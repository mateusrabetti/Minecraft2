// =============================================================================
// js/world.js - Mundo 3D de Blocos, Geração de Terreno e Raycasting DDA
// =============================================================================

class World {
  constructor(scene) {
    this.scene = scene;

    // Dimensões do mundo inicial (32x16x32)
    this.sizeX = 32;
    this.sizeY = 16;
    this.sizeZ = 32;

    // Array linear de dados para máxima performance
    this.data = new Uint8Array(this.sizeX * this.sizeY * this.sizeZ);

    // InstancedMeshes para cada tipo de bloco visível
    this.meshes = {};
    this.maxInstancesPerBlock = 4096;

    // Geometria padrão de cubo 1x1x1
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.dummy = new THREE.Object3D();

    this.initMeshes();
    this.generateTerrain();
    this.rebuildMeshes();
  }

  // Índice linear no array de dados
  getIndex(x, y, z) {
    return x + z * this.sizeX + y * (this.sizeX * this.sizeZ);
  }

  // Verifica se a coordenada está dentro dos limites do mundo
  inBounds(x, y, z) {
    return x >= 0 && x < this.sizeX && y >= 0 && y < this.sizeY && z >= 0 && z < this.sizeZ;
  }

  // Obtém o tipo de bloco na posição
  getBlock(x, y, z) {
    if (!this.inBounds(x, y, z)) {
      if (y < 0) return BLOCK_STONE; // Base sólida infinita para não cair no vazio
      return BLOCK_AIR;
    }
    return this.data[this.getIndex(x, y, z)];
  }

  // Altera um bloco e reconstrói as malhas visíveis
  setBlock(x, y, z, type) {
    if (!this.inBounds(x, y, z)) return false;
    this.data[this.getIndex(x, y, z)] = type;
    this.rebuildMeshes();
    return true;
  }

  // Verifica se o bloco é sólido para colisão
  isSolid(x, y, z) {
    if (y < 0) return true; // Chão abaixo do mundo é sólido
    if (!this.inBounds(x, y, z)) return false;
    const type = this.data[this.getIndex(x, y, z)];
    return type !== BLOCK_AIR && BLOCK_TYPES[type]?.solid;
  }

  // Inicializa as malhas instanciadas (InstancedMesh) para cada bloco
  initMeshes() {
    const types = [BLOCK_GRASS, BLOCK_DIRT, BLOCK_STONE, BLOCK_WOOD, BLOCK_LEAVES];

    types.forEach((type) => {
      const material = BLOCK_MATERIALS[type];
      const mesh = new THREE.InstancedMesh(this.boxGeometry, material, this.maxInstancesPerBlock);
      mesh.count = 0;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      this.scene.add(mesh);
      this.meshes[type] = mesh;
    });
  }

  // Geração do terreno inicial com relevo suave e árvores
  generateTerrain() {
    for (let x = 0; x < this.sizeX; x++) {
      for (let z = 0; z < this.sizeZ; z++) {
        // Cálculo de elevação suave usando senos e cossenos
        const hill = Math.sin(x * 0.22) * 1.5 + Math.cos(z * 0.22) * 1.5 + Math.sin((x + z) * 0.15) * 0.8;
        const groundHeight = Math.max(3, Math.min(8, Math.floor(4 + hill)));

        for (let y = 0; y < this.sizeY; y++) {
          const idx = this.getIndex(x, y, z);
          if (y === 0) {
            this.data[idx] = BLOCK_STONE; // Bedrock
          } else if (y < groundHeight - 2) {
            this.data[idx] = BLOCK_STONE;
          } else if (y < groundHeight) {
            this.data[idx] = BLOCK_DIRT;
          } else if (y === groundHeight) {
            this.data[idx] = BLOCK_GRASS;
          } else {
            this.data[idx] = BLOCK_AIR;
          }
        }
      }
    }

    // Adiciona algumas árvores no mundo
    const treePositions = [
      { x: 8, z: 8 },
      { x: 23, z: 9 },
      { x: 9, z: 23 },
      { x: 22, z: 22 }
    ];

    treePositions.forEach((pos) => {
      this.createTree(pos.x, pos.z);
    });
  }

