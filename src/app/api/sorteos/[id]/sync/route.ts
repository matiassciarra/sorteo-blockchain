export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { respuestaError } from '@/lib/server/auth';
import { sincronizarConContrato } from '@/lib/server/sync';

// Público: no recibe datos, solo copia a la base lo que dice el contrato.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    const sorteo = await sincronizarConContrato(id);
    if (!sorteo) return NextResponse.json({ error: 'Sorteo no encontrado' }, { status: 404 });
    return NextResponse.json({ sorteo });
  } catch (err) {
    return respuestaError(err);
  }
}
