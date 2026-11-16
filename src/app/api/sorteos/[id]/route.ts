export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSorteo, upsertSorteo, getParticipantes } from '@/lib/storage';
import { verificarOrganizador, respuestaError, ErrorHttp } from '@/lib/server/auth';
import { leerSorteoOnChain } from '@/lib/server/chain';
import { sincronizarConContrato } from '@/lib/server/sync';

const TX_HASH = /^0x[0-9a-fA-F]{64}$/;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const sorteo = await getSorteo(id);
    if (!sorteo) return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 });

    const participantes = await getParticipantes(id);
    return NextResponse.json({
      sorteo: { ...sorteo, totalParticipantes: participantes.length },
      totalParticipantes: participantes.length,
    });
  } catch (err) {
    return respuestaError(err);
  }
}

// Solo el organizador. Permite:
//  - cerrar / reabrir inscripciones (estado SELLADO / ABIERTO) mientras el contrato siga Abierto
//  - guardar hashes de transacción
// Todo lo demás (estado posterior, raíz sellada, ganador) se copia del contrato.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    await verificarOrganizador(req);
    const id = parseInt(params.id);
    if (isNaN(id)) throw new ErrorHttp(400, 'ID inválido');

    const db = await getSorteo(id);
    if (!db) throw new ErrorHttp(404, 'Sorteo no encontrado');
    const body = await req.json();

    const cambios: any = { id };
    for (const campo of ['txSellarHash', 'txVrfHash']) {
      if (body[campo] !== undefined) {
        if (!TX_HASH.test(body[campo])) throw new ErrorHttp(400, `${campo} inválido.`);
        cambios[campo] = body[campo];
      }
    }

    if (body.estado !== undefined) {
      if (body.estado !== 'ABIERTO' && body.estado !== 'SELLADO') {
        throw new ErrorHttp(400, 'Solo se puede cerrar o reabrir inscripciones; el resto lo define el contrato.');
      }
      const chain = await leerSorteoOnChain(id);
      if (chain.estado === 'ABIERTO') cambios.estado = body.estado;
    }

    if (Object.keys(cambios).length > 1) await upsertSorteo(cambios);
    const sorteo = await sincronizarConContrato(id);
    return NextResponse.json({ sorteo });
  } catch (err) {
    return respuestaError(err);
  }
}
