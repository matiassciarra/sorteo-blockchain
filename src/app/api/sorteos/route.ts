import { NextResponse } from 'next/server';
import { listSorteos, upsertSorteo, getSorteo } from '@/lib/storage';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id');
  const ultimoParam = searchParams.get('ultimo');

  if (ultimoParam === 'true') {
    const sorteos = await listSorteos();
    const ultimo = sorteos.length > 0 ? sorteos[0] : null;
    return NextResponse.json({ sorteo: ultimo });
  }

  if (idParam) {
    const sorteo = await getSorteo(parseInt(idParam));
    return NextResponse.json({ sorteo });
  }

  const sorteos = await listSorteos();
  return NextResponse.json({ sorteos });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, titulo, basesTexto, basesHash, txCrearHash } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta el id del sorteo' }, { status: 400 });
    }

    const sorteo = await upsertSorteo({
      id: Number(id),
      titulo: titulo || `Sorteo #${id}`,
      basesTexto: basesTexto || 'Bases verificables',
      basesHash: basesHash || null,
      txCrearHash: txCrearHash || null,
      estado: 'ABIERTO',
    });

    return NextResponse.json({ sorteo });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
