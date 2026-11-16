// Formato del mensaje que firma el organizador (compartido por navegador y servidor)
import { CONTRACT_ADDRESS } from '@/lib/contract';

export const HEADER_AUTH = 'x-sorteofiel-auth';

export function armarMensaje(address: string, vence: Date): string {
  return [
    'SorteoFiel - acceso de organizador',
    `Wallet: ${address.toLowerCase()}`,
    `Contrato: ${CONTRACT_ADDRESS.toLowerCase()}`,
    `Valido hasta: ${vence.toISOString()}`,
    'Esta firma no envia ninguna transaccion ni tiene costo.',
  ].join('\n');
}

export function extraerVencimiento(mensaje: string): number | null {
  if (!mensaje.startsWith('SorteoFiel - acceso de organizador\n')) return null;
  if (!mensaje.toLowerCase().includes(`contrato: ${CONTRACT_ADDRESS.toLowerCase()}`)) return null;
  const m = mensaje.match(/\nValido hasta: (\S+)\n/);
  if (!m) return null;
  const t = Date.parse(m[1]);
  return isNaN(t) ? null : t;
}
