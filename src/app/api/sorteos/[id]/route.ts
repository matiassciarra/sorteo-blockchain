import { NextResponse } from 'next/server';
import { getSorteo, upsertSorteo, getParticipantes } from '@/lib/storage';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const sorteo = await getSorteo(id);
  if (!sorteo) {
    return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 });
  }

  const participantes = await getParticipantes(id);

  return NextResponse.json({
    sorteo: {
      ...sorteo,
      totalParticipantes: participantes.length,
    },
    totalParticipantes: participantes.length,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const actualizado = await upsertSorteo({
      id,
      ...body,
    });

    return NextResponse.json({ sorteo: actualizado });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
