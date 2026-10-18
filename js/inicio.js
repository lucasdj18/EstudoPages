/* Tela inicial: um card por matéria do índice, com o progresso guardado no navegador. */
(() => {
  const { esc, plural } = EP;
  const pct = (n, total) => (total ? (n / total) * 100 : 0).toFixed(2) + '%';

  function card(m) {
    if (m.erros.length) {
      return `
      <article class="card card-erro">
        <div class="card-topo"><span class="sigla">${esc(m.sigla)}</span>
          <div><h2>${esc(m.materia)}</h2><div class="card-meta">Não foi possível abrir ${esc(m.arquivo || 'esta matéria')}</div></div></div>
        <ul class="erros">${m.erros.slice(0, 3).map(e => `<li>${esc(e)}</li>`).join('')}${m.erros.length > 3 ? `<li>… e mais ${m.erros.length - 3}</li>` : ''}</ul>
        <div class="card-cta"><button class="btn" data-acao="tentar-de-novo" data-materia="${esc(m.chave)}">Tentar de novo</button></div>
      </article>`;
    }
    const c = EP.progresso.contagem(m);
    const pos = Math.min(c.posicao, m.itens.length - 1) + 1;
    return `
      <a class="card${c.comecou ? '' : ' novo'}" href="#${encodeURIComponent(m.chave)}/${pos}" data-materia="${esc(m.chave)}">
        <div class="card-topo"><span class="sigla">${esc(m.sigla)}</span>
          <div><h2>${esc(m.materia)}</h2>
            <div class="card-meta">${plural(m.capitulos.length, 'capítulo', 'capítulos')} · ${plural(m.nTextos, 'texto', 'textos')} · ${plural(c.total, 'questão', 'questões')}</div></div></div>
        <div class="progresso" role="img" aria-label="${c.acertos} acertos e ${c.erros} erros em ${c.total} questões">
          <i class="ok" style="width:${pct(c.acertos, c.total)}"></i><i class="bad" style="width:${pct(c.erros, c.total)}"></i></div>
        <div class="card-numeros">
          <span><b>${c.respondidas}</b>/${c.total} respondidas</span>
          <span class="n-ok">✓ <b>${c.acertos}</b> ${c.acertos === 1 ? 'acerto' : 'acertos'}</span>
          <span class="n-bad">✗ <b>${c.erros}</b> ${c.erros === 1 ? 'erro' : 'erros'}</span>
        </div>
        <div class="card-cta"><span class="btn${c.comecou ? ' primario' : ''}">${c.comecou ? 'Continuar' : 'Começar'}</span></div>
      </a>`;
  }

  function render() {
    const lista = EP.materias;
    EP.render(`
      <header class="topo"><div class="marca">Estudo<b>Pages</b></div><div class="topo-acoes">${EP.tema.botao()}</div></header>
      <main class="pagina inicio">
        ${lista.length ? '<p class="dica">Escolha a matéria para estudar.</p>' : ''}
        ${EP.progresso.disponivel ? '' : '<p class="aviso">Este navegador não deixa gravar dados: dá para estudar, mas as respostas se perdem ao fechar a página.</p>'}
        ${lista.length ? `<div class="cards">${lista.map(card).join('')}</div>`
          : '<section class="mensagem"><h1>Nenhuma matéria ainda</h1><p>O índice <code>Estudos/estudos.json</code> está vazio. Gere uma matéria com o Claude42.</p></section>'}
        <div id="inicio-rodape"></div>
      </main>`);
    EP.inicio.depois?.();
  }

  // "Tentar de novo" (M1): relê só o arquivo da matéria e redesenha a tela inicial
  EP.acoes['tentar-de-novo'] = async el => {
    const m = EP.materia(el.dataset.materia);
    if (!m) return;
    el.disabled = true;
    el.textContent = 'Carregando…';
    await EP.dados.lerMateria(m);
    render();
    EP.toast(m.erros.length ? `${m.materia}: ainda com problema` : `${m.materia} carregada`);
  };

  EP.inicio = { render };
})();
