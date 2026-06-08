import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_, { params }) {
  try {
    const { id } = await params;
    const res = await query('SELECT * FROM posts WHERE id = $1', [id]);
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { slug, title, excerpt, content, tag, status, read_time, published_at } = body;
    
    const res = await query(
      `UPDATE posts SET slug=$1, title=$2, excerpt=$3, content=$4, tag=$5, status=$6, read_time=$7, 
       published_at=$8, updated_at=CURRENT_TIMESTAMP WHERE id=$9 RETURNING *`,
      [slug, title, excerpt, content, tag, status, read_time, published_at, id]
    );
    if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(res.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_, { params }) {
  try {
    const { id } = await params;
    await query('DELETE FROM posts WHERE id = $1', [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
