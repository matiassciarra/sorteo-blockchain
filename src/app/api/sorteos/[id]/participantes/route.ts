export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getParticipantes, registerParticipante } from '@/lib/storage';
import { respuestaError, ErrorHttp } from '@/lib/server/auth';
import { participantePublico } from '@/lib/server/privacidad';

const MAX_PARTICIPANTES = 2000;
// Letras (con acentos), números, espacios y signos comunes de nombres/emails
const PERMITIDOS = /^[\p{L}\p{N} .,'@_+\-]+$/u;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    const participantes = await getParticipantes(id);
    return NextResponse.json({ participantes: participantes.map(participantePublico) });
  } catch (err) {
    return respuestaError(err);
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) throw new ErrorHttp(400, 'ID inválido');

    let body: any;
    try {
      body = await req.json();
    } catch {
      throw new ErrorHttp(400, 'Pedido inválido.');
    }
    const nombre = typeof body?.nombre === 'string' ? body.nombre.trim().replace(/\s+/g, ' ') : '';
    const identificador = typeof body?.identificador === 'string' ? body.identificador.trim() : '';

    if (!nombre || !identificador) throw new ErrorHttp(400, 'El nombre y el DNI/Email son obligatorios.');
    if (nombre.length < 2 || nombre.length > 60) throw new ErrorHttp(400, 'El nombre debe tener entre 2 y 60 caracteres.');
    if (identificador.length < 3 || identificador.length > 60) throw new ErrorHttp(400, 'El DNI/Email debe tener entre 3 y 60 caracteres.');
    if (!PERMITIDOS.test(nombre) || !PERMITIDOS.test(identificador)) {
      throw new ErrorHttp(400, 'El nombre o el DNI/Email tienen caracteres no permitidos.');
    }

    const actuales = await getParticipantes(id);
    if (actuales.length >= MAX_PARTICIPANTES) throw new ErrorHttp(400, 'Se alcanzó el máximo de inscriptos.');

    try {
      const { participante, ticketJson } = await registerParticipante(id, nombre, identificador);
      // El propio participante recibe su ticket completo (lo necesita para auditar)
      return NextResponse.json({ participante, ticketJson });
    } catch (err: any) {
      // Errores de negocio (sorteo cerrado, DNI repetido...) son mensajes para el usuario
      if (err?.code) throw err; // error de base de datos: no se muestra
      throw new ErrorHttp(400, err.message);
    }
  } catch (err) {
    return respuestaError(err);
  }
}
