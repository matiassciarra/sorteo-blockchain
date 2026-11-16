import fs from 'fs';
import path from 'path';
import os from 'os';
import { generarHoja } from './merkle';
import { Pool } from 'pg';

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
  estado: 'ABIERTO' | 'SELLADO' | 'SORTEANDO' | 'FINALIZADO' | 'CANCELADO';
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

async function json_getSorteo(id: number): Promise<SorteoRecord | null> {
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

async function json_listSorteos(): Promise<SorteoRecord[]> {
  const state = loadStore();
  return state.sorteos
    .map((s) => ({
      ...s,
      totalParticipantes: state.participantes.filter((p) => p.sorteoId === s.id).length,
    }))
    .sort((a, b) => b.id - a.id);
}

async function json_upsertSorteo(sorteoData: Partial<SorteoRecord> & { id: number }): Promise<SorteoRecord> {
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

async function json_getParticipantes(sorteoId: number): Promise<ParticipanteRecord[]> {
  const state = loadStore();
  return state.participantes
    .filter((p) => p.sorteoId === sorteoId)
    .sort((a, b) => a.indice - b.indice);
}

async function json_registerParticipante(
  sorteoId: number,
  nombre: string,
  identificador: string
): Promise<{ participante: ParticipanteRecord; ticketJson: any }> {
  const nombreLimpio = nombre.trim();
  const idLimpio = identificador.trim();

  const sorteo = await json_getSorteo(sorteoId);
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


// ---------------------------------------------------------------------------
// Backend PostgreSQL. Se usa automáticamente cuando DATABASE_URL está definida
// (por ejemplo, en Vercel con Neon o Supabase). Sin DATABASE_URL, la app sigue
// funcionando con el archivo JSON temporal de arriba (modo local).
// Las tablas se crean solas la primera vez que se usa la base.
// ---------------------------------------------------------------------------

const USE_DB = !!process.env.DATABASE_URL;

declare global {
  // eslint-disable-next-line no-var
  var __sorteofiel_pool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __sorteofiel_schema: Promise<void> | undefined;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS sorteos (
  id                  INTEGER PRIMARY KEY,
  titulo              TEXT NOT NULL DEFAULT 'Sorteo Fiel Blockchain',
  bases_texto         TEXT NOT NULL DEFAULT 'Bases y Condiciones Verificables',
  bases_hash          TEXT,
  estado              TEXT NOT NULL DEFAULT 'ABIERTO',
  merkle_root         TEXT,
  tx_crear_hash       TEXT,
  tx_sellar_hash      TEXT,
  tx_vrf_hash         TEXT,
  total_participantes INTEGER NOT NULL DEFAULT 0,
  indice_ganador      INTEGER,
  numero_aleatorio    TEXT,
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS participantes (
  id             TEXT PRIMARY KEY,
  sorteo_id      INTEGER NOT NULL REFERENCES sorteos(id) ON DELETE CASCADE,
  indice         INTEGER NOT NULL,
  nombre         TEXT NOT NULL,
  identificador  TEXT NOT NULL,
  hoja_hash      TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sorteo_id, indice)
);
CREATE UNIQUE INDEX IF NOT EXISTS participantes_sorteo_identificador
  ON participantes (sorteo_id, lower(identificador));
`;

function pool(): Pool {
  if (!globalThis.__sorteofiel_pool) {
    const url = process.env.DATABASE_URL!;
    const local = /localhost|127\.0\.0\.1/.test(url);
    globalThis.__sorteofiel_pool = new Pool({
      connectionString: url,
      ssl: local ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return globalThis.__sorteofiel_pool;
}

async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  if (!globalThis.__sorteofiel_schema) {
    globalThis.__sorteofiel_schema = pool().query(SCHEMA_SQL).then(() => undefined);
  }
  await globalThis.__sorteofiel_schema;
  const res = await pool().query(sql, params);
  return res.rows as T[];
}

const iso = (d: Date | string) => (d instanceof Date ? d.toISOString() : d);

function rowToSorteo(r: any): SorteoRecord {
  return {
    id: r.id,
    titulo: r.titulo,
    basesTexto: r.bases_texto,
    basesHash: r.bases_hash,
    estado: r.estado,
    merkleRoot: r.merkle_root,
    txCrearHash: r.tx_crear_hash,
    txSellarHash: r.tx_sellar_hash,
    txVrfHash: r.tx_vrf_hash,
    totalParticipantes: r.total_participantes,
    indiceGanador: r.indice_ganador,
    numeroAleatorio: r.numero_aleatorio,
    activo: r.activo,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function rowToParticipante(r: any): ParticipanteRecord {
  return {
    id: r.id,
    sorteoId: r.sorteo_id,
    indice: r.indice,
    nombre: r.nombre,
    identificador: r.identificador,
    hojaHash: r.hoja_hash,
    createdAt: iso(r.created_at),
  };
}

// Campo de SorteoRecord -> columna de la tabla
const COLUMNAS: Record<string, string> = {
  titulo: 'titulo',
  basesTexto: 'bases_texto',
  basesHash: 'bases_hash',
  estado: 'estado',
  merkleRoot: 'merkle_root',
  txCrearHash: 'tx_crear_hash',
  txSellarHash: 'tx_sellar_hash',
  txVrfHash: 'tx_vrf_hash',
  totalParticipantes: 'total_participantes',
  indiceGanador: 'indice_ganador',
  numeroAleatorio: 'numero_aleatorio',
  activo: 'activo',
};

async function db_getSorteo(id: number): Promise<SorteoRecord | null> {
  const rows = await q('SELECT * FROM sorteos WHERE id = $1', [id]);
  return rows[0] ? rowToSorteo(rows[0]) : null;
}

async function db_listSorteos(): Promise<SorteoRecord[]> {
  const rows = await q(
    `SELECT s.*, (SELECT count(*)::int FROM participantes p WHERE p.sorteo_id = s.id) AS inscriptos
       FROM sorteos s ORDER BY s.id DESC`
  );
  return rows.map((r) => ({ ...rowToSorteo(r), totalParticipantes: r.inscriptos }));
}

async function db_upsertSorteo(data: Partial<SorteoRecord> & { id: number }): Promise<SorteoRecord> {
  const cols: string[] = [];
  const vals: unknown[] = [];
  for (const [campo, col] of Object.entries(COLUMNAS)) {
    const v = (data as any)[campo];
    if (v !== undefined) {
      cols.push(col);
      vals.push(v);
    }
  }
  if (!cols.includes('titulo')) {
    cols.push('titulo');
    vals.push(`Sorteo #${data.id}`);
  }
  // En un sorteo existente, el título por defecto no pisa el que ya tenía
  const updates = cols
    .filter((c) => !(c === 'titulo' && data.titulo === undefined))
    .map((c) => `${c} = EXCLUDED.${c}`);
  updates.push('updated_at = now()');

  const placeholders = vals.map((_, i) => `$${i + 2}`).join(', ');
  const rows = await q(
    `INSERT INTO sorteos (id, ${cols.join(', ')}) VALUES ($1, ${placeholders})
     ON CONFLICT (id) DO UPDATE SET ${updates.join(', ')}
     RETURNING *`,
    [data.id, ...vals]
  );
  return rowToSorteo(rows[0]);
}

async function db_getParticipantes(sorteoId: number): Promise<ParticipanteRecord[]> {
  const rows = await q('SELECT * FROM participantes WHERE sorteo_id = $1 ORDER BY indice ASC', [sorteoId]);
  return rows.map(rowToParticipante);
}

async function db_registerParticipante(
  sorteoId: number,
  nombre: string,
  identificador: string
): Promise<{ participante: ParticipanteRecord; ticketJson: any }> {
  const nombreLimpio = nombre.trim();
  const idLimpio = identificador.trim();

  const sorteo = await db_getSorteo(sorteoId);
  if (!sorteo) {
    throw new Error(`El sorteo #${sorteoId} no existe aún.`);
  }
  if (sorteo.estado !== 'ABIERTO') {
    throw new Error(`El sorteo #${sorteoId} ya no admite inscripciones (Estado: ${sorteo.estado}).`);
  }

  // En clase se inscriben muchos a la vez con el QR. Si dos personas toman el
  // mismo índice, la restricción UNIQUE (sorteo_id, indice) rechaza a una y se
  // reintenta con el índice siguiente.
  for (let intento = 0; intento < 10; intento++) {
    const previo = await q(
      'SELECT indice FROM participantes WHERE sorteo_id = $1 AND lower(identificador) = lower($2)',
      [sorteoId, idLimpio]
    );
    if (previo[0]) {
      throw new Error(`Ya existe una inscripción registrada con ${idLimpio} para este sorteo (Ticket #${previo[0].indice}).`);
    }

    const [{ n }] = await q<{ n: number }>(
      'SELECT count(*)::int AS n FROM participantes WHERE sorteo_id = $1',
      [sorteoId]
    );
    const indice = n;
    const hojaHash = generarHoja(sorteoId, indice, nombreLimpio, idLimpio);
    const idRegistro = `part_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const rows = await q(
        `INSERT INTO participantes (id, sorteo_id, indice, nombre, identificador, hoja_hash)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [idRegistro, sorteoId, indice, nombreLimpio, idLimpio, hojaHash]
      );
      await q(
        `UPDATE sorteos SET total_participantes =
           (SELECT count(*) FROM participantes WHERE sorteo_id = $1), updated_at = now()
         WHERE id = $1`,
        [sorteoId]
      );

      const participante = rowToParticipante(rows[0]);
      const ticketJson = {
        sorteoFielVersion: '1.0',
        idSorteo: sorteoId,
        indice,
        nombre: nombreLimpio,
        identificador: idLimpio,
        hashTicket: hojaHash,
        fechaInscripcion: participante.createdAt,
        red: 'Polygon Amoy',
        contrato: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0DF3C49109d960cfFde411A6c34058c86A675c29',
      };
      return { participante, ticketJson };
    } catch (err: any) {
      if (err?.code === '23505') continue; // índice o identificador tomado al mismo tiempo
      throw err;
    }
  }
  throw new Error('Hay muchas inscripciones simultáneas, intentá de nuevo en unos segundos.');
}

// ---------------------------------------------------------------------------
// API pública (la usan las rutas /api/*)
// ---------------------------------------------------------------------------

export const getSorteo = (id: number) => (USE_DB ? db_getSorteo(id) : json_getSorteo(id));
export const listSorteos = () => (USE_DB ? db_listSorteos() : json_listSorteos());
export const upsertSorteo = (data: Partial<SorteoRecord> & { id: number }) =>
  USE_DB ? db_upsertSorteo(data) : json_upsertSorteo(data);
export const getParticipantes = (sorteoId: number) =>
  USE_DB ? db_getParticipantes(sorteoId) : json_getParticipantes(sorteoId);
export const registerParticipante = (sorteoId: number, nombre: string, identificador: string) =>
  USE_DB ? db_registerParticipante(sorteoId, nombre, identificador) : json_registerParticipante(sorteoId, nombre, identificador);
