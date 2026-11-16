export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0DF3C49109d960cfFde411A6c34058c86A675c29';

export const AMOY_RPC =
  process.env.NEXT_PUBLIC_AMOY_RPC || 'https://polygon-amoy-bor-rpc.publicnode.com';

export const EXPLORER_URL =
  process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://amoy.polygonscan.com';

export const AMOY_CHAIN_ID_HEX = '0x13882'; // 80002 decimal
export const AMOY_CHAIN_ID_DEC = 80002;

export const CONTRACT_ABI = [
  'function crearSorteo(bytes32 _hashBases, uint256 _fechaSorteo) external returns (uint256)',
  'function sellarLista(uint256 _idSorteo, bytes32 _huellaLista, uint256 _totalParticipantes, string calldata _uriLista) external',
  'function solicitarAleatoriedad(uint256 _idSorteo) external returns (uint256)',
  'function verificarParticipacion(uint256 _idSorteo, bytes32[] calldata _merkleProof, bytes32 _hojaParticipante) external view returns (bool)',
  'function sorteos(uint256) external view returns (uint256 idSorteo, address organizador, bytes32 hashBases, uint256 fechaSorteo, uint8 estado)',
  'function registrosSellados(uint256) external view returns (bytes32 huellaLista, uint256 totalParticipantes, string uriLista)',
  'function resultados(uint256) external view returns (uint256 requestId, uint256 numeroAleatorio, uint256 indiceGanador)',
  'function contadorSorteos() external view returns (uint256)',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function ORGANIZADOR_ROLE() external view returns (bytes32)',
  'event SorteoCreado(uint256 indexed idSorteo, address indexed organizador, bytes32 hashBases)',
  'event ListaSellada(uint256 indexed idSorteo, bytes32 huellaLista, uint256 totalParticipantes)',
  'event AleatoriedadSolicitada(uint256 indexed idSorteo, uint256 requestId)',
  'event SorteoFinalizado(uint256 indexed idSorteo, uint256 indiceGanador, uint256 numeroAleatorio)',
  'error AccessControlUnauthorizedAccount(address account, bytes32 neededRole)'
];

export const ESTADOS_SORTEO = [
  'Abierto',
  'Sellado',
  'Sorteando',
  'Finalizado',
  'Cancelado'
] as const;

export const GAS_OVERRIDES = {
  maxPriorityFeePerGas: BigInt('30000000000'), // 30 gwei
  maxFeePerGas: BigInt('45000000000') // 45 gwei
};


// Traduce los rechazos del contrato a un mensaje legible para la demo
export function mensajeErrorContrato(err: any): string {
  const nombre = err?.revert?.name;
  if (nombre === 'AccessControlUnauthorizedAccount') {
    const cuenta = err.revert.args?.[0];
    return `Rechazado por el contrato: la wallet ${cuenta ?? ''} no tiene el rol ORGANIZADOR_ROLE.`;
  }
  if (err?.reason) return `Rechazado por el contrato: ${err.reason}`;
  if (err?.code === 'ACTION_REJECTED') return 'Transacción cancelada en MetaMask.';
  return err?.shortMessage || err?.message || String(err);
}
