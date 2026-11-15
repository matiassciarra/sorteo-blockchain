'use client';

import { useState } from 'react';
import {
  Container,
  Card,
  Title,
  Text,
  Textarea,
  Button,
  Stack,
  Alert,
  Paper,
  Badge,
  Code,
  Group,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import { ethers } from 'ethers';
import {
  IconShieldCheck,
  IconCheck,
  IconX,
  IconTrophy,
  IconFileUpload,
  IconSearch,
} from '@tabler/icons-react';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  AMOY_RPC,
  ESTADOS_SORTEO,
} from '@/lib/contract';
import { construirArbolMerkle, generarHoja } from '@/lib/merkle';

export default function AuditoriaPage() {
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const readProvider = new ethers.JsonRpcProvider(AMOY_RPC);
  const contractRead = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);

  async function handleVerificar() {
    if (!jsonText.trim()) return;
    setLoading(true);
    setResultado(null);

    try {
      const comp = JSON.parse(jsonText.trim());
      const idSorteo = Number(comp.idSorteo);
      const indice = Number(comp.indice);
      const nombre = comp.nombre;
      const identificador = comp.identificador;

      // 1. Obtener la lista completa de inscriptos del sorteo
      const resParts = await fetch(`/api/sorteos/${idSorteo}/participantes`);
      if (!resParts.ok) {
        throw new Error('No se pudo obtener el padrón para reconstruir el árbol de Merkle.');
      }
      const dataP = await resParts.json();
      const participantes = dataP.participantes || [];

      // 2. Reconstruir Merkle Tree y Proof
      const tree = construirArbolMerkle(participantes, idSorteo);
      const hojaRecalculada = generarHoja(idSorteo, indice, nombre, identificador);
      const proof = tree.getHexProof(hojaRecalculada);

      // 3. Consultar Smart Contract en Polygon Amoy
      const esValido = await contractRead.verificarParticipacion(idSorteo, proof, hojaRecalculada);
      const s = await contractRead.sorteos(idSorteo);
      const estadoNum = Number(s.estado);
      const estadoNombre = ESTADOS_SORTEO[estadoNum] || 'Desconocido';

      let esGanador = false;
      let ganadorIndice: number | null = null;
      let numeroAleatorio: string | null = null;

      if (estadoNombre === 'Finalizado') {
        const res = await contractRead.resultados(idSorteo);
        ganadorIndice = Number(res.indiceGanador);
        numeroAleatorio = res.numeroAleatorio.toString();
        esGanador = ganadorIndice === indice;
      }

      setResultado({
        esValido,
        estadoNombre,
        esGanador,
        ganadorIndice,
        numeroAleatorio,
        hojaRecalculada,
        proof,
        idSorteo,
        indice,
        nombre,
      });
    } catch (err: any) {
      setResultado({
        error: err.message || 'Error analizando comprobante. Verifica que sea un JSON válido.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCargarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target?.result as string);
    };
    reader.readAsText(file);
  }

  return (
    <Container size="md" py={40}>
      <Card
        shadow="md"
        radius="lg"
        p="xl"
        withBorder
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
        }}
      >
        <Stack gap="lg">
          <Group gap="md">
            <ThemeIcon size={48} radius="md" color="emerald" variant="filled">
              <IconShieldCheck size={28} />
            </ThemeIcon>
            <div>
              <Title order={2} style={{ color: '#064e3b', fontWeight: 800 }}>
                Auditoría Criptográfica Pública
              </Title>
              <Text size="sm" c="dimmed">
                Verifica de manera independiente e indiscutible que tu ticket formó parte de la lista sellada on-chain.
              </Text>
            </div>
          </Group>

          <Divider />

          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text size="sm" fw={600} style={{ color: '#064e3b' }}>
                Pega el contenido de tu comprobante JSON:
              </Text>
              <Button
                variant="subtle"
                color="emerald"
                size="xs"
                leftSection={<IconFileUpload size={14} />}
                component="label"
              >
                Subir archivo .json
                <input type="file" accept=".json" hidden onChange={handleCargarArchivo} />
              </Button>
            </Group>

            <Textarea
              rows={6}
              placeholder='{\n  "sorteoFielVersion": "1.0",\n  "idSorteo": 1,\n  "indice": 0,\n  "nombre": "Lucas García",\n  "identificador": "41234567",\n  "hashTicket": "0x..."\n}'
              value={jsonText}
              onChange={(e) => setJsonText(e.currentTarget.value)}
              styles={{ input: { fontFamily: 'monospace', fontSize: '12px' } }}
            />

            <Button
              color="emerald"
              size="md"
              leftSection={<IconSearch size={18} />}
              onClick={handleVerificar}
              loading={loading}
              disabled={!jsonText.trim()}
              style={{ boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
            >
              Verificar con Smart Contract en Polygon Amoy
            </Button>
          </Stack>

          {resultado && (
            <Stack gap="md" mt="md">
              {resultado.error ? (
                <Alert color="red" title="Error en la verificación" icon={<IconX size={20} />}>
                  {resultado.error}
                </Alert>
              ) : (
                <Paper
                  p="lg"
                  radius="md"
                  withBorder
                  style={{
                    backgroundColor: resultado.esValido ? '#f0fdf4' : '#fef2f2',
                    borderColor: resultado.esValido ? '#86efac' : '#fca5a5',
                  }}
                >
                  <Group justify="space-between" align="center" mb="sm">
                    <Group gap="xs">
                      <ThemeIcon
                        size={32}
                        radius="xl"
                        color={resultado.esValido ? 'emerald' : 'red'}
                      >
                        {resultado.esValido ? <IconCheck size={20} /> : <IconX size={20} />}
                      </ThemeIcon>
                      <Text fw={800} size="md" style={{ color: resultado.esValido ? '#065f46' : '#991b1b' }}>
                        {resultado.esValido
                          ? '✅ TICKET 100% AUTÉNTICO Y SELLADO ON-CHAIN'
                          : '❌ COMPROBANTE INVÁLIDO O ALTERADO'}
                      </Text>
                    </Group>
                    <Badge color={resultado.esValido ? 'emerald' : 'red'}>
                      Sorteo #{resultado.idSorteo}
                    </Badge>
                  </Group>

                  <Text size="sm" style={{ color: '#0f172a' }}>
                    <strong>Participante:</strong> {resultado.nombre} (Ticket #{resultado.indice})
                  </Text>
                  <Text size="sm" style={{ color: '#0f172a' }}>
                    <strong>Estado del Sorteo:</strong> {resultado.estadoNombre}
                  </Text>

                  {resultado.esValido && resultado.estadoNombre === 'Finalizado' && (
                    <Alert
                      mt="md"
                      color={resultado.esGanador ? 'yellow' : 'gray'}
                      title={resultado.esGanador ? '🏆 ¡ESTE TICKET ES EL GANADOR!' : 'Participación Correcta'}
                      icon={<IconTrophy size={20} />}
                    >
                      {resultado.esGanador ? (
                        <Text size="sm">
                          ¡Felicitaciones! Este comprobante coincide de manera exacta con el índice ganador #{resultado.ganadorIndice} arrojado por Chainlink VRF.
                        </Text>
                      ) : (
                        <Text size="sm">
                          Este ticket participó legítimamente. El índice ganador seleccionado fue el #{resultado.ganadorIndice}.
                        </Text>
                      )}
                    </Alert>
                  )}

                  <Divider my="sm" />

                  <Text size="xs" c="dimmed">
                    Prueba de Merkle (Merkle Proof - {resultado.proof.length} ramas):
                  </Text>
                  <Code block color="emerald" mt={4} style={{ fontSize: '11px' }}>
                    {JSON.stringify(resultado.proof, null, 2)}
                  </Code>
                </Paper>
              )}
            </Stack>
          )}
        </Stack>
      </Card>
    </Container>
  );
}
