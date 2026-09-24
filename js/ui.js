// =============================================================================
// js/ui.js - Interface de Usuário, Telas de Início/Pausa, Hotbar e Mira
// =============================================================================

class UI {
  constructor(player) {
    this.player = player;

    // Slots disponíveis na barra de blocos inferior
    this.hotbarSlots = [
      { id: BLOCK_GRASS, name: 'Grama', key: '1' },
      { id: BLOCK_DIRT, name: 'Terra', key: '2' },
      { id: BLOCK_STONE, name: 'Pedra', key: '3' },
      { id: BLOCK_WOOD, name: 'Madeira', key: '4' },
      { id: BLOCK_LEAVES, name: 'Folhas', key: '5' }
    ];

    this.selectedSlotIndex = 0;
    this.isStarted = false;

    this.initElements();
    this.buildHotbar();
    this.selectSlot(0);
  }

  initElements() {
    this.screenOverlay = document.getElementById('screen-overlay');
    this.titleEl = document.getElementById('overlay-title');
    this.playBtn = document.getElementById('play-btn');
    this.crosshair = document.getElementById('crosshair');
    this.hotbarContainer = document.getElementById('hotbar');
    this.selectedBlockName = document.getElementById('selected-block-name');
    this.debugCoords = document.getElementById('debug-coords');

    // Ao clicar em JOGAR / CONTINUAR
    this.playBtn.addEventListener('click', () => {
      if (window.game && window.game.input) {
        window.game.input.requestPointerLock();
      }
    });
  }

  // Constrói a Hotbar dinamicamente com as texturas dos blocos
  buildHotbar() {
    this.hotbarContainer.innerHTML = '';

    this.hotbarSlots.forEach((slot, index) => {
      const slotEl = document.createElement('div');
      slotEl.className = 'hotbar-slot';
      slotEl.dataset.index = index;

      // Ícone com textura procedural pixelada
      const iconUrl = getBlockIconDataUrl(slot.id);
      const imgEl = document.createElement('img');
      imgEl.className = 'slot-icon';
      imgEl.src = iconUrl;
      imgEl.alt = slot.name;

      // Número do atalho (1, 2, 3...)
      const numEl = document.createElement('span');
      numEl.className = 'slot-key';
      numEl.textContent = slot.key;

      slotEl.appendChild(imgEl);
      slotEl.appendChild(numEl);

      // Clique no slot da barra
      slotEl.addEventListener('click', () => {
        this.selectSlot(index);
      });

      this.hotbarContainer.appendChild(slotEl);
    });
  }

  // Seleciona um slot específico da Hotbar
  selectSlot(index) {
    if (index < 0 || index >= this.hotbarSlots.length) return;

    this.selectedSlotIndex = index;
    const current = this.hotbarSlots[index];

    // Atualiza classes CSS dos slots
    const slots = this.hotbarContainer.querySelectorAll('.hotbar-slot');
    slots.forEach((el, idx) => {
      if (idx === index) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Atualiza nome na UI e no Jogador
    if (this.selectedBlockName) {
      this.selectedBlockName.textContent = current.name;
    }

    if (this.player) {
      this.player.setSelectedBlock(current.id);
    }
  }

  // Alterna para o próximo slot (scroll do mouse)
  selectNextSlot() {
    let next = (this.selectedSlotIndex + 1) % this.hotbarSlots.length;
    this.selectSlot(next);
  }

  // Alterna para o slot anterior (scroll do mouse)
  selectPrevSlot() {
    let prev = (this.selectedSlotIndex - 1 + this.hotbarSlots.length) % this.hotbarSlots.length;
    this.selectSlot(prev);
  }

  // Esconde o menu e mostra a mira ao entrar no jogo
  hideStartScreen() {
    this.isStarted = true;
    this.screenOverlay.classList.add('hidden');
    this.crosshair.classList.remove('hidden');
  }

  // Mostra a tela de pausa ao liberar o ponteiro (ESC)
  showPauseScreen() {
    this.titleEl.textContent = 'PAUSADO';
    this.playBtn.textContent = 'CONTINUAR';
    this.screenOverlay.classList.remove('hidden');
    this.crosshair.classList.add('hidden');
  }

  // Atualiza coordenadas no HUD leve superior
  update() {
    if (!this.player || !this.debugCoords) return;

    const x = this.player.position.x.toFixed(1);
    const y = this.player.position.y.toFixed(1);
    const z = this.player.position.z.toFixed(1);

    this.debugCoords.textContent = `XYZ: ${x} / ${y} / ${z}`;
  }
}
