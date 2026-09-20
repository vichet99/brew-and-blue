/* ============================================================
   ui.js — shared UI kit
   Icons, product illustrations, header/footer, toasts, helpers.
   Included on every page BEFORE the page specific script.
   ============================================================ */

/* ---------- tiny helpers ---------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const money = (n) => '$' + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const fmtDate = (iso, withTime) => {
  const d = new Date(iso);
  const opts = { year: 'numeric', month: 'short', day: 'numeric' };
  if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
  return d.toLocaleDateString('en-US', opts);
};

const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + ' min ago';
  if (s < 86400) return Math.floor(s / 3600) + ' h ago';
  if (s < 604800) return Math.floor(s / 86400) + ' d ago';
  return fmtDate(iso);
};

const initials = (name) => (name || '?').trim().split(/\s+/).slice(0, 2)
  .map(w => w[0]).join('').toUpperCase();

const param = (k) => new URLSearchParams(location.search).get(k);

/* ---------- icon set ---------- */
const ICONS = {
  cart:'<circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h3l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 7H6"/>',
  user:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  minus:'<path d="M5 12h14"/>',
  star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
  check:'<path d="M20 6 9 17l-5-5"/>',
  checkCircle:'<circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  truck:'<path d="M1 3h13v13H1z"/><path d="M14 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2"/><circle cx="17.5" cy="18.5" r="2"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>',
  chevronDown:'<path d="m6 9 6 6 6-6"/>',
  chevronRight:'<path d="m9 18 6-6-6-6"/>',
  arrowRight:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowUp:'<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowDown:'<path d="M12 5v14M19 12l-7 7-7-7"/>',
  phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
  pin:'<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff:'<path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.6 3.7M6.6 6.6A18.5 18.5 0 0 0 1 12s4 8 11 8a10.9 10.9 0 0 0 5.4-1.4"/><path d="M1 1l22 22"/>',
  box:'<path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  dollar:'<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
  users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  chart:'<path d="M3 3v18h18"/><path d="m7 15 4-5 3 3 5-7"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
  home:'<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
  info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  message:'<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l2-4.9A8.4 8.4 0 0 1 4.1 11a8.4 8.4 0 0 1 8.4-8.4h.5A8.4 8.4 0 0 1 21 11z"/>',
  bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  gift:'<rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/>',
  coffee:'<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><path d="M6 2v3M10 2v3M14 2v3"/>',
  leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8a7 7 0 0 1-7 7z"/><path d="M2 21c0-3 1.9-5.8 4.5-7.5"/>',
  fire:'<path d="M12 2s4 4.5 4 8a4 4 0 0 1-8 0c0-1 .3-2 .8-2.8C7 9 5 11.4 5 14.5A7 7 0 0 0 19 15c0-5-7-13-7-13z"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  sparkle:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
  filter:'<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>',
  card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
  wallet:'<path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  cash:'<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>',
  facebook:'<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  instagram:'<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
  twitter:'<path d="M23 3a10.9 10.9 0 0 1-3.1 1.5 4.5 4.5 0 0 0-7.9 3v1A10.7 10.7 0 0 1 3 4.8s-4 9 5 13a11.6 11.6 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.1-.8A7.7 7.7 0 0 0 23 3z"/>',
  menu:'<path d="M3 12h18M3 6h18M3 18h18"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
  download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
  ticket:'<path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6z"/><path d="M13 5v14"/>'
};

/** Inline SVG icon. `name` from ICONS, `cls` extra classes. */
function icon(name, cls) {
  const body = ICONS[name] || '';
  const fillIcons = ['star', 'heart', 'facebook', 'instagram', 'twitter', 'fire'];
  const filled = fillIcons.includes(name);
  return '<svg viewBox="0 0 24 24" class="' + (cls || '') + '" fill="' + (filled ? 'currentColor' : 'none') +
    '" stroke="' + (filled ? 'none' : 'currentColor') +
    '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
}

/* ============================================================
   Product illustrations — drawn in SVG so there are no image
   downloads and every product scales crisply at any size.
   ============================================================ */
