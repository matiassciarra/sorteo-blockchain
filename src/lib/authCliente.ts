'use client';
// Firma del organizador en el navegador: se pide una vez (válida 12 h) y se
// guarda en la pestaña. No es una transacción y no cuesta nada.
import type { Signer } from 'ethers';
import { armarMensaje, extraerVencimiento, HEADER_AUTH } from '@/lib/authMensaje';

const CLAVE = 'sorteofiel_auth_organizador';

function leerGuardada(address: string): { mensaje: string; firma: string } | null {
  try {
    const g = JSON.parse(sessionStorage.getItem(CLAVE) || 'null');
    if (!g || !g.mensaje.includes(`Wallet: ${address.toLowerCase()}`)) return null;
    const vence = extraerVencimiento(g.mensaje);
    if (!vence || vence < Date.now() + 5 * 60_000) return null;
    return g;
  } catch {
    return null;
  }
}

export async function obtenerFirma(signer: Signer): Promise<{ mensaje: string; firma: string }> {
  const address = await signer.getAddress();
  const guardada = leerGuardada(address);
  if (guardada) return guardada;
  const mensaje = armarMensaje(address, new Date(Date.now() + 12 * 3600_000));
  const firma = await signer.signMessage(mensaje);
  const nueva = { mensaje, firma };
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(nueva));
  } catch {}
  return nueva;
}

// fetch con la firma del organizador; lanza un Error legible si la API rechaza
export async function fetchOrganizador(signer: Signer, url: string, init: RequestInit): Promise<any> {
  const auth = await obtenerFirma(signer);
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      [HEADER_AUTH]: encodeURIComponent(JSON.stringify(auth)),
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}
