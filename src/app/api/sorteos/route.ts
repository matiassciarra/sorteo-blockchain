export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { listSorteos, upsertSorteo, getSorteo } from '@/lib/storage';
import { verificarOrganizador, respuestaError, ErrorHttp } from '@/lib/server/auth';
import { leerSorteoOnChain } from '@/lib/server/chain';

const TX_HASH = /^0x[0-9a-fA-F]{64}$/;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const ultimoParam = searchParams.get('ultimo');

    if (ultimoParam === 'true') {
      const sorteos = await listSorteos();
      return NextResponse.json({ sorteo: sorteos.length > 0 ? sorteos[0] : null });
    }
    if (idParam) {
      const id = parseInt(idParam);
      if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
      return NextResponse.json({ sorteo: await getSorteo(id) });
    }
    return NextResponse.json({ sorteos: await listSorteos() });
  } catch (err) {
    return respuestaError(err);
  }
}

// Registra en la base un sorteo que YA existe en el contrato. Solo el organizador.
export async function POST(req: Request) {
  try {
    await verificarOrganizador(req);
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) throw new ErrorHttp(400, 'ID de sorteo inválido.');

    const existente = await getSorteo(id);
    if (existente) return NextResponse.json({ sorteo: existente });

    // El nodo RPC puede tardar unos segundos en ver la transacción recién confirmada
    let chain = await leerSorteoOnChain(id);
    for (let i = 0; i < 5 && !chain.existe; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      chain = await leerSorteoOnChain(id);
    }
    if (!chain.existe) throw new ErrorHttp(404, `El sorteo #${id} no existe en el contrato.`);
    if (chain.estado !== 'ABIERTO') throw new ErrorHttp(409, `El sorteo #${id} ya no está abierto en el contrato.`);

    const titulo = String(body.titulo || `Sorteo #${id}`).trim().slice(0, 120);
    const basesTexto = String(body.basesTexto || 'Bases verificables').trim().slice(0, 2000);

    const sorteo = await upsertSorteo({
      id,
      titulo,
      basesTexto,
      basesHash: chain.hashBases,
      txCrearHash: TX_HASH.test(body.txCrearHash || '') ? body.txCrearHash : null,
      estado: 'ABIERTO',
    });
    return NextResponse.json({ sorteo });
  } catch (err) {
    return respuestaError(err);
  }
}
