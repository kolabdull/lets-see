let responses = [];

function rows(r) {
  const out = [];
  const add = (k, v) => {
    const val = Array.isArray(v) ? v.join(', ') : v;
    if (val) out.push([k, val]);
  };
  add('Name', r.name);
  add('Mood', r.mood); add('Mood (own)', r.moodCustom);
  add('Setting', r.setting); add('Setting (own)', r.settingCustom);
  add('Pace', r.pace);
  add('Conversation', r.conversation); add('Topic (own)', r.conversationCustom);
  for (const [k, v] of Object.entries(r.details || {})) add('Detail: ' + k, v);
  add('Wildcard', r.wildcard);
  for (const [k, v] of Object.entries(r.customPlan || {})) add('Own plan: ' + k, v);
  add('Final note', r.note);
  if (r.surprise) add('Surprise', 'She is happy to be surprised by one detail');
  if (r.followup) add('Follow-up', [r.followup.feeling, r.followup.text].filter(Boolean).join(' — '));
  return out;
}

function asText(r) {
  return [`Submitted: ${new Date(r.submittedAt).toLocaleString()}`]
    .concat(r.notReady ? ['Status: not ready yet'] : [])
    .concat(rows(r).map(([k, v]) => `${k}: ${v}`)).join('\n');
}

function render() {
  document.getElementById('count').textContent = responses.length + ' response' + (responses.length === 1 ? '' : 's');
  const box = document.getElementById('list');
  box.textContent = '';
  if (!responses.length) { box.textContent = 'Nothing yet.'; return; }
  responses.forEach((r) => {
    const a = document.createElement('article');
    const h = document.createElement('h2');
    h.textContent = 'Submitted: ' + new Date(r.submittedAt).toLocaleString();
    if (r.notReady) { const t = document.createElement('span'); t.className = 'tag'; t.textContent = 'not ready yet'; h.appendChild(t); }
    a.appendChild(h);
    const dl = document.createElement('dl');
    rows(r).forEach(([k, v]) => {
      const dt = document.createElement('dt'); dt.textContent = k;
      const dd = document.createElement('dd'); dd.textContent = v;
      dl.append(dt, dd);
    });
    a.appendChild(dl);
    const bar = document.createElement('div'); bar.className = 'bar';
    const c = document.createElement('button'); c.textContent = 'Copy';
    c.onclick = async () => { await navigator.clipboard.writeText(asText(r)); c.textContent = 'Copied'; setTimeout(() => (c.textContent = 'Copy'), 1200); };
    const d = document.createElement('button'); d.textContent = 'Delete';
    d.onclick = async () => {
      if (!confirm('Delete this response permanently?')) return;
      await fetch('/admin/api/responses/' + r.id, { method: 'DELETE' });
      load();
    };
    bar.append(c, d); a.appendChild(bar);
    box.appendChild(a);
  });
}

async function load() {
  const res = await fetch('/admin/api/responses', { cache: 'no-store' });
  responses = await res.json();
  render();
}

document.getElementById('refresh').onclick = load;
document.getElementById('copyAll').onclick = () => navigator.clipboard.writeText(responses.map(asText).join('\n\n----------\n\n'));
document.getElementById('dlJson').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(responses, null, 2)], { type: 'application/json' }));
  a.download = 'lets-see-responses.json';
  a.click();
};
load();
