// =====================================================================
//  PREFEITO — inicialização
// =====================================================================

const Jogo = {
  velocidade: 0,   // 0 pausado, 1 normal (1 mês = 10 min), 2 e 5 acelerado
  rodando() {
    const S = Sim.S;
    return !!S && !S.fimDeJogo && !S.pausaForcada && !UI.bloqueado();
  },
};

function iniciar() {
  UI.init();
  window.jogoPhaser = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'jogo',
    pixelArt: false,      // texturas 2x reduzidas com suavização ficam mais nítidas
    antialias: true,
    roundPixels: true,
    backgroundColor: '#2a3a24',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    input: { activePointers: 3 },
    fps: { target: 60, limit: 60 },        // não desenha além de 60 quadros (monitores de 120/144 Hz)
    render: { powerPreference: 'high-performance', antialias: true, roundPixels: true },
    scene: [CidadeScene],
  });
}

// espera as fontes pixeladas para os textos do mapa saírem certos
const fontes = document.fonts ? Promise.race([
  Promise.all([document.fonts.load('16px "Nunito"'), document.fonts.load('bold 16px "Nunito"')]),
  new Promise(r => setTimeout(r, 2500)),
]) : Promise.resolve();
fontes.then(iniciar, iniciar);
