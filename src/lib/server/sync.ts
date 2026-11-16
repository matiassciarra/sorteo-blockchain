// Copia a la base el estado real del contrato. Solo avanza: si el contrato sigue
// "Abierto", no toca la base (así se respeta el cierre previo de inscripciones).
import { getSorteo, upsertSorteo, SorteoRecord } from '@/lib/storage';
import { leerSorteoOnChain } from './chain';

export async function sincronizarConContrato(id: number): Promise<SorteoRecord | null> {
  const db = await getSorteo(id);
  if (!db) return null;
  const chain = await leerSorteoOnChain(id);
  if (!chain.existe || chain.estado === 'ABIERTO') return db;

  const cambios: Partial<SorteoRecord> & { id: number } = { id, estado: chain.estado };
  if (chain.huellaLista) cambios.merkleRoot = chain.huellaLista;
  if (chain.estado === 'FINALIZADO') {
    cambios.indiceGanador = chain.indiceGanador;
    cambios.numeroAleatorio = chain.numeroAleatorio;
  }
  const igual =
    db.estado === cambios.estado &&
    (cambios.merkleRoot === undefined || db.merkleRoot === cambios.merkleRoot) &&
    (cambios.indiceGanador === undefined || db.indiceGanador === cambios.indiceGanador);
  return igual ? db : upsertSorteo(cambios);
}
