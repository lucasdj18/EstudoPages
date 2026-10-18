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

// Aviso rápido. op.tipo = 'ok' (fundo verde discreto); op.centro = true (no meio da tela)
EP.toast = (msg, op = {}) => {
  document.querySelector('.toast')?.remove();
  const classe = 'toast' + (op.tipo === 'ok' ? ' toast-ok' : '') + (op.centro ? ' toast-centro' : '');
  const t = Object.assign(document.createElement('div'), { className: classe, role: 'status', textContent: msg });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
};

// Ações por clique: elementos com data-acao="nome" chamam EP.acoes.nome(elemento, evento)
EP.acoes = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-acao]');
  if (!el || el.disabled) return;
  const fn = EP.acoes[el.dataset.acao];
  if (fn) { e.preventDefault(); fn(el, e); }
});
