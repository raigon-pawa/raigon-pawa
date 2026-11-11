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
setInterval(() => {
  const s = Math.floor((Date.now() - start) / 1000), m = Math.floor(s / 60);
  uptime.textContent = m > 0 ? m + "m " + (s % 60) + "s" : s + "s";
}, 1000);

const label = document.getElementById("discord-label");
let resetTimer;
document.getElementById("copy-discord").addEventListener("click", () => {
  navigator.clipboard && navigator.clipboard.writeText("_raigon");
  label.textContent = "copied ✓";
  clearTimeout(resetTimer);
  resetTimer = setTimeout(() => { label.textContent = "_raigon (click to copy)"; }, 1600);
});

console.log("%c> hey, you found the console. bonus points.", "color:#4FD8E8;font-family:monospace;font-size:13px");
