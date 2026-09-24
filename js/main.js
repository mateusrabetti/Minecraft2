// =============================================================================
// js/main.js - Inicialização do Motor 3D, Cena, Luzes e Loop Principal
// =============================================================================

class Game {
  constructor() {
    window.game = this;
    this.clock = new THREE.Clock();

    this.initThree();
    this.initLights();

    // Inicialização dos subsistemas modulares
    this.world = new World(this.scene);
    this.physics = new Physics();
    this.player = new Player(this.camera, this.world, this.physics, this.scene);
    this.ui = new UI(this.player);
    this.input = new Input(this.player, this.ui);

    // Ajusta o tamanho da tela quando a janela for redimensionada
    window.addEventListener('resize', () => this.onWindowResize());

    // Inicia o loop de renderização
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    // 1. Criação da Cena
    this.scene = new THREE.Scene();

    // Cor do céu azul e névoa atmosférica para profundidade voxel
    const skyColor = new THREE.Color(0x7db4f5);
    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog(skyColor, 25, 45);

    // 2. Câmera em Primeira Pessoa
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 100);

    // 3. Renderizador WebGL otimizado
    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // Sem antialias para estética pixel/voxel e máxima taxa de quadros
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const container = document.getElementById('canvas-container');
    container.appendChild(this.renderer.domElement);
  }

  initLights() {
    // Luz ambiente suave
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(ambientLight);

    // Luz hemisférica (céu azul no topo + reflexão terrosa embaixo)
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x543d2b, 0.55);
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    // Luz do Sol direcional para criar faces iluminadas e sombreadas nos blocos
    const sunLight = new THREE.DirectionalLight(0xfff7e6, 0.85);
    sunLight.position.set(24, 40, 18);
    this.scene.add(sunLight);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate);

    // Limita delta time a no máximo 50ms para evitar saltos ou atravessamentos em travamentos bruscos
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Atualiza lógica do jogador e física quando jogando
    if (this.input.isPointerLocked) {
      this.player.update(dt, this.input.keys);
      this.ui.update();
    }

    // Renderiza a cena 3D
    this.renderer.render(this.scene, this.camera);
  }
}

// Inicializa o jogo quando o DOM e bibliotecas estiverem carregados
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
