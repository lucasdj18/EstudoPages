/* Tema claro/escuro: segue o sistema até a pessoa escolher; a escolha fica no localStorage. */
(() => {
  const CHAVE = 'estudopages:tema';
  const MODOS = [
    { v: '', rotulo: 'Tema do sistema', icone: '◐' },
    { v: 'light', rotulo: 'Tema claro', icone: '☀' },
    { v: 'dark', rotulo: 'Tema escuro', icone: '☾' },
  ];
  const atual = () => document.documentElement.dataset.theme || '';
  const modo = () => MODOS.find(m => m.v === atual()) || MODOS[0];

  EP.tema = {
    botao() {
      const m = modo();
      return `<button class="icone" data-acao="tema" aria-label="${m.rotulo} (trocar)" title="${m.rotulo} — clique para trocar">${m.icone}</button>`;
    },
  };

  EP.acoes.tema = el => {
    const prox = MODOS[(MODOS.indexOf(modo()) + 1) % MODOS.length];
    if (prox.v) document.documentElement.dataset.theme = prox.v; else delete document.documentElement.dataset.theme;
    try { if (prox.v) localStorage.setItem(CHAVE, prox.v); else localStorage.removeItem(CHAVE); } catch { /* sem localStorage: vale só nesta visita */ }
    el.outerHTML = EP.tema.botao();
    EP.toast(prox.rotulo);
  };
})();
