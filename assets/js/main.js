/* =====================================================
   amznon.me — Claude-Code-inspired JS
   ===================================================== */

// ── Panel navigation ─────────────────────────────────
const navItems   = document.querySelectorAll('.nav-item');
const panels     = document.querySelectorAll('.panel');
const panelTitle = document.getElementById('panel-title');

function switchPanel(id) {
  panels.forEach(p   => p.classList.toggle('active', p.id === `panel-${id}`));
  navItems.forEach(n => n.classList.toggle('active', n.dataset.panel === id));
  if (panelTitle) {
    panelTitle.textContent = id.charAt(0).toUpperCase() + id.slice(1);
  }
  // trigger counters when about panel shown
  if (id === 'about') startCounters();
}

navItems.forEach(btn => {
  btn.addEventListener('click', () => {
    switchPanel(btn.dataset.panel);
    closeSidebar();
  });
});

// prompt-bar shortcut buttons
document.querySelectorAll('.prompt-btn').forEach(btn => {
  btn.addEventListener('click', () => switchPanel(btn.dataset.panel));
});

// ── Sidebar mobile toggle ─────────────────────────────
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebarToggle  = document.getElementById('sidebar-toggle');

function openSidebar()  {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

if (sidebarToggle)  sidebarToggle.addEventListener('click', openSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

// ── Typing animation (home panel) ─────────────────────
const typedEl = document.getElementById('typed-text');

const messages = [
  "Here's a quick summary of what I can do for you:",
  "I build full-stack web apps, APIs, and dev tools.",
  "Check out the panels on the left to learn more ↙"
];

let msgIdx = 0;

function typeMessage(text, onDone) {
  typedEl.innerHTML = '';
  let i = 0;
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.textContent = '▋';
  cursor.style.cssText = 'color:var(--orange);animation:blink-cursor .8s step-end infinite';

  function tick() {
    if (i < text.length) {
      typedEl.textContent = text.slice(0, ++i);
      typedEl.appendChild(cursor);
      setTimeout(tick, 28 + Math.random() * 20);
    } else {
      setTimeout(() => {
        cursor.remove();
        if (onDone) onDone();
      }, 600);
    }
  }
  tick();
}

// inject cursor blink keyframe once
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes blink-cursor{0%,100%{opacity:1}50%{opacity:0}}';
document.head.appendChild(styleEl);

// start after a short delay
setTimeout(() => {
  function nextMessage() {
    if (msgIdx < messages.length) {
      typeMessage(messages[msgIdx++], () => setTimeout(nextMessage, 400));
    }
  }
  nextMessage();
}, 900);

// ── Animated counters ─────────────────────────────────
let countersStarted = false;

function startCounters() {
  if (countersStarted) return;
  countersStarted = true;

  document.querySelectorAll('[data-count]').forEach(el => {
    const target   = parseInt(el.dataset.count, 10);
    const duration = 1200;
    const start    = performance.now();

    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(ease * target);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}
