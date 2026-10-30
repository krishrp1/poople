const TARGET = "poop";
const dict = new Set(WORDS);
const $ = id => document.getElementById(id);
const wait = ms => new Promise(r => setTimeout(r, ms));
let chain, typed, active, locked;

function makeRow(word = "", cls = false) {
  const r = document.createElement("div");
  r.className = "row";
  for (let i = 0; i < 4; i++) {
    const t = document.createElement("div");
    t.className = "tile" + (cls && word[i] ? (word[i] === TARGET[i] ? " correct" : " miss") : "");
    t.style.setProperty("--i", i);
    t.textContent = word[i] || "";
    r.append(t);
  }
  $("board").append(r);
  r.scrollIntoView({ block: "end" });
  return r;
}

function toast(text) {
  const t = $("toast");
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(toast.id);
  toast.id = setTimeout(() => t.classList.remove("show"), 1400);
}

// One start word per local calendar day, in a fixed shuffled order so it cycles through every word.
const day = (d => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5))(new Date());
const saveKey = "poople-" + day;

function dailyWord() {
  let seed = 20240601;
  const rand = () => {  // mulberry32
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const order = [...START_WORDS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order[day % order.length];
}

const LAUNCH_DAY = Math.floor(Date.UTC(2026, 9, 30) / 864e5);

function shareText() {
  const grid = chain.map(w => [...w].map((c, i) => (c === TARGET[i] ? "🟫" : "⬛")).join("")).join("\n");
  return `Poople #${day - LAUNCH_DAY + 1} - ${chain.length - 1} moves\n${grid}\n${location.origin}`;
}

async function share() {
  try {
    await navigator.clipboard.writeText(shareText());
    toast("Copied to clipboard");
  } catch {
    toast("Couldn't copy");
  }
}

function save() {
  try { localStorage.setItem(saveKey, JSON.stringify(chain)); } catch {}
}

function start() {
  const first = dailyWord();
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(saveKey)) || []; } catch {}
  chain = saved[0] === first && saved.every(w => dict.has(w) || w === first) ? saved : [first];
  typed = "";
  locked = false;
  chain.forEach(w => makeRow(w, true));
  $("count").textContent = chain.length - 1;
  if (chain[chain.length - 1] === TARGET) {
    locked = true;
    $("done").style.display = "block";
  } else {
    active = makeRow();
  }
}

function type(ch) {
  if (locked || typed.length >= 4) return;
  const tile = active.children[typed.length];
  tile.textContent = ch;
  tile.classList.add("filled");
  typed += ch;
}

function erase() {
  if (locked || !typed.length) return;
  typed = typed.slice(0, -1);
  const tile = active.children[typed.length];
  tile.textContent = "";
  tile.classList.remove("filled");
}

function reject(text) {
  toast(text);
  active.classList.remove("invalid");
  void active.offsetWidth;
  active.classList.add("invalid");
}

async function submit() {
  if (locked) return;
  const cur = chain[chain.length - 1];
  if (typed.length < 4) return reject("Not enough letters");
  if ([...typed].filter((c, i) => c !== cur[i]).length !== 1) return reject("Change exactly one letter");
  if (!dict.has(typed)) return reject("Not in word list");

  locked = true;
  const row = active, word = typed;
  [...row.children].forEach((tile, i) => {
    tile.classList.add("flip");
    setTimeout(() => {
      tile.classList.remove("filled");
      tile.classList.add(word[i] === TARGET[i] ? "correct" : "miss");
    }, i * 250 + 300);
  });
  await wait(3 * 250 + 600);

  chain.push(word);
  save();
  $("count").textContent = chain.length - 1;
  if (word === TARGET) return win(row);
  typed = "";
  active = makeRow();
  locked = false;
}

async function win(row) {
  [...row.children].forEach(t => { t.classList.remove("flip"); t.classList.add("bounce"); });
  await wait(1000);
  const fx = $("fx");
  fx.insertAdjacentHTML("beforeend",
    '<div class="flash"></div><div class="shock"></div><div class="cloud"><div class="stem"></div><div class="cap"></div></div>');
  document.body.classList.add("shake");
  setTimeout(() => document.body.classList.remove("shake"), 1500);
  setTimeout(() => shower(fx), 900);
  $("done").style.display = "block";
}

function shower(fx) {
  for (let i = 0; i < 150; i++) {
    const p = document.createElement("span");
    p.className = "poo";
    p.textContent = "💩";
    p.style.left = Math.random() * 100 + "vw";
    p.style.fontSize = 20 + Math.random() * 40 + "px";
    p.style.animationDuration = 2 + Math.random() * 3 + "s";
    p.style.animationDelay = Math.random() * 3 + "s";
    p.style.setProperty("--spin", (Math.random() * 720 - 360) + "deg");
    fx.append(p);
  }
}

function handle(key) {
  if (key === "Enter") submit();
  else if (key === "Backspace") erase();
  else if (/^[a-z]$/i.test(key)) type(key.toLowerCase());
}

document.addEventListener("keydown", e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  handle(e.key);
});

["qwertyuiop", "asdfghjkl", "+zxcvbnm-"].forEach(letters => {
  const r = document.createElement("div");
  r.className = "krow";
  [...letters].forEach(k => {
    const b = document.createElement("button");
    b.className = "key" + (k === "+" || k === "-" ? " wide" : "");
    b.textContent = k === "+" ? "enter" : k === "-" ? "⌫" : k;
    b.addEventListener("click", () => handle(k === "+" ? "Enter" : k === "-" ? "Backspace" : k));
    r.append(b);
  });
  $("kb").append(r);
});

$("share").addEventListener("click", share);
start();
