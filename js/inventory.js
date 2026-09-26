// =============================================================================
// js/inventory.js - Sistema de Inventário (36 Slots), Empilhamento e Hotbar
// =============================================================================

class Inventory {
  constructor(initialData = null) {
    // 36 slots no total:
    // 0 a 8: Hotbar (barra inferior)
    // 9 a 35: Mochila principal (grade 3x9)
    this.totalSlots = 36;
    this.hotbarSize = 9;
    this.maxStack = 64;

    this.slots = new Array(this.totalSlots).fill(null);
    this.selectedHotbarIndex = 0;

    // Item temporariamente "segurado" pelo cursor do mouse durante movimentação no menu
    this.cursorItem = null;

    if (initialData && Array.isArray(initialData)) {
      this.deserialize(initialData);
    } else {
      this.giveStarterKit();
    }
  }

  // Kit inicial de sobrevivência para mundos novos
  giveStarterKit() {
    this.slots[0] = { id: BLOCK_GRASS, count: 32 };
    this.slots[1] = { id: BLOCK_DIRT, count: 64 };
    this.slots[2] = { id: BLOCK_STONE, count: 64 };
    this.slots[3] = { id: BLOCK_WOOD, count: 24 };
    this.slots[4] = { id: BLOCK_PLANKS, count: 32 };
    this.slots[5] = { id: BLOCK_BRICKS, count: 32 };
    this.slots[6] = { id: BLOCK_GLASS, count: 16 };
    this.slots[7] = { id: BLOCK_SAND, count: 32 };
    this.slots[8] = { id: BLOCK_LEAVES, count: 32 };
  }

  // Retorna o item do slot da Hotbar atualmente selecionado
  getSelectedHotbarItem() {
    return this.slots[this.selectedHotbarIndex];
  }

  // Consome 1 unidade do bloco selecionado ao construir
  consumeSelectedItem() {
    const item = this.slots[this.selectedHotbarIndex];
    if (!item) return false;

    item.count -= 1;
    if (item.count <= 0) {
      this.slots[this.selectedHotbarIndex] = null;
    }
    return true;
  }

  /**
   * Adiciona itens ao inventário tentando empilhar primeiro nos slots com mesmo ID,
   * depois preenchendo os primeiros slots vazios.
   * Retorna a quantidade que não coube (0 se tudo foi adicionado).
   */
  addItem(blockId, count = 1) {
    if (!blockId || count <= 0) return 0;
    let remaining = count;

    // 1. Tenta empilhar em slots existentes com o mesmo ID
    for (let i = 0; i < this.totalSlots; i++) {
      const slot = this.slots[i];
      if (slot && slot.id === blockId && slot.count < this.maxStack) {
        const canAdd = this.maxStack - slot.count;
        const toAdd = Math.min(canAdd, remaining);
        slot.count += toAdd;
        remaining -= toAdd;
        if (remaining <= 0) return 0;
      }
    }

    // 2. Coloca em slots vazios
    for (let i = 0; i < this.totalSlots; i++) {
      if (!this.slots[i]) {
        const toAdd = Math.min(this.maxStack, remaining);
        this.slots[i] = { id: blockId, count: toAdd };
        remaining -= toAdd;
        if (remaining <= 0) return 0;
      }
    }

    return remaining;
  }

  /**
   * Ação de Clique Esquerdo em um slot da grade do inventário
   */
  handleSlotLeftClick(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.totalSlots) return;

    const currentSlot = this.slots[slotIndex];

    if (!this.cursorItem) {
      // Sem item no cursor: pega o item do slot
      if (currentSlot) {
        this.cursorItem = { ...currentSlot };
        this.slots[slotIndex] = null;
      }
    } else {
      // Tem item no cursor
      if (!currentSlot) {
        // Slot vazio: solta todo o stack do cursor
        this.slots[slotIndex] = { ...this.cursorItem };
        this.cursorItem = null;
      } else if (currentSlot.id === this.cursorItem.id) {
        // Mesmo tipo: empilha até o limite
        const space = this.maxStack - currentSlot.count;
        if (space > 0) {
          const moveAmount = Math.min(space, this.cursorItem.count);
          currentSlot.count += moveAmount;
          this.cursorItem.count -= moveAmount;
          if (this.cursorItem.count <= 0) {
            this.cursorItem = null;
          }
        }
      } else {
        // Tipos diferentes: troca de posição
        const temp = { ...currentSlot };
        this.slots[slotIndex] = { ...this.cursorItem };
        this.cursorItem = temp;
      }
    }
  }

  /**
   * Ação de Clique Direito em um slot da grade do inventário
   */
  handleSlotRightClick(slotIndex) {
    if (slotIndex < 0 || slotIndex >= this.totalSlots) return;

    const currentSlot = this.slots[slotIndex];

    if (!this.cursorItem) {
      // Sem item no cursor: divide o stack do slot pela metade
      if (currentSlot && currentSlot.count > 0) {
        const half = Math.ceil(currentSlot.count / 2);
        const remainder = currentSlot.count - half;

        this.cursorItem = { id: currentSlot.id, count: half };
        if (remainder > 0) {
          currentSlot.count = remainder;
        } else {
          this.slots[slotIndex] = null;
        }
      }
    } else {
      // Tem item no cursor: deposita exatamente 1 unidade no slot
      if (!currentSlot) {
        this.slots[slotIndex] = { id: this.cursorItem.id, count: 1 };
        this.cursorItem.count -= 1;
        if (this.cursorItem.count <= 0) {
          this.cursorItem = null;
        }
      } else if (currentSlot.id === this.cursorItem.id && currentSlot.count < this.maxStack) {
        currentSlot.count += 1;
        this.cursorItem.count -= 1;
        if (this.cursorItem.count <= 0) {
          this.cursorItem = null;
        }
      }
    }
  }

  // Devolve o item do cursor ao inventário (se o menu for fechado com item na mão)
  returnCursorItem() {
    if (!this.cursorItem) return;
    this.addItem(this.cursorItem.id, this.cursorItem.count);
    this.cursorItem = null;
  }

  serialize() {
    return this.slots.map(s => s ? { id: s.id, count: s.count } : null);
  }

  deserialize(data) {
    if (!Array.isArray(data)) return;
    for (let i = 0; i < this.totalSlots; i++) {
      if (data[i] && data[i].id && data[i].count > 0) {
        this.slots[i] = { id: data[i].id, count: data[i].count };
      } else {
        this.slots[i] = null;
      }
    }
  }
}
