// Raigon Pawa portfolio. Styles are only ever set through the CSSOM (el.style): the CSP blocks style attributes.
const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const palette = getComputedStyle(root);
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SECTIONS = ["projects", "about", "skills", "sponsor", "contact"];

// ---- typing tagline, today's date, uptime, Discord copy ----
const phrases = [
  "full-stack tinkerer",
  "IT student",
  "professional wheel reinventor",
  "linux person (the fun kind)",
  "SaaS builder for non-tech humans",
  "it's always DNS.",
];
const SPEED = 65;

const typed = $("typed");
let pi = 0, ci = 0, deleting = false;
function tick() {
  const full = phrases[pi % phrases.length];
  ci += deleting ? -1 : 1;
  typed.textContent = full.slice(0, ci);
  if (!deleting && ci >= full.length) { deleting = true; return setTimeout(tick, 2200); }
  if (deleting && ci <= 0) { deleting = false; pi++; return setTimeout(tick, 400); }
  setTimeout(tick, deleting ? SPEED * 0.4 : SPEED + Math.random() * 60);
}
tick();

$("today").textContent =
  new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const uptime = $("uptime");
const start = Date.now();
const fmt = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return m > 0 ? m + "m " + (s % 60) + "s" : s + "s";
};
setInterval(() => { uptime.textContent = fmt(Date.now() - start); }, 1000);

const discordLabel = $("discord-label");
let resetTimer;
$("copy-discord").addEventListener("click", () => {
  navigator.clipboard && navigator.clipboard.writeText("_raigon");
  discordLabel.textContent = "copied ✓";
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => { discordLabel.textContent = "_raigon (click to copy)"; }, 1600);
});

console.log("%c> hey, you found the console. bonus points.\n> psst: shake your mouse. something here is hungry.", `color:${palette.getPropertyValue("--cyan")};font-family:monospace;font-size:13px`);

// ---- mouse: module spotlight, hunt telemetry, shake detection ----
let mx = innerWidth / 2, my = innerHeight / 2;
addEventListener("mousemove", (e) => {
  mx = e.clientX; my = e.clientY;

  const mod = e.target.closest?.(".module");
  if (mod && !unbolted) {
    const r = mod.getBoundingClientRect();
    mod.style.setProperty("--mx", mx - r.left + "px");
    mod.style.setProperty("--my", my - r.top + "px");
  }

  if (hunting) {
    // a real PS/2 packet, as /dev/input/mouse0 would emit it: flags, dx, dy (y up)
    bytes = [8 | (e.movementX < 0) << 4 | (e.movementY > 0) << 5, e.movementX, -e.movementY]
      .map((n) => (n & 255).toString(16).padStart(2, "0")).join(" ");
  } else if (Math.abs(e.movementX) > 6 && Math.sign(e.movementX) !== shakeDir) {
    // shake = 7 fast left/right reversals inside a second
    shakeDir = Math.sign(e.movementX);
    flips = flips.filter((t) => e.timeStamp - t < 1000);
    if (flips.push(e.timeStamp) >= 7) { flips = []; startHunt(); }
  }
});

// ---- scroll: modules fade in; the nav link of the section under the top bar lights up ----
const links = document.querySelectorAll(".nav a");
const modules = [...document.querySelectorAll(".module")];
const spied = modules.filter((m) => m.id);
function spy() {
  if (unbolted) return;
  // the last section can be too short to ever reach the top, so the page bottom counts as reaching it
  const atEnd = scrollY + innerHeight >= root.scrollHeight - 2;
  const cur = atEnd ? spied.at(-1) : spied.findLast((m) => m.getBoundingClientRect().top <= 140);
  links.forEach((a) => a.classList.toggle("on", a.hash === "#" + cur?.id));
}
addEventListener("scroll", spy, { passive: true });
const reveal = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (en.isIntersecting) { en.target.classList.add("in"); reveal.unobserve(en.target); }
  }
}, { rootMargin: "0px 0px -8% 0px" });
modules.forEach((m) => { m.classList.add("reveal"); reveal.observe(m); });

// ---- hovering the name scrambles it, then resolves left to right ----
const nameEl = $("name"), realName = nameEl.textContent, GLYPHS = "!<>-_\\/[]{}=+*^?#01";
let scramble;
nameEl.addEventListener("mouseenter", () => {
  if (scramble) return;
  let i = 0;
  scramble = setInterval(() => {
    nameEl.textContent = [...realName].map((c, k) => (k < i || c === " " ? c : GLYPHS[Math.random() * GLYPHS.length | 0])).join("");
    if (i++ >= realName.length) { clearInterval(scramble); scramble = null; }
  }, 40);
});