  // Cria uma árvore com tronco de madeira e copa de folhas
  createTree(x, z) {
    if (!this.inBounds(x, 0, z)) return;

    // Encontra a altura do chão
    let groundY = -1;
    for (let y = this.sizeY - 1; y >= 0; y--) {
      if (this.getBlock(x, y, z) === BLOCK_GRASS) {
        groundY = y;
        break;
      }
    }

    if (groundY === -1 || groundY + 5 >= this.sizeY) return;

    const trunkHeight = 4;
    // Tronco
    for (let ty = 1; ty <= trunkHeight; ty++) {
      this.data[this.getIndex(x, groundY + ty, z)] = BLOCK_WOOD;
    }

    // Copa de folhas
    const leafBase = groundY + trunkHeight - 1;
    for (let lx = -2; lx <= 2; lx++) {
      for (let lz = -2; lz <= 2; lz++) {
        for (let ly = 0; ly <= 2; ly++) {
          const tx = x + lx;
          const ty = leafBase + ly;
          const tz = z + lz;

          // Arredonda cantos da copa
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly >= 1) continue;
          if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && Math.random() > 0.4) continue;

          if (this.inBounds(tx, ty, tz)) {
            const current = this.getBlock(tx, ty, tz);
            if (current === BLOCK_AIR) {
              this.data[this.getIndex(tx, ty, tz)] = BLOCK_LEAVES;
            }
          }
        }
      }
    }
  }

  // Verifica se um bloco tem pelo menos uma face exposta ao ar
  isBlockExposed(x, y, z) {
    const neighbors = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1]
    ];

    for (let i = 0; i < neighbors.length; i++) {
      const [nx, ny, nz] = neighbors[i];
      if (!this.inBounds(nx, ny, nz) || this.getBlock(nx, ny, nz) === BLOCK_AIR) {
        return true;
      }
    }
    return false;
  }

  // Atualiza as instâncias renderizadas na tela (Face culling)
  rebuildMeshes() {
    // Listas de posições por bloco
    const blockInstances = {
      [BLOCK_GRASS]: [],
      [BLOCK_DIRT]: [],
      [BLOCK_STONE]: [],
      [BLOCK_WOOD]: [],
      [BLOCK_LEAVES]: []
    };

    // Varredura de blocos visíveis
    for (let x = 0; x < this.sizeX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        for (let z = 0; z < this.sizeZ; z++) {
          const type = this.data[this.getIndex(x, y, z)];
          if (type !== BLOCK_AIR && this.isBlockExposed(x, y, z)) {
            if (blockInstances[type]) {
              blockInstances[type].push({ x, y, z });
            }
          }
        }
      }
    }

    // Atualiza cada InstancedMesh
    Object.keys(blockInstances).forEach((typeStr) => {
      const type = parseInt(typeStr, 10);
      const instances = blockInstances[type];
      const mesh = this.meshes[type];
      if (!mesh) return;

      mesh.count = Math.min(instances.length, this.maxInstancesPerBlock);

      for (let i = 0; i < mesh.count; i++) {
        const { x, y, z } = instances[i];
        this.dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
        this.dummy.updateMatrix();
        mesh.setMatrixAt(i, this.dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    });
  }

  /**
   * Algoritmo DDA Voxel Traversal para Raycasting rápido e preciso.
   * Dispara um raio a partir da câmera e encontra exatamente o bloco olhado e a face normal.
   */
  raycast(origin, direction, maxDistance = 5.0) {
    const px = origin.x;
    const py = origin.y;
    const pz = origin.z;

    let x = Math.floor(px);
    let y = Math.floor(py);
    let z = Math.floor(pz);

    const stepX = direction.x > 0 ? 1 : (direction.x < 0 ? -1 : 0);
    const stepY = direction.y > 0 ? 1 : (direction.y < 0 ? -1 : 0);
    const stepZ = direction.z > 0 ? 1 : (direction.z < 0 ? -1 : 0);

    const tDeltaX = stepX !== 0 ? Math.abs(1 / direction.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / direction.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / direction.z) : Infinity;

    let tMaxX = stepX > 0 ? (x + 1 - px) * tDeltaX : (px - x) * tDeltaX;
    let tMaxY = stepY > 0 ? (y + 1 - py) * tDeltaY : (py - y) * tDeltaY;
    let tMaxZ = stepZ > 0 ? (z + 1 - pz) * tDeltaZ : (pz - z) * tDeltaZ;

    let normal = { x: 0, y: 0, z: 0 };
    let distance = 0;

    while (distance <= maxDistance) {
      if (this.inBounds(x, y, z)) {
        const block = this.getBlock(x, y, z);
        if (block !== BLOCK_AIR) {
          return {
            hit: true,
            block: { x, y, z },
            normal: normal,
            type: block,
            distance: distance
          };
        }
      }

      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          distance = tMaxX;
          tMaxX += tDeltaX;
          normal = { x: -stepX, y: 0, z: 0 };
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = { x: 0, y: 0, z: -stepZ };
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          distance = tMaxY;
          tMaxY += tDeltaY;
          normal = { x: 0, y: -stepY, z: 0 };
        } else {
          z += stepZ;
          distance = tMaxZ;
          tMaxZ += tDeltaZ;
          normal = { x: 0, y: 0, z: -stepZ };
        }
      }
    }

    return null;
  }
}
