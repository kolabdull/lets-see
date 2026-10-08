(() => {
'use strict';

/* ---- edit these if the plan changes -------------------------------------
   Times are Lagos time (WAT, UTC+1). Dinner starts 19:00 on 9 Oct 2026. */
const DINNER_UTC = Date.UTC(2026, 9, 9, 18, 0);   // 19:00 WAT
const NIGHT_END_UTC = Date.UTC(2026, 9, 10, 0, 0); // 01:00 WAT, calendar end
// Paste a Spotify playlist link here and an "Open the playlist" button appears.
const PLAYLIST_URL = 'https://open.spotify.com/playlist/4tyfKoyfOdXoKdBu00uOtt';
// Drop a photo at public/nomaada.png and it appears above the dinner map.
const QUESTIONS = [
  'What are you reading right now that you would defend in an argument?',
  'What is the best thing you have ever researched purely out of curiosity?',
  'Which lost cause were you right to walk away from?',
  'Explain something you love in plain English. Plain. I will be checking.',
  'What is a "let\'s see" you are still waiting on?',
  'Which movie do you think people are wrong about?',
  'What does a good morning walk look like for you?',
  'What is something you have changed your mind about this year?',
  'What would you do with a free Saturday and no obligations?',
  'What is the most interesting thing you have learned from a stranger?',
  'Which Yoruba (or Naija) expression is impossible to translate properly?',
  'What are you secretly very good at?',
];
/* ------------------------------------------------------------------------ */

const $ = (s) => document.querySelector(s);

/* optional extras */
if (PLAYLIST_URL) { $('#plBtn').href = PLAYLIST_URL; $('#plRow').hidden = false; }
const ph = $('#nomaadaImg');
ph.addEventListener('load', () => { $('#nomaadaPhoto').hidden = false; });
ph.src = '/nomaada.png';

/* scroll reveal */
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 })
  : null;
document.querySelectorAll('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));
setTimeout(() => document.querySelectorAll('.reveal').forEach((el) => el.classList.add('in')), 2500); // never leave content hidden

/* countdown */
function tick() {
  const ms = DINNER_UTC - Date.now();
  const note = $('#cd-note');
  if (ms <= 0) {
    ['d', 'h', 'm', 's'].forEach((k) => ($('#cd-' + k).textContent = '0'));
    note.textContent = Date.now() < NIGHT_END_UTC ? 'it\'s happening. put the phone down.' : 'that was the evening. let\'s see what\'s next.';
    return;
  }
  const s = Math.floor(ms / 1000);
  $('#cd-d').textContent = Math.floor(s / 86400);
  $('#cd-h').textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
  $('#cd-m').textContent = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  $('#cd-s').textContent = String(s % 60).padStart(2, '0');
  note.textContent = 'until dinner.';
}
tick(); setInterval(tick, 1000);

/* question deck (no immediate repeats) */
let last = -1;
$('#draw').addEventListener('click', () => {
  let i; do { i = Math.floor(Math.random() * QUESTIONS.length); } while (i === last);
  last = i;
  const q = $('#deckq'); q.style.opacity = 0;
  setTimeout(() => { q.textContent = QUESTIONS[i]; q.style.opacity = 1; }, 180);
  $('#draw').textContent = 'Draw another';
});

/* calendar file */
$('#ics').addEventListener('click', () => {
  const f = (t) => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Lets See//EN', 'BEGIN:VEVENT',
    'UID:lets-see-' + DINNER_UTC + '@lets-see', 'DTSTAMP:' + f(Date.now()),
    'DTSTART:' + f(DINNER_UTC), 'DTEND:' + f(NIGHT_END_UTC),
    'SUMMARY:Dinner at Nomaada, then The Mad House',
    "LOCATION:Nomaada\\, 4B Musa Yar'Adua Street\\, Victoria Island\\, Lagos",
    'DESCRIPTION:7:00 PM dinner at Nomaada. ~9:45 PM walk (about 10 min) to The Mad House\\, Casa 45\\, 35 Adeola Odeku\\, VI. Let\'s see.',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  a.download = 'friday-lets-see.ics';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});

/* reply */
let choice = '';
const send = $('#sendReply');
$('#choices').addEventListener('click', (e) => {
  const b = e.target.closest('.chip'); if (!b) return;
  choice = b.dataset.v;
  document.querySelectorAll('#choices .chip').forEach((c) => c.setAttribute('aria-pressed', c === b));
  $('#tweak').hidden = choice.startsWith('Perfect');
  send.disabled = false;
});
send.addEventListener('click', async () => {
  send.disabled = true; send.textContent = 'Sending…'; $('#err').textContent = '';
  try {
    const r = await fetch('/api/planreply', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice, text: $('#tweakText').value }),
    });
    if (!r.ok) throw new Error();
    send.textContent = 'Sent.';
    $('#thanks').textContent = choice.startsWith('Perfect') ? 'Good. See you Friday.' : 'Noted. We\'ll sort it out.';
  } catch {
    send.disabled = false; send.textContent = 'Send my answer →';
    $('#err').textContent = 'That didn\'t go through. Try again?';
  }
});
})();
