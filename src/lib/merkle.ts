import { ethers } from 'ethers';

export interface ParticipanteMerkle {
  indice: number;
  nombre: string;
  identificador: string;
}

export function generarHoja(
  idSorteo: number,
  indice: number,
  nombre: string,
  identificador: string
): string {
  return ethers.solidityPackedKeccak256(
    ['uint256', 'uint256', 'string', 'string'],
    [idSorteo, indice, nombre.trim(), identificador.trim()]
  );
}

export function construirArbolMerkle(
  participantes: ParticipanteMerkle[],
  idSorteo: number
) {
  if (participantes.length === 0) {
    return {
      hojas: [] as string[],
      getHexRoot: () => ethers.ZeroHash,
      getHexProof: (_hoja: string) => [] as string[],
    };
  }

  const hojas = participantes.map((p) =>
    generarHoja(idSorteo, p.indice, p.nombre, p.identificador)
  );

  const niveles: string[][] = [hojas];

  while (niveles[niveles.length - 1].length > 1) {
    const nivelActual = niveles[niveles.length - 1];
    const siguienteNivel: string[] = [];

    for (let i = 0; i < nivelActual.length; i += 2) {
      if (i + 1 === nivelActual.length) {
        siguienteNivel.push(nivelActual[i]);
      } else {
        const [a, b] = [nivelActual[i], nivelActual[i + 1]].sort();
        siguienteNivel.push(
          ethers.solidityPackedKeccak256(['bytes32', 'bytes32'], [a, b])
        );
      }
    }
    niveles.push(siguienteNivel);
  }

  return {
    hojas,
    getHexRoot: () => niveles[niveles.length - 1][0],
    getHexProof: (hoja: string) => {
      let idx = hojas.indexOf(hoja);
      if (idx === -1) return [];
      const proof: string[] = [];
      for (let n = 0; n < niveles.length - 1; n++) {
        const nivel = niveles[n];
        const esDerecho = idx % 2 === 1;
        const parIdx = esDerecho ? idx - 1 : idx + 1;
        if (parIdx < nivel.length) {
          proof.push(nivel[parIdx]);
        }
        idx = Math.floor(idx / 2);
      }
      return proof;
    },
  };
}
