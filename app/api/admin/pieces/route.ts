import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { pieceOut } from '@/lib/serverMappers';
import { isSlug, nonNegativeInt, sanitizePieceColors, sanitizeSizes, str, strArray } from '@/lib/serverValidators';

const AVAILABILITY = ['Available', 'Two remaining', 'By request', 'Pre-order', 'Archive only', 'Sold Out'];
const CURRENCIES = ['SAR', 'EGP'];

async function collectionExists(key: string | undefined | null) {
  if (!key) return true; // optional field
  const rows = await sql`SELECT 1 FROM collections WHERE key = ${key}`;
  return rows.length > 0;
}

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const rows = await sql`SELECT * FROM pieces ORDER BY created_at`;
  return NextResponse.json(rows.map(pieceOut));
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const b = await req.json().catch(() => ({}));

  if (!isSlug(b.id)) return NextResponse.json({ error: 'id must be lowercase letters, numbers and hyphens (1-60 chars)' }, { status: 400 });
  if (!str(b.n, 200) || !str(b.ar, 200)) return NextResponse.json({ error: 'n and ar (name) are required' }, { status: 400 });
  if (!(await collectionExists(b.coll))) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });
  if (b.av !== undefined && b.av !== '' && !AVAILABILITY.includes(b.av)) return NextResponse.json({ error: 'Invalid availability value' }, { status: 400 });
  if (b.currency !== undefined && b.currency !== '' && !CURRENCIES.includes(b.currency)) return NextResponse.json({ error: 'currency must be SAR or EGP' }, { status: 400 });
  if (b.images !== undefined && (!Array.isArray(b.images) || b.images.length > 10)) {
    return NextResponse.json({ error: 'images must be an array of at most 10 photos' }, { status: 400 });
  }

  const existing = await sql`SELECT 1 FROM pieces WHERE id = ${b.id}`;
  if (existing.length) return NextResponse.json({ error: 'A piece with that id already exists' }, { status: 409 });

  const images = strArray(b.images, 10, 300);
  const pantsImg = str(b.pantsImg, 300) || null;
  const pantsPrice = pantsImg ? nonNegativeInt(b.pantsPrice) : null;
  const price = nonNegativeInt(b.price);
  // A sale price only counts as a discount if it's actually lower than the
  // full price — otherwise it's just noise, so it's dropped to null.
  const salePrice = b.salePrice !== undefined && b.salePrice !== null && b.salePrice !== ''
    ? (() => { const n = nonNegativeInt(b.salePrice, -1); return n >= 0 && n < price ? n : null; })()
    : null;

  const visible = b.visible === undefined ? true : !!b.visible;
  const stock = b.stock !== undefined ? nonNegativeInt(b.stock, 0) : 999;
  const featured = !!b.featured;
  const colors = sanitizePieceColors(b.colors);
  const sizes = sanitizeSizes(b.sizes);

  await sql`INSERT INTO pieces
    (id,ed,name_en,name_ar,price,currency,coll_key,fabric,sil,colour,occ,mat_en,mat_ar,silf_en,silf_ar,pal_en,pal_ar,availability,desc_en,desc_ar,story_en,story_ar,image,images,pants_image,pants_price,sale_price,visible,stock,featured,colors,sizes)
    VALUES (${b.id}, ${str(b.ed, 40)}, ${str(b.n, 200)}, ${str(b.ar, 200)}, ${price}, ${b.currency || 'SAR'}, ${b.coll || null},
      ${str(b.fabric, 60)}, ${str(b.sil, 60)}, ${str(b.colour, 60)}, ${str(b.occ, 60)},
      ${str(b.mat, 300)}, ${str(b.matAr, 300)}, ${str(b.silf, 300)}, ${str(b.silfAr, 300)}, ${str(b.pal, 150)}, ${str(b.palAr, 150)},
      ${b.av || 'Available'}, ${str(b.d, 4000)}, ${str(b.dAr, 4000)},
      ${JSON.stringify(strArray(b.story))}, ${JSON.stringify(strArray(b.storyAr))}, ${images[0] || null},
      ${JSON.stringify(images)}, ${pantsImg}, ${pantsPrice}, ${salePrice}, ${visible}, ${stock}, ${featured},
      ${JSON.stringify(colors)}, ${JSON.stringify(sizes)})`;

  const rows = await sql`SELECT * FROM pieces WHERE id = ${b.id}`;
  return NextResponse.json(pieceOut(rows[0]), { status: 201 });
}
