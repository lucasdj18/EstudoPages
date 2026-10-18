/* Progresso de cada matéria no localStorage: uma chave por matéria, "estudopages:<arquivo>", em JSON.
   { versao: 1, arquivo, posicao, tema, respostas: { <id da questão>: { escolhida, correta, acertou, em } } }
   - posicao: índice (0 = primeiro) do último item visto; tema: filtro de tema escolhido ("" = todos).
   - A primeira resposta enviada de uma questão é a que vale (D3): responder() não sobrescreve.
   Sem localStorage (navegação privada, bloqueio), guarda em memória: funciona até fechar a página. */
(() => {
  const chave = arquivo => 'estudopages:' + arquivo;
  const vazio = arquivo => ({ versao: 1, arquivo, posicao: 0, tema: '', respostas: {} });
  const memoria = {};

  const disponivel = (() => {
    try { localStorage.setItem('estudopages:teste', '1'); localStorage.removeItem('estudopages:teste'); return true; } catch { return false; }
  })();

  function ler(arquivo) {
    if (!disponivel) return memoria[arquivo] ||= vazio(arquivo);
    try {
      const d = JSON.parse(localStorage.getItem(chave(arquivo)));
      if (d && d.versao === 1 && d.respostas && typeof d.respostas === 'object') return { ...vazio(arquivo), ...d };
    } catch { /* ilegível: começa do zero */ }
    return vazio(arquivo);
  }

  function gravar(arquivo, d) {
    if (!disponivel) { memoria[arquivo] = d; return true; }
    try { localStorage.setItem(chave(arquivo), JSON.stringify(d)); return true; }
    catch { EP.toast('⚠ Não consegui gravar a resposta no navegador'); return false; }
  }

  function alterar(arquivo, fn) { const d = ler(arquivo); if (fn(d) !== false) gravar(arquivo, d); return d; }

  const posicao = (arquivo, pos) => alterar(arquivo, d => (d.posicao === pos ? false : (d.posicao = pos, true)));
  const filtrarTema = (arquivo, tema) => alterar(arquivo, d => (d.tema === tema ? false : (d.tema = tema, true)));
  const resposta = (arquivo, q) => ler(arquivo).respostas[q.id] || null;

  function responder(arquivo, q, letra) {
    const d = ler(arquivo);
    if (d.respostas[q.id]) return d.respostas[q.id];
    const r = { escolhida: letra, correta: q.certa, acertou: letra === q.certa, em: new Date().toISOString() };
    d.respostas[q.id] = r;
    gravar(arquivo, d);
    return r;
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

  EP.progresso = { disponivel, chave, ler, gravar, posicao, filtrarTema, resposta, responder, contagem };
})();
