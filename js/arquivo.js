/* Exportar e importar as respostas (.json). O arquivo é legível sozinho: traz a questão, a resposta e a correta.
   { formato: "estudopages-respostas", versao: 1, exportadoEm,
     materias: [ { arquivo, materia, posicao, capitulo, tema, resumo: { total, respondidas, acertos, erros },
                   respostas: [ { id, uuid, capitulo, tema, titulo, questao, escolhida, escolhidaTexto, correta, corretaTexto,
                                  acertou, em } ] } ] }
   (id = chave do progresso, pelo texto da questão; uuid = o id da questão no JSON de estudo)
   Importar só acrescenta: a resposta que já existe no navegador continua valendo (D3). */
(() => {
  const FORMATO = 'estudopages-respostas';
  const hoje = () => new Date().toISOString().slice(0, 10);

  function montar(materias) {
    return {
      formato: FORMATO, versao: 1, exportadoEm: new Date().toISOString(),
      materias: materias.filter(m => !m.erros.length).map(m => {
        const p = EP.progresso.ler(m.arquivo), c = EP.progresso.contagem(m);
        const textoDe = (q, l) => q.alts.find(a => a.l === l)?.texto || '';
        return {
          arquivo: m.arquivo, materia: m.materia, posicao: p.posicao, capitulo: p.capitulo, tema: p.tema,
          resumo: { total: c.total, respondidas: c.respondidas, acertos: c.acertos, erros: c.erros },
          respostas: m.questoes.filter(q => p.respostas[q.id]).map(q => {
            const r = p.respostas[q.id];
            return { id: q.id, uuid: q.uuid, capitulo: q.capitulo, tema: q.tema, titulo: q.titulo, questao: q.questao, escolhida: r.escolhida, escolhidaTexto: textoDe(q, r.escolhida),
              correta: q.certa, corretaTexto: textoDe(q, q.certa), acertou: r.escolhida === q.certa, em: r.em };
          }),
        };
      }),
    };
  }

  function baixar(obj, nome) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2) + '\n'], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: nome });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // Texto de um arquivo exportado → acrescenta as respostas que faltam. Devolve a mensagem para mostrar
  function importarTexto(texto) {
    let d;
    try { d = JSON.parse(texto); } catch { throw new Error('o arquivo não é um JSON válido'); }
    if (d?.formato !== FORMATO || !Array.isArray(d.materias)) throw new Error('o arquivo não é uma exportação do EstudoPages');
    let novas = 0, existentes = 0, ignoradas = 0;
    for (const mm of d.materias) {
      const m = EP.materias.find(x => x.arquivo === mm?.arquivo && !x.erros.length);
      if (!m || !Array.isArray(mm.respostas)) { ignoradas += mm?.respostas?.length || 0; continue; }
      const p = EP.progresso.ler(m.arquivo);
      for (const r of mm.respostas) {
        const q = m.questoes.find(x => x.id === r?.id);
        if (!q || !q.alts.some(a => a.l === r.escolhida)) { ignoradas++; continue; }
        if (p.respostas[q.id]) { existentes++; continue; }
        p.respostas[q.id] = { escolhida: r.escolhida, correta: q.certa, acertou: r.escolhida === q.certa, em: r.em || new Date().toISOString() };
        novas++;
      }
      if (!p.posicao && Number.isInteger(mm.posicao) && mm.posicao > 0 && mm.posicao < m.itens.length) p.posicao = mm.posicao;
      EP.progresso.gravar(m.arquivo, p);
    }
    return [`${EP.plural(novas, 'resposta importada', 'respostas importadas')}`,
      existentes && `${existentes} já estavam aqui`, ignoradas && `${ignoradas} ignorada${ignoradas === 1 ? '' : 's'} (matéria ou questão que não existe mais)`]
      .filter(Boolean).join(' · ');
  }

  function escolherArquivo() {
    const inp = Object.assign(document.createElement('input'), { type: 'file', accept: '.json,application/json' });
    inp.onchange = async () => {
      const f = inp.files[0];
      if (!f) return;
      try { EP.toast(importarTexto(await f.text())); EP.rota(); } catch (e) { EP.toast('⚠ Não importei: ' + e.message); }
    };
    inp.click();
  }

  EP.acoes['exportar-materia'] = () => {
    const at = decodeURIComponent(location.hash.slice(1)).split('/')[0];
    const m = EP.materia(at);
    if (m) baixar(montar([m]), `estudopages-${m.sigla.toLowerCase()}-respostas-${hoje()}.json`);
  };
  EP.acoes['exportar-todas'] = () => baixar(montar(EP.materias), `estudopages-respostas-${hoje()}.json`);
  EP.acoes.importar = escolherArquivo;

  // No resumo: exportar esta matéria / importar
  EP.resumo.extras.unshift(() => `
    <div class="transferir opcao">
      <h3>Guardar ou levar as respostas</h3>
      <p>Exporte para guardar um arquivo com as respostas desta matéria, ou importe um arquivo exportado (por exemplo, de outro aparelho).</p>
      <div class="refazer-botoes"><button class="btn" data-acao="exportar-materia">Exportar respostas</button><button class="btn" data-acao="importar">Importar respostas</button></div>
    </div>`);

  // Na tela inicial: exportar todas / importar
  EP.inicio.depois = () => {
    const r = document.getElementById('inicio-rodape');
    if (r && EP.materias.some(m => !m.erros.length)) {
      r.innerHTML = `<div class="inicio-rodape"><button class="link" data-acao="exportar-todas">Exportar todas as respostas</button>
        <button class="link" data-acao="importar">Importar respostas</button></div>`;
    }
  };

  EP.arquivo = { montar, importarTexto, baixar };
})();
