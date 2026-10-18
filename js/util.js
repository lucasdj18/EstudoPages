/* Utilitários comuns do EstudoPages. Tudo fica no objeto global EP (scripts clássicos, sem build). */
window.EP = window.EP || {};

EP.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
EP.str = v => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

// Hash curto e estável (FNV-1a) para identificar questões sem depender da posição no JSON
EP.hash = s => {
  let h = 2166136261;
  for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
};

// Iniciais do nome da matéria, sem as palavras curtas ("Linhas de Produtos de Software" → "LPS")
EP.iniciais = nome => {
  const fora = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'para']);
  return EP.str(nome).split(/\s+/).filter(p => p && !fora.has(p.toLowerCase())).map(p => p[0].toUpperCase()).join('').slice(0, 4) || '?';
};

// Texto em parágrafos (quebra em linhas em branco), sempre escapado
EP.paragrafos = texto => EP.str(texto).split(/\n\s*\n/).map(p => `<p>${EP.esc(p).replace(/\n/g, '<br>')}</p>`).join('');

EP.plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

// Avisos (M7, D11 — B Mola): cartão no centro, cor por op.tipo: 'ok' (verde), 'parabens' (amarelo), 'erro' (vermelho)
// ou 'neutro' (padrão; texto começando com ⚠ vira erro). O novo entra no centro e empurra os anteriores para cima;
// no máximo 3 (o mais antigo sai); cada um fica 3,2 s. O mais novo é o primeiro no DOM.
(() => {
  const MAX = 3, DURACAO = 3200, GAP = 8;
  const vivos = [];   // mais novo primeiro
  let pilha = null;
  const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function arrumar() {
    let y = 0;
    vivos.forEach((el, i) => {
      if (i) y += vivos[i - 1].offsetHeight / 2 + GAP + el.offsetHeight / 2;
      el.style.transform = `translate(-50%, calc(-50% - ${y}px))`;
      el.style.zIndex = String(10 - i);
    });
  }
  function tirar(el) {
    const k = vivos.indexOf(el);
    if (k < 0) return;
    vivos.splice(k, 1);
    el.classList.add('saindo');
    setTimeout(() => el.remove(), 220);
    arrumar();
  }

  EP.EMOJIS_FESTA = ['🎉', '🥳', '🎊', '🏆', '⭐', '👏', '🙌', '🚀', '✨', '💪'];
  // De 1 a 4 emojis de comemoração, cada um sorteado da lista
  EP.festa = () => Array.from({ length: 1 + Math.floor(Math.random() * 4) },
    () => EP.EMOJIS_FESTA[Math.floor(Math.random() * EP.EMOJIS_FESTA.length)]).join('');

  EP.toast = (msg, op = {}) => {
    const tipo = op.tipo || (String(msg).startsWith('⚠') ? 'erro' : 'neutro');
    if (!pilha || !pilha.isConnected) pilha = document.body.appendChild(Object.assign(document.createElement('div'), { className: 'avisos' }));
    const el = Object.assign(document.createElement('div'), { className: `toast toast-${tipo}`, textContent: msg });
    el.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
    el.style.transition = 'none';
    el.style.opacity = '0';
    el.style.transform = semMovimento() ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(.7)';
    pilha.prepend(el);
    void el.offsetHeight;   // aplica o estado inicial antes da transição
    el.style.transition = '';
    el.style.opacity = '1';
    vivos.unshift(el);
    while (vivos.length > MAX) tirar(vivos[vivos.length - 1]);
    arrumar();
    setTimeout(() => tirar(el), DURACAO);
  };
})();

// Ações por clique: elementos com data-acao="nome" chamam EP.acoes.nome(elemento, evento)
EP.acoes = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-acao]');
  if (!el || el.disabled) return;
  const fn = EP.acoes[el.dataset.acao];
  if (fn) { e.preventDefault(); fn(el, e); }
});
