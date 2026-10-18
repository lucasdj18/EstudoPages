/* Início do app: carrega as matérias e escolhe a tela pela URL.
   #                → tela inicial (cards)
   #<chave>/<n>     → estudo, no item n (1 = primeiro)
   #<chave>/resumo  → resumo da matéria */
(() => {
  const app = document.getElementById('app');
  EP.app = app;
  EP.materias = [];

  // ?indice=<caminho> troca o índice (usado pelos testes); só vale caminho deste mesmo site
  function urlIndice() {
    const q = new URLSearchParams(location.search).get('indice');
    if (q) { try { if (new URL(q, location.href).origin === location.origin) return q; } catch { /* ignora */ } }
    return 'Estudos/estudos.json';
  }

  EP.render = (html, titulo) => {
    app.innerHTML = html;
    document.title = titulo ? `${titulo} · EstudoPages` : 'EstudoPages';
  };

  EP.telaMensagem = (titulo, html) => EP.render(`
    <header class="topo"><div class="marca">Estudo<b>Pages</b></div><div class="topo-acoes">${EP.tema.botao()}</div></header>
    <main class="pagina"><section class="mensagem"><h1>${EP.esc(titulo)}</h1>${html}</section></main>`, titulo);

  EP.materia = chave => EP.materias.find(m => m.chave === chave);
  EP.ir = hash => { if (location.hash.slice(1) === hash) rota(); else location.hash = hash; };

  function rota() {
    const [chave, resto = ''] = decodeURIComponent(location.hash.slice(1)).split('/');
    const m = chave && EP.materia(chave);
    if (!m || m.erros.length) {
      if (chave) history.replaceState(null, '', location.pathname + location.search);
      return EP.inicio.render();
    }
    if (resto === 'resumo' && EP.resumo) return EP.resumo.render(m);
    if (EP.estudo) return EP.estudo.render(m, resto);
    return EP.inicio.render();
  }
  EP.rota = rota;

  async function iniciar() {
    if (location.protocol === 'file:') {
      EP.telaMensagem('Abra por um servidor', `
        <p>Aberta direto do disco, o navegador não deixa a página ler os arquivos de estudo.</p>
        <p>No VS Code, clique com o botão direito no <code>index.html</code> e escolha <b>Open with Live Server</b>
        (endereço <code>http://127.0.0.1:5500</code>), ou use o site publicado no GitHub Pages.</p>`);
    } else {
      try {
        EP.materias = await EP.dados.carregar(urlIndice());
        addEventListener('hashchange', rota);
        rota();
      } catch (e) {
        EP.telaMensagem('Não consegui carregar as matérias', `<p>${EP.esc(e.message)}.</p>
          <p>Confira o arquivo <code>Estudos/estudos.json</code> e recarregue a página.</p>
          <p><button class="btn primario" onclick="location.reload()">Recarregar</button></p>`);
      }
    }
    document.body.dataset.pronto = '1';
  }
  iniciar();
})();
