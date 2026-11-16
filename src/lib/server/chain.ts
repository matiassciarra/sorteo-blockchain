// Lecturas del contrato desde el servidor. La blockchain es la fuente de verdad:
// el estado del sorteo, la raíz sellada y el ganador se copian de acá, nunca de
// lo que envía el navegador.
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, AMOY_RPC, AMOY_CHAIN_ID_DEC } from '@/lib/contract';

const ESTADOS_DB = ['ABIERTO', 'SELLADO', 'SORTEANDO', 'FINALIZADO', 'CANCELADO'] as const;
export type EstadoDb = (typeof ESTADOS_DB)[number];

let contrato: ethers.Contract | null = null;
function c(): ethers.Contract {
  if (!contrato) {
    const chainId = Number(process.env.SORTEOFIEL_CHAIN_ID || AMOY_CHAIN_ID_DEC);
    const provider = new ethers.JsonRpcProvider(AMOY_RPC, chainId, { staticNetwork: true });
    contrato = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  }
  return contrato;
}

export interface SorteoOnChain {
  existe: boolean;
  estado: EstadoDb;
  organizador: string;
  hashBases: string;
  huellaLista: string | null;
  totalParticipantes: number | null;
  indiceGanador: number | null;
  numeroAleatorio: string | null;
}

export async function leerSorteoOnChain(id: number): Promise<SorteoOnChain> {
  const s = await c().sorteos(id);
  const existe = Number(s.idSorteo) !== 0;
  const estadoNum = Number(s.estado);
  const out: SorteoOnChain = {
    existe,
    estado: ESTADOS_DB[estadoNum] ?? 'ABIERTO',
    organizador: s.organizador,
    hashBases: s.hashBases,
    huellaLista: null,
    totalParticipantes: null,
    indiceGanador: null,
    numeroAleatorio: null,
  };
  if (!existe) return out;
  if (estadoNum >= 1 && estadoNum <= 3) {
    const r = await c().registrosSellados(id);
    out.huellaLista = r.huellaLista;
    out.totalParticipantes = Number(r.totalParticipantes);
  }
  if (estadoNum === 3) {
    const res = await c().resultados(id);
    out.indiceGanador = Number(res.indiceGanador);
    out.numeroAleatorio = res.numeroAleatorio.toString();
  }
  return out;
}

// Cache corto del chequeo de rol para no consultar la red en cada pedido
const cacheRol = new Map<string, { valor: boolean; hasta: number }>();
let rolOrganizador: string | null = null;

export async function esOrganizador(address: string): Promise<boolean> {
  const clave = address.toLowerCase();
  const enCache = cacheRol.get(clave);
  if (enCache && enCache.hasta > Date.now()) return enCache.valor;
  if (!rolOrganizador) rolOrganizador = await c().ORGANIZADOR_ROLE();
  const valor: boolean = await c().hasRole(rolOrganizador, address);
  cacheRol.set(clave, { valor, hasta: Date.now() + 60_000 });
  return valor;
}
