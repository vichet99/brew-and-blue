/* ============================================================
   store.js — data persistence layer (localStorage)
   All reads/writes to browser storage go through here so that
   pages never touch localStorage keys directly.
   ============================================================ */

const KEY = {
  users:    'bb_users',
  session:  'bb_session',
  cart:     'bb_cart',
  orders:   'bb_orders',
  feedback: 'bb_feedback',
  products: 'bb_products',
  favs:     'bb_favs',
  seeded:   'bb_seeded_v1'
};

/* ---------- low level ---------- */
const DB = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      console.warn('storage read failed for', key, e);
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('storage write failed for', key, e);
      return false;
    }
  },
  del(key) { try { localStorage.removeItem(key); } catch (e) {} }
};

/* Demo-grade password hashing ONLY.
   A real shop must hash on the server with bcrypt/argon2 — this exists so
   plain-text passwords are not sitting in localStorage during the demo. */
function hashPw(pw) {
  let h = 5381;
  const salted = 'bb$' + pw + '$salt';
  for (let i = 0; i < salted.length; i++) h = ((h << 5) + h + salted.charCodeAt(i)) >>> 0;
  return 'h' + h.toString(16);
}

const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ============================================================
   PRODUCTS  (seed catalogue + any admin edits layered on top)
   ============================================================ */
const Products = {
  all() {
    const custom = DB.get(KEY.products, null);
    return custom && custom.length ? custom : PRODUCTS.slice();
  },
  find(id) { return this.all().find(p => p.id === id) || null; },
  byCat(cat) { return cat === 'all' ? this.all() : this.all().filter(p => p.cat === cat); },
  save(product) {
    const list = this.all();
    const i = list.findIndex(p => p.id === product.id);
    if (i > -1) list[i] = { ...list[i], ...product };
    else list.unshift({ ...product, id: product.id || uid('p') });
    DB.set(KEY.products, list);
    return product;
  },
  remove(id) {
    DB.set(KEY.products, this.all().filter(p => p.id !== id));
  },
  countByCat() {
    const counts = { all: this.all().length };
    CATEGORIES.forEach(c => counts[c.id] = this.all().filter(p => p.cat === c.id).length);
    return counts;
  }
};

/* ============================================================
   AUTH  (users + session)
   ============================================================ */
const Auth = {
  users() { return DB.get(KEY.users, []); },

  current() {
    const id = DB.get(KEY.session, null);
    if (!id) return null;
    return this.users().find(u => u.id === id) || null;
  },

  isAdmin() { const u = this.current(); return !!u && u.role === 'admin'; },

  signup({ name, email, phone, password }) {
    email = (email || '').trim().toLowerCase();
    if (this.users().some(u => u.email === email))
      return { ok: false, error: 'An account with this email already exists.' };

    const user = {
      id: uid('u'), name: name.trim(), email, phone: (phone || '').trim(),
      pw: hashPw(password), role: 'customer',
      address: '', city: '', notes: '', avatar: '',
      points: 0, joined: new Date().toISOString(), newsletter: true
    };
    const list = this.users();
    list.push(user);
    DB.set(KEY.users, list);
    DB.set(KEY.session, user.id);
    return { ok: true, user };
  },

  signin(email, password) {
    email = (email || '').trim().toLowerCase();
    const user = this.users().find(u => u.email === email);
    if (!user) return { ok: false, error: 'No account found with that email.' };
    if (user.pw !== hashPw(password)) return { ok: false, error: 'Incorrect password. Please try again.' };
    DB.set(KEY.session, user.id);
    return { ok: true, user };
  },

  signout() { DB.del(KEY.session); },

  update(patch) {
    const user = this.current();
    if (!user) return { ok: false, error: 'Not signed in.' };
    const list = this.users();
    const i = list.findIndex(u => u.id === user.id);
    if (patch.email) {
      const email = patch.email.trim().toLowerCase();
      if (list.some(u => u.email === email && u.id !== user.id))
        return { ok: false, error: 'That email is already used by another account.' };
      patch.email = email;
    }
    list[i] = { ...list[i], ...patch };
    DB.set(KEY.users, list);
    return { ok: true, user: list[i] };
  },

  changePassword(currentPw, newPw) {
    const user = this.current();
    if (!user) return { ok: false, error: 'Not signed in.' };
    if (user.pw !== hashPw(currentPw)) return { ok: false, error: 'Your current password is not correct.' };
    return this.update({ pw: hashPw(newPw) });
  },

  addPoints(n) {
    const user = this.current();
    if (user) this.update({ points: (user.points || 0) + Math.floor(n) });
  },

  /** Guard a page: bounce to sign-in (remembering where we came from). */
  require(adminOnly) {
    const user = this.current();
    if (!user) {
      location.href = 'signin.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
      return null;
    }
    if (adminOnly && user.role !== 'admin') { location.href = 'index.html'; return null; }
    return user;
  }
};

