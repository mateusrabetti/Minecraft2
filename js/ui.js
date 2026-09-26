// =============================================================================
// js/ui.js - Interface de Usuário: Menus, Hotbar, Inventário e HUD
// =============================================================================

class UI {
  constructor(game) {
    this.game = game;

    // Cache de elementos do DOM
    this.initElements();

    // Constrói os slots estáticos da Hotbar e do Inventário
    this.buildHotbarDOM();
    this.buildInventoryDOM();

    // Eventos de clique nos menus
    this.initMenuEvents();

    // Eventos do mouse no inventário (arrastar / soltar itens)
    this.initInventoryMouseEvents();
  }

  initElements() {
    // Telas principais
    this.mainMenuEl = document.getElementById('screen-main-menu');
    this.worldsMenuEl = document.getElementById('screen-worlds');
    this.createWorldMenuEl = document.getElementById('screen-create-world');
    this.pauseMenuEl = document.getElementById('screen-pause');
    this.inventoryOverlayEl = document.getElementById('screen-inventory');
    this.settingsMenuEl = document.getElementById('screen-settings');

    // Elementos do HUD
    this.crosshairEl = document.getElementById('crosshair');
    this.topHudEl = document.getElementById('top-hud');
    this.coordsEl = document.getElementById('hud-coords');
    this.biomeEl = document.getElementById('hud-biome');
    this.flyBadgeEl = document.getElementById('hud-fly-badge');
    this.hotbarWrapperEl = document.getElementById('hotbar-wrapper');
    this.hotbarContainer = document.getElementById('hotbar');
    this.selectedBlockName = document.getElementById('selected-block-name');

    // Elemento do item segurado pelo cursor no inventário
    this.cursorItemEl = document.getElementById('inventory-cursor-item');

    // Notificações Toast
    this.toastEl = document.getElementById('toast-notification');
  }

