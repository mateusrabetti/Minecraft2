# Block World (Minecraft 3D Voxel)

Um jogo 3D de blocos para navegador, inspirado no Minecraft, construído **exclusivamente com HTML, CSS, JavaScript puro e Three.js**.

---

## 🎮 Como Jogar

Você pode rodar o jogo de duas formas muito simples:

### Opção 1: Servidor Local (Recomendado)
Execute no terminal da pasta do projeto:
```bash
npm start
```
*(ou `python -m http.server 8080`)*

Em seguida, abra no navegador:
👉 **[http://localhost:8080](http://localhost:8080)**

### Opção 2: Direto no Arquivo
Abra o arquivo [`index.html`](file:///c:/Users/Aluno/Documents/Minecraft2/index.html) diretamente com dois cliques em qualquer navegador moderno (Chrome, Edge, Firefox, Brave). A biblioteca Three.js já está incluída localmente na pasta `js/libs/`.

---

## 🕹️ Controles

| Ação | Controle |
| :--- | :--- |
| **Mover** | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> |
| **Pular** | <kbd>Espaço</kbd> |
| **Correr (Sprint)** | <kbd>Shift</kbd> |
| **Olhar ao redor** | Mover o Mouse |
| **Quebrar Bloco** | Clique Esquerdo |
| **Colocar Bloco** | Clique Direito |
| **Escolher Bloco** | Teclas <kbd>1</kbd> a <kbd>5</kbd> ou Scroll do Mouse |
| **Pausar / Liberar Mouse** | Tecla <kbd>ESC</kbd> |

---

## 🧱 Blocos Disponíveis

1. **Grama**: Topo verde vibrante, lateral estilizada e base terrosa.
2. **Terra**: Textura orgânica de terra pura.
3. **Pedra**: Estrutura sólida e resistente.
4. **Madeira**: Tronco de carvalho com casca e anéis concêntricos.
5. **Folhas**: Folhagem verde das árvores.

---

## 🏗️ Arquitetura e Estrutura do Projeto

O código foi cuidadosamente modularizado para facilitar a expansão contínua em etapas futuras:

```
Minecraft2/
├── index.html          # Estrutura HTML, HUD, mira e tela inicial/pausa
├── style.css           # Estilos visuais, glassmorphism, hotbar e menus
├── package.json        # Configuração e scripts de execução
├── README.md           # Documentação completa
└── js/
    ├── libs/
    │   └── three.min.js# Three.js r128 (modo offline garantido)
    ├── blocks.js       # Definições dos blocos, texturas procedurais 16x16 e materiais
    ├── world.js        # Voxel grid 3D (32x16x32), terreno, árvores e raycasting DDA
    ├── physics.js      # Gravidade, pulo e resolução de colisão AABB (eixos separados)
    ├── player.js       # Câmera em primeira pessoa, movimentação e interação
    ├── input.js        # Captura de teclado, mouse e Pointer Lock API
    ├── ui.js           # Gerenciamento da hotbar, mira, coordenadas e telas
    └── main.js         # Loop principal (requestAnimationFrame) e iluminação
```

---

## ⚙️ Principais Destaques Técnicos

- **Física Robusta (AABB)**: Resolução de colisão desacoplada nos eixos X, Z e Y. Permite andar pelas paredes sem prender, detectar chão com precisão milimétrica e nunca atravessar blocos.
- **Prevenção de Colocação no Jogador**: Não é possível colocar blocos que intersectem o corpo do jogador.
- **Raycasting DDA Rápido**: Algoritmo *Fast Voxel Traversal* (DDA) que encontra o bloco exato e sua normal sem travamentos.
- **Renderização Otimizada**: Utiliza `THREE.InstancedMesh` com culling de faces internas (apenas blocos expostos ao ar são desenhados).
- **Sem Dependência de Imagens Externas**: Texturas pixel-art de 16x16 geradas proceduralmente via Canvas 2D em tempo de execução.
- **Áudio Sintetizado**: Sons sutis e crocantes de quebra e colocação usando a Web Audio API nativa.