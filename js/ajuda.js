/* Ajuda "Como usar" (M9, D12 — B Janela central): aberta pelo "?" do placar do resumo.
   Fecha com ✕, Fechar, Esc ou clique fora; foco preso dentro; o foco volta ao "?".
   Na primeira vez abre no topo; ao fechar guarda a posição da rolagem (localStorage) e reabre no mesmo lugar. */
(() => {
  const CHAVE = 'estudopages:ajuda-rolagem';
  let camada = null, voltarPara = null;

  const mini = (texto, prim) => `<span class="mini-btn${prim ? ' prim' : ''}">${texto}</span>`;
  const p = EP.pilula;

  const html = () => `
    <div class="aj-camada" hidden>
      <div class="aj-fundo" data-acao="fechar-ajuda"></div>
      <div class="aj-janela" role="dialog" aria-modal="true" aria-labelledby="aj-titulo">
        <div class="aj-cab"><h2 id="aj-titulo">Como usar</h2>
          <button type="button" class="icone" data-acao="fechar-ajuda" aria-label="Fechar ajuda">✕</button></div>
        <div class="aj-corpo">
          <section><h3>Navegação</h3>
            <ul class="aj-itens">
              <li>${mini('←')} <b>Item anterior.</b> Nunca fica desativado. No começo de um tema filtrado, segue no capítulo;
                no começo do capítulo, sai do filtro e segue na matéria.</li>
              <li>${mini('→')} <b>Item seguinte.</b> Igual, no outro sentido. No fim da matéria, volta ao começo.</li>
              <li>${mini('Próximo →', true)} <b>Vai ao próximo item que você ainda não respondeu</b> (pula questões respondidas e
                textos cujas questões já foram todas respondidas). Com filtro, mostra o nome dele:
                ${mini('<span class="fn">Tema</span> : Próximo →', true)}. Com a matéria toda respondida, vira ${mini('Ver resumo', true)}.</li>
              <li>${mini('Enviar resposta', true)} <b>Confirma a alternativa</b> marcada. Depois de enviar, a resposta não muda.</li>
            </ul></section>
          <section><h3>Filtro</h3>
            <div class="mini-filtro" aria-hidden="true">
              <div><span>Todos os capítulos</span></div>
              <div><span><b>Capítulo</b></span><span class="pilulas">${p('doc', 3)}${p('q', 2)}${p('ok', 5)}${p('bad', 1)}</span></div>
              <div class="t sel"><span>Tema escolhido</span><span class="pilulas">${p('q', 2)}${p('ok', 3)}</span></div>
              <div class="t"><span>Outro tema</span><span class="pilulas">${p('ok', 2)}${p('bad', 1)}</span></div>
            </div>
            <ul class="aj-itens">
              <li>No botão <b>Filtro</b>, escolha <b>Todos</b>, um <b>capítulo</b> (em negrito) ou um <b>tema</b> (abaixo dele).</li>
              <li>Terminou o tema? O filtro <b>passa para o capítulo</b>. Terminou o capítulo? O filtro <b>sai</b> e aparece um parabéns.</li>
            </ul></section>
          <section><h3>Resumo</h3>
            <ul class="aj-itens">
              <li><b>Placar:</b> sua % de acerto e quantas você respondeu, acertou, errou e quantas faltam.</li>
              <li><b>Por capítulo:</b> acertos e erros de cada capítulo.</li>
              <li><b>O que eu errei:</b> sua resposta, a certa e o porquê, com atalho para a questão.</li>
              <li><b>Faltam responder:</b> atalhos para as questões em aberto.</li>
              <li><b>Opções da matéria:</b> refazer a matéria (apaga as respostas dela neste navegador).</li>
            </ul></section>
          <section><h3>Indicadores</h3>
            <div class="aj-ind">
              ${p('doc', 3)}<span>textos (conteúdos) para ler</span>
              ${p('q', 2)}<span>questões não respondidas</span>
              ${p('ok', 5)}<span>certas</span>
              ${p('bad', 1)}<span>erradas</span>
              <span></span><span>Contagem zero não aparece.</span>
              <div class="progresso" aria-hidden="true"><i class="ok" style="width:55%"></i><i class="bad" style="width:20%"></i></div>
              <span>verde = certas, vermelho = erradas, cinza = faltam</span>
              <b class="aj-pct">78%</b><span>de acerto = certas ÷ respondidas</span>
            </div></section>
        </div>
        <div class="aj-pe"><button type="button" class="btn primario" data-acao="fechar-ajuda">Fechar</button></div>
      </div>
    </div>`;

  const corpo = () => camada.querySelector('.aj-corpo');
  const focaveis = () => [...camada.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')].filter(e => !e.disabled);

  function abrir(origem) {
    if (!camada || !camada.isConnected) camada = document.body.appendChild(Object.assign(document.createElement('div'), { innerHTML: html() })).firstElementChild;
    voltarPara = origem || document.activeElement;
    camada.hidden = false;
    document.body.style.overflow = 'hidden';
    let pos = 0;
    try { pos = Number(localStorage.getItem(CHAVE)) || 0; } catch { /* sem localStorage: sempre no topo */ }
    corpo().scrollTop = pos;
    camada.querySelector('.aj-cab [data-acao="fechar-ajuda"]').focus({ preventScroll: true });
  }

  function fechar() {
    if (!camada || camada.hidden) return;
    try { localStorage.setItem(CHAVE, String(Math.round(corpo().scrollTop))); } catch { /* ignora */ }
    camada.hidden = true;
    document.body.style.overflow = '';
    voltarPara?.focus({ preventScroll: true });
  }

  EP.acoes.ajuda = el => abrir(el);
  EP.acoes['fechar-ajuda'] = fechar;

  document.addEventListener('keydown', e => {
    if (!camada || camada.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fechar(); return; }
    if (e.key === 'Tab') {
      const f = focaveis(), prim = f[0], ult = f[f.length - 1];
      if (!camada.contains(document.activeElement)) { e.preventDefault(); prim.focus(); }
      else if (e.shiftKey && document.activeElement === prim) { e.preventDefault(); ult.focus(); }
      else if (!e.shiftKey && document.activeElement === ult) { e.preventDefault(); prim.focus(); }
    }
  }, true);

  // Trocar de tela com a ajuda aberta (voltar do navegador) fecha a ajuda
  addEventListener('hashchange', fechar);

  EP.ajuda = { abrir, fechar };
})();
