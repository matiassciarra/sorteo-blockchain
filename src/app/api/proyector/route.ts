export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { listSorteos, getSorteo, getParticipantes } from '@/lib/storage';
import { respuestaError } from '@/lib/server/auth';
import { participantePublico } from '@/lib/server/privacidad';
import { sincronizarConContrato } from '@/lib/server/sync';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');

    const todos = await listSorteos();
    if (todos.length === 0) {
      return NextResponse.json({ sorteo: null, participantes: [], todosSorteos: [] });
    }

    let sorteoActivo = todos[0]; // El último creado
    if (idParam) {
      const encontrado = await getSorteo(parseInt(idParam));
      if (encontrado) sorteoActivo = encontrado;
    }

    // Mientras se espera el sellado o a Chainlink, el proyector se pone al día
    // con el contrato aunque el panel admin esté cerrado.
    if (sorteoActivo.estado === 'SELLADO' || sorteoActivo.estado === 'SORTEANDO') {
      try {
        sorteoActivo = (await sincronizarConContrato(sorteoActivo.id)) ?? sorteoActivo;
      } catch (e) {
        console.error('No se pudo sincronizar con el contrato', e);
      }
    }

    const participantes = await getParticipantes(sorteoActivo.id);
    return NextResponse.json({
      sorteo: { ...sorteoActivo, totalParticipantes: participantes.length },
      participantes: participantes.map(participantePublico),
      todosSorteos: todos.map((s) => ({ id: s.id, titulo: s.titulo, estado: s.estado })),
    });
  } catch (err) {
    return respuestaError(err);
  }
}
