export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getParticipantes, getSorteo } from '@/lib/storage';
import { construirArbolMerkle } from '@/lib/merkle';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const sorteo = await getSorteo(id);
  const participantes = await getParticipantes(id);

  const tree = construirArbolMerkle(
    participantes.map((p) => ({
      indice: p.indice,
      nombre: p.nombre,
      identificador: p.identificador,
    })),
    id
  );

  const raizMerkle = tree.getHexRoot();

  return NextResponse.json({
    idSorteo: id,
    sorteo,
    totalParticipantes: participantes.length,
    raizMerkle,
    hojas: tree.hojas,
  });
}
