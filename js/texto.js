/* Item "materia": subtema e o texto explicativo. */
EP.estudo.tipos.materia = {
  html: (m, item) => `
    <h1>${EP.esc(item.subtema || item.tema || 'Texto')}</h1>
    <div class="texto">${EP.paragrafos(item.texto)}</div>`,
};
