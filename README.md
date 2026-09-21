# Brew &amp; Blue — Coffee Shop Website

**Live demo: https://brew-and-blue-coffee.vercel.app**

A complete, responsive coffee shop website built with **HTML5, CSS3 and vanilla JavaScript**.
No frameworks, no build step, no backend — every page opens straight in a browser.

Brand palette: 🔵 **Blue** `#14507E` · 🟤 **Brown** `#6B4226` · 🟡 **Yellow** `#F5B301`

---

## 1. Running the site

**Option A — open the file directly**

Double-click `index.html`.

**Option B — local web server (recommended)**

```bash
python -m http.server 5510
```

Then open <http://localhost:5510>. A server avoids browser restrictions on `file://`
URLs and is closer to how the site would really be hosted.

**Option C — the hosted version**

The site is deployed on Vercel at <https://brew-and-blue-coffee.vercel.app>.
The Vercel project is connected to this GitHub repository, so **every push to
`main` deploys to production automatically** — there is nothing to run by hand.
It is a static deployment — no build command, the files are served as-is.
`.vercelignore` keeps secrets and local tooling out of the upload, because on a
static host every uploaded file is publicly downloadable.

### Demo accounts

| Role     | Email                        | Password   |
|----------|------------------------------|------------|
| Customer | `customer@demo.com`          | `demo123`  |
| Admin    | `admin@brewandblue.coffee`   | `admin123` |

You can also register a real account from the Sign Up page — it works the same way.

---

## 2. The eleven pages

| # | Page | File | What it does |
|---|------|------|--------------|
| 1 | Home | `index.html` | Hero, feature strip, category tiles, bestsellers, about, loyalty banner, testimonials |
| 2 | Menu | `menu.html` | 18 products with category / price / tag / rating filters, live search, 5 sort modes, shareable URLs |
| 3 | Product Details | `product.html?id=p01` | Gallery, size + add-on picker with live price, quantity, tabs (description / nutrition / reviews), related items |
| 4 | Shopping Cart | `cart.html` | Line items with options, quantity steppers, remove, promo codes, delivery vs pickup, live totals |
| 5 | Checkout / Order | `checkout.html` | 3-step flow (details → payment → review), validation, loyalty points, order confirmation |
| 6 | Sign In | `signin.html` | Login with validation, show/hide password, redirect back to the page you came from |
| 7 | Sign Up | `signup.html` | Registration with password strength meter, duplicate-email check, 50 welcome points |
| 8 | My Orders | `orders.html` | Order history, status tabs, live tracking strip, details modal, reorder, cancel |
| 9 | My Profile | `profile.html` | Details, saved address, change password, preferences, favourites, loyalty progress |
| 10 | Complaint / Feedback | `feedback.html` | 5 message types, star rating, order linking, previous messages, FAQ accordion |
| 11 | Admin Dashboard | `admin.html` | KPIs, charts, order management, product CRUD, customers, feedback inbox, shop settings |

---

## 3. File structure

```
coffee-shop/
├── index.html            Home
├── menu.html             Menu
├── product.html          Product details
├── cart.html             Shopping cart
├── checkout.html         Checkout / order
├── signin.html           Sign in
├── signup.html           Sign up
├── orders.html           My orders
├── profile.html          My profile
├── feedback.html         Complaint / feedback
├── admin.html            Admin dashboard
├── README.md
└── assets/
    ├── css/
    │   ├── style.css     Design tokens, reset, buttons, forms, header, footer, tables
    │   └── pages.css     Page-specific layouts (hero, cards, cart, checkout, admin…)
    └── js/
        ├── data.js       Product catalogue, categories, sizes, add-ons, promos, shop info
        ├── store.js      Storage layer: Auth, Cart, Orders, Feedback, Products, Favs
        └── ui.js         Shared UI: icons, SVG illustrations, header/footer, toasts, cards
```

Three shared files are included by every page, always in this order:

