// =============================================================================
// js/player.js - Jogador em Primeira Pessoa, Câmera, Movimentação e Interação
// =============================================================================

class Player {
  constructor(camera, world, physics, scene) {
    this.camera = camera;
    this.world = world;
    this.physics = physics;
    this.scene = scene;

    // Posição inicial no centro do mundo
    this.position = { x: 16.5, y: 12.0, z: 16.5 };
    this.velocity = { x: 0, y: 0, z: 0 };

    // Orientação da visão inicial (levemente angulado para admirar o mundo)
    this.yaw = -Math.PI / 4;
    this.pitch = -0.15;
    this.mouseSensitivity = 0.0022;

    // Configurações de velocidade e aceleração
    this.walkSpeed = 4.8;
    this.sprintSpeed = 7.0;
    this.accelGround = 18.0;
    this.accelAir = 5.0;

    // Bloco atualmente selecionado na barra de blocos
    this.selectedBlock = BLOCK_GRASS;

    // Alvo atual do raycast
    this.targetBlock = null;

    // Inicializa a câmera
    this.camera.rotation.order = 'YXZ';

    // Cria a caixa de seleção visual (contorno preto ao redor do bloco olhado)
    this.initSelectionBox();

    // Inicializa sintetizador de áudio procedural leve
    this.initAudio();

    // Ajusta o spawn no topo do terreno mais alto do centro
    this.findSpawnPosition();

    // Sincroniza a câmera imediatamente
    this.updateCamera();
  }

  // Atualiza posição e orientação da câmera
  updateCamera() {
    this.camera.position.set(
      this.position.x,
      this.position.y + this.physics.eyeHeight,
      this.position.z
    );
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
  }

  // Encontra uma posição segura sobre o solo para spawnar o jogador
  findSpawnPosition() {
    const sx = 16;
    const sz = 16;
    let groundY = 8;
    for (let y = this.world.sizeY - 1; y >= 0; y--) {
      if (this.world.isSolid(sx, y, sz)) {
        groundY = y;
        break;
      }
    }
    this.position.x = sx + 0.5;
    this.position.y = groundY + 1.1;
    this.position.z = sz + 0.5;
  }

  // Caixa de contorno aramado preto indicando o bloco focado
  initSelectionBox() {
    const geom = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    const edges = new THREE.EdgesGeometry(geom);
    const mat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.selectionBox = new THREE.LineSegments(edges, mat);
    this.selectionBox.visible = false;
    this.scene.add(this.selectionBox);
  }

  // Efeitos sonoros procedurais simples usando a Web Audio API (sem arquivos externos)
  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = AudioCtx ? new AudioCtx() : null;
    } catch (e) {
      this.audioCtx = null;
    }
  }

  playSound(type) {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    const now = this.audioCtx.currentTime;

    if (type === 'break') {
      // Som de quebrar bloco (pop crocante)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'place') {
      // Som de colocar bloco (impacto surdo)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.06);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  }

  // Processa movimento do mouse para rotação da câmera
  handleMouseMove(deltaX, deltaY) {
    this.yaw -= deltaX * this.mouseSensitivity;
    this.pitch -= deltaY * this.mouseSensitivity;

    // Limita a rotação vertical (pitch) entre cerca de -89° e +89° para não inverter a visão
    const maxPitch = Math.PI / 2 - 0.02;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  // Atualização a cada quadro (física, câmera e raycast)
  update(dt, inputState) {
    // 1. Processa entrada de movimento relativo à orientação da visão
    let moveForward = 0;
    let moveRight = 0;

    if (inputState.forward) moveForward += 1;
    if (inputState.backward) moveForward -= 1;
    if (inputState.right) moveRight += 1;
    if (inputState.left) moveRight -= 1;

    // Direções relativas ao Yaw
    const fwdX = -Math.sin(this.yaw);
    const fwdZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    let moveX = fwdX * moveForward + rightX * moveRight;
    let moveZ = fwdZ * moveForward + rightZ * moveRight;

    const moveLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if (moveLen > 0.001) {
      moveX /= moveLen;
      moveZ /= moveLen;
    }

    const currentSpeed = inputState.shift ? this.sprintSpeed : this.walkSpeed;
    const targetVelX = moveX * currentSpeed;
    const targetVelZ = moveZ * currentSpeed;

    // Aceleração/fricção suave
    const accel = this.physics.onGround ? this.accelGround : this.accelAir;
    const lerpFactor = Math.min(1.0, accel * dt);
    this.velocity.x += (targetVelX - this.velocity.x) * lerpFactor;
    this.velocity.z += (targetVelZ - this.velocity.z) * lerpFactor;

    // Pulo
    if (inputState.jump && this.physics.onGround) {
      this.velocity.y = this.physics.jumpSpeed;
      this.physics.onGround = false;
    }

    // 2. Atualiza a física e resolução de colisão
    this.physics.update(this.position, this.velocity, this.world, dt);

    // 3. Atualiza a câmera para a posição dos olhos do jogador
    this.camera.position.set(
      this.position.x,
      this.position.y + this.physics.eyeHeight,
      this.position.z
    );
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;

    // 4. Raycasting para detecção do bloco em foco
    this.updateTargetBlock();
  }

  // Atualiza o bloco sob a mira usando o Raycasting da câmera
  updateTargetBlock() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    // Alcance máximo de interação de 5 blocos
    this.targetBlock = this.world.raycast(this.camera.position, dir, 5.0);

    if (this.targetBlock) {
      const { x, y, z } = this.targetBlock.block;
      this.selectionBox.position.set(x + 0.5, y + 0.5, z + 0.5);
      this.selectionBox.visible = true;
    } else {
      this.selectionBox.visible = false;
    }
  }

  // Ação de Quebrar Bloco (Clique Esquerdo)
  breakBlock() {
    if (!this.targetBlock) return;

    const { x, y, z } = this.targetBlock.block;
    // Não quebrar bedrock (y === 0)
    if (y === 0) return;

    this.world.setBlock(x, y, z, BLOCK_AIR);
    this.playSound('break');
    this.updateTargetBlock();
  }

  // Ação de Colocar Bloco (Clique Direito)
  placeBlock() {
    if (!this.targetBlock) return;

    const target = this.targetBlock.block;
    const normal = this.targetBlock.normal;

    const placeX = target.x + normal.x;
    const placeY = target.y + normal.y;
    const placeZ = target.z + normal.z;

    // 1. Limite de altura e limites do mundo
    if (!this.world.inBounds(placeX, placeY, placeZ)) return;

    // 2. Não permitir colocar blocos dentro do corpo do jogador!
    if (this.physics.overlapsPlayer(placeX, placeY, placeZ, this.position)) {
      return;
    }

    // 3. Posiciona o bloco
    this.world.setBlock(placeX, placeY, placeZ, this.selectedBlock);
    this.playSound('place');
    this.updateTargetBlock();
  }

  // Define qual bloco está ativo na mão do jogador
  setSelectedBlock(blockId) {
    if (BLOCK_TYPES[blockId]) {
      this.selectedBlock = blockId;
    }
  }
}
