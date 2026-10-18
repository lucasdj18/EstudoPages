/* Refazer a matéria (no resumo): apaga as respostas depois de confirmar na própria página (sem confirm()). */
(() => {
  EP.resumo.extras.push(m => {
    const n = EP.progresso.contagem(m).respondidas;
    return `
      <div class="refazer opcao" data-materia="${EP.esc(m.chave)}">
        <h3>Refazer a matéria</h3>
        <p>Apaga ${n ? `as ${EP.plural(n, 'resposta', 'respostas')}` : 'o progresso'} desta matéria e começa do zero.${EP.arquivo ? ' Exporte antes se quiser guardar o histórico.' : ''}</p>
        <div class="refazer-botoes"><button class="btn perigo" data-acao="refazer">Refazer a matéria</button></div>
        <div class="refazer-confirma" hidden>
          <p><b>Apagar ${n ? EP.plural(n, 'resposta', 'respostas') : 'o progresso'}?</b> Não dá para desfazer.</p>
          <div class="refazer-botoes">
            ${EP.arquivo ? '<button class="btn" data-acao="exportar-materia">Exportar antes</button>' : ''}
            <button class="btn perigo" data-acao="refazer-sim">Apagar e refazer</button>
            <button class="btn" data-acao="refazer-nao">Cancelar</button>
          </div>
        </div>
      </div>`;
  });

  const caixa = el => el.closest('.refazer');
  EP.acoes.refazer = el => {
    const c = caixa(el);
    c.querySelector('.refazer-confirma').hidden = false;
    c.querySelector('.refazer-botoes').hidden = true;
    c.querySelector('[data-acao="refazer-nao"]').focus();
  };
  EP.acoes['refazer-nao'] = el => {
    const c = caixa(el);
    c.querySelector('.refazer-confirma').hidden = true;
    c.querySelector('.refazer-botoes').hidden = false;
  };
  EP.acoes['refazer-sim'] = el => {
    const m = EP.materia(caixa(el).dataset.materia);
    EP.progresso.limpar(m.arquivo);
    EP.toast('Respostas apagadas: a matéria recomeça do zero');
    EP.resumo.render(m);
  };
})();
