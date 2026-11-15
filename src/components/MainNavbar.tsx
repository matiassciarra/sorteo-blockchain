'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Group, Button, Text, Badge, Container, Box } from '@mantine/core';
import {
  IconDice,
  IconShieldCheck,
  IconDeviceTv,
  IconUserCheck,
  IconLockSquareRounded,
} from '@tabler/icons-react';

export function MainNavbar() {
  const pathname = usePathname();

  // Si estamos en modo proyector fullscreen, podemos compactar o mostrar un navbar mínimo
  const isProyector = pathname?.includes('/proyector');

  return (
    <Box
      component="header"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <Container size="xl" py={12}>
        <Group justify="space-between" align="center">
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Box
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                color: '#fff',
                padding: '8px 10px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
              }}
            >
              <IconDice size={24} stroke={2.2} />
            </Box>
            <div>
              <Group gap={8} align="center">
                <Text fw={800} size="lg" style={{ color: '#064e3b', letterSpacing: '-0.5px' }}>
                  Sorteo<span style={{ color: '#059669' }}>Fiel</span>
                </Text>
                <Badge variant="light" color="emerald" size="xs">
                  Polygon Amoy
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" style={{ lineHeight: 1 }}>
                Inmutable · Merkle Tree · Chainlink VRF
              </Text>
            </div>
          </Link>

          <Group gap={8}>
            <Button
              component={Link}
              href="/sorteos"
              variant={pathname === '/sorteos' || (pathname?.startsWith('/sorteo/') && !isProyector) ? 'light' : 'subtle'}
              color="emerald"
              size="sm"
              leftSection={<IconUserCheck size={18} />}
            >
              Sorteos Activos
            </Button>

            <Button
              component={Link}
              href="/proyector"
              variant={isProyector || pathname === '/proyector' ? 'filled' : 'subtle'}
              color="emerald"
              size="sm"
              leftSection={<IconDeviceTv size={18} />}
            >
              Proyector en Vivo
            </Button>

            <Button
              component={Link}
              href="/auditoria"
              variant={pathname === '/auditoria' ? 'light' : 'subtle'}
              color="teal"
              size="sm"
              leftSection={<IconShieldCheck size={18} />}
            >
              Auditar Ticket
            </Button>

            <Button
              component={Link}
              href="/admin"
              variant={pathname === '/admin' ? 'filled' : 'outline'}
              color="emerald"
              size="sm"
              leftSection={<IconLockSquareRounded size={18} />}
            >
              Panel Admin
            </Button>
          </Group>
        </Group>
      </Container>
    </Box>
  );
}
