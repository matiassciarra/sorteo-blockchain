// Autenticación del organizador: la wallet firma un mensaje (sin costo) y el
// servidor verifica en el contrato que tenga ORGANIZADOR_ROLE.
import { ethers } from 'ethers';
import { esOrganizador } from './chain';
import { extraerVencimiento, HEADER_AUTH } from '@/lib/authMensaje';

export class ErrorHttp extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function verificarOrganizador(req: Request): Promise<string> {
  const crudo = req.headers.get(HEADER_AUTH);
  if (!crudo) throw new ErrorHttp(401, 'Falta la firma del organizador. Conectá la wallet en el Panel Admin.');

  let mensaje: string, firma: string;
  try {
    ({ mensaje, firma } = JSON.parse(decodeURIComponent(crudo)));
  } catch {
    throw new ErrorHttp(401, 'Firma del organizador inválida.');
  }
  if (typeof mensaje !== 'string' || typeof firma !== 'string' || mensaje.length > 500) {
    throw new ErrorHttp(401, 'Firma del organizador inválida.');
  }

  const vence = extraerVencimiento(mensaje);
  if (!vence || vence < Date.now() || vence > Date.now() + 13 * 3600_000) {
    throw new ErrorHttp(401, 'La firma del organizador venció. Volvé a conectar la wallet.');
  }

  let address: string;
  try {
    address = ethers.verifyMessage(mensaje, firma);
  } catch {
    throw new ErrorHttp(401, 'Firma del organizador inválida.');
  }
  if (!mensaje.toLowerCase().includes(`wallet: ${address.toLowerCase()}`)) {
    throw new ErrorHttp(401, 'La firma no corresponde a la wallet indicada.');
  }

  let autorizado = false;
  try {
    autorizado = await esOrganizador(address);
  } catch {
    throw new ErrorHttp(503, 'No se pudo consultar la blockchain para verificar el rol. Probá de nuevo.');
  }
  if (!autorizado) {
    throw new ErrorHttp(403, `La wallet ${address} no tiene el rol ORGANIZADOR_ROLE en el contrato.`);
  }
  return address;
}

export function respuestaError(err: any) {
  if (err instanceof ErrorHttp) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: 'Error interno del servidor.' }, { status: 500 });
}
