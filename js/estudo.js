/* Tela de estudo: um item por vez, na ordem do JSON, com Anterior/Próximo, filtro único (capítulos e temas) e teclado.
   Cada tipo de item tem o seu desenho em EP.estudo.tipos (texto.js: "conteudo"; questao.js: "questao"):
   { html(m, item), principal(m, item) → { rotulo, acao, desativado } | null, tecla?(m, item, evento) } */
(() => {
  const { esc } = EP;
  const tipos = {};
  let atual = null;   // { m, item, lista, cap, tema }

  // Itens visíveis com o filtro da matéria (capítulo e tema; "" = todos)
  const visiveis = (m, cap, tema) => m.itens.filter(i => (!cap || i.capitulo === cap) && (!tema || i.tema === tema));
  const conta = (m, cap, tema) => visiveis(m, cap, tema).length;

  // Filtro gravado, validado contra a matéria atual (capítulo ou tema que sumiu do JSON é ignorado)
  function filtroGravado(m) {
    const p = EP.progresso.ler(m.arquivo);
    const cap = m.capitulos.includes(p.capitulo) ? p.capitulo : '';
    const tema = cap && m.temasDe(cap).includes(p.tema) ? p.tema : '';
    return { cap, tema };
  }

  // Contagens em pílulas (M4, visual C do D10): conteúdos (só capítulo e Todos), pendentes, certas e erradas; zero não aparece
  const ICONES = {
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    q: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6"/><path d="M12 17.2h.01"/>',
    ok: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    bad: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
  };
  const ROTULOS = { doc: ['conteúdo', 'conteúdos'], q: ['não respondida', 'não respondidas'], ok: ['certa', 'certas'], bad: ['errada', 'erradas'] };
  function pilulas(m, cap, tema, comDoc) {
    const r = EP.progresso.ler(m.arquivo).respostas;
    const itens = visiveis(m, cap, tema);
    const n = { doc: comDoc ? itens.filter(i => i.tipo === 'conteudo').length : 0, q: 0, ok: 0, bad: 0 };
    for (const q of itens) {
      if (q.tipo !== 'questao') continue;
      const resp = r[q.id];
      if (!resp) n.q++; else if (resp.escolhida === q.certa) n.ok++; else n.bad++;
    }
    return `<span class="pilulas">${Object.keys(n).filter(k => n[k] > 0).map(k =>
      `<span class="pilula p-${k}" role="img" aria-label="${n[k]} ${ROTULOS[k][n[k] === 1 ? 0 : 1]}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONES[k]}</svg><span aria-hidden="true">${n[k]}</span></span>`).join('')}</span>`;
  }

  // Filtro único (f6.4): botão que abre uma lista com "Todos", cada capítulo (negrito) e os seus temas (recuados)
  function filtroHtml(m, cap, tema) {
    const temFiltro = m.capitulos.length > 1 || m.temasDe(m.capitulos[0]).length > 1;
    if (!temFiltro) return '';
    const op = (c, t, classe, texto) => {
      const sel = c === cap && t === tema;
      return `<li><button type="button" role="option" class="filtro-op ${classe}" data-acao="escolher-filtro" data-cap="${esc(c)}" data-tema="${esc(t)}" aria-selected="${sel}">
        <span class="filtro-nome">${texto}</span> ${pilulas(m, c, t, !t)}</button></li>`;
    };
    const atualTexto = tema ? `${esc(cap)} · <b>${esc(tema)}</b>` : cap ? `<b>${esc(cap)}</b>` : 'Todos os capítulos';
    return `
      <div class="filtro">
        <span class="filtro-rotulo" id="filtro-rotulo">Filtro</span>
        <button type="button" class="filtro-botao" data-acao="abrir-filtro" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="filtro-rotulo filtro-atual">
          <span id="filtro-atual">${atualTexto}</span><span class="filtro-seta" aria-hidden="true"></span></button>
      </div>
      <div class="filtro-painel" hidden>
        <div class="filtro-fundo" data-acao="fechar-filtro"></div>
        <ul class="filtro-lista" role="listbox" aria-label="Filtrar por capítulo ou tema">
          ${op('', '', 'op-todos', 'Todos os capítulos')}
          ${m.capitulos.map(c => op(c, '', 'op-cap', `<b>${esc(c)}</b>`) + m.temasDe(c).map(t => op(c, t, 'op-tema', esc(t))).join('')).join('')}
        </ul>
      </div>`;
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

    const t = tipos[item.tipo];
    const local = item.tipo === 'questao' ? ` · questão ${item.num} de ${m.questoes.length}` : '';
    EP.render(`
      <header class="topo estudo-topo">
        <a class="icone" href="#" aria-label="Voltar às matérias" title="Voltar às matérias">←</a>
        <div class="topo-titulo"><b title="${esc(m.materia)}">${esc(m.materia)}</b><small>Item ${n} de ${m.itens.length}${local}</small></div>
        <div class="topo-acoes">${EP.resumo ? `<a class="icone" href="#${encodeURIComponent(m.chave)}/resumo" aria-label="Resumo da matéria" title="Resumo da matéria">☰</a>` : ''}${EP.tema.botao()}</div>
      </header>
      <div class="estudo-faixa">
        <div class="progresso" role="progressbar" aria-label="Posição na matéria" aria-valuemin="1" aria-valuemax="${m.itens.length}" aria-valuenow="${n}">
          <i class="pos" style="width:${((n / m.itens.length) * 100).toFixed(2)}%"></i></div>
        ${filtroHtml(m, cap, tema)}
        ${cap || tema ? `<p class="filtro-pos">${k + 1} de ${lista.length} ${tema ? 'neste tema' : 'neste capítulo'}</p>` : ''}
      </div>
      <main class="pagina estudo" data-tipo="${item.tipo}">
        <div class="rotulo">${esc(item.capitulo)}${item.tipo === 'questao' ? ` · ${esc(item.tema)}` : ''}</div>
        ${t ? t.html(m, item) : '<p>Tipo de item desconhecido.</p>'}
      </main>
      <nav class="rodape-acoes" aria-label="Navegação"><div class="rodape-in">
        <button class="btn icone-btn" data-acao="anterior" aria-label="Item anterior" title="Item anterior (←)">←</button>
        <span id="principal"></span>
        <button class="btn icone-btn" data-acao="seguinte" aria-label="Item seguinte" title="Item seguinte (→)">→</button>
      </div></nav>`, `${m.materia} · item ${n}`);
    desenharPrincipal();
    if (mudouDeItem) scrollTo(0, 0);
  }

  // Pendente (M3): questão sem resposta, ou conteúdo que ainda tem questão sem resposta (as do mesmo tema, D9)
  function pendente(m, item) {
    const r = EP.progresso.ler(m.arquivo).respostas;
    if (item.tipo === 'questao') return !r[item.id];
    return m.questoes.some(q => q.tema === item.tema && !r[q.id]);
  }
  const tudoRespondido = m => { const r = EP.progresso.ler(m.arquivo).respostas; return m.questoes.every(q => r[q.id]); };

  // Próximo pendente depois do item, dando a volta na lista; null se não houver
  function proximoPendente(m, lista, item) {
    const k = lista.indexOf(item);
    const ordem = [...lista.slice(k + 1), ...lista.slice(0, Math.max(k, 0))];
    return ordem.find(i => pendente(m, i)) || null;
  }

  // Botão principal do rodapé (M3): o tipo decide (Enviar resposta); senão, Ver resumo se a matéria toda foi
  // respondida, ou Próximo, que vai ao próximo item pendente
  // M5: com filtro, enquanto o próximo pendente estiver dentro dele, o botão leva o nome do filtro ("<tema> : Próximo →")
  function desenharPrincipal() {
    const { m, item, lista, cap, tema } = atual;
    let b = tipos[item.tipo]?.principal?.(m, item);
    if (!b) {
      b = tudoRespondido(m) ? { rotulo: 'Ver resumo', acao: 'ver-resumo' } : { rotulo: 'Próximo →', acao: 'proximo-pendente' };
      // M6: tema completo com o capítulo ainda pendente → o botão já mostra o capítulo, para onde o filtro vai subir
      if (b.acao === 'proximo-pendente' && (cap || tema)) {
        if (proximoPendente(m, lista, item)) b.filtro = tema || cap;
        else if (tema && proximoPendente(m, visiveis(m, cap, ''), item)) b.filtro = cap;
      }
    }
    // Espaços entre as partes: no flex não aparecem (vale o gap), mas o texto lido fica "<filtro> : Próximo →"
    const nome = b.filtro ? `<span class="principal-filtro">${esc(b.filtro)}</span> <span aria-hidden="true">:</span> ` : '';
    document.getElementById('principal').outerHTML = `<button class="btn primario" id="principal" data-acao="${b.acao}"${b.desativado ? ' disabled' : ''}${
      b.filtro ? ` aria-label="${esc(b.filtro)}: ${esc(b.rotulo)}" title="${esc(b.filtro)}: ${esc(b.rotulo)}"` : ''}>${nome}<span>${esc(b.rotulo)}</span></button>`;
  }

  const avisoOk = msg => EP.toast(msg, { tipo: 'ok' });

  // ← e → (M5/M6): item a item no filtro, nunca desativam. No limite do tema, seguem no capítulo (o filtro sobe para
  // ele); no limite do capítulo, passam ao item vizinho da matéria (o filtro sai); no começo/fim da matéria dão a volta
  function ir(delta) {
    if (!atual) return;
    const { m, item, lista, cap, tema } = atual;
    let prox = lista[lista.indexOf(item) + delta];
    if (!prox && tema) {
      const doCap = visiveis(m, cap, '');
      prox = doCap[doCap.indexOf(item) + delta];
      if (prox) { EP.progresso.filtrar(m.arquivo, cap, ''); avisoOk('Saiu do tema: filtro no capítulo'); }
    }
    if (!prox) {
      const n = m.itens.length;
      prox = m.itens[(item.pos + delta + n) % n];
      if (cap || tema) { EP.progresso.filtrar(m.arquivo, '', ''); avisoOk('Saiu do capítulo: filtro removido'); }
    }
    EP.ir(`${m.chave}/${prox.pos + 1}`);
  }

  // Próximo pendente (M6): no filtro; tema completo → sobe para o capítulo; capítulo completo → matéria (filtro sai)
  function irParaPendente() {
    if (!atual) return;
    const { m, item, lista, cap, tema } = atual;
    let destino = proximoPendente(m, lista, item);
    if (!destino && tema) {
      destino = proximoPendente(m, visiveis(m, cap, ''), item);
      if (destino) { EP.progresso.filtrar(m.arquivo, cap, ''); avisoOk(`${tema} completo: filtro no capítulo`); }
    }
    if (!destino && (cap || tema)) {
      destino = proximoPendente(m, m.itens, item);
      if (destino) { EP.progresso.filtrar(m.arquivo, '', ''); avisoOk(`${cap} completo: filtro removido`); }
    }
    if (destino) EP.ir(`${m.chave}/${destino.pos + 1}`); else EP.ir(`${m.chave}/resumo`);
  }

  EP.acoes.anterior = () => ir(-1);
  EP.acoes.seguinte = () => ir(1);
  EP.acoes['proximo-pendente'] = irParaPendente;
  EP.acoes.sair = () => EP.ir('');
  EP.acoes['ver-resumo'] = () => EP.ir(`${atual.m.chave}/resumo`);

  // Painel do filtro: abre com a opção atual em foco; fecha com Esc, clique fora ou escolha
  const painel = () => document.querySelector('.filtro-painel');
  function abrirFiltro(abrir) {
    const p = painel(), botao = document.querySelector('.filtro-botao');
    if (!p) return;
    p.hidden = !abrir;
    botao.setAttribute('aria-expanded', String(abrir));
    if (abrir) {
      const sel = p.querySelector('[aria-selected="true"]') || p.querySelector('.filtro-op');
      sel.focus({ preventScroll: true });
      sel.scrollIntoView({ block: 'nearest' });
    } else botao.focus({ preventScroll: true });
  }
  EP.acoes['abrir-filtro'] = () => abrirFiltro(painel().hidden);
  EP.acoes['fechar-filtro'] = () => abrirFiltro(false);

  // Escolher um capítulo filtra o capítulo inteiro; um tema, só ele. Se o item atual sair do filtro, vai ao primeiro que ficou
  EP.acoes['escolher-filtro'] = el => {
    if (!atual) return;
    const { m, item } = atual;
    const cap = el.dataset.cap, tema = el.dataset.tema;
    EP.progresso.filtrar(m.arquivo, cap, tema);
    const lista = visiveis(m, cap, tema);
    const destino = lista.includes(item) ? item : lista[0];
    if (destino === item) render(m, String(item.pos + 1)); else EP.ir(`${m.chave}/${destino.pos + 1}`);
  };

  document.addEventListener('keydown', e => {
    const p = painel();
    if (p && !p.hidden) {   // com o painel aberto, o teclado é dele
      const ops = [...p.querySelectorAll('.filtro-op')];
      const i = ops.indexOf(document.activeElement);
      const foco = j => { e.preventDefault(); ops[Math.max(0, Math.min(ops.length - 1, j))].focus(); };
      if (e.key === 'ArrowDown') foco(i + 1);
      else if (e.key === 'ArrowUp') foco(i - 1);
      else if (e.key === 'Home') foco(0);
      else if (e.key === 'End') foco(ops.length - 1);
      else if (e.key === 'Escape') { e.preventDefault(); abrirFiltro(false); }
      return;
    }
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
