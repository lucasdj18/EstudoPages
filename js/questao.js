/* Item "questao" (D3): clicar seleciona (dá para trocar); "Enviar resposta" grava e trava.
   Depois de enviar: a escolhida com a obs dela; se errou, a correta destacada com a obs dela; as outras apagadas. */
(() => {
  const { esc } = EP;
  let selecionada = null;   // { id, letra } enquanto não envia

  function alternativa(q, a, r) {
    const marcada = !r && selecionada?.id === q.id && selecionada.letra === a.l;
    let classe = '', obs = '';
    if (r) {
      const escolhida = a.l === r.escolhida, certa = a.l === q.certa;
      classe = certa ? ' certa' : escolhida ? ' errada' : ' apagada';
      if (escolhida || certa) {
        const rotulo = escolhida && certa ? '✓ Sua resposta — correta' : escolhida ? '✗ Sua resposta' : '✓ Resposta correta';
        obs = `<div class="obs ${certa ? 'ok' : 'bad'}"><span class="obs-rotulo">${rotulo}</span>${esc(a.obs || 'Sem justificativa no material.')}</div>`;
      }
    }
    return `
      <li>
        <button class="alt${classe}" data-acao="alternativa" data-letra="${a.l}" aria-pressed="${marcada}"${r ? ' disabled' : ''}>
          <span class="letra" aria-hidden="true">${a.l.toUpperCase()}</span><span class="alt-texto"><span class="sr">Alternativa ${a.l.toUpperCase()}: </span>${esc(a.texto)}</span>
        </button>${obs}
      </li>`;
  }

  function html(m, q) {
    const r = EP.progresso.resposta(m.arquivo, q);
    if (selecionada?.id !== q.id) selecionada = null;
    return `
      ${q.titulo ? `<h1>${esc(q.titulo)}</h1>` : ''}
      <p class="enunciado">${esc(q.questao)}</p>
      <ol class="alts" aria-label="Alternativas">${q.alts.map(a => alternativa(q, a, r)).join('')}</ol>
      ${r ? `<div class="veredito ${r.escolhida === q.certa ? 'ok' : 'bad'}" role="status">${r.escolhida === q.certa ? '✓ Você acertou'
        : `✗ Você errou — a correta é a ${q.certa.toUpperCase()}`}</div>` : '<p class="dica-teclado">Escolha uma alternativa e aperte Enviar resposta.</p>'}`;
  }

  // Sem resposta: "Enviar resposta" (desativado até selecionar). Respondida: navegação normal (Próxima)
  function principal(m, q) {
    if (EP.progresso.resposta(m.arquivo, q)) return null;
    return { rotulo: 'Enviar resposta', acao: 'enviar', desativado: selecionada?.id !== q.id };
  }

  function selecionar(letra) {
    const at = EP.estudo.atual();
    if (!at || at.item.tipo !== 'questao' || EP.progresso.resposta(at.m.arquivo, at.item)) return;
    if (!at.item.alts.some(a => a.l === letra)) return;
    selecionada = { id: at.item.id, letra };
    document.querySelectorAll('.alt').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.letra === letra)));
    EP.estudo.desenharPrincipal();
  }

  function enviar() {
    const at = EP.estudo.atual();
    if (!at || at.item.tipo !== 'questao' || selecionada?.id !== at.item.id) return;
    EP.progresso.responder(at.m.arquivo, at.item, selecionada.letra);
    selecionada = null;
    EP.estudo.render(at.m, String(at.item.pos + 1));
    document.querySelector('.veredito')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    document.getElementById('principal')?.focus({ preventScroll: true });
  }

  EP.acoes.alternativa = el => selecionar(el.dataset.letra);
  EP.acoes.enviar = enviar;

  EP.estudo.tipos.questao = {
    html, principal,
    tecla(m, q, e) {
      const k = e.key.toLowerCase();
      if (k.length === 1 && 'abcdef'.includes(k)) { e.preventDefault(); selecionar(k); }
      else if (e.key === 'Enter') { e.preventDefault(); enviar(); }
    },
  };
})();
