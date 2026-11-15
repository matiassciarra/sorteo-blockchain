# SorteoFiel · Sorteos Transparentes en Blockchain

Plataforma Web3 y Web2 de sorteos verificables en tiempo real, construida con **Next.js (App Router)**, **Mantine UI (Blanco & Verde Esmeralda)**, **Árboles de Merkle** y **Chainlink VRF v2.5** sobre la red **Polygon Amoy**.

---

## 🚀 Arquitectura para la Presentación en Vivo (Demo)

Diseñado con 3 vistas simultáneas para garantizar el impacto visual y la transparencia durante la presentación:

1. **📱 Vista Móvil del Público (`/sorteo/[id]`)**:
   - Los asistentes de la sala escanean el código QR con sus celulares.
   - Ingresan Nombre y DNI/Email (cero costos de gas, sin billetera).
   - Reciben y descargan al instante su **Comprobante Digital Criptográfico (Ticket #N + Hash Keccak256)**.
   - Si el sorteo finaliza, ven en vivo si resultaron ganadores.

2. **📺 Vista de Proyección en Vivo (`/sorteo/[id]/proyector`)**:
   - Pensada para el proyector o pantalla gigante del escenario.
   - Código QR dinámico grande para que toda la audiencia se inscriba.
   - Contador en tiempo real del padrón subiendo conforme la gente se registra.
   - Lista animada de participantes con sus hashes.
   - Al finalizar, despliega pantalla gigante del ganador con confeti y hash de la transacción on-chain.

3. **🛡️ Panel de Control del Organizador (`/admin`)**:
   - Conexión a MetaMask en red Polygon Amoy.
   - Selector y creador de sorteos on-chain.
   - **Paso A**: Crear sorteo on-chain con bases y condiciones inmutables.
   - **Paso B**: Sellar padrón (calcula el Merkle Root con todos los inscriptos de la base de datos y lo sella en el Smart Contract).
   - **Paso C**: Solicitar aleatoriedad a Chainlink VRF (espera el callback criptográfico que define al ganador matemáticamente).

4. **🔍 Auditor Criptográfico (`/auditoria`)**:
   - Cualquier espectador o jurado puede subir o pegar su comprobante JSON y verificar contra el contrato inteligente que no hubo manipulación.

---

## ⚡ Cómo Iniciar el Proyecto

### 1. Desarrollo Local
```bash
# Iniciar servidor de desarrollo
pnpm dev
# o
npm run dev
```
Abre en tu navegador:
- [http://localhost:3000](http://localhost:3000) (Inicio)
- [http://localhost:3000/sorteo/1](http://localhost:3000/sorteo/1) (Inscripción Móvil)
- [http://localhost:3000/sorteo/1/proyector](http://localhost:3000/sorteo/1/proyector) (Pantalla Escenario)
- [http://localhost:3000/admin](http://localhost:3000/admin) (Organizador MetaMask)

---

## 🗄️ Base de Datos: PostgreSQL (Neon / Supabase)

La app elige sola dónde guardar sorteos e inscriptos:

- **Sin `DATABASE_URL`** (modo local): usa un archivo JSON temporal. Sirve para probar en una sola compu.
- **Con `DATABASE_URL`**: usa PostgreSQL. Es lo que hace falta para publicarla, porque en Vercel el archivo temporal se pierde. **Las tablas se crean solas** la primera vez; no hay que correr ningún comando.

1. Crear una base gratis en [Neon](https://neon.tech) (o Supabase) y copiar el *connection string*.
2. En local, pegarlo en `.env.local`:
   ```env
   DATABASE_URL="postgresql://usuario:password@host/neondb?sslmode=require"
   ```

## 🌐 Publicar en Vercel

1. En [vercel.com](https://vercel.com) → **Add New → Project** → importar este repositorio (Vercel detecta Next.js solo).
2. En **Environment Variables** cargar:
   - `DATABASE_URL` → el connection string de Neon
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` → `0x0DF3C49109d960cfFde411A6c34058c86A675c29`
   - `NEXT_PUBLIC_AMOY_RPC` → `https://polygon-amoy-bor-rpc.publicnode.com`
   - `NEXT_PUBLIC_EXPLORER_URL` → `https://amoy.polygonscan.com`
3. **Deploy**. La URL pública (`https://<proyecto>.vercel.app`) es la que va en el QR del proyector.

---

## 📌 Aclaración Importante sobre el Ciclo de Vida del Smart Contract

En Blockchain, un sorteo tiene una máquina de estados unidireccional estricta:
```
[No Creado] ➔ [Abierto] ➔ [Sellado] ➔ [Sorteando (VRF)] ➔ [Finalizado]
```
Una vez que un sorteo llega a **`Finalizado`**, el contrato inteligente sella de forma perpetua ese sorteo con su ganador oficial. Por seguridad, **no permite volver a agregar participantes ni volver a sortear el mismo ID**.

👉 Para sortear de nuevo, en el **Panel Admin** simplemente se crea o selecciona el siguiente sorteo (`Sorteo #2`, `Sorteo #3`, etc.).
