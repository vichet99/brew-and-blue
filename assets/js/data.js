/* ============================================================
   data.js — seed catalogue & static content for Brew & Blue
   Everything the shop needs before the user touches anything.
   ============================================================ */

const CATEGORIES = [
  { id: 'hot',    name: 'Hot Coffee',  icon: 'cup'    },
  { id: 'cold',   name: 'Cold Brew',   icon: 'iced'   },
  { id: 'tea',    name: 'Tea & Matcha',icon: 'leaf'   },
  { id: 'pastry', name: 'Pastries',    icon: 'pastry' },
  { id: 'beans',  name: 'Beans & Gear',icon: 'beans'  }
];

const SIZES = [
  { id: 'S', name: 'Small',  ml: '240 ml', add: 0    },
  { id: 'M', name: 'Medium', ml: '350 ml', add: 0.75 },
  { id: 'L', name: 'Large',  ml: '470 ml', add: 1.50 }
];

const ADDONS = [
  { id: 'shot',    name: 'Extra espresso shot', price: 0.90 },
  { id: 'oat',     name: 'Oat milk',            price: 0.60 },
  { id: 'vanilla', name: 'Vanilla syrup',       price: 0.50 },
  { id: 'caramel', name: 'Caramel drizzle',     price: 0.50 },
  { id: 'whip',    name: 'Whipped cream',       price: 0.40 }
];

/* art: hot | iced | tea | pastry | beans  ->  drives the SVG illustration
   tint: main colour of the illustration, bg: card background gradient      */
