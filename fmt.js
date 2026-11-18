/* FTR Güncel – klinik özet biçimlendirici.
   Düz metin özeti (✅ / ❌ / ➕ / ⏸ / 📌 / 🔄 / 📝 işaretli satırlar) etiketli, renkli bloklara çevirir.
   Satırlar \n ile ayrılmış olabilir ya da tek paragrafta bitişik yazılmış olabilir; ikisi de işlenir. */
(function () {
  const css = `
.sum{margin-top:12px;display:grid;gap:8px}
.sum .h{font-size:13px;color:var(--mute);font-weight:700}
.sg{border-left:5px solid;border-radius:8px;padding:8px 12px;font-size:15px;line-height:1.5}
.sg .sl{font-size:12.5px;font-weight:800;letter-spacing:.04em;margin-bottom:3px}
.sg ul{margin:0;padding-left:18px}.sg li{margin:3px 0}.sg p{margin:0}
.sg.yap{background:light-dark(#e6f4ea,#12301d);border-color:#17703a}.sg.yap .sl{color:light-dark(#17703a,#7fdc9f)}
.sg.yapma{background:light-dark(#fdecec,#3a1616);border-color:#a11d1d}.sg.yapma .sl{color:light-dark(#a11d1d,#ff9b9b)}
.sg.plus{background:light-dark(#e9effb,#16233d);border-color:#1d4f9e}.sg.plus .sl{color:light-dark(#1d4f9e,#9cc0ff)}
.sg.dur{background:light-dark(#eef1f0,#232e2c);border-color:#6a7573}.sg.dur .sl{color:light-dark(#4f5958,#c4cecc)}
.sg.bil{background:light-dark(#fff5d1,#33290d);border-color:#a07a00}.sg.bil .sl{color:light-dark(#7a5d00,#f2cf5b)}
.sg.deg{background:light-dark(#f1ecfb,#251c38);border-color:#6b46c1}.sg.deg .sl{color:light-dark(#5a37a8,#c7b2ff)}
.sg.not{background:var(--soft);border-color:var(--line)}.sg.not .sl{color:var(--mute)}
.sx{margin:0;font-size:14px;color:var(--mute)}.sx b{color:var(--ink)}
.sx.pr{font-size:15px;color:var(--ink);background:var(--soft);border-radius:8px;padding:8px 12px}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const LAB = {
    '✅': ['yap', '✅ YAP'], '❌': ['yapma', '❌ YAPMA'], '➕': ['plus', '➕ DÜŞÜNÜLEBİLİR'],
    '⏸': ['dur', '⏸ PRATİĞİ DEĞİŞTİRME'], '📌': ['bil', '📌 BİLMEKTE YARAR'], '🔄': ['deg', '🔄 ÖNCE → ŞİMDİ'], '📝': ['not', '📝 NOT']
  };
  const MARK = /(?=✅|❌|➕|⏸|📌|🔄|📝)/u;
  const WORD = /^(yapma|yap|not|düşünülebilir|DÜŞÜNÜLEBİLİR|bilmekte yarar|BİLMEKTE YARAR|pratiği değiştirme|PRATİĞİ DEĞİŞTİRME)\s*:\s*/i;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lead = t => { const m = /^([A-Za-zÇĞİÖŞÜçğıöşü][A-Za-zÇĞİÖŞÜçğıöşü0-9 .\/()-]{1,30}):\s+(.*)$/s.exec(t); return m ? `<b>${esc(m[1])}:</b> ${esc(m[2])}` : esc(t); };

  window.fmtSum = function (raw, head) {
    let s = String(raw || '').trim();
    if (!s) return '';
    const runOn = !s.includes('\n');
    s = s.replace(/\s*\b(Kaynak|PRATİKTE|Kanıt):\s/g, '\n$1: ');
    const parts = [];
    s.split('\n').forEach(line => line.split(MARK).forEach(p => { p = p.trim(); if (p) parts.push(p); }));
    const groups = [];
    for (const p of parts) {
      const m = Object.keys(LAB).find(k => p.startsWith(k));
      if (!m) { groups.push({ plain: p }); continue; }
      let body = p.slice(m.length).replace(/^️/, '').trim().replace(WORD, '');
      if (!body) continue;
      if (/^(Kaynak|PRATİKTE|Kanıt):/.test(body)) { groups.push({ plain: body }); continue; }
      let items = [body];
      if (m === '🔄') items = body.split(/\s+(?=Şimdi\b)/).map(x => x.trim()).filter(Boolean);
      if (runOn && m !== '🔄' && body.length > 90 && body.includes('; ')) items = body.split(/;\s+/).map(x => x.trim()).filter(Boolean);
      const last = groups[groups.length - 1];
      if (last && last.m === m) last.items.push(...items); else groups.push({ m, items });
    }
    const html = groups.map(g => {
      if (g.plain) return `<p class="sx${/^PRATİKTE:/.test(g.plain) ? ' pr' : ''}">${lead(g.plain)}</p>`;
      const [cls, label] = LAB[g.m];
      const body = g.items.length > 1 ? `<ul>${g.items.map(i => `<li>${lead(i)}</li>`).join('')}</ul>` : `<p>${lead(g.items[0])}</p>`;
      return `<div class="sg ${cls}"><div class="sl">${label}</div>${body}</div>`;
    }).join('');
    return `<div class="sum">${head ? `<span class="h">${esc(head)}</span>` : ''}${html}</div>`;
  };
})();
