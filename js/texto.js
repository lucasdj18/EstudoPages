/* Item "conteudo": o tema como título e o texto explicativo (o capítulo aparece no rótulo, em estudo.js). */
EP.estudo.tipos.conteudo = {
  html: (m, item) => `
    <h1>${EP.esc(item.tema || item.capitulo || 'Texto')}</h1>
    <div class="texto">${EP.paragrafos(item.texto)}</div>`,
};
