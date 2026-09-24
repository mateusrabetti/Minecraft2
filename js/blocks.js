// =============================================================================
// js/blocks.js - Definição e Texturas dos Blocos
// =============================================================================

// Identificadores únicos dos tipos de blocos
const BLOCK_AIR = 0;
const BLOCK_GRASS = 1;
const BLOCK_DIRT = 2;
const BLOCK_STONE = 3;
const BLOCK_WOOD = 4;
const BLOCK_LEAVES = 5;

// Dados informativos de cada bloco para UI e lógica
const BLOCK_TYPES = {
  [BLOCK_GRASS]: {
    id: BLOCK_GRASS,
    name: 'Grama',
    solid: true,
    transparent: false,
    key: '1'
  },
  [BLOCK_DIRT]: {
    id: BLOCK_DIRT,
    name: 'Terra',
    solid: true,
    transparent: false,
    key: '2'
  },
  [BLOCK_STONE]: {
    id: BLOCK_STONE,
    name: 'Pedra',
    solid: true,
    transparent: false,
    key: '3'
  },
  [BLOCK_WOOD]: {
    id: BLOCK_WOOD,
    name: 'Madeira',
    solid: true,
    transparent: false,
    key: '4'
  },
  [BLOCK_LEAVES]: {
    id: BLOCK_LEAVES,
    name: 'Folhas',
    solid: true,
    transparent: false,
    key: '5'
  }
};

/**
 * Cria uma textura procedural pixelada de 16x16 usando Canvas 2D.
 * Isso garante visual voxel clássico sem depender de imagens externas.
 */
