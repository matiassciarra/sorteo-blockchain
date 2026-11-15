'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  TextInput,
  Paper,
  Alert,
  Loader,
  Divider,
  Code,
  ThemeIcon,
  NumberInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ethers } from 'ethers';
import {
  IconWallet,
  IconShieldLock,
  IconSparkles,
  IconDeviceTv,
  IconArrowRight,
  IconCheck,
  IconAlertTriangle,
  IconExternalLink,
  IconRefresh,
  IconPlus,
} from '@tabler/icons-react';
import {
  CONTRACT_ADDRESS,
  CONTRACT_ABI,
  AMOY_RPC,
  EXPLORER_URL,
  AMOY_CHAIN_ID_HEX,
  AMOY_CHAIN_ID_DEC,
  GAS_OVERRIDES,
  ESTADOS_SORTEO,
} from '@/lib/contract';
import { construirArbolMerkle } from '@/lib/merkle';

export default function AdminPage() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [idSorteo, setIdSorteo] = useState<number>(1);
  const [contadorSorteosOnChain, setContadorSorteosOnChain] = useState<number>(0);
  const [sorteoInfo, setSorteoInfo] = useState<any>(null);
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [txLog, setTxLog] = useState<{ msg: string; hash?: string }[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [basesTexto, setBasesTexto] = useState('Bases y Condiciones Sorteo Blockchain Demo 2026');

  // Conectar Provider de sólo lectura
  const readProvider = new ethers.JsonRpcProvider(AMOY_RPC);
  const contractRead = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);

  // Conectar MetaMask
  async function conectarMetaMask() {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      notifications.show({
        title: 'MetaMask requerida',
        message: 'Instala la extensión MetaMask para operar como organizador.',
        color: 'red',
      });
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
      const network = await browserProvider.getNetwork();

      if (Number(network.chainId) !== AMOY_CHAIN_ID_DEC) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: AMOY_CHAIN_ID_HEX }],
          });
        } catch (switchError: any) {
          // Si no está agregada la red Amoy
          if (switchError.code === 4902) {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: AMOY_CHAIN_ID_HEX,
                  chainName: 'Polygon Amoy Testnet',
                  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
                  rpcUrls: [AMOY_RPC],
                  blockExplorerUrls: [EXPLORER_URL],
                },
              ],
            });
          }
        }
      }

      const sig = await browserProvider.getSigner();
      const addr = await sig.getAddress();
      setSigner(sig);
      setWalletAddress(addr);

      notifications.show({
        title: 'Billetera Conectada',
        message: `Admin: ${addr.slice(0, 6)}...${addr.slice(-4)}`,
        color: 'emerald',
        icon: <IconCheck size={18} />,
      });
    } catch (err: any) {
      notifications.show({
        title: 'Error de conexión',
        message: err.message,
        color: 'red',
      });
    }
  }

  // Cargar estado del sorteo seleccionado
  async function cargarEstado() {
    try {
      // 1. Contador total on-chain
      try {
        const total = await contractRead.contadorSorteos();
        setContadorSorteosOnChain(Number(total));
      } catch (e) {
        console.warn('Error leyendo contadorSorteos:', e);
      }

      // 2. Estado on-chain del sorteo actual
      let estadoOnChain = 'No Creado';
      let resultadoVRF: any = null;
      try {
        const s = await contractRead.sorteos(idSorteo);
        if (Number(s.idSorteo) !== 0) {
          estadoOnChain = ESTADOS_SORTEO[Number(s.estado)] || 'Desconocido';
          if (estadoOnChain === 'Finalizado') {
            const res = await contractRead.resultados(idSorteo);
            resultadoVRF = {
              indiceGanador: Number(res.indiceGanador),
              numeroAleatorio: res.numeroAleatorio.toString(),
            };
          }
        }
      } catch (e) {
        console.warn('Error leyendo datos de contrato para sorteo #', idSorteo, e);
      }

      // 3. Obtener datos de la base de datos local / API
      const resApi = await fetch(`/api/sorteos/${idSorteo}`);
      let apiData = null;
      if (resApi.ok) {
        const j = await resApi.json();
        apiData = j.sorteo;
      }

      const resParts = await fetch(`/api/sorteos/${idSorteo}/participantes`);
      let parts: any[] = [];
      if (resParts.ok) {
        const j = await resParts.json();
        parts = j.participantes || [];
        setParticipantes(parts);
      }

      setSorteoInfo({
        estadoOnChain,
        resultadoVRF,
        apiData,
        totalInscriptos: parts.length,
      });
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    cargarEstado();
  }, [idSorteo]);

  function agregarLog(msg: string, hash?: string) {
    setTxLog((prev) => [{ msg, hash }, ...prev]);
  }

  // PASO A: Crear Sorteo on-chain
  async function handleCrearSorteo() {
    if (!signer) return conectarMetaMask();
    setLoadingAction('crear');
    try {
      const contractWrite = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const hashBases = ethers.keccak256(ethers.toUtf8Bytes(basesTexto));
      const fechaSorteo = Math.floor(Date.now() / 1000);

      agregarLog(`Enviando transacción crearSorteo on-chain...`);
      const tx = await contractWrite.crearSorteo(hashBases, fechaSorteo, GAS_OVERRIDES);
      agregarLog(`Esperando confirmación en Polygon Amoy...`, tx.hash);
      await tx.wait();

      const total = await contractRead.contadorSorteos();
      const nuevoId = Number(total);
      setIdSorteo(nuevoId);

      // Guardar en backend
      await fetch('/api/sorteos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: nuevoId,
          titulo: `Sorteo #${nuevoId}`,
          basesTexto,
          basesHash: hashBases,
          txCrearHash: tx.hash,
        }),
      });

      agregarLog(`¡Sorteo #${nuevoId} creado con éxito en Polygon!`, tx.hash);
      notifications.show({
        title: 'Sorteo Creado',
        message: `El sorteo #${nuevoId} ya está abierto en blockchain.`,
        color: 'emerald',
      });
      cargarEstado();
    } catch (err: any) {
      notifications.show({ title: 'Error al crear sorteo', message: err.message, color: 'red' });
    } finally {
      setLoadingAction(null);
    }
  }

  // PASO B: Sellar Lista on-chain (Merkle Tree)
  async function handleSellarLista() {
    if (!signer) return conectarMetaMask();
    if (participantes.length === 0) {
      notifications.show({
        title: 'Sin participantes',
        message: 'No puedes sellar un padrón vacío. Espera inscripciones o inscribe participantes de prueba.',
        color: 'yellow',
      });
      return;
    }

    setLoadingAction('sellar');
    try {
      const contractWrite = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Construcción del Merkle Tree exacto
      const tree = construirArbolMerkle(participantes, idSorteo);
      const raizMerkle = tree.getHexRoot();

      agregarLog(`Sellando padrón de ${participantes.length} personas (Raíz Merkle: ${raizMerkle.slice(0, 14)}...)...`);
      const tx = await contractWrite.sellarLista(
        idSorteo,
        raizMerkle,
        participantes.length,
        `ipfs://sorteofiel-padron-sorteo-${idSorteo}`,
        GAS_OVERRIDES
      );
      agregarLog(`Transacción enviada. Confirmando en bloque...`, tx.hash);
      await tx.wait();

      // Actualizar en backend
      await fetch(`/api/sorteos/${idSorteo}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'SELLADO',
          merkleRoot: raizMerkle,
          txSellarHash: tx.hash,
        }),
      });

      agregarLog(`¡Padrón sellado e inmutable on-chain!`, tx.hash);
      notifications.show({
        title: 'Lista Sellada',
        message: 'El Árbol de Merkle fue verificado y registrado en el Smart Contract.',
        color: 'emerald',
      });
      cargarEstado();
    } catch (err: any) {
      notifications.show({ title: 'Error al sellar lista', message: err.message, color: 'red' });
    } finally {
      setLoadingAction(null);
    }
  }

  // PASO C: Solicitar Aleatoriedad a Chainlink VRF
  async function handleSolicitarVRF() {
    if (!signer) return conectarMetaMask();
    setLoadingAction('vrf');
    try {
      const contractWrite = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      agregarLog(`Solicitando aleatoriedad verificable a Chainlink VRF v2.5...`);
      const tx = await contractWrite.solicitarAleatoriedad(idSorteo, GAS_OVERRIDES);
      agregarLog(`Pedido VRF enviado a los nodos de Chainlink. Aguardando respuesta (~15-35s)...`, tx.hash);
      await tx.wait();

      // Actualizar estado en backend
      await fetch(`/api/sorteos/${idSorteo}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: 'SORTEANDO',
          txVrfHash: tx.hash,
        }),
      });

      notifications.show({
        title: 'Chainlink VRF Solicitado',
        message: 'Los nodos oráculo están resolviendo la semilla aleatoria en Amoy.',
        color: 'violet',
      });

      // Polling activo para detectar la llegada del callback VRF (fulfillRandomWords)
      let intentos = 0;
      const poll = setInterval(async () => {
        intentos++;
        try {
          const s = await contractRead.sorteos(idSorteo);
          const estadoNombre = ESTADOS_SORTEO[Number(s.estado)];
          if (estadoNombre === 'Finalizado') {
            clearInterval(poll);
            const res = await contractRead.resultados(idSorteo);
            await fetch(`/api/sorteos/${idSorteo}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                estado: 'FINALIZADO',
                indiceGanador: Number(res.indiceGanador),
                numeroAleatorio: res.numeroAleatorio.toString(),
              }),
            });
            agregarLog(`🎉 ¡Chainlink VRF respondió! Ganador oficial: Ticket #${res.indiceGanador}`);
            cargarEstado();
          } else if (intentos > 25) {
            clearInterval(poll);
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    } catch (err: any) {
      notifications.show({ title: 'Error solicitando VRF', message: err.message, color: 'red' });
    } finally {
      setLoadingAction(null);
    }
  }

  const estadoActual = sorteoInfo?.estadoOnChain || 'Consultando...';

  return (
    <Container size="lg" py={40}>
      <Stack gap="xl">
        {/* Cabecera Admin */}
        <Paper
          p="xl"
          radius="lg"
          withBorder
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="md">
              <ThemeIcon size={48} radius="md" color="emerald" variant="filled">
                <IconShieldLock size={28} />
              </ThemeIcon>
              <div>
                <Title order={2} style={{ color: '#064e3b', fontWeight: 800 }}>
                  Panel de Control Blockchain (Organizador)
                </Title>
                <Text size="sm" c="dimmed">
                  Contrato: <Code color="emerald">{CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-8)}</Code> · Red: Polygon Amoy
                </Text>
              </div>
            </Group>

            <Group gap="sm">
              {walletAddress ? (
                <Badge size="lg" color="emerald" variant="light" leftSection={<IconCheck size={14} />}>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </Badge>
              ) : (
                <Button
                  color="emerald"
                  onClick={conectarMetaMask}
                  leftSection={<IconWallet size={18} />}
                  style={{ boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }}
                >
                  Conectar MetaMask
                </Button>
              )}
            </Group>
          </Group>
        </Paper>

        {/* SELECTOR DE SORTEO Y ESTADO */}
        <Card p="lg" radius="lg" withBorder style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <Group justify="space-between" align="center" wrap="wrap">
            <Group gap="md" align="center">
              <Text fw={700} size="sm" style={{ color: '#064e3b' }}>
                ID Sorteo Activo:
              </Text>
              <NumberInput
                value={idSorteo}
                onChange={(val) => setIdSorteo(Number(val) || 1)}
                min={1}
                w={100}
                radius="md"
              />
              <Button
                variant="subtle"
                color="emerald"
                size="sm"
                onClick={cargarEstado}
                leftSection={<IconRefresh size={16} />}
              >
                Actualizar
              </Button>
            </Group>

            <Group gap="md">
              <Badge color="gray" size="md">
                Total Sorteos On-Chain: {contadorSorteosOnChain}
              </Badge>

              <Badge
                size="lg"
                color={
                  estadoActual === 'Abierto'
                    ? 'emerald'
                    : estadoActual === 'Sellado'
                    ? 'yellow'
                    : estadoActual === 'Finalizado'
                    ? 'teal'
                    : 'gray'
                }
                variant="filled"
              >
                Estado On-Chain: {estadoActual}
              </Badge>
            </Group>
          </Group>
        </Card>

        {/* AVISO IMPORTANTE SOBRE EL CICLO DE VIDA (Explica el por qué del error anterior) */}
        {estadoActual === 'Finalizado' && (
          <Alert
            color="emerald"
            title="¡Sorteo Concluido con Éxito!"
            icon={<IconCheck size={20} />}
            radius="md"
          >
            <Text size="sm">
              Este sorteo ya finalizó y el Smart Contract es inmutable: ya tiene un ganador oficial (<strong>Ticket #{sorteoInfo?.resultadoVRF?.indiceGanador}</strong>).
              Para hacer un nuevo sorteo, crea el <strong>Sorteo #{idSorteo + 1}</strong> en el botón a continuación.
            </Text>
            <Button
              mt="sm"
              size="xs"
              color="emerald"
              variant="filled"
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setIdSorteo(idSorteo + 1);
              }}
            >
              Ir al Sorteo #{idSorteo + 1}
            </Button>
          </Alert>
        )}

        {/* FLUJO DE 3 PASOS EN BLOCKCHAIN */}
        <Stack gap="lg">
          {/* PASO A */}
          <Paper p="lg" radius="lg" withBorder style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Text fw={700} style={{ color: '#064e3b' }}>
                Paso A: Crear Sorteo en Blockchain
              </Text>
              <Badge color={estadoActual !== 'No Creado' ? 'emerald' : 'gray'}>
                {estadoActual !== 'No Creado' ? 'Listo On-Chain' : 'Pendiente'}
              </Badge>
            </Group>
            <Text size="xs" c="dimmed" mb="md">
              Registra las bases y condiciones con hash Keccak256 y abre el padrón en Polygon Amoy.
            </Text>

            <Group gap="md">
              <TextInput
                style={{ flex: 1 }}
                placeholder="Texto o bases del sorteo"
                value={basesTexto}
                onChange={(e) => setBasesTexto(e.currentTarget.value)}
                disabled={estadoActual !== 'No Creado'}
              />
              <Button
                color="emerald"
                onClick={handleCrearSorteo}
                loading={loadingAction === 'crear'}
                disabled={estadoActual !== 'No Creado'}
              >
                Crear Sorteo On-Chain
              </Button>
            </Group>
          </Paper>

          {/* PASO B */}
          <Paper p="lg" radius="lg" withBorder style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <Group justify="space-between" align="center" mb="sm">
              <div>
                <Text fw={700} style={{ color: '#064e3b' }}>
                  Paso B: Sellar Padrón de Participantes (Merkle Tree)
                </Text>
                <Text size="xs" c="dimmed">
                  Inscriptos registrados en base de datos: <strong>{participantes.length}</strong>
                </Text>
              </div>
              <Badge color={estadoActual === 'Sellado' || estadoActual === 'Finalizado' ? 'emerald' : 'gray'}>
                {estadoActual === 'Sellado' || estadoActual === 'Finalizado' ? 'Sellado' : 'Abierto'}
              </Badge>
            </Group>

            <Text size="xs" c="dimmed" mb="md">
              Calcula la Raíz del Árbol de Merkle con todos los tickets registrados y la fija de manera inmutable en el contrato. Cierra la inscripción.
            </Text>

            <Button
              color="yellow"
              variant="filled"
              fullWidth
              onClick={handleSellarLista}
              loading={loadingAction === 'sellar'}
              disabled={estadoActual !== 'Abierto' || participantes.length === 0}
            >
              Sellar Lista ({participantes.length} Participantes)
            </Button>
          </Paper>

          {/* PASO C */}
          <Paper p="lg" radius="lg" withBorder style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <Group justify="space-between" align="center" mb="sm">
              <Text fw={700} style={{ color: '#064e3b' }}>
                Paso C: Solicitar Aleatoriedad a Chainlink VRF v2.5
              </Text>
              <Badge color={estadoActual === 'Finalizado' ? 'teal' : 'gray'}>
                {estadoActual === 'Finalizado' ? 'Ganador Elegido' : 'Pendiente'}
              </Badge>
            </Group>

            <Text size="xs" c="dimmed" mb="md">
              Dispara la solicitud criptográfica al oráculo VRF. En ~20 segundos Chainlink devolverá el número aleatorio verificable que seleccionará al ganador on-chain.
            </Text>

            <Button
              color="violet"
              variant="filled"
              fullWidth
              onClick={handleSolicitarVRF}
              loading={loadingAction === 'vrf'}
              disabled={estadoActual !== 'Sellado'}
            >
              Ejecutar Sorteo con Chainlink VRF
            </Button>
          </Paper>
        </Stack>

        {/* CONSOLA DE TRANSACCIONES */}
        <Paper p="lg" radius="lg" withBorder style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <Text fw={700} size="sm" style={{ color: '#064e3b' }} mb="xs">
            Registro de Operaciones (Transactions Log):
          </Text>
          <Stack gap={6}>
            {txLog.length === 0 ? (
              <Text size="xs" c="dimmed">
                Sin transacciones recientes en esta sesión.
              </Text>
            ) : (
              txLog.map((log, i) => (
                <Paper key={i} p="xs" radius="sm" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Text size="xs" style={{ color: '#0f172a' }}>
                    {log.msg}
                  </Text>
                  {log.hash && (
                    <a
                      href={`${EXPLORER_URL}/tx/${log.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        fontSize: '11px',
                        color: '#059669',
                        textDecoration: 'underline',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginTop: 4,
                      }}
                    >
                      Ver en Polygonscan <IconExternalLink size={12} />
                    </a>
                  )}
                </Paper>
              ))
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
