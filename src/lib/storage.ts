import fs from 'fs';
import path from 'path';
import os from 'os';
import { generarHoja } from './merkle';

export interface ParticipanteRecord {
  id: string;
  sorteoId: number;
  indice: number;
  nombre: string;
  identificador: string;
  hojaHash: string;
  createdAt: string;
}

export interface SorteoRecord {
  id: number;
  titulo: string;
  basesTexto: string;
  basesHash?: string | null;
  estado: 'ABIERTO' | 'SELLADO' | 'SORTEANDO' | 'FINALIZADO';
  merkleRoot?: string | null;
  txCrearHash?: string | null;
  txSellarHash?: string | null;
  txVrfHash?: string | null;
  totalParticipantes: number;
  indiceGanador?: number | null;
  numeroAleatorio?: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoreState {
  sorteos: SorteoRecord[];
  participantes: ParticipanteRecord[];
}

// Guardamos en un directorio fuera de la vigilancia de webpack de Next.js
// para evitar que el file watcher recargue la página en caliente (Hot Reload loop)
const DATA_FILE = path.join(os.tmpdir(), 'sorteofiel_store.json');

// Mantenemos una instancia global en memoria de Node.js
declare global {
  // eslint-disable-next-line no-var
  var __sorteofiel_store: StoreState | undefined;
}

function getInitialState(): StoreState {
  return {
    sorteos: [
      {
        id: 1,
        titulo: 'Sorteo #1 Blockchain (Edición 1)',
        basesTexto: 'Bases y condiciones del sorteo verificable en Polygon Amoy',
        basesHash: '0x3a4b8c9d1e2f3a4b8c9d1e2f3a4b8c9d1e2f3a4b8c9d1e2f3a4b8c9d1e2f3a4b',
        estado: 'FINALIZADO',
        merkleRoot: '0x8f4c2b1a9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b',
        totalParticipantes: 1,
        indiceGanador: 0,
        numeroAleatorio: '9843217823912839120931294821',
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 2,
        titulo: 'Sorteo #2 Blockchain (En Vivo)',
        basesTexto: 'Bases y condiciones para la demo en vivo',
        basesHash: null,
        estado: 'ABIERTO',
        merkleRoot: null,
        totalParticipantes: 0,
        indiceGanador: null,
        numeroAleatorio: null,
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    participantes: [],
  };
}

function loadStore(): StoreState {
  if (globalThis.__sorteofiel_store) {
    return globalThis.__sorteofiel_store;
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      globalThis.__sorteofiel_store = JSON.parse(raw);
      return globalThis.__sorteofiel_store!;
    }
  } catch (err) {
    console.warn('Error leyendo archivo store temporal, inicializando en memoria:', err);
  }

  const initial = getInitialState();
  globalThis.__sorteofiel_store = initial;
  saveStoreToDisk(initial);
  return initial;
}

function saveStoreToDisk(state: StoreState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error guardando store en disco temporal:', err);
  }
}

export async function getSorteo(id: number): Promise<SorteoRecord | null> {
  const state = loadStore();
  const found = state.sorteos.find((s) => s.id === id);
  if (!found && id === 1) {
    const defaultSorteo: SorteoRecord = {
      id: 1,
      titulo: 'Sorteo Blockchain Demo 2026',
      basesTexto: 'Bases y condiciones del sorteo verificable en vivo',
      estado: 'ABIERTO',
      totalParticipantes: 0,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.sorteos.push(defaultSorteo);
    saveStoreToDisk(state);
    return defaultSorteo;
  }
  return found || null;
}

export async function listSorteos(): Promise<SorteoRecord[]> {
  const state = loadStore();
  return state.sorteos
    .map((s) => ({
      ...s,
      totalParticipantes: state.participantes.filter((p) => p.sorteoId === s.id).length,
    }))
    .sort((a, b) => b.id - a.id);
}

export async function upsertSorteo(sorteoData: Partial<SorteoRecord> & { id: number }): Promise<SorteoRecord> {
  const state = loadStore();
  const idx = state.sorteos.findIndex((s) => s.id === sorteoData.id);
  const now = new Date().toISOString();

  if (idx >= 0) {
    state.sorteos[idx] = {
      ...state.sorteos[idx],
      ...sorteoData,
      updatedAt: now,
    };
    saveStoreToDisk(state);
    return state.sorteos[idx];
  } else {
    const nuevo: SorteoRecord = {
      id: sorteoData.id,
      titulo: sorteoData.titulo || `Sorteo #${sorteoData.id}`,
      basesTexto: sorteoData.basesTexto || 'Bases verificables',
      basesHash: sorteoData.basesHash || null,
      estado: sorteoData.estado || 'ABIERTO',
      merkleRoot: sorteoData.merkleRoot || null,
      txCrearHash: sorteoData.txCrearHash || null,
      txSellarHash: sorteoData.txSellarHash || null,
      txVrfHash: sorteoData.txVrfHash || null,
      totalParticipantes: sorteoData.totalParticipantes || 0,
      indiceGanador: sorteoData.indiceGanador ?? null,
      numeroAleatorio: sorteoData.numeroAleatorio ?? null,
      activo: true,
      createdAt: now,
      updatedAt: now,
    };
    state.sorteos.push(nuevo);
    saveStoreToDisk(state);
    return nuevo;
  }
}

export async function getParticipantes(sorteoId: number): Promise<ParticipanteRecord[]> {
  const state = loadStore();
  return state.participantes
    .filter((p) => p.sorteoId === sorteoId)
    .sort((a, b) => a.indice - b.indice);
}

export async function registerParticipante(
  sorteoId: number,
  nombre: string,
  identificador: string
): Promise<{ participante: ParticipanteRecord; ticketJson: any }> {
  const nombreLimpio = nombre.trim();
  const idLimpio = identificador.trim();

  const sorteo = await getSorteo(sorteoId);
  if (!sorteo) {
    throw new Error(`El sorteo #${sorteoId} no existe aún.`);
  }
  if (sorteo.estado !== 'ABIERTO') {
    throw new Error(`El sorteo #${sorteoId} ya no admite inscripciones (Estado: ${sorteo.estado}).`);
  }

  const state = loadStore();
  const yaExiste = state.participantes.find(
    (p) => p.sorteoId === sorteoId && p.identificador.toLowerCase() === idLimpio.toLowerCase()
  );
  if (yaExiste) {
    throw new Error(`Ya existe una inscripción registrada con ${idLimpio} para este sorteo (Ticket #${yaExiste.indice}).`);
  }

  const listaActual = state.participantes.filter((p) => p.sorteoId === sorteoId);
  const indice = listaActual.length;
  const hojaHash = generarHoja(sorteoId, indice, nombreLimpio, idLimpio);

  const nuevo: ParticipanteRecord = {
    id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sorteoId,
    indice,
    nombre: nombreLimpio,
    identificador: idLimpio,
    hojaHash,
    createdAt: new Date().toISOString(),
  };

  state.participantes.push(nuevo);
  const sIdx = state.sorteos.findIndex((s) => s.id === sorteoId);
  if (sIdx >= 0) {
    state.sorteos[sIdx].totalParticipantes = indice + 1;
    state.sorteos[sIdx].updatedAt = new Date().toISOString();
  }
  saveStoreToDisk(state);

  const ticketJson = {
    sorteoFielVersion: '1.0',
    idSorteo: sorteoId,
    indice,
    nombre: nombreLimpio,
    identificador: idLimpio,
    hashTicket: hojaHash,
    fechaInscripcion: nuevo.createdAt,
    red: 'Polygon Amoy',
    contrato: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0DF3C49109d960cfFde411A6c34058c86A675c29',
  };

  return { participante: nuevo, ticketJson };
}
