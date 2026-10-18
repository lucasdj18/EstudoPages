/* Resumo da matéria: placar geral, acertos e erros por tema, a lista do que errei e o que falta responder.
   EP.resumo.extras: funções (m) → html acrescentadas no fim (refazer, exportar/importar). */
(() => {
  const { esc, plural } = EP;
  const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);
  const largura = (n, total) => (total ? (n / total) * 100 : 0).toFixed(2) + '%';
  const irQuestao = (m, q) => `#${encodeURIComponent(m.chave)}/${q.pos + 1}`;
  const alt = (q, l) => q.alts.find(a => a.l === l) || { l, texto: '(alternativa que não existe mais)', obs: '' };

  function render(m) {
    const p = EP.progresso.ler(m.arquivo);
    const c = EP.progresso.contagem(m);
    const resp = q => p.respostas[q.id];
    const erradas = m.questoes.filter(q => resp(q) && resp(q).escolhida !== q.certa);
    const faltam = m.questoes.filter(q => !resp(q));
    const temas = m.temas.map(t => {
      const qs = m.questoes.filter(q => q.tema === t);
      const r = qs.filter(resp), a = r.filter(q => resp(q).escolhida === q.certa);
      return { t, total: qs.length, respondidas: r.length, acertos: a.length, erros: r.length - a.length };
    }).filter(x => x.total);
    const voltar = Math.min(p.posicao, m.itens.length - 1) + 1;

    EP.render(`
      <header class="topo estudo-topo">
        <a class="icone" href="#${encodeURIComponent(m.chave)}/${voltar}" aria-label="Voltar ao estudo" title="Voltar ao estudo">←</a>
        <div class="topo-titulo"><b>Resumo</b><small>${esc(m.materia)}</small></div>
        <div class="topo-acoes"><a class="icone" href="#" aria-label="Matérias" title="Matérias">⌂</a>${EP.tema.botao()}</div>
      </header>
      <main class="pagina resumo">
        <section class="placar card-base">
          <div class="placar-pct"><b>${c.respondidas ? pct(c.acertos, c.respondidas) + '%' : '—'}</b><span>de acerto${c.respondidas ? ` nas ${plural(c.respondidas, 'respondida', 'respondidas')}` : ''}</span></div>
          <div class="progresso" role="img" aria-label="${c.acertos} acertos e ${c.erros} erros em ${c.total} questões">
            <i class="ok" style="width:${largura(c.acertos, c.total)}"></i><i class="bad" style="width:${largura(c.erros, c.total)}"></i></div>
          <dl class="placar-numeros">
            <div><dt>Respondidas</dt><dd>${c.respondidas}<small>/${c.total}</small></dd></div>
            <div class="n-ok"><dt>✓ Acertos</dt><dd>${c.acertos}</dd></div>
            <div class="n-bad"><dt>✗ Erros</dt><dd>${c.erros}</dd></div>
            <div><dt>Faltam</dt><dd>${faltam.length}</dd></div>
          </dl>
        </section>

        ${temas.length > 1 ? recolhivel('temas', 'Por tema', temas.length, `
          <ul class="temas">${temas.map(x => `
            <li class="tema" data-tema="${esc(x.t)}">
              <div class="tema-linha"><span class="tema-nome">${esc(x.t)}</span>
                <span class="tema-num">${x.respondidas ? `${x.acertos}/${x.respondidas} · ${pct(x.acertos, x.respondidas)}%` : 'não começado'}</span></div>
              <div class="progresso"><i class="ok" style="width:${largura(x.acertos, x.total)}"></i><i class="bad" style="width:${largura(x.erros, x.total)}"></i></div>
              <div class="tema-det">✓ ${x.acertos} · ✗ ${x.erros} · ${x.total - x.respondidas} sem responder de ${x.total}</div>
            </li>`).join('')}
          </ul>`, true) : ''}

        ${recolhivel('erros', 'O que eu errei', erradas.length, erradas.length ? `<ol class="erradas">${erradas.map(q => {
            const r = resp(q), e = alt(q, r.escolhida), certa = alt(q, q.certa);
            return `
            <li class="errada" data-id="${esc(q.id)}">
              <div class="rotulo">${esc(q.tema)} · questão ${q.num}</div>
              ${q.titulo ? `<h3>${esc(q.titulo)}</h3>` : ''}
              <p class="enunciado">${esc(q.questao)}</p>
              <div class="obs bad"><span class="obs-rotulo">✗ Sua resposta: ${e.l.toUpperCase()}</span> <span class="obs-alt">${esc(e.texto)}</span> ${e.obs ? `<span class="obs-txt">${esc(e.obs)}</span>` : ''}</div>
              <div class="obs ok"><span class="obs-rotulo">✓ Correta: ${certa.l.toUpperCase()}</span> <span class="obs-alt">${esc(certa.texto)}</span> ${certa.obs ? `<span class="obs-txt">${esc(certa.obs)}</span>` : ''}</div>
              <a class="link" href="${irQuestao(m, q)}">Abrir a questão</a>
            </li>`;
          }).join('')}</ol>` : `<p class="vazio">${c.respondidas ? 'Nenhum erro até agora. 🎉' : 'Você ainda não respondeu nenhuma questão desta matéria.'}</p>`)}

        ${faltam.length ? recolhivel('faltam', 'Faltam responder', faltam.length,
          `<ol class="faltam">${faltam.map(q => `<li><a href="${irQuestao(m, q)}">${esc(q.titulo || q.questao)}</a> <small>${esc(q.tema)}</small></li>`).join('')}</ol>`) : ''}

        ${EP.resumo.extras.length ? recolhivel('opcoes', 'Opções da matéria', null, `<div class="resumo-acoes">${EP.resumo.extras.map(fn => fn(m)).join('')}</div>`) : ''}
      </main>`, `Resumo · ${m.sigla}`);
    // M2: "Por tema" nasce aberto, mas fecha se ocupar mais da metade da altura da tela
    const porTema = document.querySelector('[data-secao="temas"]');
    if (porTema && porTema.offsetHeight > innerHeight * 0.5) porTema.open = false;
    scrollTo(0, 0);
  }

  // Card recolhível (D6): fechado por padrão (aberto = true para nascer aberto), com o número no cabeçalho
  const recolhivel = (secao, titulo, n, corpo, aberto = false) => `
    <details class="recolhivel card-base" data-secao="${secao}"${aberto ? ' open' : ''}>
      <summary><span class="recolhivel-titulo">${titulo}</span>${n == null ? '' : ` <span class="conta">${n}</span>`}<span class="seta" aria-hidden="true"></span></summary>
      <div class="recolhivel-corpo">${corpo}</div>
    </details>`;

  EP.resumo = { render, extras: [] };
})();
