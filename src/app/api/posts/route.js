import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  try {
    let res;
    if (status) {
      res = await query('SELECT * FROM posts WHERE status = $1 ORDER BY COALESCE(published_at, created_at) DESC', [status]);
    } else {
      res = await query('SELECT * FROM posts ORDER BY COALESCE(published_at, created_at) DESC');
    }
    return NextResponse.json(res.rows);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { slug, title, excerpt, content, tag, status, read_time, published_at } = body;
    
    const res = await query(
      `INSERT INTO posts (slug, title, excerpt, content, tag, status, read_time, published_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [slug, title, excerpt, content, tag, status || 'draft', read_time, published_at]
    );
    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