// ---- synth + oscilloscope: when armed, project rows play a note on hover ----
const scope = $("scope"), pen = scope.getContext("2d");
const synthBtn = $("synth-toggle");
const LIVE = palette.getPropertyValue("--cyan").trim(), IDLE = palette.getPropertyValue("--border-strong").trim();
let audio, analyser, wave, synthOn = false, idlePhase = 0;

function note(freq) {
  if (!synthOn) return;
  if (!audio) {
    audio = new AudioContext();
    analyser = audio.createAnalyser();
    analyser.fftSize = 128;
    wave = new Uint8Array(analyser.fftSize);
    analyser.connect(audio.destination);
  }
  if (audio.state === "suspended") audio.resume();
  const now = audio.currentTime;
  const osc = audio.createOscillator(), filter = audio.createBiquadFilter(), gain = audio.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, now);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1100, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.45);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
  osc.connect(filter).connect(gain).connect(analyser);
  osc.start(now);
  osc.stop(now + 0.6);
}
function toggleSynth() {
  synthOn = !synthOn;
  $("synth-label").textContent = synthOn ? "SIGNAL: LIVE" : "SIGNAL: STANDBY";
  synthBtn.classList.toggle("live", synthOn);
  synthBtn.setAttribute("aria-pressed", synthOn);
  note(293.66);
  return synthOn;
}
synthBtn.addEventListener("click", toggleSynth);
document.querySelectorAll(".work-item").forEach((row) => {
  row.addEventListener("mouseenter", () => note(+row.dataset.freq));
});

(function drawScope() {
  requestAnimationFrame(drawScope);
  const w = scope.width, h = scope.height;
  pen.clearRect(0, 0, w, h);
  pen.lineWidth = 2;
  pen.strokeStyle = synthOn ? LIVE : IDLE;
  pen.beginPath();
  if (analyser && synthOn) {
    analyser.getByteTimeDomainData(wave);
    wave.forEach((v, i) => pen.lineTo(i * w / (wave.length - 1), v / 255 * h));
  } else {
    if (!calm) idlePhase += 0.04;
    for (let x = 0; x <= w; x += 4) pen.lineTo(x, h / 2 + Math.sin(x * 0.08 + idlePhase) * 3.5);
  }
  pen.stroke();
})();

// ---- x-ray blueprint mode ----
const xrayBtn = $("xray-toggle");
function toggleXray() {
  const on = document.body.classList.toggle("xray-mode");
  xrayBtn.textContent = on ? "X-RAY: ON" : "X-RAY: OFF";
  xrayBtn.classList.toggle("on", on);
  xrayBtn.setAttribute("aria-pressed", on);
  return on;
}
xrayBtn.addEventListener("click", toggleXray);

// ---- loose bolt: three clicks and every module drops out of the grid as a throwable body.
// Each loose module carries a bolt; clicking it fastens that one module back into its slot.
const bolt = $("bolt"), pill = $("reassemble");
let boltClicks = 0, unbolted = false, bodies = [], settling = 0, physicsFrame;

bolt.addEventListener("click", (e) => {
  if (unbolted) return; // bubbles to its module, which fastens itself
  e.stopPropagation(); // unbolt() arms the module's click handler mid-dispatch; this click must not reach it
  bolt.dataset.clicks = ++boltClicks;
  note(150 + boltClicks * 45);
  if (boltClicks >= 3) unbolt();
});

function unbolt() {
  if (unbolted) return;
  unbolted = true;
  note(110);
  // measure everything before anything leaves the flow
  const rects = modules.map((el) => el.getBoundingClientRect());

  bodies = modules.map((el, i) => {
    const r = rects[i];
    const b = {
      el, x: r.left, y: r.top, w: r.width, h: r.height,
      vx: (Math.random() - 0.5) * 4, vy: -2 - i * 0.5,
      angle: 0, va: (Math.random() - 0.5) * 0.35,
      dragging: false, grabX: 0, grabY: 0, lastX: 0, lastY: 0, moved: 0,
    };
    // an empty slot keeps the module's place in the grid, so it can be bolted back on its own
    b.slot = Object.assign(document.createElement("div"), { className: "slot " + [...el.classList].find((c) => c.startsWith("col-")) });
    b.slot.style.height = r.height + "px";
    el.before(b.slot);
    if (!el.contains(bolt)) {
      b.bolt = el.appendChild(Object.assign(document.createElement("button"), { type: "button", className: "bolt bolt-back", title: "Bolt this module back in" }));
      b.bolt.setAttribute("aria-label", "Bolt this module back in");
    }
    el.classList.add("unbolted", "in"); // "in": modules not yet scrolled to would otherwise fly around invisible
    Object.assign(el.style, { position: "fixed", left: "0", top: "0", width: r.width + "px", height: r.height + "px", margin: "0" });

    el.onpointerdown = (e) => {
      if (e.target.closest(".bolt")) return; // capturing the pointer would swallow the bolt's click
      b.dragging = true;
      el.setPointerCapture(e.pointerId);
      b.grabX = e.clientX - b.x; b.grabY = e.clientY - b.y;
      b.lastX = e.clientX; b.lastY = e.clientY;
      b.vx = b.vy = b.va = b.moved = 0;
    };
    el.onpointermove = (e) => {
      if (!b.dragging) return;
      b.x = e.clientX - b.grabX; b.y = e.clientY - b.grabY;
      b.vx = (e.clientX - b.lastX) * 0.85; b.vy = (e.clientY - b.lastY) * 0.85;
      b.moved += Math.abs(e.clientX - b.lastX) + Math.abs(e.clientY - b.lastY);
      b.lastX = e.clientX; b.lastY = e.clientY;
    };
    el.onpointerup = el.onpointercancel = () => { b.dragging = false; b.va = b.vx * 0.08; };
    el.onclick = (e) => {
      if (e.target.closest(".bolt")) fasten(b);
      else if (b.moved > 5) e.preventDefault(); // letting go of a throw must not open the link under the cursor
    };
    el.ondragstart = () => false; // native link dragging would cancel the pointer stream
    return b;
  });

  pill.classList.add("visible");
  stepPhysics();
}

