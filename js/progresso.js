/* Progresso de cada matéria no localStorage: uma chave por matéria, "estudopages:<arquivo>", em JSON.
   { versao: 1, arquivo, posicao, respostas: { <id da questão>: { escolhida, correta, acertou, em } } } */
(() => {
  const chave = arquivo => 'estudopages:' + arquivo;
  const vazio = arquivo => ({ versao: 1, arquivo, posicao: 0, respostas: {} });

  const disponivel = (() => {
    try { localStorage.setItem('estudopages:teste', '1'); localStorage.removeItem('estudopages:teste'); return true; } catch { return false; }
  })();

  function ler(arquivo) {
    try {
      const d = JSON.parse(localStorage.getItem(chave(arquivo)));
      if (d && d.versao === 1 && d.respostas && typeof d.respostas === 'object') return { ...vazio(arquivo), ...d };
    } catch { /* ilegível ou sem localStorage: começa do zero */ }
    return vazio(arquivo);
  }

  // Números da matéria contra as questões atuais (resposta de questão que saiu do JSON é ignorada;
  // o acerto é recalculado pela resposta_correta atual)
  function contagem(m) {
    const p = ler(m.arquivo);
    let respondidas = 0, acertos = 0;
    for (const q of m.questoes) {
      const r = p.respostas[q.id];
      if (!r) continue;
      respondidas++;
      if (r.escolhida === q.certa) acertos++;
    }
    return { total: m.questoes.length, respondidas, acertos, erros: respondidas - acertos, posicao: p.posicao,
      comecou: respondidas > 0 || p.posicao > 0 };
  }

  EP.progresso = { disponivel, chave, ler, contagem };
})();
