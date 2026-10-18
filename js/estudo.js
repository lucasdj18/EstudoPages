/* Tela de estudo: um item por vez, na ordem do JSON, com Anterior/Próximo, filtro por capítulo e tema e teclado.
   Cada tipo de item tem o seu desenho em EP.estudo.tipos (texto.js: "conteudo"; questao.js: "questao"):
   { html(m, item), principal(m, item) → { rotulo, acao, desativado } | null, tecla?(m, item, evento) } */
(() => {
  const { esc } = EP;
  const tipos = {};
  let atual = null;   // { m, item, lista, cap, tema }

  // Itens visíveis com o filtro da matéria (capítulo e tema; "" = todos)
  const visiveis = (m, cap, tema) => m.itens.filter(i => (!cap || i.capitulo === cap) && (!tema || i.tema === tema));
  const conta = (m, cap, tema) => visiveis(m, cap, tema).length;
  // Com um capítulo só, o filtro de tema vale para ele sem precisar escolher o capítulo
  const capDoFiltro = (m, cap) => cap || (m.capitulos.length === 1 ? m.capitulos[0] : '');

  // Filtro gravado, validado contra a matéria atual (capítulo ou tema que sumiu do JSON é ignorado)
  function filtroGravado(m) {
    const p = EP.progresso.ler(m.arquivo);
    const cap = m.capitulos.includes(p.capitulo) ? p.capitulo : '';
    const tema = m.temasDe(capDoFiltro(m, cap)).includes(p.tema) ? p.tema : '';
    return { cap, tema };
  }

  function render(m, resto) {
    const p = EP.progresso.ler(m.arquivo);
    let n = parseInt(resto, 10);
    if (!(n >= 1 && n <= m.itens.length)) return EP.ir(`${m.chave}/${Math.min(p.posicao, m.itens.length - 1) + 1}`);
    const item = m.itens[n - 1];
    let { cap, tema } = filtroGravado(m);
    if ((cap && item.capitulo !== cap) || (tema && item.tema !== tema)) { cap = tema = ''; EP.progresso.filtrar(m.arquivo, '', ''); }
    const lista = visiveis(m, cap, tema);
    const k = lista.indexOf(item);
    const mudouDeItem = atual?.m !== m || atual?.item !== item;
    atual = { m, item, lista, cap, tema };
    EP.progresso.posicao(m.arquivo, item.pos);
    const capTemas = capDoFiltro(m, cap);
    const temas = m.temasDe(capTemas);

    const t = tipos[item.tipo];
    const local = item.tipo === 'questao' ? ` · questão ${item.num} de ${m.questoes.length}` : '';
    EP.render(`
      <header class="topo estudo-topo">
        <a class="icone" href="#" aria-label="Voltar às matérias" title="Voltar às matérias">←</a>
        <div class="topo-titulo"><b>${esc(m.sigla)}</b><small>Item ${n} de ${m.itens.length}${local}</small></div>
        <div class="topo-acoes">${EP.resumo ? `<a class="icone" href="#${encodeURIComponent(m.chave)}/resumo" aria-label="Resumo da matéria" title="Resumo da matéria">☰</a>` : ''}${EP.tema.botao()}</div>
      </header>
      <div class="estudo-faixa">
        <div class="progresso" role="progressbar" aria-label="Posição na matéria" aria-valuemin="1" aria-valuemax="${m.itens.length}" aria-valuenow="${n}">
          <i class="pos" style="width:${((n / m.itens.length) * 100).toFixed(2)}%"></i></div>
        ${m.capitulos.length > 1 ? `
        <label class="filtro"><span>Capítulo</span>
          <select data-filtro-capitulo>
            <option value="">Todos os capítulos (${m.itens.length})</option>
            ${m.capitulos.map(c => `<option value="${esc(c)}"${c === cap ? ' selected' : ''}>${esc(c)} (${conta(m, c, '')})</option>`).join('')}
          </select></label>` : ''}
        ${capTemas && temas.length > 1 ? `
        <label class="filtro"><span>Tema</span>
          <select data-filtro-tema>
            <option value="">Todos os temas do capítulo (${conta(m, capTemas, '')})</option>
            ${temas.map(t => `<option value="${esc(t)}"${t === tema ? ' selected' : ''}>${esc(t)} (${conta(m, capTemas, t)})</option>`).join('')}
          </select></label>` : ''}
        ${cap || tema ? `<p class="filtro-pos">${k + 1} de ${lista.length} ${tema ? 'neste tema' : 'neste capítulo'}</p>` : ''}
      </div>
      <main class="pagina estudo" data-tipo="${item.tipo}">
        <div class="rotulo">${esc(item.capitulo)}${item.tipo === 'questao' ? ` · ${esc(item.tema)}` : ''}</div>
        ${t ? t.html(m, item) : '<p>Tipo de item desconhecido.</p>'}
      </main>
      <nav class="rodape-acoes" aria-label="Navegação"><div class="rodape-in">
        <button class="btn icone-btn" data-acao="anterior" aria-label="Anterior" title="Anterior (←)"${k > 0 ? '' : ' disabled'}>←</button>
        <span id="principal"></span>
      </div></nav>`, `${m.sigla} · item ${n}`);
    desenharPrincipal();
    if (mudouDeItem) scrollTo(0, 0);
  }

  // Botão principal do rodapé: o tipo decide (Enviar resposta…); senão, Próximo / fim da matéria
  function desenharPrincipal() {
    const { m, item, lista } = atual;
    const k = lista.indexOf(item);
    let b = tipos[item.tipo]?.principal?.(m, item);
    if (!b) {
      b = k < lista.length - 1 ? { rotulo: item.tipo === 'questao' ? 'Próxima →' : 'Próximo →', acao: 'proximo' }
        : EP.resumo ? { rotulo: 'Ver resumo', acao: 'ver-resumo' } : { rotulo: 'Voltar às matérias', acao: 'sair' };
    }
    document.getElementById('principal').outerHTML =
      `<button class="btn primario" id="principal" data-acao="${b.acao}"${b.desativado ? ' disabled' : ''}>${esc(b.rotulo)}</button>`;
  }

  function ir(delta) {
    if (!atual) return;
    const { m, item, lista } = atual;
    const prox = lista[lista.indexOf(item) + delta];
    if (prox) EP.ir(`${m.chave}/${prox.pos + 1}`);
  }

  EP.acoes.anterior = () => ir(-1);
  EP.acoes.proximo = () => ir(1);
  EP.acoes.sair = () => EP.ir('');
  EP.acoes['ver-resumo'] = () => EP.ir(`${atual.m.chave}/resumo`);

  // Trocar o capítulo zera o tema; trocar o tema mantém o capítulo. Se o item atual sair do filtro, vai ao primeiro que ficou
  document.addEventListener('change', e => {
    const ehCap = e.target.matches('[data-filtro-capitulo]');
    if ((!ehCap && !e.target.matches('[data-filtro-tema]')) || !atual) return;
    const { m, item } = atual;
    const cap = ehCap ? e.target.value : atual.cap;
    const tema = ehCap ? '' : e.target.value;
    EP.progresso.filtrar(m.arquivo, cap, tema);
    const lista = visiveis(m, cap, tema);
    const destino = lista.includes(item) ? item : lista[0];
    if (destino === item) render(m, String(item.pos + 1)); else EP.ir(`${m.chave}/${destino.pos + 1}`);
  });

  document.addEventListener('keydown', e => {
    if (!atual || !document.querySelector('.estudo') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.('input, select, textarea')) return;
    if (e.key === 'Enter' && e.target.closest?.('button, a')) return;   // Enter num botão: o clique normal dele
    if (e.key === 'ArrowLeft') { e.preventDefault(); return ir(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); return ir(1); }
    tipos[atual.item.tipo]?.tecla?.(atual.m, atual.item, e);
  });

  // Trocou de tela (voltou ao início, resumo): esquece o item atual
  addEventListener('hashchange', () => { if (!location.hash.slice(1).includes('/')) atual = null; });

  EP.estudo = { render, tipos, desenharPrincipal, atual: () => atual };
})();
