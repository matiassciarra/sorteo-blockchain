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

## 🗄️ Base de Datos: PostgreSQL (Supabase / Neon)

La aplicación almacena los sorteos y participantes en tiempo real. 
Viene con soporte directo para almacenamiento local automático (`data/store.json`) y conexión con PostgreSQL:

1. Crea tu base de datos gratuita en [Supabase](https://supabase.com) o [Neon](https://neon.tech).
2. Pega tu cadena de conexión en `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?sslmode=require"
   ```

---

## 📌 Aclaración Importante sobre el Ciclo de Vida del Smart Contract

En Blockchain, un sorteo tiene una máquina de estados unidireccional estricta:
```
[No Creado] ➔ [Abierto] ➔ [Sellado] ➔ [Sorteando (VRF)] ➔ [Finalizado]
```
Una vez que un sorteo llega a **`Finalizado`**, el contrato inteligente sella de forma perpetua ese sorteo con su ganador oficial. Por seguridad, **no permite volver a agregar participantes ni volver a sortear el mismo ID**.

👉 Para sortear de nuevo, en el **Panel Admin** simplemente se crea o selecciona el siguiente sorteo (`Sorteo #2`, `Sorteo #3`, etc.).
