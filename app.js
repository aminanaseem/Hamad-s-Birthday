// The password is NOT stored anywhere. Pages and photos in /vault are encrypted with it
// (tools/build.py), and only the right password can unlock them. Capitals and spaces don't matter.
const END_DAY = "2026-12-02";   // from this day the whole site shows "This surprise has ended"

const $ = id => document.getElementById(id);

/* =====================================================================
   DATE
   Preview any day (only on your own computer):  http://127.0.0.1:5500/?day=2026-11-24
   ===================================================================== */
const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
const params = new URLSearchParams(location.search);
const previewDay = isLocal && /^\d{4}-\d{2}-\d{2}$/.test(params.get("day") || "") ? params.get("day") : null;

function now() {
  const real = new Date();
  if (!previewDay) return real;
  const [y, m, d] = previewDay.split("-").map(Number);
  return new Date(y, m - 1, d, real.getHours(), real.getMinutes(), real.getSeconds());
}
const pad = n => String(n).padStart(2, "0");
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const BDAY = DAYS[DAYS.length - 1].date; // 2026-12-01
const daysUntil = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const pageKey = k => { const [, m, d] = k.split("-").map(Number); return MONTHS[m - 1] + pad(d); }; // "nov16"

/* ---------- which page / theme for today ---------- */
function dayState() {
  const key = keyOf(now());
  if (key >= END_DAY) return { key, ended: true };
  const e = DAYS.find(d => d.date === key);
  if (e) return { key, entry: e, page: pageKey(key) };
  return { key, entry: null, page: "teaser" }; // before 16 Nov
}

let heartChars = DEFAULT_THEME.hearts;
function applyTheme(t) {
  const r = document.documentElement.style;
  ["accent", "accent2", "accent3", "soft", "bgA", "bgB", "bgC", "text", "deep"].forEach(k => r.setProperty("--" + k, t[k]));
  r.setProperty("--strong", t.strong || t.accent2);
  r.setProperty("--btnText", t.btnText || "#fff");
  r.setProperty("--script", t.font);
  heartChars = t.hearts;
}

let state = dayState();
function applyDay() {
  state = dayState();
  document.body.classList.toggle("ended", !!state.ended);
  if (state.ended) { stopMusic(true); return; }

  const e = state.entry;
  applyTheme(e || DEFAULT_THEME);
  const left = daysUntil(state.key, BDAY);
  const notice = $("notice");

  // today's lock screen style + words
  const L = LOCKS[state.key] || LOCKS.default;
  document.body.className = document.body.className.replace(/\blk-\S+/g, "").trim();
  document.body.classList.add("lk-" + L.style);
  $("lockTitle").textContent = L.title;
  $("lockSub").textContent = L.sub;
  $("unlockBtn").textContent = L.btn;
  $("passInput").placeholder = L.ph;
  $("lockIcon").textContent = L.icon;

  if (!e) {
    $("lockNote").textContent = "🌙 Your first surprise opens tonight after 12";
    notice.textContent = "🌙 Your first surprise opens tonight after 12!";
  } else if (e.birthday) {
    $("lockNote").textContent = "🎂 Today's surprise is the biggest one";
    notice.textContent = "🎂 Happy Birthday, Khuchu Puchu! 🎂";
  } else {
    const plural = left === 1 ? "day" : "days";
    $("lockNote").textContent = `🎁 ${left} ${plural} to your birthday · 🌙 a new surprise opens every night after 12`;
    notice.textContent = left === 1
      ? "🌙 Come back after 12 tonight. It will be your BIRTHDAY! 🎂"
      : `🌙 New surprise every night after 12 · ${left} ${plural} to go`;
  }
  if (document.body.classList.contains("unlocked")) loadFrame();
}
/* ---------- unlocking the encrypted pages + photos ---------- */
let KEY = null, imgIndex = null, loadedPage = null;
const imgCache = {};
async function deriveKey(pw) {
  const salt = (await (await fetch("vault/salt.txt", { cache: "no-store" })).text()).trim();
  const saltBytes = new Uint8Array(salt.match(/../g).map(h => parseInt(h, 16)));
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: saltBytes, iterations: 200000, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
}
async function openFile(path, key = KEY) {
  const buf = await (await fetch(path, { cache: "no-store" })).arrayBuffer();
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: buf.slice(0, 12) }, key, buf.slice(12));
}
async function photoURL(path) {
  if (imgCache[path]) return imgCache[path];
  const info = imgIndex[path];
  if (!info) return path;
  const data = await openFile("vault/" + info.f);
  return (imgCache[path] = URL.createObjectURL(new Blob([data], { type: info.t })));
}
async function loadFrame() {
  if (!KEY || loadedPage === state.page) return;
  loadedPage = state.page;
  if (!imgIndex) imgIndex = await (await fetch("vault/images.json", { cache: "no-store" })).json();
  let html = new TextDecoder().decode(await openFile(`vault/${state.page}.bin`));
  const needed = new Set(html.match(/\.\.\/images\/[\w./-]+/g) || []);
  if (state.page === "dec01") Object.keys(imgIndex).forEach(p => needed.add(p)); // all memories
  const map = {};
  await Promise.all([...needed].map(async p => { map[p] = await photoURL(p); }));
  for (const p of needed) html = html.split(p).join(map[p]);
  html = html.replace(/<head>/i, `<head><script>window.__IMG=${JSON.stringify(map)}<\/script>`);
  $("dayFrame").srcdoc = html;
}