```html
<script src="assets/js/data.js"></script>   <!-- the data -->
<script src="assets/js/store.js"></script>  <!-- reading and writing it -->
<script src="assets/js/ui.js"></script>     <!-- drawing it -->
```

---

## 4. How it works

### Storage
Everything lives in the browser's `localStorage` under `bb_*` keys, wrapped by the `DB`
helper in `store.js` so no page touches storage keys directly. On the very first visit a
seed routine creates 4 users, ~34 orders spread over two weeks and 3 feedback messages,
so the shop and the dashboard have something to show immediately.

| Key | Contents |
|-----|----------|
| `bb_users` | Registered accounts |
| `bb_session` | The signed-in user's id |
| `bb_cart` | Current cart lines |
| `bb_orders` | All orders |
| `bb_feedback` | Feedback and complaints |
| `bb_products` | Admin edits to the catalogue |
| `bb_favs` | Saved favourites |
| `bb_settings` | Shop settings from the dashboard |

*Admin → Settings → Reset all demo data* clears everything and reseeds on the next load.

### Header and footer
Written once in `ui.js` and injected into the `#site-header` / `#site-footer` elements on
every page. The active nav link comes from `<body data-page="…">`, so there are no eleven
copies of the navigation to keep in sync.

### Images
There are no image files. Every product illustration is an inline SVG generated by
`productArt(type, colour)` in `ui.js` — five shapes (hot cup, iced glass, tea cup, pastry,
bean bag) tinted per product. Nothing to download, sharp at any size, and no broken images.
The dashboard charts are hand-drawn SVG too, so there is no charting library.

### Prices
`Cart.unitPrice()` = base price + size supplement + add-ons. `Cart.totals()` then applies
the promo code, loyalty points, delivery fee and VAT, rounding to cents so stored totals
never carry floating-point dust.

### Promo codes
`BREW10` (10% off) · `BLUE5` ($5 off orders over $25) · `FREESHIP` (free delivery)

### Loyalty points
1 point per $1 spent, 100 points = $5 off, applied at checkout. New accounts start with 50.

---

## 5. Responsive design

Mobile-first breakpoints in `style.css` and `pages.css`:

| Width | What changes |
|-------|--------------|
| ≤ 1100px | Hero stacks, features and KPIs go 2-up |
| ≤ 1024px | 3- and 4-column grids go 2-up, footer 2-up |
| ≤ 1000px | Sidebars collapse (menu filters, cart summary, account nav, admin sidebar becomes off-canvas) |
| ≤ 900px | Navigation becomes a hamburger menu |
| ≤ 760px | Grids and form rows go single column |
| ≤ 640px | Compact product cards, stacked cart rows, icon-only checkout steps |

Wide tables scroll horizontally inside `.table-wrap` instead of breaking the layout.
`prefers-reduced-motion` is respected — all animation is disabled for users who ask for it.

---

## 6. Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `aside`, `footer`) and a sensible heading order
- Every icon button has an `aria-label`; decorative SVGs are `aria-hidden`
- Visible focus rings (`:focus-visible`) in the brand yellow
- Form fields have real `<label>`s and inline error messages
- Colour contrast checked for body text and buttons

---

## 7. Notes for assessment

A few things are deliberately simplified, and worth saying out loud rather than hiding:

- **Passwords** are hashed with a small demo hash before being stored. This is *not*
  secure — a real shop must hash on a server with bcrypt or argon2. The code says so where
  it happens (`hashPw` in `store.js`).
- **Card payment** is a mock form. There is no payment processor. Only the last four
  digits are ever kept, the form warns not to enter a real card, and the test number
  `4242 4242 4242 4242` is provided.
- **Data is per-browser.** Because there is no server, orders placed in Chrome will not
  appear in Firefox, and clearing site data resets the shop.
- **Social sign-in buttons** are placeholders — real OAuth needs a registered app.

### Possible next steps
A real backend (Node/Express or PHP + MySQL), server-side sessions, a payment gateway,
image uploads for products, and email receipts.
