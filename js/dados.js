/* Carrega o índice Estudos/estudos.json e os JSONs de estudo (formato do Claude42) e normaliza os itens. */
(() => {
  const LETRAS = 'abcdef';
  const { str } = EP;

  // Lista crua do JSON → itens normalizados + lista de problemas (vazia = arquivo bom)
  function normalizar(lista) {
    if (!Array.isArray(lista)) return { itens: [], erros: ['o arquivo não é uma lista de itens'] };
    const itens = [], erros = [], vistos = new Map();
    let tema = '', nQuestao = 0;
    lista.forEach((it, i) => {
      const n = `item ${i + 1}`;
      if (!it || typeof it !== 'object') { erros.push(`${n}: não é um objeto`); return; }
      if (it.tipo === 'materia') {
        if (!str(it.texto)) erros.push(`${n}: matéria sem texto`);
        tema = str(it.tema) || tema;
        itens.push({ tipo: 'materia', pos: itens.length, tema, subtema: str(it.subtema), texto: str(it.texto) });
      } else if (it.tipo === 'questao') {
        const alts = [...LETRAS].filter(l => str(it['alternativa_' + l]))
          .map(l => ({ l, texto: str(it['alternativa_' + l]), obs: str(it['obs_' + l]) }));
        const certa = str(it.resposta_correta).toLowerCase();
        if (!str(it.questao)) erros.push(`${n}: questão sem enunciado`);
        if (alts.length < 2) erros.push(`${n}: questão com menos de duas alternativas`);
        if (!alts.some(a => a.l === certa)) erros.push(`${n}: resposta_correta "${certa}" não é uma das alternativas`);
        // id pelo conteúdo: a resposta continua valendo se o JSON for regerado com outra ordem
        let id = EP.hash(str(it.titulo) + '\n' + str(it.questao));
        const rep = vistos.get(id) || 0;
        vistos.set(id, rep + 1);
        if (rep) id += '-' + (rep + 1);
        itens.push({ tipo: 'questao', pos: itens.length, num: ++nQuestao, tema: str(it.tema) || tema, titulo: str(it.titulo),
          questao: str(it.questao), alts, certa, id });
      } else {
        erros.push(`${n}: tipo "${it.tipo ?? ''}" desconhecido`);
      }
    });
    if (!lista.length) erros.push('o arquivo não tem itens');
    return { itens, erros };
  }

  async function lerJSON(url, nome) {
    let r;
    try { r = await fetch(url, { cache: 'no-cache' }); } catch { throw new Error(`não consegui baixar ${nome}`); }
    if (!r.ok) throw new Error(`${nome} não foi encontrado (HTTP ${r.status})`);
    try { return await r.json(); } catch { throw new Error(`${nome} não é um JSON válido`); }
  }

  // Lê o índice e cada matéria. Erro no índice → exceção; erro numa matéria → a matéria volta com "erros"
  async function carregar(urlIndice) {
    const base = new URL(urlIndice, location.href);
    if (base.origin !== location.origin) throw new Error('o índice precisa estar neste mesmo site');
    const indice = await lerJSON(base, 'o índice ' + base.pathname.split('/').pop());
    if (!Array.isArray(indice?.estudos)) throw new Error('o índice não tem a lista "estudos"');
    const chaves = new Set();
    return Promise.all(indice.estudos.map(async (e, k) => {
      const arquivo = str(e?.arquivo);
      const materia = str(e?.materia) || arquivo.replace(/\.json$/i, '') || `Matéria ${k + 1}`;
      let chave = (arquivo.replace(/\.json$/i, '') || 'materia-' + (k + 1)).replace(/[^\w-]+/g, '-');
      while (chaves.has(chave)) chave += '-' + (k + 1);
      chaves.add(chave);
      const m = { arquivo, materia, sigla: (str(e?.sigla) || EP.iniciais(materia)).toUpperCase().slice(0, 4), chave, itens: [], erros: [] };
      if (!arquivo) { m.erros = ['a linha do índice não tem "arquivo"']; return m; }
      try { Object.assign(m, normalizar(await lerJSON(new URL(arquivo, base), arquivo))); } catch (err) { m.erros = [err.message]; }
      m.questoes = m.itens.filter(i => i.tipo === 'questao');
      m.nTextos = m.itens.length - m.questoes.length;
      m.temas = [...new Set(m.itens.map(i => i.tema).filter(Boolean))];
      return m;
    }));
  }

  EP.dados = { carregar, normalizar };
})();