/* ============================================================
   CART
   ============================================================ */
const Cart = {
  list() { return DB.get(KEY.cart, []); },
  save(items) { DB.set(KEY.cart, items); document.dispatchEvent(new CustomEvent('cart:change')); },
  count() { return this.list().reduce((n, i) => n + i.qty, 0); },

  /** unique line key = product + size + sorted add-ons */
  lineKey(productId, size, addons) {
    return productId + '|' + size + '|' + (addons || []).slice().sort().join(',');
  },

  add(product, { size = 'M', addons = [], qty = 1 } = {}) {
    const items = this.list();
    const key = this.lineKey(product.id, size, addons);
    const line = items.find(i => i.key === key);
    if (line) {
      line.qty = Math.min(99, line.qty + qty);
    } else {
      items.push({
        key, id: product.id, name: product.name, base: product.price,
        art: product.art, tint: product.tint, bg: product.bg,
        size, addons: addons.slice(), qty: Math.min(99, qty), cat: product.cat
      });
    }
    this.save(items);
    return this.count();
  },

  setQty(key, qty) {
    const items = this.list();
    const line = items.find(i => i.key === key);
    if (!line) return;
    line.qty = Math.max(1, Math.min(99, qty));
    this.save(items);
  },

  remove(key) { this.save(this.list().filter(i => i.key !== key)); },
  clear() { this.save([]); },

  /** Drinks are the only things sold in sizes — a croissant has no "large". */
  isDrink(cat) { return ['hot', 'cold', 'tea'].includes(cat); },

  /** unit price = base + size supplement (drinks only) + add-ons */
  unitPrice(line) {
    const size = SIZES.find(s => s.id === line.size);
    const sizeAdd = (this.isDrink(line.cat) && size) ? size.add : 0;
    const addAdd = (line.addons || []).reduce((sum, id) => {
      const a = ADDONS.find(x => x.id === id);
      return sum + (a ? a.price : 0);
    }, 0);
    return line.base + sizeAdd + addAdd;
  },

  lineTotal(line) { return this.unitPrice(line) * line.qty; },

  /** Full money breakdown. promo = code string, method = delivery|pickup */
  totals(promoCode, method = 'delivery', pointsUsed = 0) {
    const items = this.list();
    const subtotal = items.reduce((s, l) => s + this.lineTotal(l), 0);

    let discount = 0, freeShip = false, promoValid = false;
    const promo = promoCode ? PROMOS[promoCode.toUpperCase()] : null;
    if (promo && (!promo.min || subtotal >= promo.min)) {
      promoValid = true;
      if (promo.type === 'percent') discount = subtotal * promo.value / 100;
      if (promo.type === 'fixed')   discount = promo.value;
      if (promo.type === 'ship')    freeShip = true;
    }

    const pointsDiscount = Math.min(pointsUsed / 100 * 5, Math.max(0, subtotal - discount));
    discount += pointsDiscount;

    let delivery = 0;
    if (method === 'delivery' && items.length) {
      delivery = (subtotal >= SHOP.freeDeliveryOver || freeShip) ? 0 : SHOP.deliveryFee;
    }
    const taxable = Math.max(0, subtotal - discount);
    const tax = taxable * SHOP.taxRate;
    const total = Math.max(0, taxable + tax + delivery);

    /* round to cents so stored totals never carry floating point dust */
    const r = (n) => Math.round(n * 100) / 100;
    return { subtotal: r(subtotal), discount: r(discount), pointsDiscount: r(pointsDiscount),
             delivery: r(delivery), tax: r(tax), total: r(total), promoValid, freeShip,
             count: items.reduce((n, i) => n + i.qty, 0) };
  }
};

/* ============================================================
   ORDERS
   ============================================================ */
const ORDER_FLOW = ['pending', 'preparing', 'ontheway', 'completed'];
const STATUS_META = {
  pending:   { label: 'Pending',    cls: 'badge-warn',   icon: 'clock' },
  preparing: { label: 'Preparing',  cls: 'badge-info',   icon: 'cup' },
  ontheway:  { label: 'On the way', cls: 'badge-info',   icon: 'truck' },
  completed: { label: 'Completed',  cls: 'badge-ok',     icon: 'check' },
  cancelled: { label: 'Cancelled',  cls: 'badge-danger', icon: 'x' }
};

