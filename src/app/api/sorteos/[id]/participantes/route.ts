import { NextResponse } from 'next/server';
import { getParticipantes, registerParticipante } from '@/lib/storage';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const participantes = await getParticipantes(id);
  return NextResponse.json({ participantes });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { nombre, identificador } = body;

    if (!nombre || !identificador) {
      return NextResponse.json(
        { error: 'El nombre y el DNI/Email son obligatorios.' },
        { status: 400 }
      );
    }

    const { participante, ticketJson } = await registerParticipante(
      id,
      nombre,
      identificador
    );

    return NextResponse.json({ participante, ticketJson });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