function productArt(type, tint) {
  const c = tint || '#6B4226';
  const light = c + '33';
  const head = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img">';

  if (type === 'iced') {
    return head +
      '<path d="M36 34h48l-6 62a8 8 0 0 1-8 7H50a8 8 0 0 1-8-7z" fill="#fff" fill-opacity=".85" stroke="' + c + '" stroke-width="3"/>' +
      '<path d="M40 62h40l-4 34a8 8 0 0 1-8 7H52a8 8 0 0 1-8-7z" fill="' + c + '" fill-opacity=".85"/>' +
      '<rect x="46" y="44" width="13" height="13" rx="3" fill="' + c + '" fill-opacity=".3"/>' +
      '<rect x="62" y="48" width="12" height="12" rx="3" fill="' + c + '" fill-opacity=".22"/>' +
      '<rect x="54" y="60" width="12" height="12" rx="3" fill="#fff" fill-opacity=".45"/>' +
      '<path d="M72 30 84 8" stroke="#F5B301" stroke-width="7" stroke-linecap="round"/>' +
      '<ellipse cx="60" cy="34" rx="24" ry="6" fill="#fff" stroke="' + c + '" stroke-width="3"/>' +
      '</svg>';
  }

  if (type === 'tea') {
    return head +
      '<path d="M28 44h58v22a29 29 0 0 1-58 0z" fill="#fff" stroke="' + c + '" stroke-width="3"/>' +
      '<path d="M32 50h50v16a25 25 0 0 1-50 0z" fill="' + c + '" fill-opacity=".8"/>' +
      '<path d="M86 50h6a11 11 0 0 1 0 22h-2" fill="none" stroke="' + c + '" stroke-width="3"/>' +
      '<ellipse cx="57" cy="98" rx="36" ry="7" fill="' + c + '" fill-opacity=".18"/>' +
      '<path d="M62 22c-10 4-13 12-8 19 7-2 11-9 8-19z" fill="' + c + '" fill-opacity=".55"/>' +
      '<path d="M54 41c-2-6 0-12 8-19" stroke="' + c + '" stroke-width="2" fill="none"/>' +
      '<path d="M44 30c0-5 2-8 5-11M70 30c0-5-2-8-5-11" stroke="' + c + '" stroke-width="3" stroke-linecap="round" opacity=".45" fill="none"/>' +
      '</svg>';
  }

  if (type === 'pastry') {
    return head +
      '<path d="M20 74c6-26 24-42 40-42s34 16 40 42c-10 6-24 9-40 9s-30-3-40-9z" fill="' + c + '" fill-opacity=".85"/>' +
      '<path d="M32 70c4-18 14-29 28-29s24 11 28 29" fill="none" stroke="#fff" stroke-width="3" stroke-opacity=".5"/>' +
      '<path d="M20 74c-5 3-8 7-9 12 12 6 30 9 49 9s37-3 49-9c-1-5-4-9-9-12" fill="' + c + '" fill-opacity=".55"/>' +
      '<circle cx="48" cy="60" r="4" fill="#fff" fill-opacity=".55"/>' +
      '<circle cx="66" cy="54" r="3" fill="#fff" fill-opacity=".45"/>' +
      '<circle cx="76" cy="66" r="3.5" fill="#fff" fill-opacity=".4"/>' +
      '</svg>';
  }

  if (type === 'beans') {
    return head +
      '<path d="M32 36h56l-5 62a8 8 0 0 1-8 7H45a8 8 0 0 1-8-7z" fill="' + c + '" fill-opacity=".9"/>' +
      '<path d="M32 36l6-14h44l6 14z" fill="' + c + '"/>' +
      '<rect x="44" y="52" width="32" height="26" rx="5" fill="#fff" fill-opacity=".92"/>' +
      '<ellipse cx="54" cy="62" rx="6" ry="8" transform="rotate(-25 54 62)" fill="' + c + '"/>' +
      '<path d="M54 55c-2 4-2 10 0 14" stroke="#fff" stroke-width="1.6" fill="none"/>' +
      '<ellipse cx="66" cy="68" rx="6" ry="8" transform="rotate(20 66 68)" fill="' + c + '"/>' +
      '<path d="M66 61c-2 4-2 10 0 14" stroke="#fff" stroke-width="1.6" fill="none"/>' +
      '<path d="M38 22h44" stroke="' + c + '" stroke-width="6" stroke-linecap="round"/>' +
      '</svg>';
  }

  /* default: hot cup */
  return head +
    '<ellipse cx="60" cy="100" rx="38" ry="8" fill="' + c + '" fill-opacity=".18"/>' +
    '<path d="M26 44h60v26a30 30 0 0 1-60 0z" fill="#fff" stroke="' + c + '" stroke-width="3"/>' +
    '<path d="M31 52h50v18a25 25 0 0 1-50 0z" fill="' + c + '" fill-opacity=".85"/>' +
    '<ellipse cx="56" cy="52" rx="25" ry="5" fill="' + light + '"/>' +
    '<path d="M86 52h6a12 12 0 0 1 0 24h-3" fill="none" stroke="' + c + '" stroke-width="3"/>' +
    '<path d="M18 96h80" stroke="' + c + '" stroke-width="4" stroke-linecap="round" opacity=".55"/>' +
    '<path d="M46 32c-4-5 4-9 0-14M60 30c-4-6 4-10 0-15M74 32c-4-5 4-9 0-14" stroke="' + c + '" stroke-width="3" stroke-linecap="round" fill="none" opacity=".5"/>' +
    '</svg>';
}