/* ---------- phone-style lock clock ---------- */
setInterval(() => {
  const d = new Date();
  $("lockClock").innerHTML = `${pad(d.getHours())}:${pad(d.getMinutes())}<small>${d.toDateString().slice(0, 10)}</small>`;
}, 1000);

/* ---------- floating hearts ---------- */
const bg = $("hearts-bg");
setInterval(() => {
  if (document.body.classList.contains("unlocked")) return;
  const h = document.createElement("span");
  h.className = "fh";
  h.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
  h.style.left = Math.random() * 100 + "vw";
  h.style.fontSize = 12 + Math.random() * 22 + "px";
  h.style.animationDuration = 7 + Math.random() * 8 + "s";
  bg.appendChild(h);
  setTimeout(() => h.remove(), 16000);
}, 700);

/* =====================================================================
   MUSIC (starts by itself when he unlocks; no pop-ups)
   A different romantic song every day, starting at its most-loved part.
   1 December: built-in Happy Birthday tune.
   (Optional: an mp3 in songs/ named nov16.mp3 … dec01.mp3 replaces that day's song.)
   ===================================================================== */
const SONGS = { // id = YouTube video (only uploads that allow playing on other websites), start = second of the romantic part
  "2026-11-16": { name: "Ik Lamha",                id: "aj4aZgTZ18g", start: 156 },
  "2026-11-17": { name: "Tujh Mein Rab Dikhta Hai", id: "qoq8B8ThgEM", start: 36 },
  "2026-11-18": { name: "Tum Mile",                id: "UcqI3uBKgTg", start: 65 },
  "2026-11-19": { name: "Hawayein",                id: "cYOB941gyXI", start: 52 },
  "2026-11-20": { name: "Gerua",                   id: "AEIVhBS6baE", start: 60 },
  "2026-11-21": { name: "Jag Ghoomeya",            id: "t10sQb0Zmjs", start: 165 },
  "2026-11-22": { name: "Kesariya",                id: "jcV4YKfeOMI", start: 0 },
  "2026-11-23": { name: "Janam Janam",             id: "cgmhimjsczk", start: 119 },
  "2026-11-24": { name: "Raataan Lambiyan",        id: "orYf6VDtj_k", start: 20 },
  "2026-11-25": { name: "Saans",                   id: "VAt6TO2gdko", start: 190 },
  "2026-11-26": { name: "Haule Haule",             id: "efTcN1JRB5s", start: 97 },
  "2026-11-27": { name: "Dil Diyan Gallan",        id: "SAcpESN_Fk4", start: 21 },
  "2026-11-28": { name: "Apna Bana Le",            id: "ElZfdU54Cp8", start: 40 },
  "2026-11-29": { name: "Mann Bharryaa 2.0",       id: "1poXN3jF3Bw", start: 103 },
  "2026-11-30": { name: "Pal Pal Dil Ke Paas",     id: "lgTHGZF3BQw", start: 68 }
};
const FALLBACK_SONG = SONGS["2026-11-16"]; // before 16 Nov: Ik Lamha
const audio = $("song");
const musicBtn = $("musicBtn");
let mode = null, decided = null, paused = false, song = FALLBACK_SONG;
const unlocked = () => document.body.classList.contains("unlocked");
const isBirthdayToday = () => keyOf(now()) === BDAY;

async function exists(url) {
  try { const r = await fetch(url, { method: "HEAD", cache: "no-store" }); return r.ok; }
  catch { return false; }
}
async function decideSong() {
  const key = keyOf(now());
  const daily = `songs/${pageKey(key)}.mp3`;
  if (await exists(daily)) return { mode: "file", src: daily, label: isBirthdayToday() ? "Birthday song 🎂" : "Today's song" };
  if (isBirthdayToday()) return { mode: "synth", label: "Happy Birthday 🎂" };
  const s = SONGS[key] || FALLBACK_SONG;
  return { mode: "yt", song: s, label: s.name };
}
function setup(choice) {
  mode = choice.mode;
  $("musicLabel").textContent = choice.label;
  if (mode === "file") { audio.src = choice.src; audio.load(); }
  if (mode === "yt") {
    song = choice.song;
    if (ytReady) { yt.mute(); yt.loadVideoById({ videoId: song.id, startSeconds: song.start }); }
    else loadYouTube();
  }
}

