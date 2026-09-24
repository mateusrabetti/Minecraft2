// =============================================================================
// js/input.js - Captura de Teclado, Mouse e Pointer Lock API
// =============================================================================

class Input {
  constructor(player, ui) {
    this.player = player;
    this.ui = ui;

    // Estado das teclas de movimentação
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      shift: false
    };

    this.isPointerLocked = false;

    this.initKeyboard();
    this.initMouse();
    this.initPointerLock();
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Ignora repetição se não necessário ou fora do jogo
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          this.keys.jump = true;
          e.preventDefault();
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.shift = true;
          break;

        // Seleção rápida de blocos pelos números 1 a 5
        case 'Digit1':
          this.ui.selectSlot(0);
          break;
        case 'Digit2':
          this.ui.selectSlot(1);
          break;
        case 'Digit3':
          this.ui.selectSlot(2);
          break;
        case 'Digit4':
          this.ui.selectSlot(3);
          break;
        case 'Digit5':
          this.ui.selectSlot(4);
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
        case 'Space':
          this.keys.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          this.keys.shift = false;
          break;
      }
    });
  }

  initMouse() {
    // Movimento do mouse para controlar a visão (apenas quando em Pointer Lock)
    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      this.player.handleMouseMove(e.movementX || 0, e.movementY || 0);
    });

    // Cliques do mouse (apenas quando travado)
    window.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) return;

      if (e.button === 0) {
        // Botão Esquerdo: Quebrar bloco
        this.player.breakBlock();
      } else if (e.button === 2) {
        // Botão Direito: Colocar bloco
        this.player.placeBlock();
      }
    });

    // Scroll do mouse para alternar o bloco selecionado
    window.addEventListener('wheel', (e) => {
      if (!this.isPointerLocked) return;
      if (e.deltaY > 0) {
        this.ui.selectNextSlot();
      } else if (e.deltaY < 0) {
        this.ui.selectPrevSlot();
      }
    });

    // Desativa o menu de contexto padrão do botão direito
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }

  initPointerLock() {
    // Escuta mudanças no bloqueio de ponteiro
    document.addEventListener('pointerlockchange', () => {
      const isLocked = document.pointerLockElement === document.body;
      this.isPointerLocked = isLocked;

      if (isLocked) {
        this.ui.hideStartScreen();
      } else {
        // Se o usuário apertar ESC ou perder foco, mostra tela de pausa
        this.ui.showPauseScreen();
        // Reseta teclas para não ficarem presas
        this.resetKeys();
      }
    });
  }

  // Solicita o bloqueio do ponteiro do mouse ao clicar em JOGAR
  requestPointerLock() {
    document.body.requestPointerLock =
      document.body.requestPointerLock ||
      document.body.mozRequestPointerLock ||
      document.body.webkitRequestPointerLock;

    if (document.body.requestPointerLock) {
      document.body.requestPointerLock();
    }
  }

  resetKeys() {
    this.keys.forward = false;
    this.keys.backward = false;
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
    this.keys.shift = false;
  }
}