/** 5-star row. */
function starRow(rating, count) {
  let html = '<div class="stars" aria-label="Rated ' + rating + ' out of 5">';
  for (let i = 1; i <= 5; i++) {
    html += '<span style="opacity:' + (i <= Math.round(rating) ? 1 : .28) + '">' + icon('star') + '</span>';
  }
  if (count !== undefined) html += '<span>' + rating + ' (' + count + ')</span>';
  return html + '</div>';
}

/* ============================================================
   Toasts
   ============================================================ */
function toast(msg, kind) {
  let box = $('#toaster');
  if (!box) { box = document.createElement('div'); box.id = 'toaster'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast ' + (kind || '');
  el.innerHTML = icon(kind === 'err' ? 'alert' : kind === 'ok' ? 'checkCircle' : 'info') + '<span>' + esc(msg) + '</span>';
  box.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s, transform .3s';
    el.style.opacity = '0'; el.style.transform = 'translateX(20px)';
    setTimeout(() => el.remove(), 300);
  }, 2800);
}

/* ============================================================
   Header + footer (injected so 11 pages share one source)
   ============================================================ */
const NAV_ITEMS = [
  { href: 'index.html',    label: 'Home',      page: 'home' },
  { href: 'menu.html',     label: 'Menu',      page: 'menu' },
  { href: 'orders.html',   label: 'My Orders', page: 'orders' },
  { href: 'feedback.html', label: 'Feedback',  page: 'feedback' }
];