function createProceduralTexture(drawFn) {
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');

  drawFn(ctx, 16, 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return { texture, canvas };
}

// Pseudo-aleatório determinístico simples baseado em coordenadas
function pseudoNoise(x, y, seed = 1) {
  const val = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return val - Math.floor(val);
}

// ==========================================
// Geradores das texturas dos blocos
// ==========================================

// Textura de Terra (Dirt)
const dirtResult = createProceduralTexture((ctx) => {
  const dirtColors = ['#866043', '#77543a', '#91694a', '#6c4b32', '#5e402a'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const idx = Math.floor(pseudoNoise(x, y, 10) * dirtColors.length);
      ctx.fillStyle = dirtColors[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
});

// Textura de Grama - Topo (Grass Top)
const grassTopResult = createProceduralTexture((ctx) => {
  const grassColors = ['#5a9632', '#4e8629', '#63a637', '#427421', '#6bb33c'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const idx = Math.floor(pseudoNoise(x, y, 20) * grassColors.length);
      ctx.fillStyle = grassColors[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
});

// Textura de Grama - Lado (Grass Side)
const grassSideResult = createProceduralTexture((ctx) => {
  // Fundo de terra
  const dirtColors = ['#866043', '#77543a', '#91694a', '#6c4b32', '#5e402a'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const idx = Math.floor(pseudoNoise(x, y, 30) * dirtColors.length);
      ctx.fillStyle = dirtColors[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  // Camada superior de grama com pequenos dentes/gotas
  const grassColors = ['#5a9632', '#4e8629', '#63a637', '#427421'];
  for (let x = 0; x < 16; x++) {
    const grassDepth = 3 + Math.floor(pseudoNoise(x, 1, 40) * 3); // 3 a 5 pixels
    for (let y = 0; y < grassDepth; y++) {
      const idx = Math.floor(pseudoNoise(x, y, 50) * grassColors.length);
      ctx.fillStyle = grassColors[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
});

// Textura de Pedra (Stone)
const stoneResult = createProceduralTexture((ctx) => {
  const stoneColors = ['#7f8285', '#727578', '#8c8f92', '#646769', '#5b5d5f'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const idx = Math.floor(pseudoNoise(x, y, 60) * stoneColors.length);
      ctx.fillStyle = stoneColors[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
});

// Textura de Madeira - Tronco Lateral (Wood Bark)
const woodSideResult = createProceduralTexture((ctx) => {
  const barkColors = ['#6e5233', '#5d4428', '#7c5d3b', '#513a21', '#886742'];
  for (let x = 0; x < 16; x++) {
    const baseColIdx = Math.floor(pseudoNoise(x, 0, 70) * barkColors.length);
    for (let y = 0; y < 16; y++) {
      const noise = pseudoNoise(x, y, 80);
      const colIdx = (baseColIdx + (noise > 0.6 ? 1 : (noise < 0.2 ? -1 : 0)) + barkColors.length) % barkColors.length;
      ctx.fillStyle = barkColors[colIdx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
});

// Textura de Madeira - Topo Anéis (Wood Top Rings)
const woodTopResult = createProceduralTexture((ctx) => {
  const ringColors = ['#a57e4e', '#916d40', '#b68c59', '#7c5b33'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const dx = x - 7.5;
      const dy = y - 7.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const ring = Math.floor(dist * 0.9 + pseudoNoise(x, y, 90) * 0.4) % ringColors.length;
      ctx.fillStyle = ringColors[ring];
      ctx.fillRect(x, y, 1, 1);
    }
  }
});

// Textura de Folhas (Leaves)
const leavesResult = createProceduralTexture((ctx) => {
  const leafColors = ['#3d7a27', '#32681e', '#499030', '#285417', '#54a337'];
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const idx = Math.floor(pseudoNoise(x, y, 100) * leafColors.length);
      ctx.fillStyle = leafColors[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
});

// ==========================================
// Materiais Three.js para cada bloco
// Três.js BoxGeometry tem 6 faces:
// [0: +X, 1: -X, 2: +Y (topo), 3: -Y (baixo), 4: +Z, 5: -Z]
// ==========================================

const matOptions = { roughness: 0.9, metalness: 0.1 };

// Materiais reutilizáveis
const dirtMaterial = new THREE.MeshStandardMaterial({ map: dirtResult.texture, ...matOptions });
const grassTopMaterial = new THREE.MeshStandardMaterial({ map: grassTopResult.texture, ...matOptions });
const grassSideMaterial = new THREE.MeshStandardMaterial({ map: grassSideResult.texture, ...matOptions });
const stoneMaterial = new THREE.MeshStandardMaterial({ map: stoneResult.texture, ...matOptions });
const woodSideMaterial = new THREE.MeshStandardMaterial({ map: woodSideResult.texture, ...matOptions });
const woodTopMaterial = new THREE.MeshStandardMaterial({ map: woodTopResult.texture, ...matOptions });
const leavesMaterial = new THREE.MeshStandardMaterial({ map: leavesResult.texture, ...matOptions });

// Definição dos materiais por bloco
const BLOCK_MATERIALS = {
  [BLOCK_GRASS]: [
    grassSideMaterial, // +X
    grassSideMaterial, // -X
    grassTopMaterial,  // +Y (topo)
    dirtMaterial,      // -Y (baixo)
    grassSideMaterial, // +Z
    grassSideMaterial  // -Z
  ],
  [BLOCK_DIRT]: dirtMaterial,
  [BLOCK_STONE]: stoneMaterial,
  [BLOCK_WOOD]: [
    woodSideMaterial, // +X
    woodSideMaterial, // -X
    woodTopMaterial,  // +Y (topo)
    woodTopMaterial,  // -Y (baixo)
    woodSideMaterial, // +Z
    woodSideMaterial  // -Z
  ],
  [BLOCK_LEAVES]: leavesMaterial
};

// Gera Data URLs para os ícones da barra de blocos (Hotbar)
function getBlockIconDataUrl(blockId) {
  switch (blockId) {
    case BLOCK_GRASS:
      return grassSideResult.canvas.toDataURL();
    case BLOCK_DIRT:
      return dirtResult.canvas.toDataURL();
    case BLOCK_STONE:
      return stoneResult.canvas.toDataURL();
    case BLOCK_WOOD:
      return woodSideResult.canvas.toDataURL();
    case BLOCK_LEAVES:
      return leavesResult.canvas.toDataURL();
    default:
      return '';
  }
}
