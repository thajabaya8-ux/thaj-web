import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdmin } from '@/lib/adminAuth';
import { pieceOut } from '@/lib/serverMappers';
import { nonNegativeInt, str, strArray } from '@/lib/serverValidators';

const AVAILABILITY = ['Available', 'Two remaining', 'By request', 'Pre-order', 'Archive only', 'Sold Out'];
const CURRENCIES = ['SAR', 'EGP'];

async function collectionExists(key: string | undefined | null) {
  if (!key) return true;
  const rows = await sql`SELECT 1 FROM collections WHERE key = ${key}`;
  return rows.length > 0;
}

function parseArr(v: unknown): string[] {
  if (typeof v !== 'string') return [];
  try { return JSON.parse(v || '[]'); } catch { return []; }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const existingRows = await sql`SELECT * FROM pieces WHERE id = ${id}`;
  if (!existingRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const existing = existingRows[0];

  const b = await req.json().catch(() => ({}));
  if (b.coll !== undefined && !(await collectionExists(b.coll))) return NextResponse.json({ error: 'Unknown collection' }, { status: 400 });
  if (b.av !== undefined && b.av !== '' && !AVAILABILITY.includes(b.av)) return NextResponse.json({ error: 'Invalid availability value' }, { status: 400 });
  if (b.currency !== undefined && b.currency !== '' && !CURRENCIES.includes(b.currency)) return NextResponse.json({ error: 'currency must be SAR or EGP' }, { status: 400 });
  if (b.images !== undefined && (!Array.isArray(b.images) || b.images.length > 10)) {
    return NextResponse.json({ error: 'images must be an array of at most 10 photos' }, { status: 400 });
  }

  const nextImages = b.images !== undefined ? strArray(b.images, 10, 300) : parseArr(existing.images);
  const nextPantsImg = b.pantsImg !== undefined ? (str(b.pantsImg, 300) || null) : existing.pants_image;
  const nextPantsPrice = b.pantsImg !== undefined
    ? (nextPantsImg ? nonNegativeInt(b.pantsPrice, existing.pants_price ?? 0) : null)
    : (b.pantsPrice !== undefined && existing.pants_image ? nonNegativeInt(b.pantsPrice, existing.pants_price ?? 0) : existing.pants_price);

  const next = {
    ed: b.ed !== undefined ? str(b.ed, 40) : existing.ed,
    name_en: b.n !== undefined ? (str(b.n, 200) || existing.name_en) : existing.name_en,
    name_ar: b.ar !== undefined ? (str(b.ar, 200) || existing.name_ar) : existing.name_ar,
    price: b.price !== undefined ? nonNegativeInt(b.price, existing.price) : existing.price,
    currency: b.currency || existing.currency,
    coll_key: b.coll !== undefined ? (b.coll || null) : existing.coll_key,
    fabric: b.fabric !== undefined ? str(b.fabric, 60) : existing.fabric,
    sil: b.sil !== undefined ? str(b.sil, 60) : existing.sil,
    colour: b.colour !== undefined ? str(b.colour, 60) : existing.colour,
    occ: b.occ !== undefined ? str(b.occ, 60) : existing.occ,
    mat_en: b.mat !== undefined ? str(b.mat, 300) : existing.mat_en,
    mat_ar: b.matAr !== undefined ? str(b.matAr, 300) : existing.mat_ar,
    silf_en: b.silf !== undefined ? str(b.silf, 300) : existing.silf_en,
    silf_ar: b.silfAr !== undefined ? str(b.silfAr, 300) : existing.silf_ar,
    pal_en: b.pal !== undefined ? str(b.pal, 150) : existing.pal_en,
    pal_ar: b.palAr !== undefined ? str(b.palAr, 150) : existing.pal_ar,
    availability: b.av || existing.availability,
    desc_en: b.d !== undefined ? str(b.d, 4000) : existing.desc_en,
    desc_ar: b.dAr !== undefined ? str(b.dAr, 4000) : existing.desc_ar,
    story_en: JSON.stringify(b.story !== undefined ? strArray(b.story) : parseArr(existing.story_en)),
    story_ar: JSON.stringify(b.storyAr !== undefined ? strArray(b.storyAr) : parseArr(existing.story_ar)),
    image: nextImages[0] || null,
    images: JSON.stringify(nextImages),
    pants_image: nextPantsImg,
    pants_price: nextPantsPrice,
    visible: b.visible === undefined ? existing.visible : !!b.visible
  };

  // A sale price only counts as a discount if it's actually lower than the
  // (possibly just-updated) full price — otherwise it's dropped to null.
  const nextSalePrice = b.salePrice !== undefined
    ? (b.salePrice === null || b.salePrice === ''
      ? null
      : (() => { const n = nonNegativeInt(b.salePrice, -1); return n >= 0 && n < next.price ? n : null; })())
    : (existing.sale_price != null && existing.sale_price < next.price ? existing.sale_price : null);

  await sql`UPDATE pieces SET ed=${next.ed}, name_en=${next.name_en}, name_ar=${next.name_ar}, price=${next.price}, currency=${next.currency},
    coll_key=${next.coll_key}, fabric=${next.fabric}, sil=${next.sil}, colour=${next.colour}, occ=${next.occ},
    mat_en=${next.mat_en}, mat_ar=${next.mat_ar}, silf_en=${next.silf_en}, silf_ar=${next.silf_ar},
    pal_en=${next.pal_en}, pal_ar=${next.pal_ar}, availability=${next.availability},
    desc_en=${next.desc_en}, desc_ar=${next.desc_ar}, story_en=${next.story_en}, story_ar=${next.story_ar},
    image=${next.image}, images=${next.images}, pants_image=${next.pants_image}, pants_price=${next.pants_price},
    sale_price=${nextSalePrice}, visible=${next.visible}, updated_at=now() WHERE id=${id}`;

  const rows = await sql`SELECT * FROM pieces WHERE id = ${id}`;
  return NextResponse.json(pieceOut(rows[0]));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const rows = await sql`DELETE FROM pieces WHERE id = ${id} RETURNING id`;
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