// YouTube: plays hidden, starts muted (always allowed), sound turns on at unlock
let yt = null, ytReady = false, ytWant = false, ytLoaded = false;
function loadYouTube() {
  if (ytLoaded) return; ytLoaded = true;
  window.onYouTubeIframeAPIReady = () => {
    yt = new YT.Player("ytPlayer", {
      videoId: song.id, width: 200, height: 120,
      playerVars: { autoplay: 1, mute: 1, controls: 0, start: song.start, playsinline: 1, rel: 0 },
      events: {
        onReady: () => { ytReady = true; yt.mute(); yt.playVideo(); if (ytWant) ytStart(); },
        onStateChange: e => {
          // when the song ends, go back to the romantic part and play again
          if (e.data === YT.PlayerState.ENDED) { yt.seekTo(song.start, true); yt.playVideo(); }
          setPlayingUI();
        },
        onError: () => { mode = "none"; musicBtn.style.display = "none"; }
      }
    });
  };
  const s = document.createElement("script");
  s.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(s);
}
function ytStart() {
  yt.seekTo(song.start, true); yt.unMute(); yt.setVolume(85); yt.playVideo();
  setTimeout(() => { if (!isPlaying()) armRetry(); }, 1800);
}

// built-in Happy Birthday tune (no file needed)
const HB = [ // [note, beats, bass]
  ["G4", .75], ["G4", .25], ["A4", 1, "C3"], ["G4", 1], ["C5", 1], ["B4", 2, "G2"],
  ["G4", .75], ["G4", .25], ["A4", 1, "G2"], ["G4", 1], ["D5", 1], ["C5", 2, "C3"],
  ["G4", .75], ["G4", .25], ["G5", 1, "C3"], ["E5", 1], ["C5", 1], ["B4", 1, "F2"], ["A4", 2],
  ["F5", .75], ["F5", .25], ["E5", 1, "C3"], ["C5", 1], ["D5", 1, "G2"], ["C5", 3, "C3"]
];
const NOTE_IDX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const freq = n => 440 * Math.pow(2, ((+n.slice(-1) + 1) * 12 + NOTE_IDX[n[0]] - 69) / 12);
let ac = null, master = null, synthTimer = null;
function tone(f, t, len, vol, type) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0008, t + len);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + len + 0.05);
}
function playHBOnce() {
  const beat = 0.48;
  let t = ac.currentTime + 0.1;
  HB.forEach(([n, b, bass]) => {
    const dur = b * beat;
    tone(freq(n), t, dur + 0.5, 0.35, "sine");
    tone(freq(n) * 2, t, dur * 0.6 + 0.2, 0.06, "sine");
    if (bass) tone(freq(bass), t, 3 * beat, 0.18, "triangle");
    t += dur;
  });
  synthTimer = setTimeout(playHBOnce, (t - ac.currentTime + 1.2) * 1000);
}
function synthStart() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.6; master.connect(ac.destination);
  }
  ac.resume();
  if (!synthTimer) playHBOnce();
  setTimeout(() => { if (ac.state !== "running") armRetry(); setPlayingUI(); }, 800);
}
function synthStop() { clearTimeout(synthTimer); synthTimer = null; if (ac) ac.suspend(); }

function isPlaying() {
  if (mode === "file") return !audio.paused;
  if (mode === "yt") return ytReady && !yt.isMuted() && yt.getPlayerState() === YT.PlayerState.PLAYING;
  if (mode === "synth") return !!synthTimer && !!ac && ac.state === "running";
  return false;
}
function setPlayingUI() { musicBtn.classList.toggle("playing", unlocked() && isPlaying()); }

function startMusic() {
  paused = false;
  if (mode === "file") audio.play().then(setPlayingUI).catch(armRetry);
  else if (mode === "yt") { if (ytReady) ytStart(); else ytWant = true; }
  else if (mode === "synth") synthStart();
  else if (mode === null) decided.then(() => { if (mode) startMusic(); });
  setTimeout(setPlayingUI, 300);
}
function stopMusic(quiet) {
  if (!quiet) paused = true;
  if (mode === "file") audio.pause();
  else if (mode === "yt" && ytReady) yt.pauseVideo();
  synthStop();
  setPlayingUI();
}