const PRODUCTS = [
  {
    id: 'p01', name: 'Blue Mountain Espresso', cat: 'hot', price: 2.90, old: 3.50,
    art: 'hot', tint: '#4E3120', bg: 'linear-gradient(140deg,#DCEBF8,#F0E2D2)',
    badge: 'Bestseller', rating: 4.9, reviews: 214, stock: 48, cal: 5, roast: 'Dark',
    origin: 'Jamaica / Blue Mountain', caffeine: '128 mg',
    desc: 'A dense, syrupy double shot with cocoa and toasted walnut notes.',
    long: 'Our signature pull. Beans rest 14 days after roasting, then get a 27-second extraction at 93°C for a shot that is bold without turning bitter. Served with a small glass of sparkling water to reset the palate.',
    tags: ['strong', 'classic'],
    ingredients: ['100% arabica blue mountain beans', 'Filtered water']
  },
  {
    id: 'p02', name: 'Caramel Sea-Salt Latte', cat: 'hot', price: 4.50,
    art: 'hot', tint: '#9C6B45', bg: 'linear-gradient(140deg,#FFF6DF,#F0E2D2)',
    badge: 'Popular', rating: 4.8, reviews: 176, stock: 60, cal: 220, roast: 'Medium',
    origin: 'Colombia / Huila', caffeine: '85 mg',
    desc: 'Steamed milk, house caramel and a pinch of Kampot sea salt.',
    long: 'We cook the caramel in-house every morning — no syrup pumps. The salt is flaked on top at the last second so the first sip is sweet and the finish is clean.',
    tags: ['sweet', 'creamy'],
    ingredients: ['Espresso', 'Whole milk', 'House caramel', 'Sea salt flakes']
  },
  {
    id: 'p03', name: 'Classic Cappuccino', cat: 'hot', price: 3.80,
    art: 'hot', tint: '#6B4226', bg: 'linear-gradient(140deg,#F0E2D2,#FDF8F2)',
    rating: 4.7, reviews: 132, stock: 55, cal: 140, roast: 'Medium',
    origin: 'Brazil / Cerrado', caffeine: '80 mg',
    desc: 'Equal thirds espresso, steamed milk and velvet microfoam.',
    long: 'The benchmark drink. Our baristas texture the milk to 62°C so the foam stays glossy right down to the last sip, then finish with a dusting of cinnamon on request.',
    tags: ['classic', 'balanced'],
    ingredients: ['Espresso', 'Steamed milk', 'Milk foam']
  },
  {
    id: 'p04', name: 'Honey Cinnamon Flat White', cat: 'hot', price: 4.20,
    art: 'hot', tint: '#D89A00', bg: 'linear-gradient(140deg,#FFE7A8,#FFF6DF)',
    badge: 'New', rating: 4.6, reviews: 58, stock: 40, cal: 185, roast: 'Medium',
    origin: 'Ethiopia / Yirgacheffe', caffeine: '95 mg',
    desc: 'Ristretto base, wild honey and a warm cinnamon finish.',
    long: 'Built on a short ristretto so the honey never gets buried. The cinnamon is ground fresh each morning — you can smell it from the counter.',
    tags: ['sweet', 'aromatic'],
    ingredients: ['Ristretto', 'Whole milk', 'Wild honey', 'Ceylon cinnamon']
  },
  {
    id: 'p05', name: 'Midnight Cold Brew', cat: 'cold', price: 4.10,
    art: 'iced', tint: '#0A2540', bg: 'linear-gradient(140deg,#DCEBF8,#6FB2E4)',
    badge: 'Bestseller', rating: 4.9, reviews: 241, stock: 72, cal: 15, roast: 'Dark',
    origin: 'Vietnam / Da Lat', caffeine: '200 mg',
    desc: 'Steeped 18 hours cold. Smooth, chocolatey, zero bitterness.',
    long: 'We steep coarse-ground beans in cold filtered water for 18 hours, then filter twice. The result has about a third less acidity than hot-brewed coffee and keeps its body over ice.',
    tags: ['strong', 'smooth'],
    ingredients: ['Coarse ground beans', 'Cold filtered water']
  },
  {
    id: 'p06', name: 'Iced Vanilla Latte', cat: 'cold', price: 4.30,
    art: 'iced', tint: '#1E77B8', bg: 'linear-gradient(140deg,#FDF8F2,#DCEBF8)',
    rating: 4.7, reviews: 149, stock: 65, cal: 190, roast: 'Medium',
    origin: 'Guatemala / Antigua', caffeine: '85 mg',
    desc: 'Double shot over ice, cold milk and real vanilla bean syrup.',
    long: 'Poured over slow-melt ice cubes made from the same filtered water we brew with, so the last mouthful tastes like the first.',
    tags: ['sweet', 'refreshing'],
    ingredients: ['Espresso', 'Cold milk', 'Vanilla bean syrup', 'Ice']
  },
  {
    id: 'p07', name: 'Salted Coffee Frappe', cat: 'cold', price: 4.90,
    art: 'iced', tint: '#4E3120', bg: 'linear-gradient(140deg,#F0E2D2,#D9BFA4)',
    badge: 'Popular', rating: 4.8, reviews: 187, stock: 38, cal: 310, roast: 'Medium',
    origin: 'House blend', caffeine: '90 mg',
    desc: 'Blended iced coffee crowned with salted cream foam.',
    long: 'Thick enough for a spoon, light enough for a straw. The salted cream cap is whipped to order and sits on top instead of mixing in — drink it without stirring for the full effect.',
    tags: ['sweet', 'creamy', 'blended'],
    ingredients: ['Espresso', 'Milk', 'Ice', 'Salted cream foam', 'Cane sugar']
  },
  {
    id: 'p08', name: 'Coconut Cold Foam Americano', cat: 'cold', price: 4.00,
    art: 'iced', tint: '#6FB2E4', bg: 'linear-gradient(140deg,#FFFFFF,#DCEBF8)',
    badge: 'New', rating: 4.5, reviews: 41, stock: 44, cal: 90, roast: 'Light',
    origin: 'Kenya / Nyeri', caffeine: '110 mg',
    desc: 'Bright iced americano under a cloud of coconut foam.',
    long: 'A light Kenyan roast keeps the citrus notes forward; the coconut foam softens the edge without adding dairy. Vegan as it comes.',
    tags: ['refreshing', 'vegan'],
    ingredients: ['Espresso', 'Cold water', 'Coconut cream foam', 'Ice']
  },
  {
    id: 'p09', name: 'Ceremonial Matcha Latte', cat: 'tea', price: 4.60,
    art: 'tea', tint: '#3F7D53', bg: 'linear-gradient(140deg,#E4F5EC,#FDF8F2)',
    rating: 4.6, reviews: 96, stock: 30, cal: 160, roast: '—',
    origin: 'Japan / Uji', caffeine: '70 mg',
    desc: 'Stone-ground ceremonial matcha whisked with steamed milk.',
    long: 'First-harvest Uji matcha, whisked by hand with a bamboo chasen at 78°C — hot enough to bloom the powder, cool enough to keep it sweet rather than bitter.',
    tags: ['smooth', 'earthy'],
    ingredients: ['Ceremonial matcha', 'Steamed milk']
  },
  {
    id: 'p10', name: 'Lemongrass Ginger Tea', cat: 'tea', price: 3.20,
    art: 'tea', tint: '#D89A00', bg: 'linear-gradient(140deg,#FFF6DF,#FFE7A8)',
    rating: 4.4, reviews: 63, stock: 50, cal: 45, roast: '—',
    origin: 'Local farms', caffeine: '0 mg',
    desc: 'Fresh lemongrass, bruised ginger and a spoon of palm sugar.',
    long: 'Caffeine-free and made from stalks cut that morning. The ginger gets bruised rather than sliced, which gives warmth without sharp heat.',
    tags: ['caffeine-free', 'warming'],
    ingredients: ['Lemongrass', 'Ginger', 'Palm sugar', 'Hot water']
  },
  {
    id: 'p11', name: 'Butter Croissant', cat: 'pastry', price: 2.60,
    art: 'pastry', tint: '#D89A00', bg: 'linear-gradient(140deg,#FFF6DF,#F0E2D2)',
    badge: 'Bestseller', rating: 4.8, reviews: 203, stock: 24, cal: 280, roast: '—',
    origin: 'Baked in-house', caffeine: '0 mg',
    desc: 'Laminated over three days with French cultured butter.',
    long: 'Twenty-seven layers, a slow cold ferment and a bake that finishes at 7am daily. When they are gone, they are gone — we do not bake twice.',
    tags: ['buttery', 'fresh'],
    ingredients: ['Wheat flour', 'Cultured butter', 'Milk', 'Yeast', 'Salt']
  },
  {
    id: 'p12', name: 'Blueberry Cheesecake Slice', cat: 'pastry', price: 4.40,
    art: 'pastry', tint: '#1E77B8', bg: 'linear-gradient(140deg,#DCEBF8,#FDF8F2)',
    badge: 'Popular', rating: 4.9, reviews: 158, stock: 16, cal: 420, roast: '—',
    origin: 'Baked in-house', caffeine: '0 mg',
    desc: 'Baked New-York style with a wild blueberry ripple.',
    long: 'A biscuit base, a long slow bake in a water bath and a full night in the fridge. The blueberry compote is folded through, not poured on top.',
    tags: ['sweet', 'dessert'],
    ingredients: ['Cream cheese', 'Wild blueberries', 'Eggs', 'Biscuit base', 'Sugar']
  },
  {
    id: 'p13', name: 'Double Chocolate Cookie', cat: 'pastry', price: 2.20,
    art: 'pastry', tint: '#4E3120', bg: 'linear-gradient(140deg,#F0E2D2,#D9BFA4)',
    rating: 4.7, reviews: 118, stock: 35, cal: 340, roast: '—',
    origin: 'Baked in-house', caffeine: '12 mg',
    desc: 'Crisp edge, molten centre, 70% dark chocolate chunks.',
    long: 'Rested 36 hours before baking, which is why the edges crack and the middle stays fudgy. Best eaten warm — ask and we will give it 20 seconds.',
    tags: ['sweet', 'chocolate'],
    ingredients: ['Dark chocolate 70%', 'Butter', 'Brown sugar', 'Flour', 'Eggs']
  },
  {
    id: 'p14', name: 'Ham & Cheese Toastie', cat: 'pastry', price: 5.20,
    art: 'pastry', tint: '#9C6B45', bg: 'linear-gradient(140deg,#FFE7A8,#F0E2D2)',
    rating: 4.5, reviews: 74, stock: 20, cal: 480, roast: '—',
    origin: 'Made to order', caffeine: '0 mg',
    desc: 'Sourdough, smoked ham, gruyère, pressed until it sings.',
    long: 'Pressed to order on our sourdough, which we buy from the bakery two doors down. Comes with a small pot of grain mustard.',
    tags: ['savoury', 'filling'],
    ingredients: ['Sourdough', 'Smoked ham', 'Gruyère', 'Butter', 'Grain mustard']
  },
  {
    id: 'p15', name: 'House Blend Beans 250g', cat: 'beans', price: 12.90, old: 15.00,
    art: 'beans', tint: '#6B4226', bg: 'linear-gradient(140deg,#F0E2D2,#D9BFA4)',
    badge: 'Value', rating: 4.8, reviews: 92, stock: 80, cal: 0, roast: 'Medium-dark',
    origin: 'Blend: Brazil / Vietnam', caffeine: '—',
    desc: 'Our café blend, roasted weekly. Chocolate, hazelnut, caramel.',
    long: 'The same blend we pull in store. Roasted every Tuesday and bagged with a one-way valve, so the bag you get is never more than six days old. Tell us your brew method and we grind it for you.',
    tags: ['whole bean', 'gift'],
    ingredients: ['100% arabica beans']
  },
  {
    id: 'p16', name: 'Single Origin Ethiopia 250g', cat: 'beans', price: 16.50,
    art: 'beans', tint: '#0A2540', bg: 'linear-gradient(140deg,#DCEBF8,#F0E2D2)',
    rating: 4.9, reviews: 67, stock: 26, cal: 0, roast: 'Light',
    origin: 'Ethiopia / Yirgacheffe', caffeine: '—',
    desc: 'Washed Yirgacheffe. Jasmine, bergamot, stone fruit.',
    long: 'A light roast for filter brewing. Grown at 1,950m, washed at the Konga station and roasted just past first crack to keep the florals intact.',
    tags: ['whole bean', 'filter'],
    ingredients: ['100% arabica beans']
  },
  {
    id: 'p17', name: 'Brew & Blue Ceramic Mug', cat: 'beans', price: 9.90,
    art: 'beans', tint: '#1E77B8', bg: 'linear-gradient(140deg,#DCEBF8,#FFFFFF)',
    rating: 4.6, reviews: 45, stock: 33, cal: 0, roast: '—',
    origin: 'Made in Cambodia', caffeine: '—',
    desc: '280 ml stoneware mug, glazed in our house blue.',
    long: 'Thrown and glazed by a small studio outside the city. Dishwasher safe, and heavy enough at the base that it does not slide across a desk.',
    tags: ['merch', 'gift'],
    ingredients: ['Stoneware', 'Food-safe glaze']
  },
  {
    id: 'p18', name: 'Pour-Over Starter Kit', cat: 'beans', price: 28.00, old: 34.00,
    art: 'beans', tint: '#D89A00', bg: 'linear-gradient(140deg,#FFF6DF,#FFE7A8)',
    badge: 'Value', rating: 4.7, reviews: 38, stock: 12, cal: 0, roast: '—',
    origin: 'Curated set', caffeine: '—',
    desc: 'Dripper, 100 filters, scoop and a 250g bag of house blend.',
    long: 'Everything needed to brew a proper cup at home, plus a printed one-page recipe card with the ratio and timings we use behind the bar.',
    tags: ['gift', 'kit'],
    ingredients: ['Ceramic dripper', 'Paper filters', 'Scoop', 'House blend 250g']
  }
];

