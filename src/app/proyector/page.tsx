'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Container,
  Card,
  Title,
  Text,
  Badge,
  Stack,
  Group,
  SimpleGrid,
  Paper,
  Box,
  ScrollArea,
  ThemeIcon,
  Button,
  Select,
  Switch,
} from '@mantine/core';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  IconDeviceTv,
  IconUsers,
  IconTrophy,
  IconQrcode,
  IconConfetti,
  IconSparkles,
  IconRefresh,
} from '@tabler/icons-react';

interface Participante {
  id: string;
  indice: number;
  nombre: string;
  identificador: string;
  hojaHash: string;
}

interface SorteoData {
  id: number;
  titulo: string;
  basesTexto: string;
  estado: 'ABIERTO' | 'SELLADO' | 'SORTEANDO' | 'FINALIZADO';
  totalParticipantes: number;
  indiceGanador?: number | null;
  numeroAleatorio?: string | null;
  merkleRoot?: string | null;
  txSellarHash?: string | null;
  txVrfHash?: string | null;
}

export default function ProyectorUltimoSorteoPage() {
  const [sorteo, setSorteo] = useState<SorteoData | null>(null);
  const [todosSorteos, setTodosSorteos] = useState<{ id: number; titulo: string; estado: string }[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [idFijado, setIdFijado] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const idFijadoRef = useRef<number | null>(null);
  idFijadoRef.current = idFijado;

  const confettiLanzadoRef = useRef(false);
  const isFetchingRef = useRef(false);

  // Consulta consolidada en una sola llamada a /api/proyector
  async function cargarDatosProyector() {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const url = idFijadoRef.current
        ? `/api/proyector?id=${idFijadoRef.current}`
        : '/api/proyector';

      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();

      if (data.sorteo) {
        setSorteo(data.sorteo);
        setParticipantes(data.participantes || []);
        setTodosSorteos(data.todosSorteos || []);

        if (typeof window !== 'undefined') {
          const expectedUrl = `${window.location.origin}/sorteo/${data.sorteo.id}`;
          setCurrentUrl((prev) => (prev !== expectedUrl ? expectedUrl : prev));
        }

        // Si acaba de finalizar y no hemos lanzado confeti
        if (data.sorteo.estado === 'FINALIZADO' && !confettiLanzadoRef.current) {
          dispararCelebracion();
          confettiLanzadoRef.current = true;
          setAutoRefresh(false); // Detener auto-refresco al finalizar
        } else if (data.sorteo.estado !== 'FINALIZADO') {
          confettiLanzadoRef.current = false;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      isFetchingRef.current = false;
    }
  }

  // Carga inicial: SE EJECUTA UNA SOLA VEZ AL MONTAR
  useEffect(() => {
    cargarDatosProyector();
  }, []);

  // Polling opcional: SOLO si el usuario enciende el switch de auto-refresco
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      cargarDatosProyector();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  function dispararCelebracion() {
    confetti({
      particleCount: 130,
      spread: 85,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#059669', '#f59e0b', '#ffffff'],
    });
    setTimeout(() => {
      confetti({
        particleCount: 90,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#34d399', '#f59e0b'],
      });
      confetti({
        particleCount: 90,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#10b981', '#34d399', '#f59e0b'],
      });
    }, 400);
  }

  const ganadorObj =
    sorteo?.estado === 'FINALIZADO' && sorteo.indiceGanador !== null && sorteo.indiceGanador !== undefined
      ? participantes[Number(sorteo.indiceGanador)]
      : null;

  return (
    <Box
      py={30}
      style={{
        backgroundColor: '#f8fafc',
        minHeight: 'calc(100vh - 70px)',
      }}
    >
      <Container size="xl">
        {/* Cabecera Proyector */}
        <Paper
          p="lg"
          radius="lg"
          mb="xl"
          withBorder
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="md">
              <ThemeIcon size={46} radius="md" color="emerald" variant="filled">
                <IconDeviceTv size={26} />
              </ThemeIcon>
              <div>
                <Group gap={8} align="center">
                  <Title order={2} style={{ color: '#064e3b', fontWeight: 800 }}>
                    {sorteo?.titulo || 'Sorteo en Vivo'}
                  </Title>
                  <Badge color="emerald" size="lg" variant="light">
                    {sorteo ? `Sorteo #${sorteo.id} ${!idFijado ? '(Último Creado)' : ''}` : 'Esperando sorteo'}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  Modo Proyección en Vivo · Sintonizando automáticamente el último sorteo activo
                </Text>
              </div>
            </Group>

            <Group gap="md">
              <Switch
                label="Auto-refresco (5s)"
                color="emerald"
                size="xs"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.currentTarget.checked)}
              />

              <Button
                variant="light"
                color="emerald"
                size="xs"
                leftSection={<IconRefresh size={14} />}
                onClick={() => {
                  confettiLanzadoRef.current = false;
                  cargarDatosProyector();
                }}
              >
                Actualizar
              </Button>

              {todosSorteos.length > 1 && (
                <Select
                  size="xs"
                  w={180}
                  placeholder="Cambiar Sorteo"
                  value={idFijado ? String(idFijado) : 'auto'}
                  onChange={(val) => {
                    const nextId = val && val !== 'auto' ? Number(val) : null;
                    setIdFijado(nextId);
                    idFijadoRef.current = nextId;
                    confettiLanzadoRef.current = false;
                    cargarDatosProyector();
                  }}
                  data={[
                    { value: 'auto', label: '✨ Último Creado (Auto)' },
                    ...todosSorteos.map((s) => ({
                      value: String(s.id),
                      label: `Sorteo #${s.id} (${s.estado})`,
                    })),
                  ]}
                />
              )}

              {sorteo?.estado === 'ABIERTO' && (
                <Badge color="emerald" size="xl" variant="filled" leftSection={<IconSparkles size={16} />}>
                  ● EN VIVO: Inscripciones Abiertas
                </Badge>
              )}
              {sorteo?.estado === 'SELLADO' && (
                <Badge color="yellow" size="xl" variant="filled">
                  ● LISTA SELLADA ON-CHAIN
                </Badge>
              )}
              {sorteo?.estado === 'SORTEANDO' && (
                <Badge color="violet" size="xl" variant="filled">
                  ● CHAINLINK VRF GENERANDO NÚMERO
                </Badge>
              )}
              {sorteo?.estado === 'FINALIZADO' && (
                <Badge color="teal" size="xl" variant="filled" leftSection={<IconTrophy size={16} />}>
                  🏆 SORTEO FINALIZADO
                </Badge>
              )}
            </Group>
          </Group>
        </Paper>

        {/* SI ESTÁ FINALIZADO: PANTALLA GIGANTE DE GANADOR */}
        {sorteo?.estado === 'FINALIZADO' ? (
          <Card
            shadow="xl"
            radius="xl"
            p={50}
            withBorder
            mb="xl"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#86efac',
              textAlign: 'center',
              boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.15)',
            }}
          >
            <Stack align="center" gap="md">
              <ThemeIcon
                size={84}
                radius="xl"
                color="yellow"
                variant="light"
                style={{
                  border: '2px solid #fde047',
                  boxShadow: '0 0 30px rgba(234, 179, 8, 0.3)',
                }}
              >
                <IconTrophy size={50} color="#ca8a04" />
              </ThemeIcon>

              <Badge color="emerald" size="xl" radius="md">
                TICKET GANADOR #{sorteo.indiceGanador}
              </Badge>

              <Title
                order={1}
                style={{
                  fontSize: '3.2rem',
                  fontWeight: 900,
                  color: '#064e3b',
                  letterSpacing: '-1px',
                }}
              >
                {ganadorObj ? ganadorObj.nombre : `Participante #${sorteo.indiceGanador}`}
              </Title>

              {ganadorObj?.identificador && (
                <Text size="xl" fw={600} style={{ color: '#059669' }}>
                  Identificador: {ganadorObj.identificador}
                </Text>
              )}

              <Paper
                p="md"
                radius="md"
                withBorder
                mt="md"
                style={{
                  backgroundColor: '#f0fdf4',
                  borderColor: '#bbf7d0',
                  maxWidth: 680,
                  width: '100%',
                }}
              >
                <Text size="xs" fw={700} style={{ color: '#065f46' }}>
                  Prueba de Aleatoriedad Chainlink VRF:
                </Text>
                <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                  Semilla / Número Aleatorio: {sorteo.numeroAleatorio || 'Confirmado en Polygon Amoy'}
                </Text>

                {sorteo.merkleRoot && (
                  <Text size="xs" c="dimmed" mt={4} style={{ wordBreak: 'break-all' }}>
                    Raíz Merkle Inmutable: {sorteo.merkleRoot}
                  </Text>
                )}
              </Paper>

              <Button
                color="emerald"
                size="md"
                variant="light"
                leftSection={<IconConfetti size={18} />}
                onClick={dispararCelebracion}
                mt="sm"
              >
                Lanzar más confeti
              </Button>
            </Stack>
          </Card>
        ) : null}

        {/* GRID PRINCIPAL: QR A LA IZQUIERDA + LISTA EN VIVO A LA DERECHA */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          {/* COLUMNA 1: QR GIGANTE PARA EL PÚBLICO */}
          <Card
            shadow="sm"
            radius="lg"
            p="xl"
            withBorder
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
              textAlign: 'center',
            }}
          >
            <Stack align="center" gap="md">
              <ThemeIcon size={48} radius="xl" color="emerald" variant="light">
                <IconQrcode size={28} />
              </ThemeIcon>

              <Title order={3} style={{ color: '#064e3b' }}>
                ¡Escaneá para Inscribirte!
              </Title>
              <Text size="sm" c="dimmed" maw={360}>
                Apunta la cámara de tu teléfono al código QR para obtener tu ticket digital instantáneo en este sorteo.
              </Text>

              {/* QR CODE */}
              <Box
                p={16}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '2px dashed #10b981',
                  boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.1)',
                  display: 'inline-block',
                }}
              >
                {currentUrl ? (
                  <QRCodeSVG
                    value={currentUrl}
                    size={240}
                    level="H"
                    includeMargin={true}
                    fgColor="#064e3b"
                  />
                ) : (
                  <Text size="sm" c="dimmed" ta="center" maw={220} py="md">
                    Todavía no hay un sorteo creado. Crealo desde el Panel Admin y el QR aparece acá automáticamente.
                  </Text>
                )}
              </Box>

              <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                {currentUrl}
              </Text>
            </Stack>
          </Card>

          {/* COLUMNA 2: CONTADOR Y LISTA EN VIVO */}
          <Card
            shadow="sm"
            radius="lg"
            p="xl"
            withBorder
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#e2e8f0',
            }}
          >
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Group gap={8}>
                  <ThemeIcon size={38} radius="md" color="emerald" variant="light">
                    <IconUsers size={22} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="md" style={{ color: '#064e3b' }}>
                      Padrón en Vivo
                    </Text>
                    <Text size="xs" c="dimmed">
                      Actualización en tiempo real
                    </Text>
                  </div>
                </Group>

                <Paper
                  px="md"
                  py="xs"
                  radius="md"
                  style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                  }}
                >
                  <Text size="xs" c="dimmed" ta="center">
                    TOTAL INSCRIPTOS
                  </Text>
                  <Text size="1.8rem" fw={900} style={{ color: '#047857' }} ta="center">
                    {participantes.length}
                  </Text>
                </Paper>
              </Group>

              <ScrollArea h={340} offsetScrollbars>
                {participantes.length === 0 ? (
                  <Box py={40} ta="center">
                    <Text size="sm" c="dimmed">
                      Esperando primeros inscriptos...
                    </Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      Escanea el QR de la izquierda para ser el primero.
                    </Text>
                  </Box>
                ) : (
                  <Stack gap={8}>
                    {participantes.map((p) => (
                      <Paper
                        key={p.id}
                        p="xs"
                        radius="md"
                        withBorder
                        style={{
                          backgroundColor:
                            sorteo?.estado === 'FINALIZADO' && Number(sorteo.indiceGanador) === p.indice
                              ? '#dcfce7'
                              : '#ffffff',
                          borderColor:
                            sorteo?.estado === 'FINALIZADO' && Number(sorteo.indiceGanador) === p.indice
                              ? '#22c55e'
                              : '#f1f5f9',
                        }}
                      >
                        <Group justify="space-between" align="center">
                          <Group gap="sm">
                            <Badge
                              color={
                                sorteo?.estado === 'FINALIZADO' && Number(sorteo.indiceGanador) === p.indice
                                  ? 'yellow'
                                  : 'emerald'
                              }
                              size="md"
                            >
                              #{p.indice}
                            </Badge>
                            <div>
                              <Text size="sm" fw={600} style={{ color: '#0f172a' }}>
                                {p.nombre}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {p.identificador}
                              </Text>
                            </div>
                          </Group>

                          <Text size="10px" c="dimmed" style={{ fontFamily: 'monospace' }}>
                            {p.hojaHash.slice(0, 10)}...
                          </Text>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </ScrollArea>
            </Stack>
          </Card>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
