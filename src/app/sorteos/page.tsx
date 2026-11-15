'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Badge,
  Button,
  Group,
  SimpleGrid,
  Card,
  Stack,
  SegmentedControl,
  Paper,
  ThemeIcon,
  Loader,
  Box,
} from '@mantine/core';
import {
  IconTicket,
  IconSparkles,
  IconClock,
  IconTrophy,
  IconDeviceTv,
  IconArrowRight,
  IconUsers,
  IconRefresh,
} from '@tabler/icons-react';

interface SorteoItem {
  id: number;
  titulo: string;
  basesTexto: string;
  estado: 'ABIERTO' | 'SELLADO' | 'SORTEANDO' | 'FINALIZADO';
  totalParticipantes: number;
  indiceGanador?: number | null;
  createdAt: string;
}

export default function ListaSorteosPage() {
  const [sorteos, setSorteos] = useState<SorteoItem[]>([]);
  const [filtro, setFiltro] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  async function cargarSorteos() {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const res = await fetch('/api/sorteos');
      if (res.ok) {
        const data = await res.json();
        setSorteos(data.sorteos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarSorteos();
  }, []);

  const sorteosFiltrados = sorteos.filter((s) => {
    if (filtro === 'abiertos') return s.estado === 'ABIERTO';
    if (filtro === 'finalizados') return s.estado === 'FINALIZADO';
    return true;
  });

  return (
    <Box py={40}>
      <Container size="lg">
        {/* Cabecera */}
        <Stack gap="xs" mb="xl">
          <Group justify="space-between" align="center" wrap="wrap">
            <div>
              <Group gap="xs">
                <Title order={2} style={{ color: '#064e3b', fontWeight: 800 }}>
                  Sorteos Disponibles
                </Title>
                <Badge color="emerald" size="lg" variant="light">
                  {sorteos.length} en total
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                Selecciona un sorteo para inscribirte o seguir el resultado en tiempo real.
              </Text>
            </div>

            <Group gap="sm">
              <Button
                variant="subtle"
                color="emerald"
                size="sm"
                leftSection={<IconRefresh size={16} />}
                onClick={cargarSorteos}
              >
                Actualizar
              </Button>
            </Group>
          </Group>

          {/* Filtros */}
          <Group mt="md">
            <SegmentedControl
              value={filtro}
              onChange={setFiltro}
              color="emerald"
              data={[
                { label: `Todos (${sorteos.length})`, value: 'todos' },
                {
                  label: `🟢 Abiertos (${sorteos.filter((s) => s.estado === 'ABIERTO').length})`,
                  value: 'abiertos',
                },
                {
                  label: `🏆 Finalizados (${sorteos.filter((s) => s.estado === 'FINALIZADO').length})`,
                  value: 'finalizados',
                },
              ]}
            />
          </Group>
        </Stack>

        {loading && sorteos.length === 0 ? (
          <Box py={80} ta="center">
            <Loader color="emerald" size="lg" />
            <Text mt="md" c="dimmed">
              Cargando lista de sorteos...
            </Text>
          </Box>
        ) : sorteosFiltrados.length === 0 ? (
          <Paper p={50} radius="lg" withBorder ta="center" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <Text size="lg" fw={700} style={{ color: '#064e3b' }}>
              No hay sorteos en esta categoría
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              Crea un nuevo sorteo desde el Panel de Administrador para comenzar.
            </Text>
            <Button component={Link} href="/admin" color="emerald" mt="md" size="sm">
              Ir al Panel Admin
            </Button>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
            {sorteosFiltrados.map((s) => (
              <Card
                key={s.id}
                shadow="sm"
                radius="lg"
                p="lg"
                withBorder
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: s.estado === 'ABIERTO' ? '#a7f3d0' : '#e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <div>
                  <Group justify="space-between" align="center" mb="xs">
                    <Badge color="emerald" variant="filled" size="sm">
                      Sorteo #{s.id}
                    </Badge>

                    {s.estado === 'ABIERTO' && (
                      <Badge color="emerald" variant="light" leftSection={<IconSparkles size={12} />}>
                        Inscripción Abierta
                      </Badge>
                    )}
                    {s.estado === 'SELLADO' && (
                      <Badge color="yellow" variant="light" leftSection={<IconClock size={12} />}>
                        Sellado
                      </Badge>
                    )}
                    {s.estado === 'SORTEANDO' && (
                      <Badge color="violet" variant="light">
                        Sorteando (VRF)
                      </Badge>
                    )}
                    {s.estado === 'FINALIZADO' && (
                      <Badge color="teal" variant="filled" leftSection={<IconTrophy size={12} />}>
                        Finalizado
                      </Badge>
                    )}
                  </Group>

                  <Title order={3} size="h4" style={{ color: '#064e3b', fontWeight: 700 }} mb={4}>
                    {s.titulo}
                  </Title>

                  <Text size="xs" c="dimmed" lineClamp={2} mb="md">
                    {s.basesTexto}
                  </Text>
                </div>

                <Stack gap="sm" mt="md">
                  <Paper
                    p="xs"
                    radius="md"
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Group gap={6}>
                        <IconUsers size={16} color="#059669" />
                        <Text size="xs" fw={600} style={{ color: '#064e3b' }}>
                          Inscriptos
                        </Text>
                      </Group>
                      <Text size="xs" fw={700} style={{ color: '#059669' }}>
                        {s.totalParticipantes} personas
                      </Text>
                    </Group>

                    {s.estado === 'FINALIZADO' && s.indiceGanador !== null && (
                      <Group justify="space-between" align="center" mt={4}>
                        <Text size="xs" fw={600} style={{ color: '#ca8a04' }}>
                          Ticket Ganador:
                        </Text>
                        <Badge color="yellow" size="sm">
                          #{s.indiceGanador}
                        </Badge>
                      </Group>
                    )}
                  </Paper>

                  <Group gap={8} grow>
                    <Button
                      component={Link}
                      href={`/sorteo/${s.id}`}
                      color="emerald"
                      variant={s.estado === 'ABIERTO' ? 'filled' : 'light'}
                      size="sm"
                      leftSection={<IconTicket size={16} />}
                    >
                      {s.estado === 'ABIERTO' ? 'Inscribirme' : 'Ver Sorteo'}
                    </Button>

                    <Button
                      component={Link}
                      href={`/sorteo/${s.id}/proyector`}
                      color="emerald"
                      variant="subtle"
                      size="sm"
                      leftSection={<IconDeviceTv size={16} />}
                    >
                      Proyector
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}