function renderHeader() {
  const mount = $('#site-header');
  if (!mount) return;
  const page = document.body.dataset.page || '';
  const user = Auth.current();

  const links = NAV_ITEMS.map(n =>
    '<a href="' + n.href + '" class="' + (page === n.page ? 'active' : '') + '">' + n.label + '</a>'
  ).join('') + (user && user.role === 'admin'
    ? '<a href="admin.html" class="' + (page === 'admin' ? 'active' : '') + '">Dashboard</a>' : '');

  const account = user
    ? '<div class="acct" id="acct">' +
        '<button class="avatar" id="acctBtn" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">' + esc(initials(user.name)) + '</button>' +
        '<div class="acct-menu" role="menu">' +
          '<div class="head"><strong>' + esc(user.name) + '</strong><small>' + esc(user.email) + '</small></div>' +
          '<a href="profile.html">' + icon('user') + 'My Profile</a>' +
          '<a href="orders.html">' + icon('box') + 'My Orders</a>' +
          '<a href="cart.html">' + icon('cart') + 'My Cart</a>' +
          (user.role === 'admin' ? '<a href="admin.html">' + icon('grid') + 'Admin Dashboard</a>' : '') +
          '<button id="signoutBtn">' + icon('logout') + 'Sign out</button>' +
        '</div></div>'
    : '<a href="signin.html" class="btn btn-ghost btn-sm">Sign in</a>' +
      '<a href="signup.html" class="btn btn-primary btn-sm">Sign up</a>';

  mount.className = 'site-header';
  mount.innerHTML =
    '<div class="wrap nav">' +
      '<a href="index.html" class="brand"><span class="brand-mark">' + icon('coffee') + '</span>' +
        '<span>Brew <i>&amp;</i> Blue</span></a>' +
      '<nav class="nav-links" id="navLinks">' + links +
        '<div class="nav-mobile-only" style="display:none"></div></nav>' +
      '<div class="nav-actions">' +
        '<a href="cart.html" class="icon-btn" aria-label="Shopping cart">' + icon('cart') +
          '<span class="cart-count" id="cartCount">0</span></a>' +
        account +
        '<button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '</div>' +
    '</div>';

  /* mobile menu */
  const burger = $('#burger'), nav = $('#navLinks');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });

  /* account dropdown */
  const acct = $('#acct');
  if (acct) {
    $('#acctBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      const open = acct.classList.toggle('open');
      $('#acctBtn').setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', () => acct.classList.remove('open'));
    $('#signoutBtn').addEventListener('click', () => {
      Auth.signout();
      toast('Signed out. See you soon!', 'ok');
      setTimeout(() => location.href = 'index.html', 600);
    });
  }

  /* sticky shadow */
  const onScroll = () => mount.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  updateCartBadge();
}

function updateCartBadge() {
  const el = $('#cartCount');
  if (!el) return;
  const n = Cart.count();
  el.textContent = n > 99 ? '99+' : n;
  el.style.display = n ? 'grid' : 'none';
}

function renderFooter() {
  const mount = $('#site-footer');
  if (!mount) return;
  mount.className = 'site-footer';
  mount.innerHTML =
    '<div class="wrap">' +
      '<div class="footer-grid">' +
        '<div class="footer-brand">' +
          '<a href="index.html" class="brand"><span class="brand-mark">' + icon('coffee') + '</span>' +
            '<span>Brew <i>&amp;</i> Blue</span></a>' +
          '<p>Small-batch coffee roasted in the city, poured by people who actually drink it. Order ahead, skip the queue.</p>' +
          '<div class="socials">' +
            '<a href="#" aria-label="Facebook">' + icon('facebook') + '</a>' +
            '<a href="#" aria-label="Instagram">' + icon('instagram') + '</a>' +
            '<a href="#" aria-label="Twitter">' + icon('twitter') + '</a>' +
          '</div>' +
        '</div>' +
        '<div><h4>Explore</h4><ul>' +
          '<li><a href="index.html">Home</a></li>' +
          '<li><a href="menu.html">Full menu</a></li>' +
          '<li><a href="menu.html?cat=beans">Beans &amp; gear</a></li>' +
          '<li><a href="index.html#about">Our story</a></li>' +
          '<li><a href="feedback.html#faq">FAQ</a></li>' +
        '</ul></div>' +
        '<div><h4>Account</h4><ul>' +
          '<li><a href="signin.html">Sign in</a></li>' +
          '<li><a href="signup.html">Create account</a></li>' +
          '<li><a href="orders.html">My orders</a></li>' +
          '<li><a href="profile.html">My profile</a></li>' +
          '<li><a href="cart.html">Shopping cart</a></li>' +
        '</ul></div>' +
        '<div><h4>Visit us</h4><ul>' +
          '<li>' + SHOP.address + '</li>' +
          '<li><a href="tel:' + SHOP.phone.replace(/\s/g, '') + '">' + SHOP.phone + '</a></li>' +
          '<li><a href="mailto:' + SHOP.email + '">' + SHOP.email + '</a></li>' +
          '<li>Mon–Fri 06:30–21:00</li>' +
        '</ul>' +
        '<form class="newsletter" id="newsForm"><input type="email" placeholder="Email for offers" required aria-label="Email address">' +
          '<button class="btn btn-accent btn-sm" type="submit">Join</button></form>' +
        '</div>' +
      '</div>' +
      '<div class="foot-note"><span>© ' + new Date().getFullYear() + ' Brew &amp; Blue. Student project — demo data only.</span>' +
        '<span>Built with HTML, CSS &amp; vanilla JavaScript</span></div>' +
    '</div>';

  const nf = $('#newsForm');
  if (nf) nf.addEventListener('submit', (e) => {
    e.preventDefault();
    toast('Thanks! You are on the list.', 'ok');
    nf.reset();
  });
}