const Orders = {
  all() { return DB.get(KEY.orders, []); },
  saveAll(list) { DB.set(KEY.orders, list); },
  find(id) { return this.all().find(o => o.id === id) || null; },
  mine(userId) { return this.all().filter(o => o.userId === userId)
                     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); },

  create(data) {
    const list = this.all();
    const order = {
      id: 'BB-' + String(Date.now()).slice(-6) + '-' + Math.floor(Math.random() * 90 + 10),
      createdAt: new Date().toISOString(),
      status: 'pending',
      timeline: [{ status: 'pending', at: new Date().toISOString() }],
      ...data
    };
    list.unshift(order);
    this.saveAll(list);
    return order;
  },

  setStatus(id, status) {
    const list = this.all();
    const o = list.find(x => x.id === id);
    if (!o) return null;
    o.status = status;
    o.timeline = o.timeline || [];
    o.timeline.push({ status, at: new Date().toISOString() });
    this.saveAll(list);
    return o;
  },

  cancel(id) { return this.setStatus(id, 'cancelled'); },

  /** Aggregate figures for the admin dashboard. */
  stats() {
    const list = this.all().filter(o => o.status !== 'cancelled');
    const revenue = list.reduce((s, o) => s + o.total, 0);
    const today = new Date().toDateString();
    const todayOrders = this.all().filter(o => new Date(o.createdAt).toDateString() === today);

    /* revenue for the last 7 days, oldest first */
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toDateString();
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: key,
        value: list.filter(o => new Date(o.createdAt).toDateString() === key)
                   .reduce((s, o) => s + o.total, 0),
        orders: list.filter(o => new Date(o.createdAt).toDateString() === key).length
      });
    }

    /* units sold per product */
    const sold = {};
    list.forEach(o => (o.items || []).forEach(i => { sold[i.id] = (sold[i.id] || 0) + i.qty; }));
    const top = Object.entries(sold)
      .map(([id, qty]) => ({ product: Products.find(id), qty }))
      .filter(x => x.product)
      .sort((a, b) => b.qty - a.qty).slice(0, 5);

    /* revenue share per category */
    const byCat = {};
    list.forEach(o => (o.items || []).forEach(i => {
      const p = Products.find(i.id);
      const c = p ? p.cat : 'other';
      byCat[c] = (byCat[c] || 0) + (i.price * i.qty);
    }));

    return {
      revenue, orders: list.length, allOrders: this.all().length,
      todayRevenue: todayOrders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
      todayOrders: todayOrders.length,
      avg: list.length ? revenue / list.length : 0,
      pending: this.all().filter(o => o.status === 'pending').length,
      customers: Auth.users().filter(u => u.role === 'customer').length,
      days, top, byCat
    };
  }
};

/* ============================================================
   FEEDBACK / COMPLAINTS
   ============================================================ */
const Feedback = {
  all() { return DB.get(KEY.feedback, []); },
  create(data) {
    const list = this.all();
    const item = {
      id: 'FB-' + String(Date.now()).slice(-6),
      createdAt: new Date().toISOString(),
      status: 'open',
      reply: '',
      ...data
    };
    list.unshift(item);
    DB.set(KEY.feedback, list);
    return item;
  },
  setStatus(id, status, reply) {
    const list = this.all();
    const f = list.find(x => x.id === id);
    if (!f) return null;
    f.status = status;
    if (reply !== undefined) f.reply = reply;
    DB.set(KEY.feedback, list);
    return f;
  },
  mine(email) { return this.all().filter(f => f.email === email); },
  openCount() { return this.all().filter(f => f.status === 'open').length; }
};

/* ============================================================
   FAVOURITES
   ============================================================ */
const Favs = {
  list() { return DB.get(KEY.favs, []); },
  has(id) { return this.list().includes(id); },
  toggle(id) {
    const list = this.list();
    const i = list.indexOf(id);
    if (i > -1) list.splice(i, 1); else list.push(id);
    DB.set(KEY.favs, list);
    return i === -1;
  }
};

/* ============================================================
   SETTINGS — overrides saved from the admin dashboard.
   Applied before anything reads SHOP so fees/tax stay consistent.
   ============================================================ */
(function applySettings() {
  const s = DB.get('bb_settings', null);
  if (s) Object.assign(SHOP, s);
})();

/* ============================================================
   SEED — runs once so the site is not empty on first visit
   ============================================================ */