function stepPhysics() {
  const vw = innerWidth, vh = innerHeight;
  for (const b of bodies) {
    if (!b.dragging) {
      b.vy += 0.48; b.vx *= 0.985;
      b.x += b.vx; b.y += b.vy;
      b.angle += b.va; b.va *= 0.96;
      const floor = Math.max(vh - b.h, 0); // a module taller than the viewport rests on the top edge instead of jittering
      if (b.y > floor) {
        b.y = floor; b.vy *= -0.58; b.vx *= 0.9;
        if (Math.abs(b.vy) < 1.2) b.vy = 0;
        b.angle *= 0.85;
      } else if (b.y < 0) { b.y = 0; b.vy *= -0.58; }
      if (b.x < 0) { b.x = 0; b.vx *= -0.58; }
      else if (b.x + b.w > vw) { b.x = Math.max(vw - b.w, 0); b.vx *= -0.58; }
    }
    b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0) rotate(${b.angle}deg)`;
  }
  physicsFrame = requestAnimationFrame(stepPhysics);
}

// Flies one loose module back to its slot and puts it back in the grid.
function fasten(b) {
  const { el, slot } = b;
  bodies.splice(bodies.indexOf(b), 1); // physics lets go of it
  settling++;
  el.onpointerdown = el.onpointermove = el.onpointerup = el.onpointercancel = el.onclick = el.ondragstart = null;
  const r = slot.getBoundingClientRect();
  el.classList.add("fastening");
  if (!calm) el.style.transition = "transform 0.35s cubic-bezier(0.34, 1.3, 0.64, 1)";
  el.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`;
  note(196);
  setTimeout(() => {
    el.classList.remove("unbolted", "fastening");
    el.style.cssText = "transition: none"; // the reveal transition would otherwise replay the move from the wrong origin
    slot.remove();
    b.bolt?.remove();
    void el.offsetWidth;
    el.style.cssText = "";
    if (--settling || bodies.length) return;
    // the last one is home: the chassis is whole again
    unbolted = false;
    cancelAnimationFrame(physicsFrame);
    bolt.dataset.clicks = boltClicks = 0;
    pill.classList.remove("visible");
    note(329.63);
  }, calm ? 0 : 360);
}

function reassemble() {
  [...bodies].forEach(fasten);
}
pill.addEventListener("click", reassemble);

// ---- shell drawer: ` or the prompt in the top bar opens it ----
const cli = $("cli"), cliIn = $("cli-in"), cliOut = $("cli-out"), cliTrigger = $("cli-trigger");
function toggleCli(force) {
  const open = cli.classList.toggle("open", force);
  cliTrigger.setAttribute("aria-expanded", open);
  open ? cliIn.focus() : cliIn.blur();
}
cliTrigger.addEventListener("click", () => toggleCli());
$("cli-open").addEventListener("click", () => toggleCli(true));