  // ===========================================================================
  // CONSTRUÇÃO E ATUALIZAÇÃO DA HOTBAR (9 SLOTS INFERIORES)
  // ===========================================================================
  buildHotbarDOM() {
    this.hotbarContainer.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const slotEl = document.createElement('div');
      slotEl.className = 'hotbar-slot';
      slotEl.dataset.index = i;

      const imgEl = document.createElement('img');
      imgEl.className = 'slot-icon';
      imgEl.alt = 'Item';

      const keyEl = document.createElement('span');
      keyEl.className = 'slot-key';
      keyEl.textContent = String(i + 1);

      const countEl = document.createElement('span');
      countEl.className = 'slot-count';

      slotEl.appendChild(imgEl);
      slotEl.appendChild(keyEl);
      slotEl.appendChild(countEl);

      // Clique direto no slot da hotbar
      slotEl.addEventListener('click', () => {
        this.selectHotbarSlot(i);
      });

      this.hotbarContainer.appendChild(slotEl);
    }
  }

  updateHotbar() {
    if (!this.game.inventory) return;

    const selectedIndex = this.game.inventory.selectedHotbarIndex;
    const slots = this.hotbarContainer.querySelectorAll('.hotbar-slot');

    slots.forEach((slotEl, idx) => {
      const item = this.game.inventory.slots[idx];
      const imgEl = slotEl.querySelector('.slot-icon');
      const countEl = slotEl.querySelector('.slot-count');

      if (idx === selectedIndex) {
        slotEl.classList.add('active');
      } else {
        slotEl.classList.remove('active');
      }

      if (item && item.count > 0) {
        imgEl.src = getBlockIconDataUrl(item.id);
        imgEl.style.display = 'block';
        countEl.textContent = item.count > 1 ? String(item.count) : '';
      } else {
        imgEl.style.display = 'none';
        countEl.textContent = '';
      }
    });

    // Atualiza o rótulo com o nome do item selecionado
    const currentItem = this.game.inventory.getSelectedHotbarItem();
    if (currentItem && currentItem.count > 0 && BLOCK_TYPES[currentItem.id]) {
      const def = BLOCK_TYPES[currentItem.id];
      this.selectedBlockName.textContent = `${def.name} (${currentItem.count})`;
    } else {
      this.selectedBlockName.textContent = 'Vazio';
    }
  }

  selectHotbarSlot(index) {
    if (index < 0 || index >= 9 || !this.game.inventory) return;
    this.game.inventory.selectedHotbarIndex = index;
    this.updateHotbar();
  }

  selectNextHotbarSlot() {
    if (!this.game.inventory) return;
    let next = (this.game.inventory.selectedHotbarIndex + 1) % 9;
    this.selectHotbarSlot(next);
  }

  selectPrevHotbarSlot() {
    if (!this.game.inventory) return;
    let prev = (this.game.inventory.selectedHotbarIndex - 1 + 9) % 9;
    this.selectHotbarSlot(prev);
  }

  // ===========================================================================
  // CONSTRUÇÃO E ATUALIZAÇÃO DO INVENTÁRIO (36 SLOTS)
  // ===========================================================================
  buildInventoryDOM() {
    const mainGrid = document.getElementById('inv-main-grid');
    const hotbarGrid = document.getElementById('inv-hotbar-grid');
    if (!mainGrid || !hotbarGrid) return;

    mainGrid.innerHTML = '';
    hotbarGrid.innerHTML = '';

    // Slots 9 a 35: Mochila principal (3 linhas de 9 = 27 slots)
    for (let i = 9; i < 36; i++) {
      const slotEl = this.createInventorySlotElement(i);
      mainGrid.appendChild(slotEl);
    }

    // Slots 0 a 8: Linha da Hotbar no inventário (1 linha de 9)
    for (let i = 0; i < 9; i++) {
      const slotEl = this.createInventorySlotElement(i);
      hotbarGrid.appendChild(slotEl);
    }
  }

  createInventorySlotElement(index) {
    const slotEl = document.createElement('div');
    slotEl.className = 'inv-slot';
    slotEl.dataset.slotIndex = index;

    const imgEl = document.createElement('img');
    imgEl.className = 'slot-icon';
    imgEl.alt = 'Item';

    const countEl = document.createElement('span');
    countEl.className = 'slot-count';

    slotEl.appendChild(imgEl);
    slotEl.appendChild(countEl);

    // Eventos de clique com botão esquerdo e direito
    slotEl.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Posiciona o elemento flutuante imediatamente sob o cursor
      if (this.cursorItemEl) {
        this.cursorItemEl.style.left = `${e.clientX}px`;
        this.cursorItemEl.style.top = `${e.clientY}px`;
      }

      if (e.button === 0) {
        // Clique esquerdo
        this.game.inventory.handleSlotLeftClick(index);
      } else if (e.button === 2) {
        // Clique direito
        this.game.inventory.handleSlotRightClick(index);
      }

      this.updateInventory();
      this.updateHotbar();
      this.updateCursorItem();
    });

    return slotEl;
  }

  updateInventory() {
    if (!this.game.inventory) return;

    const allSlots = this.inventoryOverlayEl.querySelectorAll('.inv-slot');
    allSlots.forEach(slotEl => {
      const idx = parseInt(slotEl.dataset.slotIndex, 10);
      const item = this.game.inventory.slots[idx];
      const imgEl = slotEl.querySelector('.slot-icon');
      const countEl = slotEl.querySelector('.slot-count');

      if (item && item.count > 0) {
        imgEl.src = getBlockIconDataUrl(item.id);
        imgEl.style.display = 'block';
        countEl.textContent = item.count > 1 ? String(item.count) : '';
      } else {
        imgEl.style.display = 'none';
        countEl.textContent = '';
      }
    });
  }

  initInventoryMouseEvents() {
    // Faz o item segurado pelo cursor acompanhar o mouse suavemente
    window.addEventListener('mousemove', (e) => {
      if (this.game.state === 'INVENTORY' && this.cursorItemEl) {
        this.cursorItemEl.style.left = `${e.clientX}px`;
        this.cursorItemEl.style.top = `${e.clientY}px`;
      }
    });
  }

  updateCursorItem() {
    if (!this.cursorItemEl) return;
    const item = this.game.inventory?.cursorItem;

    if (item && item.count > 0) {
      const imgEl = this.cursorItemEl.querySelector('.cursor-item-icon');
      const countEl = this.cursorItemEl.querySelector('.cursor-item-count');
      imgEl.src = getBlockIconDataUrl(item.id);
      countEl.textContent = item.count > 1 ? String(item.count) : '';
      this.cursorItemEl.classList.remove('hidden');
    } else {
      this.cursorItemEl.classList.add('hidden');
    }
  }

  // ===========================================================================
  // GERENCIAMENTO DE MENUS E NAVEGAÇÃO
  // ===========================================================================
  initMenuEvents() {
    // Menu Principal: JOGAR (Carrega último mundo ou abre mundos)
    document.getElementById('btn-main-play')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      if (btn.disabled) return;
      btn.disabled = true;
      setTimeout(() => { btn.disabled = false; }, 600);

      const worlds = SaveSystem.getWorlds();
      if (worlds.length > 0) {
        this.game.worldManager.loadWorld(worlds[0].id);
        this.game.enterGame();
      } else {
        this.showCreateWorldScreen();
      }
    });

    // Menu Principal: MUNDOS
    document.getElementById('btn-main-worlds')?.addEventListener('click', () => {
      this.showWorldsScreen();
    });

    // Menu Principal: CONFIGURAÇÕES
    document.getElementById('btn-main-settings')?.addEventListener('click', () => {
      this.showSettingsScreen();
    });

    // Tela de Mundos: CRIAR NOVO MUNDO
    document.getElementById('btn-open-create-world')?.addEventListener('click', () => {
      this.showCreateWorldScreen();
    });

    // Tela de Mundos: VOLTAR AO MENU PRINCIPAL
    document.getElementById('btn-worlds-back')?.addEventListener('click', () => {
      this.showMainMenu();
    });

    // Tela de Criação: GERAR SEED ALEATÓRIA
    document.getElementById('btn-random-seed')?.addEventListener('click', () => {
      const seedInput = document.getElementById('input-world-seed');
      if (seedInput) {
        seedInput.value = Math.floor(Math.random() * 899999 + 100000);
      }
    });

    // Tela de Criação: CRIAR MUNDO (Confirmar)
    const handleConfirmCreateWorld = (e) => {
      const btn = document.getElementById('btn-confirm-create-world');
      if (btn && btn.disabled) return;
      if (btn) {
        btn.disabled = true;
        setTimeout(() => { btn.disabled = false; }, 600);
      }

      const nameInput = document.getElementById('input-world-name');
      const seedInput = document.getElementById('input-world-seed');

      const name = nameInput ? nameInput.value : '';
      const seed = seedInput ? seedInput.value : '';

      this.game.worldManager.createNewWorldAndEnter(name, seed);
    };

    document.getElementById('btn-confirm-create-world')?.addEventListener('click', handleConfirmCreateWorld);

    // Suporte à tecla Enter nos campos de criação de mundo
    document.getElementById('input-world-name')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleConfirmCreateWorld(e);
    });
    document.getElementById('input-world-seed')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleConfirmCreateWorld(e);
    });

    // Tela de Criação: CANCELAR
    document.getElementById('btn-cancel-create-world')?.addEventListener('click', () => {
      this.showWorldsScreen();
    });

    // Tela de Pausa: CONTINUAR
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => {
      this.game.resumeGame();
    });

    // Tela de Pausa: SALVAR E VOLTAR AO MENU
    document.getElementById('btn-pause-menu')?.addEventListener('click', () => {
      this.game.worldManager.exitWorldToMenu();
    });

    // Tela de Configurações: FECHAR
    document.getElementById('btn-settings-close')?.addEventListener('click', () => {
      this.hideAllMenus();
      this.showMainMenu();
    });

    // Botão de fechar inventário (X)
    document.getElementById('btn-close-inventory')?.addEventListener('click', () => {
      this.game.closeInventory();
    });
  }

  hideAllMenus() {
    this.mainMenuEl?.classList.add('hidden');
    this.worldsMenuEl?.classList.add('hidden');
    this.createWorldMenuEl?.classList.add('hidden');
    this.pauseMenuEl?.classList.add('hidden');
    this.inventoryOverlayEl?.classList.add('hidden');
    this.settingsMenuEl?.classList.add('hidden');

    this.crosshairEl?.classList.add('hidden');
    this.topHudEl?.classList.add('hidden');
    this.hotbarWrapperEl?.classList.add('hidden');
    this.cursorItemEl?.classList.add('hidden');
  }

  showMainMenu() {
    this.hideAllMenus();
    this.mainMenuEl?.classList.remove('hidden');
  }

  showWorldsScreen() {
    this.hideAllMenus();
    this.renderWorldsList();
    this.worldsMenuEl?.classList.remove('hidden');
  }

  showCreateWorldScreen() {
    this.hideAllMenus();
    const nameInput = document.getElementById('input-world-name');
    const seedInput = document.getElementById('input-world-seed');
    const worlds = SaveSystem.getWorlds();

    if (nameInput) nameInput.value = `Mundo ${worlds.length + 1}`;
    if (seedInput) seedInput.value = Math.floor(Math.random() * 899999 + 100000);

    this.createWorldMenuEl?.classList.remove('hidden');
  }

  showPauseMenu() {
    this.hideAllMenus();
    this.pauseMenuEl?.classList.remove('hidden');
  }

  showInventory() {
    this.hideAllMenus();
    this.updateInventory();
    this.updateHotbar();
    this.updateCursorItem();

    // Mantém o HUD visível de fundo
    this.hotbarWrapperEl?.classList.remove('hidden');
    this.inventoryOverlayEl?.classList.remove('hidden');
  }

  showSettingsScreen() {
    this.hideAllMenus();
    this.settingsMenuEl?.classList.remove('hidden');
  }

  showInGameHUD() {
    this.hideAllMenus();
    this.crosshairEl?.classList.remove('hidden');
    this.topHudEl?.classList.remove('hidden');
    this.hotbarWrapperEl?.classList.remove('hidden');
  }

  // Renderiza a lista de mundos salvos dinamicamente
  renderWorldsList() {
    const listContainer = document.getElementById('worlds-list-container');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const worlds = SaveSystem.getWorlds();

    if (worlds.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'worlds-empty-msg';
      emptyMsg.textContent = 'Nenhum mundo encontrado. Crie um novo mundo para começar!';
      listContainer.appendChild(emptyMsg);
      return;
    }

    worlds.forEach((world) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'world-item-card';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'world-info';

      const nameEl = document.createElement('div');
      nameEl.className = 'world-name';
      nameEl.textContent = world.name;

      const detailsEl = document.createElement('div');
      detailsEl.className = 'world-details';
      const dateStr = new Date(world.lastPlayed || world.createdAt).toLocaleDateString();
      detailsEl.textContent = `Seed: ${world.seed} • Jogado em: ${dateStr}`;

      infoDiv.appendChild(nameEl);
      infoDiv.appendChild(detailsEl);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'world-actions';

      // Botão Entrar
      const enterBtn = document.createElement('button');
      enterBtn.className = 'btn-world-action btn-enter';
      enterBtn.textContent = 'ENTRAR';
      enterBtn.addEventListener('click', () => {
        this.game.worldManager.loadWorld(world.id);
        this.game.enterGame();
      });

      // Botão Excluir
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn-world-action btn-delete';
      deleteBtn.textContent = 'EXCLUIR';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm(`Tem certeza de que deseja excluir o mundo "${world.name}"?`)) {
          SaveSystem.deleteWorld(world.id);
          this.renderWorldsList();
        }
      });

      actionsDiv.appendChild(enterBtn);
      actionsDiv.appendChild(deleteBtn);

      itemEl.appendChild(infoDiv);
      itemEl.appendChild(actionsDiv);

      listContainer.appendChild(itemEl);
    });
  }

  // Notificação toast na tela
  showToast(message, duration = 2500) {
    if (!this.toastEl) return;
    this.toastEl.textContent = message;
    this.toastEl.classList.add('visible');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.remove('visible');
    }, duration);
  }

  onWorldLoaded() {
    this.updateHotbar();
    this.updateInventory();
  }

  // Atualização por quadro (Coordenadas, Bioma, Voo)
  update() {
    if (!this.game.player) return;

    const p = this.game.player.position;
    if (this.coordsEl) {
      this.coordsEl.textContent = `XYZ: ${p.x.toFixed(1)} / ${p.y.toFixed(1)} / ${p.z.toFixed(1)}`;
    }

    if (this.biomeEl && this.game.world) {
      const biome = this.game.world.getBiome(Math.floor(p.x), Math.floor(p.z));
      const biomeLabels = {
        'PLAINS': 'Planície',
        'FOREST': 'Floresta',
        'DESERT': 'Deserto',
        'MOUNTAIN': 'Montanha'
      };
      this.biomeEl.textContent = `Bioma: ${biomeLabels[biome] || biome}`;
    }

    if (this.flyBadgeEl) {
      if (this.game.player.isFlying) {
        this.flyBadgeEl.classList.remove('hidden');
      } else {
        this.flyBadgeEl.classList.add('hidden');
      }
    }
  }
}
