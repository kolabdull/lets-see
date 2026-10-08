(() => {
'use strict';

/* ------------------------------------------------------------------ content */
const MOODS = [
  { id: 'easy', t: 'Easy', d: 'Something simple. No elaborate itinerary. Just somewhere we can talk and see if the conversation survives real life.', n: 'sensible.' },
  { id: 'curious', t: 'Curious', d: 'Something that gives us things to look at, talk about, disagree about, and probably overanalyse.', n: 'of course you did.' },
  { id: 'playful', t: 'Playful', d: 'Something with enough room for teasing, bad jokes and at least one moment where one of us says, "You actually said that?"', n: 'ridiculous. (affectionate)' },
  { id: 'unplanned', t: 'Unplanned', d: 'Give me a general direction and let the rest happen.', n: 'we\'ll see.' },
  { id: 'surprise', t: 'You decide', d: 'I want you to surprise me.', n: 'no pressure. none at all.' },
];
const PLACES = [
  { id: 'coffee', t: 'Coffee / Café', d: 'Two drinks, somewhere quiet, and an unreasonable amount of conversation.', n: 'classic for a reason.', line: 'Somewhere quiet enough to talk.', phrase: 'somewhere quiet enough to talk' },
  { id: 'cinema', t: 'Cinema', d: 'You did say you could go to a movie.', n: 'on the record.', line: 'A movie is involved.', phrase: 'a movie involved' },
  { id: 'bookshop', t: 'Bookshop', d: 'For when the conversation needs footnotes.', n: 'dangerous. I\'ll budget.', line: 'There will be shelves, and opinions about them.', phrase: 'shelves and opinions about them' },
  { id: 'gallery', t: 'Gallery / Museum', d: 'Something to look at when we run out of things to say.', n: 'we won\'t, but fine.', line: 'Something to look at when the talking pauses.', phrase: 'something to look at when the talking pauses' },
  { id: 'restaurant', t: 'Restaurant', d: 'Good food tends to improve almost every argument.', n: 'true.', line: 'A proper meal is part of this.', phrase: 'a proper meal' },
  { id: 'walk', t: 'Walk', d: 'Somewhere we can keep moving while pretending we aren\'t nervous.', n: 'good. you like walking.', line: 'We keep moving. Nerves optional.', phrase: 'a walk, so we can keep moving' },
  { id: 'outdoors', t: 'Something Outdoors', d: 'Sunlight, fresh air, and an opportunity to blame the weather (or the traffic) if things get awkward.', n: 'weather: already blamed.', line: 'Outdoors, weather permitting. Blame permitted.', phrase: 'somewhere outdoors' },
  { id: 'new', t: 'Something Neither of Us Has Tried', d: 'Because apparently we\'re both capable of being spontaneous.', n: 'bold. noted.', line: 'Neither of us has done this before.', phrase: 'something neither of us has tried' },
];
const TALKS = [
  { id: 'care', t: 'Things I actually care about', d: 'Books, work, ideas, ambitions, life.', n: 'this is the good stuff.', phrase: 'the things you actually care about' },
  { id: 'started', t: 'Things we\'ve already started', d: 'The things we\'ve somehow managed to discuss through messages.', n: 'to be continued.', phrase: 'the threads we already started' },
  { id: 'ask', t: 'Things you\'ve been meaning to ask me', d: 'A chance to ask questions without waiting three days for the next one.', n: 'question #1 of approximately 700.', phrase: 'questions she\'s been saving' },
  { id: 'untold', t: 'Things I haven\'t told you yet', d: 'A little room for mystery.', n: 'intriguing.', phrase: 'a few things left untold' },
  { id: 'unserious', t: 'Completely unserious things', d: 'Because not everything needs to become an intellectual exercise.', n: 'agreed. mostly.', phrase: 'completely unserious things' },
  { id: 'whatever', t: 'Whatever comes up', d: 'No agenda. Just conversation.', n: 'the best kind.', phrase: 'whatever comes up' },
];
const DETAILS = [
  { id: 'time', label: 'Time', prompt: 'When are you at your most agreeable?', opts: ['Morning', 'Afternoon', 'Evening', 'Surprise me'], tip: 'Morning walks are not on the list by accident.' },
  { id: 'duration', label: 'Duration', prompt: 'How long before one of us pretends to have somewhere to be?', opts: ['Quick coffee', 'A couple of hours', 'Half a day', 'We\'ll see'] },
  { id: 'food', label: 'Food', prompt: 'And food. Is it a side note or a main character?', opts: ['Definitely', 'Maybe', 'Only if we\'re hungry', 'I already have somewhere in mind'] },
  { id: 'music', label: 'Music', prompt: 'Should there be a soundtrack?', opts: ['Background music', 'Somewhere quiet', 'Live music', 'I don\'t care'] },
  { id: 'dress', label: 'Dress code', prompt: 'How much effort should the outfit involve?', opts: ['Casual', 'Smart casual', 'Dress up a little', 'Whatever feels natural'] },
  { id: 'transport', label: 'Transport', prompt: 'Getting there. Logistics, but make it brief.', opts: ['I\'ll sort mine', 'Let\'s figure it out together', 'You decide'] },
];
const PACE = [
  [20, 'I know where we\'re going, what we\'re doing, and approximately when we\'re leaving.'],
  [40, 'Mostly planned, with a few blank spaces on purpose.'],
  [60, 'We have a plan. We are not married to it.'],
  [80, 'A rough outline, and a lot of room to wander off it.'],
  [100, 'We know the general vicinity and that\'s about it.'],
];
const PACE_PHRASE = ['a firm plan', 'a mostly firm plan', 'a little structure, plenty of room for improvisation', 'a loose outline', 'no rigid schedule at all'];
const paceIndex = (v) => PACE.findIndex(([m]) => v <= m);
const CUSTOM_FIELDS = [
  ['where', 'Where?'], ['when', 'When?'], ['doing', 'What are we doing?'],
  ['never', 'What absolutely shouldn\'t happen?'], ['good', 'What would make it a good first meeting for you?'],
  ['know', 'Anything I should know beforehand?'], ['ending', 'Your ideal ending to the day?'],
];
const PROGRESS = ['The mood', 'The place', 'The plan', 'The details', 'Your wildcard', 'Final thoughts'];
const FLOW = ['mood', 'place', 'pace', 'talk', 'details', 'wildcard', 'review', 'final'];
const STEP_OF = { mood: 1, place: 2, pace: 3, talk: 3, details: 4, wildcard: 5, custom: 6, review: 6, final: 6 };

/* -------------------------------------------------------------------- state */
const KEY = 'lets-see-v1';
const blank = () => ({
  screen: 'landing', returnTo: null, fromReview: false, submitted: null,
  a: {
    name: '', mood: [], moodOn: false, moodCustom: '', place: [], placeOn: false, placeCustom: '',
    pace: 50, paceSet: false, talk: [], talkOn: false, talkCustom: '',
    details: {}, wildcard: '', custom: {}, customUsed: false, ignore: '', note: '', surprise: false,
  },
});
let S = blank();
let resumeOffer = false;
try {
  const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (raw && raw.a) {
    S = { ...blank(), ...raw, a: { ...blank().a, ...raw.a } };
    if (S.submitted) { /* stay on receipt */ }
    else if (S.screen !== 'landing') { resumeOffer = true; }
  }
} catch {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {} };

/* ------------------------------------------------------------------ helpers */
const $ = (s, r = document) => r.querySelector(s);
const stage = $('#stage'), bar = $('#bar'), prog = $('#progress');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const byId = (arr, id) => arr.find((x) => x.id === id);

function go(screen) {
  typingTimers.forEach(clearTimeout); typingTimers = [];
  S.screen = screen; save();
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  render();
}

/* ------------------------------------------------------------- readable out */
function readable() {
  const a = S.a;
  const details = {};
  DETAILS.forEach((d) => { if (a.details[d.id]) details[d.label] = a.details[d.id]; });
  const customPlan = {};
  if (a.customUsed) {
    CUSTOM_FIELDS.forEach(([k, l]) => { if ((a.custom[k] || '').trim()) customPlan[l] = a.custom[k].trim(); });
    if (a.ignore.trim()) customPlan['What she actually wants'] = a.ignore.trim();
  }
  return {
    name: a.name.trim(),
    mood: a.mood.map((id) => byId(MOODS, id).t), moodCustom: a.moodCustom.trim(),
    setting: a.place.map((id) => byId(PLACES, id).t), settingCustom: a.placeCustom.trim(),
    pace: a.paceSet ? PACE[paceIndex(a.pace)][1] : '',
    conversation: a.talk.map((id) => byId(TALKS, id).t), conversationCustom: a.talkCustom.trim(),
    details, wildcard: a.wildcard.trim(), customPlan,
    note: a.note.trim(), surprise: a.surprise,
  };
}
const timePhrase = () => ({ Morning: 'a morning', Afternoon: 'an afternoon', Evening: 'an evening', 'Surprise me': 'a time she\'s leaving to me' }[S.a.details.time] || '');

function planLines() {
  const a = S.a, L = [];
  const t = a.details.time;
  if (t) L.push(t === 'Surprise me' ? 'The time is my problem.' : t + '.');
  a.place.forEach((id) => L.push(byId(PLACES, id).line));
  if (a.placeCustom.trim()) L.push('Somewhere she\'s described herself. I\'ll read it twice.');
  const m = a.mood.map((id) => byId(MOODS, id).t.toLowerCase());
  if (m.length) L.push('Mood: ' + m.join(' + ') + '.');
  const f = a.details.food;
  if (f) L.push({ Definitely: 'Food is happening.', Maybe: 'Food is negotiable.', 'Only if we\'re hungry': 'Food, if hunger demands it.', 'I already have somewhere in mind': 'You have a place in mind for the food.' }[f]);
  if (a.details.duration) L.push('Duration: ' + a.details.duration.toLowerCase() + '.');
  if (a.paceSet) L.push(PACE[paceIndex(a.pace)][1]);
  L.push('Conversation is non-negotiable.');
  if (a.wildcard.trim()) L.push('One wildcard remains.');
  if (a.surprise) L.push('One detail is mine to choose.');
  return L;
}

function copyText() {
  const r = readable();
  const out = ["Our First Meeting — Omosalewa's Version", 'Prepared for Kolabdul', ''];
  const add = (k, v) => { const s = Array.isArray(v) ? v.join(', ') : v; if (s) out.push(`${k}: ${s}`); };
  if (r.name && r.name.toLowerCase() !== 'omosalewa') add('Also known as', r.name); add('Mood', r.mood); add('Mood (own words)', r.moodCustom);
  add('Setting', r.setting); add('Setting (own words)', r.settingCustom); add('Pace', r.pace);
  add('Conversation', r.conversation); add('Own topic', r.conversationCustom);
  Object.entries(r.details).forEach(([k, v]) => add(k, v));
  add('Wildcard', r.wildcard);
  Object.entries(r.customPlan).forEach(([k, v]) => add(k, v));
  add('Final note', r.note);
  if (r.surprise) out.push('One detail: left as a surprise');
  return out.join('\n');
}

/* ------------------------------------------------------------------- render */
function chrome() {
  const step = STEP_OF[S.screen];
  const q = resumeOffer || ['landing', 'done'].includes(S.screen);
  prog.hidden = q;
  bar.hidden = q || S.screen === 'final' || S.screen === 'review';
  if (!q) {
    prog.innerHTML = `<b>${String(step).padStart(2, '0')} — ${PROGRESS[step - 1]}</b><div class="ticks">${PROGRESS.map((_, i) => `<i class="tick ${i < step ? 'on' : ''}"></i>`).join('')}</div>`;
  }
  const nextBtn = $('[data-action=next]', bar);
  nextBtn.textContent = S.fromReview ? 'Back to review →' : 'Continue →';
}

function cardHTML(item, selected, i, ico) {
  return `<button class="card" data-action="toggle" data-id="${item.id}" aria-pressed="${selected}" style="--i:${i}">
    <h3>${ico ? `<span class="ico">${ico}</span>` : ''}${esc(item.t)}<span class="box"></span></h3>
    <p>${esc(item.d)}</p><span class="note">${esc(item.n)}</span></button>`;
}
const customToggle = (key, label, ph, on) => `
  <button class="link" data-action="customtoggle" data-k="${key}" style="margin-top:14px">${on ? '− Hide' : '+ ' + label}</button>
  ${on ? `<div class="reveal"><textarea data-bind="${key}" placeholder="${esc(ph)}">${esc(S.a[key])}</textarea></div>` : ''}`;
const ownVersion = `<button class="altlink" data-action="own">None of these quite sound like me. →</button>`;

const SCREENS = {
  mood() {
    const a = S.a;
    return `<section class="screen">
      <p class="eyebrow">Question #1 of approximately 700</p>
      <h1 class="big">First things first. How do you want this to feel?</h1>
      <p class="margin">Pick one, pick several. You can answer this one. I promise not to interrogate you.</p>
      <div class="cards">${MOODS.map((m, i) => cardHTML(m, a.mood.includes(m.id), i)).join('')}</div>
      ${customToggle('moodCustom', 'Write your own', 'Describe the atmosphere you actually have in mind…', a.moodOn)}
      ${ownVersion}</section>`;
  },
  place() {
    const a = S.a;
    const ico = { coffee: '☕', cinema: '🎞', bookshop: '📖', gallery: '🖼', restaurant: '🍽', walk: '👣', outdoors: '🌤', new: '✦' };
    return `<section class="screen">
      <p class="eyebrow">The place</p>
      <h1 class="big">Where does your imagination take us?</h1>
      <p class="margin">Somewhere you'd actually want to be. Not somewhere that sounds good on paper.</p>
      <div class="cards two">${PLACES.map((p, i) => cardHTML(p, a.place.includes(p.id), i, '')).join('')}</div>
      ${customToggle('placeCustom', 'Somewhere else', 'Type your own suggestion…', a.placeOn)}
      ${ownVersion}</section>`;
  },
  pace() {
    const i = paceIndex(S.a.pace);
    return `<section class="screen">
      <p class="eyebrow">The plan</p>
      <h1 class="big">You don't strike me as someone who likes being told exactly what happens next.</h1>
      <p class="margin">Speak plainly. Apparently, "I'll let you know" is not a plan.</p>
      <div class="slider">
        <div class="ends"><span>Fully planned</span><span>Let's just see</span></div>
        <input type="range" min="0" max="100" value="${S.a.pace}" id="pace" aria-label="How much should we plan?">
      </div>
      <p class="paceText" id="paceText">${S.a.paceSet ? esc(PACE[i][1]) : '<span class="small">Slide it. Or leave it in the middle and see what happens.</span>'}</p>
    </section>`;
  },
  talk() {
    const a = S.a;
    return `<section class="screen">
      <p class="eyebrow">The conversation</p>
      <h1 class="big">And what should we talk about?</h1>
      <p class="margin">It is, after all, how we got here.</p>
      <div class="cards two">${TALKS.map((t, i) => cardHTML(t, a.talk.includes(t.id), i)).join('')}</div>
      ${customToggle('talkCustom', 'Add your own topic', 'A topic, a question, a book you think I should have read…', a.talkOn)}
    </section>`;
  },
  details() {
    return `<section class="screen">
      <p class="eyebrow">The details</p>
      <h1 class="big">The things that somehow become important later.</h1>
      <p class="margin">Answer what you like. Skip the rest.</p>
      ${DETAILS.map((d) => `<div class="group"><div class="prompt">${esc(d.prompt)}</div>
        <div class="chips">${d.opts.map((o) => `<button class="chip" data-action="detail" data-d="${d.id}" data-v="${esc(o)}" aria-pressed="${S.a.details[d.id] === o}">${esc(o)}</button>`).join('')}</div></div>`).join('')}
    </section>`;
  },
  wildcard() {
    return `<section class="screen">
      <p class="eyebrow">Your wildcard</p>
      <h1 class="big">One completely unreasonable suggestion.</h1>
      <p class="sub">Give me one thing you think would make the first meeting unexpectedly better.</p>
      <textarea data-bind="wildcard" placeholder="Anything. Genuinely.">${esc(S.a.wildcard)}</textarea>
      <p class="margin" style="margin-top:16px">No judging. Unless it's objectively terrible.</p>
      ${ownVersion}</section>`;
  },
  custom() {
    const c = S.a.custom;
    return `<section class="screen">
      <p class="eyebrow">Your own version</p>
      <h1 class="big">Fine. Write it yourself.</h1>
      <p class="margin">You don't have to fill everything in. Leave anything blank.</p>
      ${CUSTOM_FIELDS.map(([k, l]) => `<label class="q" for="c_${k}">${l}</label><textarea id="c_${k}" data-bind-c="${k}" style="min-height:80px">${esc(c[k] || '')}</textarea>`).join('')}
      <label class="q" for="c_ignore" style="margin-top:40px"><i>Or ignore all of this and tell me what you actually want.</i></label>
      <textarea id="c_ignore" data-bind="ignore" style="min-height:180px">${esc(S.a.ignore)}</textarea>
      <div class="row"><button class="link" data-action="dropcustom">Actually, never mind. Back to the options.</button></div>
    </section>`;
  },
  review() {
    const r = readable(), a = S.a;
    const sec = (label, val, to) => `<div class="rv"><span class="eyebrow">${label}</span><div class="val ${val ? '' : 'none'}">${val ? esc(val) : 'Not chosen'}</div><button class="link edit" data-action="edit" data-to="${to}">Edit →</button></div>`;
    const dt = Object.entries(r.details).map(([k, v]) => `${k}: ${v}`).join('\n');
    return `<section class="screen">
      <p class="eyebrow">Review</p>
      <h1 class="big">Alright, let's see what you've built.</h1>
      <p class="sub">Before I start making executive decisions, make sure this actually sounds like you.</p>
      <div class="ticket"><span class="eyebrow">The Plan</span>${planLines().map((l, i) => `<p style="--i:${i}" class="${l.startsWith('Conversation') ? 'strong' : ''}">${esc(l)}</p>`).join('')}</div>
      ${sec('The mood', [r.mood.join(', '), r.moodCustom].filter(Boolean).join('\n'), 'mood')}
      ${sec('The setting', [r.setting.join(' → '), r.settingCustom].filter(Boolean).join('\n'), 'place')}
      ${sec('The pace', r.pace, 'pace')}
      ${sec('The conversation', [r.conversation.join(', '), r.conversationCustom].filter(Boolean).join('\n'), 'talk')}
      ${sec('The details', dt, 'details')}
      ${sec('The wildcard', r.wildcard, 'wildcard')}
      ${a.customUsed ? sec('Her own version', Object.entries(r.customPlan).map(([k, v]) => `${k}\n${v}`).join('\n\n'), 'custom') : ''}
      <div class="row" style="margin-top:34px">
        <button class="btn solid big-btn" data-action="looksgood">Looks good.</button>
        <button class="btn ghost" data-action="change">I want to change something.</button>
      </div>
      <div id="changeBox"></div>
    </section>`;
  },
  final() {
    return `<section class="screen">
      <p class="eyebrow">One last thing</p>
      <h1 class="big">One last thing.</h1>
      <p class="sub">You're not committing to a contract here. You're just telling me what would make this feel good to you.</p>
      <label class="q" for="note">Anything else you want me to know?</label>
      <textarea id="note" data-bind="note" style="min-height:150px" placeholder="Something I forgot to ask, something you want to add, or something I should probably know…">${esc(S.a.note)}</textarea>
      <label class="check"><input type="checkbox" id="surprise" ${S.a.surprise ? 'checked' : ''}> <span>You can surprise me with one detail.</span></label>
      <label class="q" for="name">What should I call this version?</label>
      <input type="text" id="name" data-bind="name" maxlength="80" autocomplete="off" placeholder="Your name, nickname, or something unnecessarily mysterious." value="${esc(S.a.name)}">
      <p class="small" style="margin:6px 0 0">Optional.</p>
      <div class="row" style="margin-top:36px;flex-direction:column;align-items:flex-start">
        <button class="btn solid big-btn send" id="sendBtn" data-action="send">Send me your version →</button>
        <span class="hand">I'll take it from here.</span>
        <div class="err" id="err" role="alert"></div>
      </div>
      <p class="small">Your answers are sent directly to me. Nothing else is collected.</p>
      <div class="row"><button class="link" data-action="back">← Back to the review</button></div>
      <p class="quiet">And if you decide you're not ready yet, that's a perfectly valid answer too.
        <br><button class="link" data-action="notready" style="margin-top:8px">Tell me that instead</button></p>
    </section>`;
  },
  done() {
    const a = S.a, sub = S.submitted;
    if (sub.notReady) {
      return `<section class="screen"><p class="eyebrow">Let's see.</p><h1 class="big">Received.</h1>
        <p class="sub">Fair enough. Honestly, thank you for saying so plainly.<br>Take your time. Nothing here expires.</p>
        <div class="row"><button class="link" data-action="restart">Start the whole thing again</button></div></section>`;
    }
    const bits = [];
    const t = timePhrase(); if (t) bits.push(t);
    const pl = a.place.map((id) => byId(PLACES, id).phrase); if (pl.length) bits.push(pl.join(' and '));
    if (a.paceSet) bits.push(PACE_PHRASE[paceIndex(a.pace)]);
    if (a.talk.length) bits.push('conversation about ' + a.talk.map((id) => byId(TALKS, id).phrase).join(', '));
    const wild = a.wildcard.trim() ? 'and one wildcard I haven\'t been allowed to know yet' : '';
    const own = a.customUsed && (a.ignore.trim() || Object.values(a.custom).some((v) => v && v.trim()));
    return `<section class="screen">
      <p class="eyebrow">Let's see.</p>
      <h1 class="big">Received.</h1>
      <p class="sub" style="margin-bottom:10px">So we're thinking:</p>
      <p style="font-size:22px;margin:0 0 20px">${bits.length ? esc(bits.join(', ')) + (wild ? ',' : '.') : ''} ${esc(wild ? wild + '.' : '')}${!bits.length && !wild ? 'Mostly a blank page, which is its own kind of answer.' : ''}</p>
      ${own ? '<p>You also wrote your own version. I\'ll read that properly. Twice.</p>' : ''}
      ${a.surprise ? '<p>And one detail is mine to choose. Noted. Slightly terrifying.</p>' : ''}
      <p style="font-size:26px;font-style:italic;margin:24px 0 4px">Fair.</p>
      <p style="margin-top:0">I'll work with that.</p>
      <p class="hand" style="font-size:26px;margin:28px 0">Your turn is over. I'll figure out the rest.</p>

      <div style="border-top:1px solid var(--line);margin-top:36px;padding-top:28px">
        <h2 style="font-size:24px">One last question: are you actually looking forward to this, or are you still deciding?</h2>
        <div class="stack" id="feel" style="margin-top:16px">
          ${['I\'m looking forward to it.', 'I\'m cautiously optimistic.', 'I\'m still deciding.'].map((o) => `<button class="chip" style="text-align:left;border-radius:3px" data-action="feel" data-v="${esc(o)}" aria-pressed="${sub.feeling === o}">${esc(o)}</button>`).join('')}
          <button class="chip" style="text-align:left;border-radius:3px" data-action="askmore">Ask me something else.</button>
        </div>
        <div id="askBox"></div>
        <div id="feelOk" class="hand" style="margin-top:10px"></div>
      </div>

      <div style="border-top:1px solid var(--line);margin-top:36px;padding-top:28px">
        <h2 style="font-size:24px">Want a copy of what you chose?</h2>
        <div class="row">
          <button class="btn ghost" data-action="copy">Copy my answers</button>
          <button class="btn ghost" data-action="pdf">Download my plan</button>
        </div>
      </div>
      <div class="row" style="margin-top:32px"><a class="btn solid" href="/plan">I've drafted something. Have a look →</a></div>
      <div class="row"><button class="link" data-action="restart">Start again</button></div>
    </section>`;
  },
};

function render() {
  if (S.screen === 'landing' || resumeOffer) return renderLanding();
  chrome();
  stage.innerHTML = SCREENS[S.screen]();
  bindDynamic();
}

/* ------------------------------------------------------------------ landing */
let typingTimers = [];
function renderLanding() {
  chrome();
  stage.innerHTML = `<section class="screen landing">
    <p class="eyebrow" id="l1"></p>
    <h1 class="big" id="l2" style="max-width:15em"></h1>
    <p class="sub fade" id="l3" style="max-width:30em;font-size:20px">So, rather than deciding for you, I thought I'd let you have unreasonable amounts of say.</p>
    <div class="fade" id="l4"><button class="btn solid big-btn" data-action="begin">Begin</button>
      <p class="hand" style="margin-top:22px">No wrong answers. Except perhaps "I haven't decided yet."</p></div>
  </section>`;
  const l1 = $('#l1'), l2 = $('#l2');
  const t1 = 'LET\'S SEE.', t2 = 'You said we\'d have to meet to decide where this goes.';
  const reveal = () => { $('#l3')?.classList.add('show'); typingTimers.push(setTimeout(() => $('#l4')?.classList.add('show'), reduced ? 0 : 700)); };
  typingTimers.forEach(clearTimeout); typingTimers = [];
  if (reduced) { l1.textContent = t1; l2.textContent = t2; reveal(); }
  else {
    const type = (el, text, speed, done) => {
      let i = 0;
      el.innerHTML = '<span></span><i class="caret"></i>';
      const span = el.firstChild;
      const tick = () => {
        span.textContent = text.slice(0, ++i);
        if (i < text.length) typingTimers.push(setTimeout(tick, speed + Math.random() * 25));
        else { el.querySelector('.caret').remove(); done && done(); }
      };
      tick();
    };
    type(l1, t1, 70, () => typingTimers.push(setTimeout(() => type(l2, t2, 38, () => typingTimers.push(setTimeout(reveal, 300))), 350)));
  }
  if (resumeOffer) {
    const m = document.createElement('div');
    m.className = 'modal'; m.id = 'resume';
    m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="rt"><h2 id="rt">You left something unfinished.</h2>
      <div class="stack"><button class="btn solid" data-action="resume">Continue where I left off</button>
      <button class="btn ghost" data-action="restart">Start again</button></div></div>`;
    document.body.appendChild(m);
    $('[data-action=resume]', m).focus();
  }
}

/* ---------------------------------------------------------- dynamic binding */
function bindDynamic() {
  const pace = $('#pace');
  if (pace) {
    const upd = () => {
      S.a.pace = +pace.value; S.a.paceSet = true; save();
      const t = $('#paceText'); t.style.opacity = 0;
      clearTimeout(upd.t);
      upd.t = setTimeout(() => { t.textContent = PACE[paceIndex(S.a.pace)][1]; t.style.opacity = 1; }, 120);
    };
    pace.addEventListener('input', upd);
  }
  stage.querySelectorAll('[data-bind]').forEach((el) => el.addEventListener('input', () => { S.a[el.dataset.bind] = el.value; save(); }));
  stage.querySelectorAll('[data-bind-c]').forEach((el) => el.addEventListener('input', () => { S.a.custom[el.dataset.bindC] = el.value; S.a.customUsed = true; save(); }));
  const sp = $('#surprise');
  if (sp) sp.addEventListener('change', () => { S.a.surprise = sp.checked; save(); });
}

/* ------------------------------------------------------------------ actions */
function next() {
  if (S.fromReview) { S.fromReview = false; return go('review'); }
  if (S.screen === 'custom') return go('review');
  const i = FLOW.indexOf(S.screen);
  go(FLOW[i + 1]);
}
function back() {
  if (S.screen === 'custom') return go(S.returnTo || 'wildcard');
  if (S.fromReview) { S.fromReview = false; return go('review'); }
  if (S.screen === 'final') return go('review');
  const i = FLOW.indexOf(S.screen);
  go(i <= 0 ? 'landing' : FLOW[i - 1]);
}

async function post(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('bad status');
  return r.json();
}

async function send(notReady) {
  const btn = $('#sendBtn'), err = $('#err');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
  if (err) err.textContent = '';
  try {
    const payload = notReady ? { name: S.a.name.trim(), note: S.a.note.trim(), notReady: true } : readable();
    const res = await post('/api/submit', payload);
    S.submitted = { id: res.id, notReady: !!notReady, at: new Date().toISOString(), feeling: '' };
    go('done');
  } catch {
    if (btn) { btn.disabled = false; btn.textContent = 'Send me your version →'; }
    if (err) err.textContent = 'That didn\'t go through. Nothing is lost; your answers are still here. Try again?';
  }
}

const actions = {
  begin: () => { S.fromReview = false; go('mood'); },
  resume: () => { $('#resume')?.remove(); resumeOffer = false; render(); },
  restart: () => {
    if (S.submitted || resumeOffer || confirm('Start again? Your current answers will be cleared.')) {
      $('#resume')?.remove(); resumeOffer = false;
      S = blank(); save(); render();
    }
  },
  next, back,
  toggle: (el) => {
    const key = S.screen === 'mood' ? 'mood' : S.screen === 'place' ? 'place' : 'talk';
    const arr = S.a[key], id = el.dataset.id, i = arr.indexOf(id);
    i >= 0 ? arr.splice(i, 1) : arr.push(id);
    save();
    el.setAttribute('aria-pressed', i < 0);
  },
  detail: (el) => {
    const d = el.dataset.d, v = el.dataset.v;
    S.a.details[d] = S.a.details[d] === v ? '' : v; save();
    el.parentElement.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', c.dataset.v === S.a.details[d]));
  },
  customtoggle: (el) => {
    const k = el.dataset.k, on = k.replace('Custom', 'On');
    S.a[on] = !S.a[on]; save(); render();
    if (S.a[on]) $(`[data-bind="${k}"]`)?.focus();
  },
  own: () => { S.returnTo = S.screen; S.a.customUsed = true; go('custom'); },
  dropcustom: () => { S.a.customUsed = false; go(S.returnTo || 'wildcard'); },
  edit: (el) => { S.fromReview = true; go(el.dataset.to); },
  looksgood: () => go('final'),
  change: () => {
    $('#changeBox').innerHTML = `<div class="row reveal"><button class="btn ghost" data-action="edit" data-to="mood">Edit</button>
      <button class="btn ghost" data-action="addmore">Add something</button>
      <button class="btn ghost" data-action="restart">Start again</button></div>`;
  },
  addmore: () => go('wildcard'),
  send: () => send(false),
  notready: () => send(true),
  feel: async (el) => {
    const v = el.dataset.v;
    S.submitted.feeling = v; save();
    $('#feel').querySelectorAll('[data-action=feel]').forEach((c) => c.setAttribute('aria-pressed', c.dataset.v === v));
    try { await post('/api/followup', { id: S.submitted.id, feeling: v }); $('#feelOk').textContent = 'Noted. Honest answers only.'; }
    catch { $('#feelOk').textContent = 'That didn\'t send. Try tapping it again?'; }
  },
  askmore: () => {
    const b = $('#askBox');
    if (b.innerHTML) return;
    b.innerHTML = `<div class="reveal"><textarea id="askText" placeholder="Go on. Ask."></textarea>
      <div class="row"><button class="btn solid" data-action="askSend">Send</button></div></div>`;
    $('#askText').focus();
  },
  askSend: async () => {
    const text = $('#askText').value.trim();
    if (!text) return;
    try { await post('/api/followup', { id: S.submitted.id, feeling: S.submitted.feeling || '', text }); $('#askBox').innerHTML = ''; $('#feelOk').textContent = 'Received. That one is going to bother me.'; }
    catch { $('#feelOk').textContent = 'That didn\'t send. Try again?'; }
  },
  copy: async (el) => {
    try { await navigator.clipboard.writeText(copyText()); el.textContent = 'Copied.'; }
    catch { el.textContent = 'Couldn\'t copy'; }
    setTimeout(() => (el.textContent = 'Copy my answers'), 1600);
  },
  pdf: () => downloadPdf(),
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !actions[el.dataset.action]) return;
  actions[el.dataset.action](el);
});

/* ---------------------------------------------------------------------- PDF */
// Minimal hand-built PDF (Times-Roman, A4). No libraries.
function ascii(s) {
  return String(s)
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-').replace(/…/g, '...').replace(/→/g, '->')
    .replace(/[^\x20-\x7E]/g, '?');
}
const pdfEsc = (s) => s.replace(/[\\()]/g, '\\$&');
function wrap(text, max) {
  const out = [];
  String(text).split('\n').forEach((para) => {
    let line = '';
    para.split(/\s+/).forEach((w) => {
      while (w.length > max) { if (line) { out.push(line); line = ''; } out.push(w.slice(0, max)); w = w.slice(max); }
      if ((line + ' ' + w).trim().length > max) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
    });
    out.push(line);
  });
  return out;
}
function buildPdf() {
  const r = readable();
  const items = []; // {size, bold, text, gap}
  const sec = (label, v) => { const s = Array.isArray(v) ? v.join(', ') : v; if (s) items.push({ label, text: s }); };
  sec('MOOD', [r.mood.join(', '), r.moodCustom].filter(Boolean).join('\n'));
  sec('SETTING', [r.setting.join(' -> '), r.settingCustom].filter(Boolean).join('\n'));
  sec('PACE', r.pace);
  sec('CONVERSATION', [r.conversation.join(', '), r.conversationCustom].filter(Boolean).join('\n'));
  Object.entries(r.details).forEach(([k, v]) => sec(k.toUpperCase(), v));
  sec('WILDCARD', r.wildcard);
  Object.entries(r.customPlan).forEach(([k, v]) => sec(k.toUpperCase(), v));
  sec('FINAL NOTE', r.note);
  if (r.surprise) sec('ONE DETAIL', 'Left as a surprise.');

  const pages = []; let ops = [], y = 0;
  const M = 64, W = 595, H = 842, TOP = H - 70, BOT = 60;
  const newPage = () => { if (ops.length) pages.push(ops.join('\n')); ops = []; y = TOP; };
  const text = (font, size, x, s) => ops.push(`BT /${font} ${size} Tf ${x} ${y} Td (${pdfEsc(ascii(s))}) Tj ET`);
  newPage();
  text('F2', 26, M, 'Our First Meeting'); y -= 26;
  text('F3', 16, M, "Omosalewa's version" + (r.name && r.name.toLowerCase() !== 'omosalewa' ? ' (a.k.a. ' + r.name + ')' : '')); y -= 20;
  const when = new Date(S.submitted ? S.submitted.at : Date.now());
  text('F1', 10, M, 'Drafted by Omosalewa for Kolabdul, ' + when.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ' at ' + when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })); y -= 10;
  ops.push(`0.6 w ${M} ${y} m ${W - M} ${y} l S`); y -= 26;
  items.forEach((it) => {
    const lines = wrap(ascii(it.text), 86);
    if (y - 14 * (lines.length + 1) < BOT) newPage();
    text('F1', 8.5, M, it.label); y -= 14;
    lines.forEach((l) => { if (y < BOT) newPage(); text('F1', 12, M, l); y -= 15; });
    y -= 10;
  });
  if (y < BOT + 30) newPage();
  y -= 6;
  ops.push(`0.4 w ${M} ${y} m ${W - M} ${y} l S`); y -= 20;
  text('F3', 12, M, 'No contracts. Just what would make it feel good.'); y -= 16;
  text('F3', 12, M, "Kolabdul takes it from here. Let's see.");
  pages.push(ops.join('\n'));

  const objs = [];
  const add = (s) => { objs.push(s); return objs.length; };
  add('<< /Type /Catalog /Pages 2 0 R >>');
  add(''); // pages placeholder
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold /Encoding /WinAnsiEncoding >>');
  add('<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic /Encoding /WinAnsiEncoding >>');
  const kids = [];
  pages.forEach((c) => {
    const cid = add(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
    kids.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${cid} 0 R >>`));
  });
  objs[1] = `<< /Type /Pages /Kids [${kids.map((k) => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;
  let pdf = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(pdf.length); pdf += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}
function downloadPdf() {
  const blob = new Blob([buildPdf()], { type: 'application/pdf' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'our-first-meeting-her-version.pdf';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

render();
})();
