import type { ParticipanteRecord } from '@/lib/storage';

// Oculta el DNI/email en todo lo que se publica (lista, proyector, auditoría).
// El árbol de Merkle se arma con hojaHash, así que no hace falta el dato completo.
export function enmascarar(identificador: string): string {
  const v = identificador.trim();
  const arroba = v.indexOf('@');
  if (arroba > 0) return `${v[0]}•••${v.slice(arroba)}`;
  if (v.length <= 4) return '•'.repeat(v.length);
  return `${v.slice(0, 2)}${'•'.repeat(Math.max(3, v.length - 5))}${v.slice(-3)}`;
}

export function participantePublico(p: ParticipanteRecord) {
  return {
    id: p.id,
    sorteoId: p.sorteoId,
    indice: p.indice,
    nombre: p.nombre,
    identificador: enmascarar(p.identificador),
    hojaHash: p.hojaHash,
    createdAt: p.createdAt,
  };
}
