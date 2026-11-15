import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '@/theme';
import { MainNavbar } from '@/components/MainNavbar';

export const metadata = {
  title: 'SorteoFiel · Sorteos Transparentes en Blockchain',
  description: 'Plataforma verificable de sorteos con Merkle Trees y Chainlink VRF sobre Polygon Amoy.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ backgroundColor: '#f8fafc', color: '#0f172a', margin: 0, minHeight: '100vh' }}>
        <MantineProvider theme={theme} defaultColorScheme="light">
          <Notifications position="top-right" />
          <MainNavbar />
          <main style={{ minHeight: 'calc(100vh - 70px)' }}>{children}</main>
        </MantineProvider>
      </body>
    </html>
  );
}
