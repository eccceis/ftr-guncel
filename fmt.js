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

/* FTR Güncel – son güncelleme saati (ana sayfa alt başlığı) ve bülten kartlarında siteye eklenme saati.
   Saatler GitHub'daki son değişikliklerden alınır ve İstanbul saatiyle gösterilir. */
(function () {
  const API = 'https://api.github.com/repos/eccceis/ftr-guncel/commits';
  const TZ = 'Europe/Istanbul';
  const st = document.createElement('style');
  st.textContent = '.upd{margin:-6px 0 16px;font-size:13px;color:#d4f0e2}.upd b{color:#fff;font-weight:700}.bt{color:var(--mute)}';
  document.head.appendChild(st);
  const fmtFull = d => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(d) + ', saat ' + new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
  const fmtTime = d => new Intl.DateTimeFormat('tr-TR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(d);
  const getJSON = async (url, key) => {
    try { const c = sessionStorage.getItem(key); if (c) { const o = JSON.parse(c); if (Date.now() - o.t < 600000) return o.v; } } catch (e) {}
    const r = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const v = await r.json();
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch (e) {}
    return v;
  };

  function start() {
    const h1 = document.querySelector('header.top h1');
    if (!h1 || document.querySelector('.upd')) return;
    const p = document.createElement('p');
    p.className = 'upd';
    p.textContent = 'Bültenler her gün 12:30 ve 18:00\'de hazırlanır.';
    h1.insertAdjacentElement('afterend', p);

    getJSON(API + '?per_page=1&path=data', 'ftr-upd2').then(v => {
      const d = v && v[0] && v[0].commit && new Date(v[0].commit.committer.date);
      if (d && !isNaN(d)) p.innerHTML = `Son güncelleme: <b>${fmtFull(d)}</b> · Bültenler her gün 12:30 ve 18:00'de hazırlanır.`;
    }).catch(() => {});

    let times = null;
    const pending = getJSON(API + '?per_page=60&path=data/bultenler.json', 'ftr-bul-times').then(v => {
      times = {};
      (v || []).forEach(c => {
        const m = /^Bülten:\s*(\d{4}-\d{2}-\d{2})\s+(Öğle|Akşam)/.exec(c.commit && c.commit.message || '');
        if (m && !times[m[1] + ' ' + m[2]]) times[m[1] + ' ' + m[2]] = new Date(c.commit.committer.date);
      });
      mark();
    }).catch(() => {});
    function mark() {
      if (!times) return;
      document.querySelectorAll('#b-list .card.bul').forEach(c => {
        if (c.querySelector('.bt')) return;
        const j = c.querySelector('.meta .j');
        const m = j && /(\d{2})\.(\d{2})\.(\d{4})\s*·\s*(Öğle|Akşam)/.exec(j.textContent);
        if (!m) return;
        const d = times[`${m[3]}-${m[2]}-${m[1]} ${m[4]}`];
        if (d) j.insertAdjacentHTML('afterend', `<span class="bt">Siteye eklendi: ${fmtTime(d)}</span>`);
      });
    }
    const list = document.getElementById('b-list');
    if (list) new MutationObserver(mark).observe(list, { childList: true });
    return pending;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

/* FTR Güncel – makale kartlarında "Bulgular" kutusu.
   Kaynak: data/ozet/<PMID>.json içindeki "b" alanı; yoksa data/bulgular.json. */
(function () {
  const st = document.createElement('style');
  st.textContent = '.bulg{margin-top:8px;padding:9px 12px;border-radius:10px;background:var(--soft);border:1px solid var(--line);font-size:14.5px;line-height:1.5}.bulg .bh{display:block;font-size:12px;font-weight:800;letter-spacing:.04em;color:var(--mute);margin-bottom:2px}';
  document.head.appendChild(st);
  let X = null;
  const extra = () => X || (X = fetch('data/bulgular.json', { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).catch(() => ({})));
  const oz = id => fetch(`data/ozet/${id}.json`).then(r => r.ok ? r.json() : null).catch(() => null);
  const escH = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  async function add(card) {
    if (card.dataset.bulg) return;
    card.dataset.bulg = '1';
    const a = card.querySelector('.links a[href*="pubmed.ncbi.nlm.nih.gov"]');
    const m = a && /(\d+)\/?$/.exec(a.getAttribute('href'));
    if (!m) return;
    const [o, x] = await Promise.all([oz(m[1]), extra()]);
    const b = (o && o.b) || x[m[1]];
    const msg = card.querySelector('.msg');
    if (!b || !msg || card.querySelector('.bulg')) return;
    msg.insertAdjacentHTML('afterend', `<div class="bulg"><span class="bh">📊 BULGULAR</span>${escH(b)}</div>`);
  }
  function scan() { document.querySelectorAll('#n-list .card, #g-list .card, #s-list .card').forEach(c => { if (c.querySelector('.msg')) add(c); }); }
  function go() { ['n-list', 'g-list', 's-list'].forEach(id => { const el = document.getElementById(id); if (el) new MutationObserver(scan).observe(el, { childList: true, subtree: true }); }); scan(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