/* ---------- promo codes ---------- */
const PROMOS = {
  BREW10:  { type: 'percent', value: 10, label: '10% off your order' },
  BLUE5:   { type: 'fixed',   value: 5,  label: '$5 off orders over $25', min: 25 },
  FREESHIP:{ type: 'ship',    value: 0,  label: 'Free delivery' }
};

/* ---------- static page content ---------- */
const TESTIMONIALS = [
  { name: 'Sophea Chan',   role: 'Regular since 2021', rating: 5,
    text: 'The cold brew is the reason I moved my morning meetings here. Staff remember my order, and the wifi actually holds up.' },
  { name: 'Daniel Ortiz',  role: 'Freelance designer', rating: 5,
    text: 'I have tried every flat white in the district. This one wins on consistency — it tastes the same at 7am and 5pm.' },
  { name: 'Mika Tanaka',   role: 'Student', rating: 4,
    text: 'Croissants sell out by 10, which tells you everything. Order ahead through the site and they hold it at the counter.' }
];

const FAQS = [
  { q: 'How long does delivery take?',
    a: 'Orders inside the city are delivered in 25–40 minutes. Pickup orders are usually ready in 10–15 minutes and we hold them at the counter for an hour.' },
  { q: 'Can I change or cancel an order?',
    a: 'Yes, while the order still shows as Pending in My Orders. Once the kitchen marks it Preparing we can no longer pull it back, but you can still contact us and we will do what we can.' },
  { q: 'Do you offer dairy-free milk?',
    a: 'Oat, almond and coconut milk are all available. Oat is a $0.60 add-on, the others are free of charge on any hot or iced drink.' },
  { q: 'How do loyalty points work?',
    a: 'You earn 1 point for every $1 spent. 100 points converts to $5 off, applied automatically at checkout when you have enough.' },
  { q: 'Where do your beans come from?',
    a: 'Direct trade with four farms across Ethiopia, Colombia, Brazil and Vietnam. Each bag lists the farm, altitude and harvest date.' },
  { q: 'Do you cater for events?',
    a: 'We do — from 20 cups upward. Send the details through the Feedback page with the Catering subject and we reply within one working day.' }
];

const SHOP = {
  name: 'Brew & Blue',
  tagline: 'Coffee with a view.',
  phone: '+855 23 987 654',
  email: 'hello@brewandblue.coffee',
  address: '128 Riverside Walk, Phnom Penh, Cambodia',
  hours: [
    { d: 'Monday – Friday',  h: '06:30 – 21:00' },
    { d: 'Saturday',         h: '07:00 – 22:00' },
    { d: 'Sunday',           h: '07:00 – 20:00' }
  ],
  deliveryFee: 2.50,
  freeDeliveryOver: 25,
  taxRate: 0.10
};
