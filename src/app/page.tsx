'use client';

import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  SimpleGrid,
  Card,
  ThemeIcon,
  Badge,
  Stack,
  Box,
} from '@mantine/core';
import {
  IconDice,
  IconShieldLock,
  IconDeviceTv,
  IconCpu,
  IconCheck,
  IconArrowRight,
  IconQrcode,
} from '@tabler/icons-react';

export default function HomePage() {
  return (
    <Box py={50}>
      <Container size="lg">
        {/* Hero Section */}
        <Stack align="center" ta="center" gap="lg" mb={60}>
          <Badge
            variant="filled"
            color="emerald"
            size="lg"
            radius="md"
            style={{ textTransform: 'none', fontWeight: 600 }}
          >
            Sorteos 100% Transparentes y Verificables en Blockchain
          </Badge>

          <Title
            order={1}
            style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              color: '#064e3b',
              lineHeight: 1.15,
              maxWidth: 780,
            }}
          >
            Cero dudas, cero manipulación.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Aleatoriedad criptográfica en vivo.
            </span>
          </Title>

          <Text size="lg" c="dimmed" maw={640}>
            Diseñado para presentaciones en vivo: los asistentes se inscriben en segundos desde su celular con un código QR, el padrón se sella con un Árbol de Merkle y un oráculo descentralizado (Chainlink VRF) elige al ganador en tiempo real.
          </Text>

          <Group mt="md" gap="md">
            <Button
              component={Link}
              href="/sorteos"
              size="lg"
              color="emerald"
              rightSection={<IconArrowRight size={20} />}
              style={{
                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
              }}
            >
              Ver Sorteos Activos
            </Button>

            <Button
              component={Link}
              href="/proyector"
              size="lg"
              variant="outline"
              color="emerald"
              leftSection={<IconDeviceTv size={20} />}
            >
              Abrir Pantalla Proyector
            </Button>
          </Group>
        </Stack>

        {/* 3 Bloques Clave de la Demo */}
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mb={60}>
          {/* Card 1: Participantes */}
          <Card
            shadow="sm"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              borderColor: '#d1fae5',
              backgroundColor: '#ffffff',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <ThemeIcon size={52} radius="md" color="emerald" variant="light" mb="md">
              <IconQrcode size={30} />
            </ThemeIcon>
            <Text fw={700} size="xl" style={{ color: '#065f46' }} mb="xs">
              1. Inscripción Móvil
            </Text>
            <Text size="sm" c="dimmed" mb="lg">
              Los asistentes escanean el QR desde sus teléfonos, ingresan nombre y DNI y obtienen al instante su comprobante digital criptográfico. Sin costos ni MetaMask.
            </Text>
            <Button
              component={Link}
              href="/sorteos"
              variant="light"
              color="emerald"
              fullWidth
              mt="auto"
            >
              Explorar y Participar
            </Button>
          </Card>

          {/* Card 2: Pantalla en Vivo */}
          <Card
            shadow="sm"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              borderColor: '#a7f3d0',
              backgroundColor: '#ffffff',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <ThemeIcon size={52} radius="md" color="teal" variant="light" mb="md">
              <IconDeviceTv size={30} />
            </ThemeIcon>
            <Text fw={700} size="xl" style={{ color: '#065f46' }} mb="xs">
              2. Proyector en Vivo
            </Text>
            <Text size="sm" c="dimmed" mb="lg">
              Diseñado para proyectar en el evento: muestra el QR gigante, contador en vivo de inscriptos, animación del sorteo y revelación del ganador con confeti y hash on-chain.
            </Text>
            <Button
              component={Link}
              href="/proyector"
              variant="filled"
              color="emerald"
              fullWidth
              mt="auto"
            >
              Lanzar Proyector
            </Button>
          </Card>

          {/* Card 3: Administrador */}
          <Card
            shadow="sm"
            padding="xl"
            radius="lg"
            withBorder
            style={{
              borderColor: '#d1fae5',
              backgroundColor: '#ffffff',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
          >
            <ThemeIcon size={52} radius="md" color="emerald" variant="light" mb="md">
              <IconShieldLock size={30} />
            </ThemeIcon>
            <Text fw={700} size="xl" style={{ color: '#065f46' }} mb="xs">
              3. Panel Blockchain
            </Text>
            <Text size="sm" c="dimmed" mb="lg">
              El organizador conecta MetaMask, sella la raíz del Árbol de Merkle con un solo clic y pide el número aleatorio a Chainlink VRF sobre Polygon Amoy.
            </Text>
            <Button
              component={Link}
              href="/admin"
              variant="outline"
              color="emerald"
              fullWidth
              mt="auto"
            >
              Abrir Panel Admin
            </Button>
          </Card>
        </SimpleGrid>

        {/* Beneficios / Seguridad */}
        <Box
          p="xl"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
          }}
        >
          <Group justify="space-between" align="center" wrap="wrap">
            <div>
              <Text fw={700} size="lg" style={{ color: '#064e3b' }}>
                ¿Por qué SorteoFiel es matemáticamente inviolable?
              </Text>
              <Text size="sm" c="dimmed">
                Cumple con el estándar de inmutabilidad estricta:
              </Text>
            </div>
            <Group gap="lg">
              <Group gap={6}>
                <IconCheck size={18} color="#10b981" />
                <Text size="sm" fw={600}>
                  Merkle Tree OpenZeppelin
                </Text>
              </Group>
              <Group gap={6}>
                <IconCheck size={18} color="#10b981" />
                <Text size="sm" fw={600}>
                  Chainlink VRF v2.5
                </Text>
              </Group>
              <Group gap={6}>
                <IconCheck size={18} color="#10b981" />
                <Text size="sm" fw={600}>
                  Polygon Amoy Testnet
                </Text>
              </Group>
            </Group>
          </Group>
        </Box>
      </Container>
    </Box>
  );
}
