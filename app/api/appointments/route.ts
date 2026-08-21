import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { appointmentOut } from '@/lib/serverMappers';
import { isEmail, str } from '@/lib/serverValidators';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, email, date, time, type, mode, notes } = body || {};

  if (!str(name, 200) || !isEmail(email) || !str(date, 40)) {
    return NextResponse.json({ error: 'name, a valid email and date are required' }, { status: 400 });
  }

  const rows = await sql`INSERT INTO appointments (name,email,date,time,type,mode,notes,status)
    VALUES (${str(name, 200)}, ${str(email, 254)}, ${str(date, 40)}, ${str(time, 60)}, ${str(type, 100)}, ${str(mode, 100)}, ${str(notes, 2000)}, 'Requested')
    RETURNING *`;

  return NextResponse.json(appointmentOut(rows[0]), { status: 201 });
}
