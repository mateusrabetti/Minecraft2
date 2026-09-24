// =============================================================================
// js/physics.js - Motor de Física, Gravidade e Colisão AABB
// =============================================================================

class Physics {
  constructor() {
    // Parâmetros físicos ajustados para sensação responsiva e natural
    this.gravity = 26.0;      // Força de aceleração da gravidade (m/s²)
    this.maxFallSpeed = 35.0;  // Velocidade terminal de queda
    this.jumpSpeed = 8.6;      // Impulso do pulo

    // Dimensões da caixa de colisão (AABB) do jogador
    this.width = 0.6;
    this.halfWidth = this.width / 2; // 0.3m para cada lado
    this.height = 1.8;               // 1.8m de altura total
    this.eyeHeight = 1.62;           // Câmera na altura dos olhos

    this.onGround = false;
  }

  /**
   * Verifica se a AABB do jogador sobrepõe algum bloco sólido na posição dada
   */
  hasCollisionAt(pos, world) {
    const eps = 0.001;
    const minX = Math.floor(pos.x - this.halfWidth + eps);
    const maxX = Math.floor(pos.x + this.halfWidth - eps);
    const minY = Math.floor(pos.y + eps);
    const maxY = Math.floor(pos.y + this.height - eps);
    const minZ = Math.floor(pos.z - this.halfWidth + eps);
    const maxZ = Math.floor(pos.z + this.halfWidth - eps);

    // Limites de mundo horizontal (paredes invisíveis nas bordas para não cair no vazio)
    if (pos.x - this.halfWidth < 0 || pos.x + this.halfWidth > world.sizeX ||
        pos.z - this.halfWidth < 0 || pos.z + this.halfWidth > world.sizeZ) {
      return true;
    }

    // Limite inferior do mundo
    if (pos.y < 0) return true;

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          if (world.isSolid(x, y, z)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Atualiza a física do jogador com resolução de colisão eixo por eixo (X, Z, Y).
   * Isso evita que o jogador atravesse blocos e permite deslizar suavemente pelas paredes.
   */
  update(pos, vel, world, dt) {
    // 1. Aplicação da Gravidade
    vel.y -= this.gravity * dt;
    if (vel.y < -this.maxFallSpeed) {
      vel.y = -this.maxFallSpeed;
    }

    // 2. Movimento e Resolução no Eixo X
    const dx = vel.x * dt;
    if (dx !== 0) {
      pos.x += dx;
      if (this.hasCollisionAt(pos, world)) {
        if (dx > 0) {
          // Indo para direita: encaixa no bloco à esquerda
          pos.x = Math.floor(pos.x + this.halfWidth) - this.halfWidth - 0.0001;
        } else {
          // Indo para esquerda: encaixa no bloco à direita
          pos.x = Math.floor(pos.x - this.halfWidth) + 1 + this.halfWidth + 0.0001;
        }
        vel.x = 0;
      }
    }

    // 3. Movimento e Resolução no Eixo Z
    const dz = vel.z * dt;
    if (dz !== 0) {
      pos.z += dz;
      if (this.hasCollisionAt(pos, world)) {
        if (dz > 0) {
          // Indo para frente: encaixa na face anterior
          pos.z = Math.floor(pos.z + this.halfWidth) - this.halfWidth - 0.0001;
        } else {
          // Indo para trás: encaixa na face posterior
          pos.z = Math.floor(pos.z - this.halfWidth) + 1 + this.halfWidth + 0.0001;
        }
        vel.z = 0;
      }
    }

    // 4. Movimento e Resolução no Eixo Y
    const dy = vel.y * dt;
    this.onGround = false;

    if (dy !== 0) {
      pos.y += dy;
      if (this.hasCollisionAt(pos, world)) {
        if (dy < 0) {
          // Caindo: aterrissou sobre um bloco
          pos.y = Math.floor(pos.y) + 1.0;
          vel.y = 0;
          this.onGround = true;
        } else {
          // Subindo: bateu a cabeça no teto
          pos.y = Math.floor(pos.y + this.height) - this.height - 0.0001;
          vel.y = 0;
        }
      }
    }

    // 5. Verificação de estabilização do chão (evita tremulação ao andar em terreno plano)
    if (!this.onGround && vel.y <= 0) {
      const probePos = { x: pos.x, y: pos.y - 0.05, z: pos.z };
      if (this.hasCollisionAt(probePos, world)) {
        this.onGround = true;
        vel.y = 0;
      }
    }

    // Proteção contra saída acidental dos limites do mundo
    pos.x = Math.max(this.halfWidth + 0.01, Math.min(world.sizeX - this.halfWidth - 0.01, pos.x));
    pos.z = Math.max(this.halfWidth + 0.01, Math.min(world.sizeZ - this.halfWidth - 0.01, pos.z));
    if (pos.y < 1.0) {
      pos.y = 1.0;
      vel.y = 0;
      this.onGround = true;
    }
  }

  /**
   * Verifica se a colocação de um bloco em (bx, by, bz) colidiria com o corpo do jogador.
   */
  overlapsPlayer(bx, by, bz, playerPos) {
    const pMinX = playerPos.x - this.halfWidth;
    const pMaxX = playerPos.x + this.halfWidth;
    const pMinY = playerPos.y;
    const pMaxY = playerPos.y + this.height;
    const pMinZ = playerPos.z - this.halfWidth;
    const pMaxZ = playerPos.z + this.halfWidth;

    const bMinX = bx;
    const bMaxX = bx + 1.0;
    const bMinY = by;
    const bMaxY = by + 1.0;
    const bMinZ = bz;
    const bMaxZ = bz + 1.0;

    return (
      pMaxX > bMinX && pMinX < bMaxX &&
      pMaxY > bMinY && pMinY < bMaxY &&
      pMaxZ > bMinZ && pMinZ < bMaxZ
    );
  }
}