// if the browser blocked the sound, the next tap / key anywhere starts it (no pop-up)
let retryArmed = false;
function armRetry() {
  if (retryArmed || paused) return; retryArmed = true;
  const evs = ["pointerdown", "keydown", "touchstart"];
  const go = e => {
    if (e.target.closest && e.target.closest("#musicBtn")) return;
    evs.forEach(ev => document.removeEventListener(ev, go, true));
    retryArmed = false;
    if (!paused && !isPlaying()) startMusic();
  };
  evs.forEach(ev => document.addEventListener(ev, go, true));
  // taps inside today's page (iframe) count too
  try {
    const fw = $("dayFrame").contentWindow;
    const goFrame = () => { evs.forEach(ev => fw.removeEventListener(ev, goFrame, true)); retryArmed = false; if (!paused && !isPlaying()) startMusic(); };
    evs.forEach(ev => fw.addEventListener(ev, goFrame, true));
  } catch (e) { /* page not loaded yet */ }
}
musicBtn.onclick = () => (isPlaying() ? stopMusic() : startMusic());

async function switchSongForToday() {
  const was = isPlaying();
  stopMusic(true);
  setup(await decideSong());
  if (was && !paused) startMusic();
}

/* =====================================================================
   LOCK SCREEN
   ===================================================================== */
const passInput = $("passInput");
const passWrap = passInput.parentElement;
const heart = $("heart3d");
const wrongMsgs = ["Hmm, not that one 🙈", "Try again, Khuchu Puchu 🤓", "Think of us + our special day 💍", "Almost… 💭"];
let wrongCount = 0;
const norm = s => s.toLowerCase().replace(/\s+/g, "");

$("hintBtn").onclick = () => $("hint").classList.add("show");
$("eyeBtn").onclick = () => { passInput.type = passInput.type === "password" ? "text" : "password"; };
$("passForm").addEventListener("submit", e => { e.preventDefault(); check(); });

let checking = false;
async function check() {
  if (checking) return;
  checking = true;
  $("lockMsg").textContent = "Checking… 💭";
  let ok = false, key = null;
  try {
    key = await deriveKey(norm(passInput.value));
    ok = new TextDecoder().decode(await openFile("vault/check.bin", key)) === "ok";
  } catch (e) { ok = false; }
  checking = false;
  if (ok) {
    KEY = key;
    passInput.blur();
    startMusic(); // right away, while the tap still counts
    $("lockMsg").textContent = "Welcome, my love 💖";
    heart.classList.add("unlock");
    loadFrame().catch(() => { $("notice").textContent = "Something went wrong. Please refresh the page 🙈"; });
    setTimeout(() => {
      $("lock").classList.add("open");
      document.body.classList.remove("locked");
      document.body.classList.add("unlocked");
      burst(220);
      setTimeout(setPlayingUI, 500);
      setTimeout(() => { $("lock").style.display = "none"; }, 1000); // fully gone after the fade
    }, 900);
  } else {
    $("lockMsg").textContent = wrongMsgs[wrongCount++ % wrongMsgs.length];
    if (wrongCount >= 2) $("hint").classList.add("show");
    heart.classList.remove("shake"); void heart.offsetWidth; heart.classList.add("shake");
    passWrap.classList.remove("shake"); void passWrap.offsetWidth; passWrap.classList.add("shake");
    passInput.select();
  }
}

/* ---------- confetti (on unlock) ---------- */
const cv = $("confetti");
const ctx = cv.getContext("2d");
let parts = [];
function resize() { cv.width = innerWidth; cv.height = innerHeight; }
addEventListener("resize", resize); resize();
function burst(n) {
  const cs = getComputedStyle(document.documentElement);
  const colors = ["--accent", "--accent2", "--accent3"].map(v => cs.getPropertyValue(v).trim()).concat(["#ffd17a", "#ffffff", "#a8e0ff"]);
  for (let i = 0; i < n; i++) {
    parts.push({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight / 3,
      vx: (Math.random() - .5) * 16, vy: Math.random() * -14 - 4,
      s: 5 + Math.random() * 7, r: Math.random() * 6, vr: (Math.random() - .5) * .3,
      c: colors[Math.floor(Math.random() * colors.length)], life: 0
    });
  }
}
(function loop() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  parts = parts.filter(p => p.y < cv.height + 40 && p.life < 400);
  parts.forEach(p => {
    p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life++;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
    ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
    ctx.restore();
  });
  requestAnimationFrame(loop);
})();

/* ---------- start ---------- */
applyDay();
if (!state.ended) {
  decided = decideSong().then(setup);
  passInput.focus();
}

// at 12 midnight: switch to the next day's page and song by itself (no reload, no re-lock)
let lastKey = keyOf(now());
setInterval(() => {
  const k = keyOf(now());
  if (k === lastKey) return;
  lastKey = k;
  applyDay();
  if (!state.ended) { switchSongForToday(); if (unlocked()) burst(150); }
}, 5000);