function run(cmd) {
  const [name, arg = ""] = cmd.split(/\s+/);
  const sec = SECTIONS.find((s) => arg.replace(/^\.?\//, "").startsWith(s));
  if ((name === "cd" || name === "cat") && sec) { $(sec).scrollIntoView(); return "-> #" + sec; }
  if (name === "cat" && arg === "/dev/input/mouse0") { toggleCli(false); startHunt(); return "it heard you. run."; }
  switch (name) {
    case "help": return "ls · cd <dir> · cat <file> · whoami · sudo · xray · synth · unbolt · reassemble · clear";
    case "ls": return SECTIONS.join("/  ") + "/  .secrets";
    case "whoami": return "guest — curious, apparently";
    case "cat": return arg === ".secrets" ? "the cat hates a shaken mouse. or: cat /dev/input/mouse0" : `cat: ${arg || "?"}: no such file`;
    case "cd": return `cd: no such directory: ${arg}`;
    case "sudo": return "guest is not in the sudoers file. this incident will be reported.";
    case "xray": return `blueprint overlay ${toggleXray() ? "on" : "off"}.`;
    case "synth": return toggleSynth() ? "synth armed. hover a project row." : "synth muted.";
    case "unbolt": return unbolted ? "already unbolted. try: reassemble" : (unbolt(), "fasteners released. throw the modules around; click a module's bolt to fasten it back.");
    case "reassemble": return unbolted ? (reassemble(), "chassis restored to the grid.") : "nothing is loose. yet.";
    default: return `command not found: ${name} — try help`;
  }
}
function print(text, className = "") {
  cliOut.appendChild(Object.assign(document.createElement("div"), { textContent: text, className }));
}
function exec(raw) {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;
  if (cmd === "clear") return cliOut.replaceChildren();
  print("$ " + cmd, "cmd-echo");
  print(run(cmd));
  while (cliOut.children.length > 40) cliOut.firstChild.remove();
  cliOut.scrollTop = cliOut.scrollHeight;
}
cliIn.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  exec(cliIn.value);
  cliIn.value = "";
});
document.querySelectorAll(".cli-chip").forEach((chip) => {
  chip.addEventListener("click", () => { exec(chip.dataset.cmd); cliIn.focus(); });
});

addEventListener("keydown", (e) => {
  if (e.key === "`") { e.preventDefault(); toggleCli(); }
  else if (e.key === "Escape") {
    if (hunting) endHunt("^C  you fled", 0);
    toggleCli(false);
  }
});

// ---- easter egg: shake the mouse (or run `cat /dev/input/mouse0`) and a cat hunts your cursor,
// which turns into a mouse. The cat speeds up, so it always wins; the score is how long you last.
let hunting = false, bytes = "08 00 00", shakeDir = 0, flips = [], cat, prey, toast, toastTimer;
function sprite(text, className) {
  return document.body.appendChild(Object.assign(document.createElement("div"), { textContent: text, className }));
}
function place(el, x, y) {
  el.style.transform = `translate(calc(${x}px - 50%), calc(${y}px - 50%))`;
}
function say(text, hideAfterMs) {
  toast ??= sprite("", "egg-toast");
  toast.textContent = text;
  toast.classList.add("on");
  clearTimeout(toastTimer);
  if (hideAfterMs) toastTimer = setTimeout(() => toast.classList.remove("on"), hideAfterMs);
}
function startHunt() {
  if (hunting) return;
  hunting = true;
  root.classList.add("hunt");
  cat ??= sprite("=^..^=", "egg-cat");
  prey ??= sprite("<:3 )~", "egg-prey");
  let t0, last, cx = -80, cy = innerHeight / 2;
  requestAnimationFrame(function frame(now) {
    if (!hunting) return;
    t0 ??= now; last ??= now;
    const t = (now - t0) / 1000, dt = Math.min(now - last, 50) / 1000;
    last = now;
    const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
    if (d < 26) return endHunt(`=^..^= caught <:3 )~ after ${t.toFixed(1)}s`, t);
    const step = Math.min((200 + t * 35) * dt, d);
    cx += dx / d * step; cy += dy / d * step;
    place(cat, cx, cy);
    place(prey, mx, my);
    say(`$ cat /dev/input/mouse0   ${bytes}   ${t.toFixed(1)}s   [esc = ^C]`);
    requestAnimationFrame(frame);
  });
}
function endHunt(msg, t) {
  hunting = false;
  root.classList.remove("hunt");
  let best = t;
  try { best = Math.max(t, +localStorage.huntBest || 0); localStorage.huntBest = best; } catch {} // storage can be blocked
  say(`${msg} · best ${best.toFixed(1)}s · the cat always wins`, 6000);
}

// ---- quirk: leaving the tab suspends the page like Ctrl+Z suspends a shell job; coming back is `fg` ----
const realTitle = document.title;
let leftAt;
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    leftAt = Date.now();
    document.title = "[1]+ Stopped ./portfolio";
    if (hunting) endHunt("^Z  you hid in another tab", 0); // the timer would keep running while the cat is frozen
    return;
  }
  document.title = realTitle;
  if (leftAt) say(`$ fg  ·  ./portfolio resumed after ${fmt(Date.now() - leftAt)} away`, 5000);
});