/* ============================================================
   Reusable renderers
   ============================================================ */
function productCard(p) {
  const fav = Favs.has(p.id);
  const soldOut = p.stock <= 0;
  return '' +
  '<article class="p-card">' +
    '<div class="p-thumb" style="background:' + p.bg + '">' +
      '<a href="product.html?id=' + p.id + '" aria-label="' + esc(p.name) + '">' + productArt(p.art, p.tint) + '</a>' +
      '<div class="p-flags">' +
        (p.badge ? '<span class="badge ' + (p.badge === 'New' ? 'badge-new' : p.badge === 'Value' ? 'badge-info' : 'badge-hot') + '">' + esc(p.badge) + '</span>' : '') +
        (p.old ? '<span class="badge badge-danger">-' + Math.round((1 - p.price / p.old) * 100) + '%</span>' : '') +
      '</div>' +
      '<button class="p-fav ' + (fav ? 'on' : '') + '" data-fav="' + p.id + '" aria-label="Save to favourites">' + icon('heart') + '</button>' +
      (soldOut ? '<div class="sold-out">Sold out</div>' : '') +
    '</div>' +
    '<div class="p-body">' +
      '<span class="p-cat">' + esc((CATEGORIES.find(c => c.id === p.cat) || {}).name || p.cat) + '</span>' +
      '<h3 class="p-name"><a href="product.html?id=' + p.id + '">' + esc(p.name) + '</a></h3>' +
      starRow(p.rating, p.reviews) +
      '<p class="p-desc">' + esc(p.desc) + '</p>' +
      '<div class="p-meta">' +
        '<span class="p-price">' + money(p.price) + (p.old ? '<s>' + money(p.old) + '</s>' : '') + '</span>' +
        (soldOut ? '<span class="badge badge-danger">Unavailable</span>'
                 : '<button class="p-add" data-add="' + p.id + '" aria-label="Add ' + esc(p.name) + ' to cart">' + icon('plus') + '</button>') +
      '</div>' +
    '</div>' +
  '</article>';
}

/** Wire the add-to-cart / favourite buttons inside a container. */
function bindCardActions(root) {
  $$('[data-add]', root).forEach(btn => btn.addEventListener('click', () => {
    const p = Products.find(btn.dataset.add);
    if (!p) return;
    Cart.add(p, { size: 'M', addons: [], qty: 1 });
    updateCartBadge();
    toast(p.name + ' added to cart', 'ok');
  }));
  $$('[data-fav]', root).forEach(btn => btn.addEventListener('click', () => {
    const on = Favs.toggle(btn.dataset.fav);
    btn.classList.toggle('on', on);
    toast(on ? 'Saved to favourites' : 'Removed from favourites');
  }));
}

function emptyState(iconName, title, text, ctaHref, ctaLabel) {
  return '<div class="empty">' + icon(iconName) + '<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' +
    (ctaHref ? '<a href="' + ctaHref + '" class="btn btn-primary" style="margin-top:1.2rem">' + esc(ctaLabel) + '</a>' : '') +
    '</div>';
}

/* ---------- boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  $$('[data-icon]').forEach(el => el.innerHTML = icon(el.dataset.icon));
});
document.addEventListener('cart:change', updateCartBadge);
window.addEventListener('storage', updateCartBadge);
