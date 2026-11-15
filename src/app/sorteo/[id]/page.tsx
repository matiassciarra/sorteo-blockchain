'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Card,
  Title,
  Text,
  TextInput,
  Button,
  Badge,
  Stack,
  Group,
  Paper,
  Alert,
  Loader,
  Code,
  Divider,
  ThemeIcon,
  Select,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconTicket,
  IconCheck,
  IconDownload,
  IconAlertCircle,
  IconTrophy,
  IconClock,
  IconShieldCheck,
  IconSparkles,
  IconArrowLeft,
  IconList,
} from '@tabler/icons-react';

interface SorteoData {
  id: number;
  titulo: string;
  basesTexto: string;
  estado: 'ABIERTO' | 'SELLADO' | 'SORTEANDO' | 'FINALIZADO';
  totalParticipantes: number;
  indiceGanador?: number | null;
  merkleRoot?: string | null;
}

export default function ParticiparPage() {
  const params = useParams();
  const router = useRouter();
  const idSorteo = params?.id ? Number(params.id) : 1;

  const [sorteo, setSorteo] = useState<SorteoData | null>(null);
  const [listaSorteos, setListaSorteos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketGenerado, setTicketGenerado] = useState<any>(null);
  const isFetchingRef = useRef(false);

  // Cargar lista de sorteos disponibles una sola vez al entrar
  useEffect(() => {
    fetch('/api/sorteos')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.sorteos) setListaSorteos(data.sorteos);
      })
      .catch((err) => console.error(err));
  }, []);

  // Cargar sorteo actual cuando cambia idSorteo
  async function cargarSorteoActual() {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const resActual = await fetch(`/api/sorteos/${idSorteo}`);
      if (resActual.ok) {
        const data = await resActual.json();
        setSorteo(data.sorteo);
      }
    } catch (err) {
      console.error(err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarSorteoActual();
  }, [idSorteo]);

  // Verificar si ya tiene ticket guardado en este navegador
  useEffect(() => {
    const saved = localStorage.getItem(`sorteofiel_ticket_${idSorteo}`);
    if (saved) {
      try {
        setTicketGenerado(JSON.parse(saved));
      } catch {}
    }
  }, [idSorteo]);

  async function handleInscribir(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !identificador.trim()) {
      notifications.show({
        title: 'Campos requeridos',
        message: 'Por favor ingresa tu nombre y DNI o correo.',
        color: 'red',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/sorteos/${idSorteo}/participantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          identificador: identificador.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al inscribirse');
      }

      setTicketGenerado(data.ticketJson);
      localStorage.setItem(`sorteofiel_ticket_${idSorteo}`, JSON.stringify(data.ticketJson));

      notifications.show({
        title: '¡Inscripción exitosa!',
        message: `Te registraste con el Ticket #${data.participante.indice}`,
        color: 'emerald',
        icon: <IconCheck size={18} />,
      });

      descargarTicket(data.ticketJson);
      cargarSorteoActual();
    } catch (err: any) {
      notifications.show({
        title: 'No se pudo completar la inscripción',
        message: err.message,
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  }

  function descargarTicket(ticket: any) {
    const blob = new Blob([JSON.stringify(ticket, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket_sorteo_${ticket.idSorteo}_num_${ticket.indice}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading && !sorteo) {
    return (
      <Container size="xs" py={80} ta="center">
        <Loader color="emerald" size="lg" />
        <Text mt="md" c="dimmed">
          Cargando datos del sorteo...
        </Text>
      </Container>
    );
  }

  const esGanador =
    sorteo?.estado === 'FINALIZADO' &&
    ticketGenerado &&
    Number(sorteo.indiceGanador) === Number(ticketGenerado.indice);

  return (
    <Container size="sm" py={30}>
      {/* Barra de navegación superior entre sorteos */}
      <Group justify="space-between" align="center" mb="md">
        <Button
          component={Link}
          href="/sorteos"
          variant="subtle"
          color="emerald"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
        >
          Ver todos los sorteos
        </Button>

        {listaSorteos.length > 1 && (
          <Group gap={6} align="center">
            <Text size="xs" c="dimmed">
              Cambiar sorteo:
            </Text>
            <Select
              size="xs"
              w={140}
              value={String(idSorteo)}
              onChange={(val) => {
                if (val) router.push(`/sorteo/${val}`);
              }}
              data={listaSorteos.map((s) => ({
                value: String(s.id),
                label: `Sorteo #${s.id}`,
              }))}
            />
          </Group>
        )}
      </Group>

      <Card
        shadow="md"
        radius="lg"
        padding="xl"
        withBorder
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
        }}
      >
        {/* Cabecera del Sorteo */}
        <Stack gap="xs" mb="lg">
          <Group justify="space-between" align="center">
            <Badge color="emerald" variant="filled" size="md">
              Sorteo #{idSorteo}
            </Badge>

            {sorteo?.estado === 'ABIERTO' && (
              <Badge color="emerald" variant="light" leftSection={<IconSparkles size={14} />}>
                Inscripciones Abiertas
              </Badge>
            )}
            {sorteo?.estado === 'SELLADO' && (
              <Badge color="yellow" variant="light" leftSection={<IconClock size={14} />}>
                Lista Sellada · Esperando Sorteo
              </Badge>
            )}
            {sorteo?.estado === 'SORTEANDO' && (
              <Badge color="violet" variant="light" leftSection={<Loader size={12} color="violet" />}>
                Generando Aleatoriedad VRF
              </Badge>
            )}
            {sorteo?.estado === 'FINALIZADO' && (
              <Badge color="teal" variant="filled" leftSection={<IconTrophy size={14} />}>
                Sorteo Finalizado
              </Badge>
            )}
          </Group>

          <Title order={2} style={{ color: '#064e3b', fontWeight: 800 }}>
            {sorteo?.titulo || `Sorteo #${idSorteo}`}
          </Title>

          <Text size="sm" c="dimmed">
            {sorteo?.basesTexto || 'Participación verificable en Polygon Blockchain.'}
          </Text>

          <Group gap="xs" mt={4}>
            <Text size="xs" fw={600} style={{ color: '#059669' }}>
              Inscriptos actuales: {sorteo?.totalParticipantes || 0}
            </Text>
          </Group>
        </Stack>

        <Divider mb="lg" />

        {/* ALERTA DE GANADOR SI YA FINALIZÓ */}
        {sorteo?.estado === 'FINALIZADO' && (
          <Alert
            icon={<IconTrophy size={20} />}
            title={esGanador ? '🏆 ¡FELICITACIONES, GANASTE!' : 'Sorteo Concluido'}
            color={esGanador ? 'emerald' : 'gray'}
            radius="md"
            mb="lg"
          >
            {esGanador ? (
              <Text size="sm">
                Tu ticket <strong>#{ticketGenerado.indice}</strong> ha sido elegido por el oráculo Chainlink VRF como el ganador legítimo del sorteo.
              </Text>
            ) : (
              <Text size="sm">
                El índice ganador oficial fue el <strong>#{sorteo.indiceGanador}</strong>. Puedes auditar la autenticidad con tu comprobante.
              </Text>
            )}
          </Alert>
        )}

        {/* SI YA TIENE TICKET */}
        {ticketGenerado ? (
          <Stack gap="md">
            <Paper
              p="lg"
              radius="md"
              withBorder
              style={{
                backgroundColor: '#f0fdf4',
                borderColor: '#86efac',
              }}
            >
              <Group justify="space-between" align="center" mb="xs">
                <Group gap={8}>
                  <ThemeIcon color="emerald" variant="filled" radius="xl" size="md">
                    <IconTicket size={18} />
                  </ThemeIcon>
                  <Text fw={700} style={{ color: '#065f46' }}>
                    Tu Comprobante Oficial
                  </Text>
                </Group>
                <Badge color="emerald" size="lg" radius="sm">
                  Ticket #{ticketGenerado.indice}
                </Badge>
              </Group>

              <Text size="sm" style={{ color: '#064e3b' }}>
                <strong>Participante:</strong> {ticketGenerado.nombre}
              </Text>
              <Text size="sm" style={{ color: '#064e3b' }}>
                <strong>Identificador:</strong> {ticketGenerado.identificador}
              </Text>

              <Text size="xs" c="dimmed" mt="xs">
                Hash criptográfico de tu ticket (Merkle Leaf):
              </Text>
              <Code block color="emerald" mt={4} style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                {ticketGenerado.hashTicket}
              </Code>

              <Group mt="md" justify="space-between">
                <Button
                  size="xs"
                  variant="outline"
                  color="emerald"
                  leftSection={<IconDownload size={14} />}
                  onClick={() => descargarTicket(ticketGenerado)}
                >
                  Descargar Ticket JSON
                </Button>
                <Text size="xs" c="dimmed">
                  Guardado en este navegador
                </Text>
              </Group>
            </Paper>

            <Text size="xs" c="dimmed" ta="center">
              Conserva este ticket. Con él podrás verificar on-chain que tu participación estuvo incluida en la lista sellada.
            </Text>
          </Stack>
        ) : (
          /* FORMULARIO DE INSCRIPCIÓN */
          <div>
            {sorteo?.estado === 'ABIERTO' ? (
              <form onSubmit={handleInscribir}>
                <Stack gap="md">
                  <TextInput
                    label="Nombre y Apellido"
                    placeholder="Ej. Lucas García"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.currentTarget.value)}
                    radius="md"
                    description="Como figurará en la lista de participantes"
                  />

                  <TextInput
                    label="DNI o Correo Electrónico"
                    placeholder="Ej. 41234567 o lucas@ejemplo.com"
                    required
                    value={identificador}
                    onChange={(e) => setIdentificador(e.currentTarget.value)}
                    radius="md"
                    description="Identificador único para evitar duplicados"
                  />

                  <Button
                    type="submit"
                    color="emerald"
                    size="md"
                    radius="md"
                    loading={submitting}
                    fullWidth
                    leftSection={<IconTicket size={20} />}
                    style={{
                      boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    Obtener Ticket y Comprobante
                  </Button>

                  <Text size="xs" c="dimmed" ta="center">
                    Al inscribirte, se genera una huella criptográfica SHA3/Keccak256 única. Cero gas y sin necesidad de instalar billeteras.
                  </Text>
                </Stack>
              </form>
            ) : (
              <Alert icon={<IconAlertCircle size={20} />} color="yellow" title="Inscripciones Cerradas">
                Este sorteo ya se encuentra en fase <strong>{sorteo?.estado}</strong>. No se admiten nuevos participantes.
              </Alert>
            )}
          </div>
        )}
      </Card>
    </Container>
  );
}
