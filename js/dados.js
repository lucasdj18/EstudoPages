/* Carrega o índice Estudos/estudos.json e os JSONs de estudo (formato do Claude42) e normaliza os itens. */
(() => {
  const LETRAS = 'abcdef';
  const { str } = EP;

  // Lista crua do JSON → itens normalizados + info (nome e sigla) + lista de problemas (vazia = arquivo bom).
  // Formato D8: { tipo: "info", materia, sigla } (opcional, primeiro), { tipo: "conteudo", id, capitulo, tema, texto }
  // e { tipo: "questao", id, capitulo, tema, titulo, questao, alternativa_a…f, obs_a…f, resposta_correta }.
  // O formato antigo ("materia" com tema/subtema) é recusado.
  function normalizar(lista) {
    if (!Array.isArray(lista)) return { itens: [], info: {}, erros: ['o arquivo não é uma lista de itens'] };
    const itens = [], erros = [], vistos = new Map();
    let capitulo = '', tema = '', nQuestao = 0, info = {};
    lista.forEach((it, i) => {
      const n = `item ${i + 1}`;
      if (!it || typeof it !== 'object') { erros.push(`${n}: não é um objeto`); return; }
      if (it.tipo === 'conteudo' || it.tipo === 'questao') {
        if (!str(it.capitulo)) erros.push(`${n}: sem capitulo`);
        if (!str(it.tema)) erros.push(`${n}: sem tema`);
        capitulo = str(it.capitulo) || capitulo;
        tema = str(it.tema) || tema;
      }
      if (it.tipo === 'info') {
        if (i) erros.push(`${n}: o item "info" só pode ser o primeiro`);
        else info = { materia: str(it.materia), sigla: str(it.sigla) };
      } else if (it.tipo === 'materia') {
        erros.push(`${n}: formato antigo ("materia"); use "conteudo" com capitulo, tema e id`);
      } else if (it.tipo === 'conteudo') {
        if (!str(it.texto)) erros.push(`${n}: conteúdo sem texto`);
        itens.push({ tipo: 'conteudo', pos: itens.length, uuid: str(it.id), capitulo, tema, texto: str(it.texto) });
      } else if (it.tipo === 'questao') {
        const alts = [...LETRAS].filter(l => str(it['alternativa_' + l]))
          .map(l => ({ l, texto: str(it['alternativa_' + l]), obs: str(it['obs_' + l]) }));
        const certa = str(it.resposta_correta).toLowerCase();
        if (!str(it.questao)) erros.push(`${n}: questão sem enunciado`);
        if (alts.length < 2) erros.push(`${n}: questão com menos de duas alternativas`);
        if (!alts.some(a => a.l === certa)) erros.push(`${n}: resposta_correta "${certa}" não é uma das alternativas`);
        // id do progresso pelo texto (título + enunciado), não pelo UUID: as respostas já gravadas continuam valendo (D8)
        let id = EP.hash(str(it.titulo) + '\n' + str(it.questao));
        const rep = vistos.get(id) || 0;
        vistos.set(id, rep + 1);
        if (rep) id += '-' + (rep + 1);
        itens.push({ tipo: 'questao', pos: itens.length, num: ++nQuestao, uuid: str(it.id), capitulo, tema, titulo: str(it.titulo),
          questao: str(it.questao), alts, certa, id });
      } else {
        erros.push(`${n}: tipo "${it.tipo ?? ''}" desconhecido`);
      }
    });
    if (!itens.length && !erros.length) erros.push('o arquivo não tem itens');
    return { itens, info, erros };
  }

  // Limite de tempo por arquivo (M1): 15 s; ?tempo=<ms> troca o limite (usado pelos testes)
  const TEMPO = Number(new URLSearchParams(location.search).get('tempo')) || 15000;

  // O limite vale para a leitura inteira (cabeçalhos e conteúdo)
  async function lerJSON(url, nome) {
    const ctrl = new AbortController();
    const relogio = setTimeout(() => ctrl.abort(), TEMPO);
    const estourou = () => new Error(`${nome} não respondeu em ${Math.round(TEMPO / 1000)} s`);
    try {
      let r, texto;
      try { r = await fetch(url, { cache: 'no-cache', signal: ctrl.signal }); }
      catch (e) { throw e.name === 'AbortError' ? estourou() : new Error(`não consegui baixar ${nome}`); }
      if (!r.ok) throw new Error(`${nome} não foi encontrado (HTTP ${r.status})`);
      try { texto = await r.text(); } catch (e) { throw e.name === 'AbortError' ? estourou() : new Error(`não consegui baixar ${nome}`); }
      try { return JSON.parse(texto); } catch { throw new Error(`${nome} não é um JSON válido`); }
    } finally { clearTimeout(relogio); }
  }

  // Lê o índice e cada matéria. Erro no índice → exceção; erro numa matéria → a matéria volta com "erros".
  // Índice: { estudos: ["LPS_estudo.json", …] } (também aceita a forma antiga { arquivo, materia, sigla }).
  // Nome: item info do JSON → índice → nome do arquivo. Sigla: item info → índice → iniciais do nome.
  async function carregar(urlIndice) {
    const base = new URL(urlIndice, location.href);
    if (base.origin !== location.origin) throw new Error('o índice precisa estar neste mesmo site');
    const indice = await lerJSON(base, 'o índice ' + base.pathname.split('/').pop());
    if (!Array.isArray(indice?.estudos)) throw new Error('o índice não tem a lista "estudos"');
    const chaves = new Set();
    return Promise.all(indice.estudos.map(async (e, k) => {
      const linha = typeof e === 'string' ? { arquivo: e } : e || {};
      const arquivo = str(linha.arquivo);
      let chave = (arquivo.replace(/\.json$/i, '') || 'materia-' + (k + 1)).replace(/[^\w-]+/g, '-');
      while (chaves.has(chave)) chave += '-' + (k + 1);
      chaves.add(chave);
      return lerMateria({ arquivo, chave, linha, base, ordem: k });
    }));
  }

  // Lê (ou relê, no "Tentar de novo") o JSON de uma matéria e preenche os dados dela
  async function lerMateria(m) {
    const { arquivo, linha, base, ordem } = m;
    Object.assign(m, { materia: '', sigla: '', itens: [], erros: [], info: {} });
    if (!arquivo) m.erros = ['a linha do índice não tem o nome do arquivo'];
    else {
      try { Object.assign(m, normalizar(await lerJSON(new URL(arquivo, base), arquivo))); } catch (err) { m.erros = [err.message]; }
    }
    m.materia = m.info.materia || str(linha.materia) || arquivo.replace(/(_estudo)?\.json$/i, '') || `Matéria ${ordem + 1}`;
    m.sigla = (m.info.sigla || str(linha.sigla) || EP.iniciais(m.materia)).toUpperCase().slice(0, 4);
    m.questoes = m.itens.filter(i => i.tipo === 'questao');
    m.nTextos = m.itens.length - m.questoes.length;
    // Capítulos na ordem do JSON e, em cada um, os seus temas
    m.capitulos = [...new Set(m.itens.map(i => i.capitulo).filter(Boolean))];
    m.temasDe = cap => [...new Set(m.itens.filter(i => i.capitulo === cap).map(i => i.tema).filter(Boolean))];
    return m;
  }

  EP.dados = { carregar, lerMateria, normalizar };
})();