(function seed() {
  if (DB.get(KEY.seeded, false)) return;

  const now = Date.now();
  const users = [
    { id: 'u_admin', name: 'Sela Kim', email: 'admin@brewandblue.coffee', phone: '+855 23 987 654',
      pw: hashPw('admin123'), role: 'admin', address: '128 Riverside Walk', city: 'Phnom Penh',
      points: 0, joined: new Date(now - 400 * 864e5).toISOString(), newsletter: false, notes: '' },
    { id: 'u_demo', name: 'Dara Sok', email: 'customer@demo.com', phone: '+855 12 345 678',
      pw: hashPw('demo123'), role: 'customer', address: '45 Street 240, Daun Penh', city: 'Phnom Penh',
      points: 240, joined: new Date(now - 120 * 864e5).toISOString(), newsletter: true, notes: 'Oat milk please' },
    { id: 'u_maly', name: 'Maly Chea', email: 'maly@demo.com', phone: '+855 17 222 333',
      pw: hashPw('demo123'), role: 'customer', address: '12 Norodom Blvd', city: 'Phnom Penh',
      points: 85, joined: new Date(now - 60 * 864e5).toISOString(), newsletter: true, notes: '' },
    { id: 'u_ravy', name: 'Ravy Ly', email: 'ravy@demo.com', phone: '+855 78 555 111',
      pw: hashPw('demo123'), role: 'customer', address: '9 Street 63', city: 'Phnom Penh',
      points: 30, joined: new Date(now - 18 * 864e5).toISOString(), newsletter: false, notes: '' }
  ];
  DB.set(KEY.users, users);

  /* deterministic pseudo-random so the dashboard looks the same on reload */
  let s = 7;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

  const orders = [];
  const customers = users.filter(u => u.role === 'customer');
  for (let d = 13; d >= 0; d--) {
    const perDay = 1 + Math.floor(rnd() * 4);
    for (let k = 0; k < perDay; k++) {
      const user = pick(customers);
      const nItems = 1 + Math.floor(rnd() * 3);
      const items = [];
      for (let j = 0; j < nItems; j++) {
        const p = pick(PRODUCTS);
        if (items.some(i => i.id === p.id)) continue;
        const size = pick(SIZES);
        const sizeAdd = ['hot', 'cold', 'tea'].includes(p.cat) ? size.add : 0;
        items.push({
          key: p.id + '|' + size.id + '|', id: p.id, name: p.name,
          base: p.price, price: +(p.price + sizeAdd).toFixed(2),
          art: p.art, tint: p.tint, bg: p.bg,
          size: size.id, addons: [], qty: 1 + Math.floor(rnd() * 2), cat: p.cat
        });
      }
      if (!items.length) continue;

      const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0);
      const method = rnd() > 0.35 ? 'delivery' : 'pickup';
      const delivery = method === 'delivery' && subtotal < SHOP.freeDeliveryOver ? SHOP.deliveryFee : 0;
      const tax = subtotal * SHOP.taxRate;
      const created = new Date(now - d * 864e5 - Math.floor(rnd() * 10) * 36e5);
      const status = d === 0 ? pick(['pending', 'preparing', 'ontheway'])
                   : d === 1 ? pick(['completed', 'completed', 'ontheway'])
                   : pick(['completed', 'completed', 'completed', 'cancelled']);

      orders.push({
        id: 'BB-' + (100000 + orders.length * 37 + d) + '-' + (10 + k),
        userId: user.id, userName: user.name, userEmail: user.email,
        items, subtotal, discount: 0, pointsDiscount: 0, delivery, tax,
        total: +(subtotal + tax + delivery).toFixed(2),
        method, payment: pick(['cash', 'card', 'wallet']),
        address: method === 'delivery' ? user.address + ', ' + user.city : 'Store pickup',
        phone: user.phone, note: '', promo: '',
        createdAt: created.toISOString(), status,
        timeline: [{ status: 'pending', at: created.toISOString() }]
      });
    }
  }
  DB.set(KEY.orders, orders.reverse());

  DB.set(KEY.feedback, [
    { id: 'FB-100241', name: 'Maly Chea', email: 'maly@demo.com', type: 'complaint',
      subject: 'Order arrived cold', orderId: orders[3] ? orders[3].id : '',
      rating: 2, message: 'The latte was lukewarm when it reached me. Delivery took 50 minutes instead of the 30 shown at checkout.',
      status: 'open', reply: '', createdAt: new Date(now - 2 * 864e5).toISOString() },
    { id: 'FB-100238', name: 'Dara Sok', email: 'customer@demo.com', type: 'praise',
      subject: 'The new cold foam americano', orderId: '',
      rating: 5, message: 'Whoever put the coconut cold foam on the menu deserves a raise. Please keep it permanently.',
      status: 'resolved', reply: 'Thank you Dara! It is staying on the menu.',
      createdAt: new Date(now - 5 * 864e5).toISOString() },
    { id: 'FB-100230', name: 'Ravy Ly', email: 'ravy@demo.com', type: 'suggestion',
      subject: 'More plug sockets upstairs', orderId: '',
      rating: 4, message: 'Great place to work from but the upstairs seating only has two sockets. Would love a few more.',
      status: 'open', reply: '', createdAt: new Date(now - 8 * 864e5).toISOString() }
  ]);

  DB.set(KEY.seeded, true);
})();
