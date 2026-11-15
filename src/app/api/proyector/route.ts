import { NextResponse } from 'next/server';
import { listSorteos, getSorteo, getParticipantes } from '@/lib/storage';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id');

  const todos = await listSorteos();
  if (todos.length === 0) {
    return NextResponse.json({ sorteo: null, participantes: [], todosSorteos: [] });
  }

  let sorteoActivo = todos[0]; // El último creado
  if (idParam) {
    const idNum = parseInt(idParam);
    const encontrado = await getSorteo(idNum);
    if (encontrado) {
      sorteoActivo = encontrado;
    }
  }

  const participantes = await getParticipantes(sorteoActivo.id);

  return NextResponse.json({
    sorteo: {
      ...sorteoActivo,
      totalParticipantes: participantes.length,
    },
    participantes,
    todosSorteos: todos.map((s) => ({
      id: s.id,
      titulo: s.titulo,
      estado: s.estado,
    })),
  });
}
