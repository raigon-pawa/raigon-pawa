// Typing tagline, uptime counter, today's date and the Discord copy button.
const phrases = [
  "full-stack tinkerer",
  "IT student",
  "professional wheel reinventor",
  "linux person (the fun kind)",
  "SaaS builder for non-tech humans",
  "it's always DNS.",
];
const SPEED = 65;

const typed = document.getElementById("typed");
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

document.getElementById("today").textContent =
  new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const uptime = document.getElementById("uptime");
const start = Date.now();
const fmt = (ms) => {
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60);
  return m > 0 ? m + "m " + (s % 60) + "s" : s + "s";
};
setInterval(() => { uptime.textContent = fmt(Date.now() - start); }, 1000);

const label = document.getElementById("discord-label");
let resetTimer;
document.getElementById("copy-discord").addEventListener("click", () => {
  navigator.clipboard && navigator.clipboard.writeText("_raigon");
  label.textContent = "copied ✓";
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => { label.textContent = "_raigon (click to copy)"; }, 1600);
});

console.log("%c> hey, you found the console. bonus points.\n> psst: shake your mouse. something here is hungry.", "color:#4FD8E8;font-family:monospace;font-size:13px");

// ---- interactivity ----
// Styles are set through the CSSOM (el.style) only: the CSP blocks style attributes.
const root = document.documentElement;
const shell = document.querySelector(".s0");
const glow = document.querySelector(".s1");
const CARDS = ".h32, .h65, .h73, .h78, .h83";
const SECTIONS = ["projects", "about", "skills", "sponsor", "contact"];
let mx = innerWidth / 2, my = innerHeight / 2;

addEventListener("mousemove", (e) => {
  mx = e.clientX; my = e.clientY;
  glow.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;

  const card = e.target.closest?.(CARDS);
  if (card) {
    const r = card.getBoundingClientRect(), x = (mx - r.left) / r.width, y = (my - r.top) / r.height;
    card.style.setProperty("--mx", x * 100 + "%");
    card.style.setProperty("--my", y * 100 + "%");
    card.style.setProperty("--ry", (x - 0.5) * 5 + "deg");
    card.style.setProperty("--rx", (0.5 - y) * 5 + "deg");
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

// Sections fade in on scroll; the nav link of the section crossing mid-screen lights up.
const links = document.querySelectorAll(".s6 a");
const spy = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.hash === "#" + en.target.id));
  }
}, { rootMargin: "-45% 0px -55% 0px" });
const reveal = new IntersectionObserver((entries) => {
  for (const en of entries) {
    if (en.isIntersecting) { en.target.classList.add("in"); reveal.unobserve(en.target); }
  }
}, { rootMargin: "0px 0px -12% 0px" });
document.querySelectorAll("section").forEach((s) => {
  spy.observe(s);
  if (s.id !== "top") { s.classList.add("reveal"); reveal.observe(s); }
});

// Hovering the name scrambles it, then resolves left to right.
const nameEl = document.querySelector("h1"), realName = nameEl.textContent, GLYPHS = "!<>-_\\/[]{}=+*^?#01";
let scramble;
nameEl.addEventListener("mouseenter", () => {
  if (scramble) return; // the width jitters mid-scramble and can re-fire mouseenter
  let i = 0;
  scramble = setInterval(() => {
    nameEl.textContent = [...realName].map((c, k) => (k < i || c === " " ? c : GLYPHS[Math.random() * GLYPHS.length | 0])).join("");
    if (i++ >= realName.length) { clearInterval(scramble); scramble = null; }
  }, 40);
});

// Mini terminal in the About card.
const termOut = document.getElementById("term-out");
function run(cmd) {
  const [name, arg = ""] = cmd.split(/\s+/);
  const sec = SECTIONS.find((s) => arg.replace(/^\.?\//, "").startsWith(s));
  if ((name === "cd" || name === "cat") && sec) { document.getElementById(sec).scrollIntoView(); return "-> #" + sec; }
  if (name === "cat" && arg === "/dev/input/mouse0") { startHunt(); return "it heard you. run."; }
  switch (name) {
    case "help": return "ls · cd <dir> · cat <file> · whoami · sudo · clear";
    case "ls": return SECTIONS.join("/  ") + "/  .secrets";
    case "whoami": return "guest — curious, apparently";
    case "cat": return arg === ".secrets" ? "the cat hates a shaken mouse. or: cat /dev/input/mouse0" : `cat: ${arg || "?"}: no such file`;
    case "cd": return `cd: no such directory: ${arg}`;
    case "sudo": return "guest is not in the sudoers file. this incident will be reported.";
    default: return `command not found: ${name} — try help`;
  }
}
function print(text, className = "") {
  termOut.appendChild(Object.assign(document.createElement("span"), { textContent: text, className }));
}
document.getElementById("term-in").addEventListener("keydown", (e) => {
  const cmd = e.target.value.trim();
  if (e.key !== "Enter" || !cmd) return;
  e.target.value = "";
  if (cmd === "clear") return termOut.replaceChildren();
  print("$ " + cmd, "s17");
  print(run(cmd));
  while (termOut.children.length > 8) termOut.firstChild.remove();
});

// Easter egg: shake the mouse (or run `cat /dev/input/mouse0`) and a cat hunts your cursor,
// which turns into a mouse. The cat speeds up, so it always wins; the score is how long you last.
let hunting = false, bytes = "08 00 00", shakeDir = 0, flips = [], cat, prey, toast, toastTimer;
function sprite(text, className) {
  return shell.appendChild(Object.assign(document.createElement("div"), { textContent: text, className }));
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
addEventListener("keydown", (e) => { if (e.key === "Escape" && hunting) endHunt("^C  you fled", 0); });

// Quirk: leaving the tab suspends the page like Ctrl+Z suspends a shell job; coming back is `fg`.
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
