import { formatPrice, legacyUsdPriceToNgn } from "@/lib/currency";
import { catalogVariantDefaults } from "@/lib/product-variants";

export { formatPrice };

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
}

export type AdminCategory = Category & {
  isPublished: boolean;
  productCount: number;
};

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  rating: number;
  reviewCount: number;
  manualReviewCount?: number | null;
  image: string;
  gallery?: string[];
  description: string;
  story: string;
  materials: string;
  dimensions: string;
  care: string;
  stock: number;
  inStock?: boolean;
  badge?: "New" | "Bestseller" | "Low stock" | "Sale";
  colors?: { name: string; hex: string }[];
  sizes?: string[];
  featured?: boolean;
}

export const categories: Category[] = [
  { slug: "jackets", name: "Jackets", tagline: "Layers for every day", description: "Everyday outerwear, from statement jackets to relaxed bombers.", image: "/images/products/stussy-jacket.png" },
  { slug: "apparel", name: "T-Shirts", tagline: "Casual essentials", description: "Distinctive everyday clothing from independent labels, made for easy layering and self-expression.", image: "/images/products/chaotic-club-spooky.png" },
  { slug: "shoes", name: "Shoes", tagline: "Made to move", description: "Comfortable everyday footwear with considered materials and distinctive details.", image: "/images/products/sneakers.png" },
  { slug: "bags", name: "Bags", tagline: "Carry your day", description: "Practical carryalls with thoughtful shapes and details for everyday use.", image: "/images/products/pearl-seashell-bag.png" },
  { slug: "accessories", name: "Accessories", tagline: "The finishing details", description: "Useful finishing pieces designed to bring character to everyday outfits.", image: "/images/products/mens-golf-cap.png" },
];

export const categoryIndexCategories = ["jackets", "apparel", "shoes", "bags", "accessories"]
  .map((slug) => categories.find((category) => category.slug === slug))
  .filter((category): category is Category => category !== undefined);

export const popularItems = [
  { name: "Chaotic Club", image: "/images/products/chaotic-club-spooky.png", href: "/products/chaotic-club" },
  { name: "Sneakers", image: "/images/products/sneakers.png", href: "/products/sneakers" },
  { name: "Seashell Bag", image: "/images/products/pearl-seashell-bag.png", href: "/products/seashell-bag" },
  { name: "Men's Golf Cap", image: "/images/products/mens-golf-cap.png", href: "/products/mens-golf-cap" },
];

const legacyUsdProductCatalog: Product[] = [
  {
    id: "terra-vessel-vase", name: "Terra Vessel Vase", category: "ceramics",
    price: 86, rating: 4.8, reviewCount: 34, image: "/images/products/vase-01.webp",
    description: "A hand-thrown stoneware vase with a soft matte glaze in warm off-white. The gently asymmetric belly catches light the way only wheel-thrown forms can.",
    story: "Thrown in a Lisbon studio by a two-person team, each Terra vessel is fired twice and sanded by hand between glazes.",
    materials: "High-fired stoneware, matte mineral glaze", dimensions: "H 24cm × Ø 16cm", care: "Wipe with a damp cloth. Watertight; suitable for fresh flowers.",
    stock: 14, badge: "Bestseller", featured: true,
    colors: [{ name: "Bone", hex: "#e9e4d8" }, { name: "Clay", hex: "#b98a68" }, { name: "Slate", hex: "#6d7178" }],
  },
  {
    id: "kiln-speckle-mugs", name: "Kiln Speckle Espresso Mugs, Pair", category: "ceramics",
    price: 48, rating: 4.9, reviewCount: 57, image: "/images/products/mugs.webp",
    description: "A pair of speckled stoneware espresso mugs in sand and clay. Small enough for a proper ristretto, sturdy enough for every single morning.",
    story: "The speckle comes from iron-bearing clay dug forty kilometres from the kiln — no two mugs pattern alike.",
    materials: "Speckled ironstone clay, food-safe glaze", dimensions: "H 6.5cm × Ø 6cm, 110ml each", care: "Dishwasher safe, though hand-washing preserves the glaze longer.",
    stock: 22, badge: "Bestseller", featured: true,
    colors: [{ name: "Sand", hex: "#d6c3a5" }, { name: "Clay", hex: "#a9785b" }],
  },
  {
    id: "kumo-lantern-lamp", name: "Kumo Paper Lantern Floor Lamp", category: "lighting",
    price: 240, compareAt: 290, rating: 4.7, reviewCount: 21, image: "/images/products/lantern-lamp.webp",
    description: "A sculptural washi paper globe on a slender blackened-steel stand. Lit, it reads like a small moon parked in the corner of the room.",
    story: "The shade is stretched by hand over a bamboo rib, a technique unchanged for three centuries.",
    materials: "Washi paper, bamboo rib, blackened steel", dimensions: "H 118cm × Ø 45cm", care: "Dust with a dry cloth. E27 bulb, max 9W LED, included.",
    stock: 6, badge: "Sale", featured: true,
  },
  {
    id: "dome-brass-lamp", name: "Dome Brass Table Lamp", category: "lighting",
    price: 185, rating: 4.6, reviewCount: 18, image: "/images/products/brass-lamp.webp",
    description: "A mushroom-domed table lamp in brushed brass. The shade throws light downward in a warm pool — ideal on a sideboard or desk.",
    story: "Spun from a single disc of brass and left unlacquered, so it develops a living patina with touch and time.",
    materials: "Brushed solid brass, unlacquered", dimensions: "H 38cm × Ø 28cm", care: "Let patina develop, or polish with brass cloth. E14 bulb included.",
    stock: 11, badge: "New",
  },
  {
    id: "oat-merino-throw", name: "Oat Merino Throw", category: "textiles",
    price: 145, rating: 4.9, reviewCount: 63, image: "/images/products/wool-throw.webp",
    description: "A chunky hand-knit merino throw in undyed oatmeal. Heavy in the lap, light on the eye — the blanket that ends arguments over the sofa.",
    story: "Knitted from 100% undyed merino lambswool spun in a fourth-generation Yorkshire mill.",
    materials: "100% undyed merino lambswool", dimensions: "130cm × 180cm", care: "Spot clean or gentle wool-cycle wash. Dry flat.",
    stock: 9, badge: "Bestseller", featured: true,
    colors: [{ name: "Oat", hex: "#d9cbb2" }, { name: "Moss", hex: "#7c8262" }, { name: "Charcoal", hex: "#4a4a45" }],
  },
  {
    id: "sage-linen-cushion", name: "Sage Stonewashed Linen Cushion", category: "textiles",
    price: 58, rating: 4.5, reviewCount: 12, image: "/images/products/linen-cushion.webp",
    description: "Stonewashed European linen in a muted sage, filled with a plump feather insert. Arrives soft; only gets softer.",
    story: "The flax is grown in Normandy and stonewashed with pumice, which gives the cloth its broken-in hand.",
    materials: "100% European linen, duck-feather insert", dimensions: "50cm × 50cm", care: "Machine wash cold, line dry. Iron optional — wrinkles are the point.",
    stock: 30,
    colors: [{ name: "Sage", hex: "#9aa48a" }, { name: "Natural", hex: "#d8cfbc" }, { name: "Terracotta", hex: "#b7704f" }],
  },
  {
    id: "walnut-serving-board", name: "Walnut Serving Board", category: "kitchen",
    price: 72, rating: 4.8, reviewCount: 41, image: "/images/products/walnut-board.webp",
    description: "A solid American walnut board with a rounded handle and leather strap. For cheese, bread, or simply leaning against the backsplash looking serious.",
    story: "Cut from a single plank — the grain runs uninterrupted from handle to tip.",
    materials: "Solid American black walnut, vegetable-tanned leather", dimensions: "45cm × 20cm × 2cm", care: "Hand wash, dry upright, oil monthly with food-safe mineral oil.",
    stock: 17, featured: true,
  },
  {
    id: "reactive-dinner-plates", name: "Reactive Glaze Dinner Plates, Set of 4", category: "kitchen",
    price: 120, rating: 4.7, reviewCount: 29, image: "/images/products/dinner-plates.webp",
    description: "Four dinner plates in layered reactive glazes — no two surfaces alike, each firing a small experiment in chemistry.",
    story: "Reactive glazes are mixed with metal oxides that bloom unpredictably in the kiln. The set is matched by tone, never by pattern.",
    materials: "Stoneware, reactive mineral glaze", dimensions: "Ø 27cm each", care: "Dishwasher and microwave safe.",
    stock: 13, badge: "New",
  },
  {
    id: "glass-bedside-carafe", name: "Glass Bedside Carafe & Tumbler", category: "kitchen",
    price: 58, rating: 4.6, reviewCount: 15, image: "/images/products/carafe.webp",
    description: "A one-litre carafe whose tumbler doubles as its lid. Nightstand water, solved elegantly since 1903 — now in clearer glass.",
    story: "Mouth-blown from recycled glass; tiny seed bubbles in the wall are the mark of the furnace.",
    materials: "Mouth-blown recycled glass", dimensions: "Carafe H 21cm, 1L; tumbler 250ml", care: "Hand wash recommended.",
    stock: 25,
  },
  {
    id: "tripod-oak-side-table", name: "Tripod Oak Side Table", category: "furniture",
    price: 310, rating: 4.8, reviewCount: 19, image: "/images/products/oak-side-table.webp",
    description: "A round-topped side table in solid white oak on three splayed legs. Holds a lamp, a book, a glass — asks for nothing else.",
    story: "Joined with wedged through-tenons you can see from below — the construction is the decoration.",
    materials: "Solid white oak, natural oil finish", dimensions: "H 52cm × Ø 40cm", care: "Re-oil annually. Coasters recommended but not enforced.",
    stock: 7, badge: "Low stock", featured: true,
  },
  {
    id: "boucle-lounge-chair", name: "Boucle Lounge Chair", category: "furniture",
    price: 890, compareAt: 1050, rating: 4.9, reviewCount: 26, image: "/images/products/boucle-chair.webp",
    description: "A deep, curved lounge chair upholstered in cream boucle over solid beech legs. The kind of chair people photograph before they sit in.",
    story: "The boucle is woven in Belgium with a looped yarn that resists pilling; the frame is guaranteed for ten years.",
    materials: "Belgian boucle (wool blend), solid beech frame", dimensions: "H 74cm × W 78cm × D 80cm", care: "Vacuum with upholstery attachment. Professional clean for stains.",
    stock: 4, badge: "Sale", featured: true,
    colors: [{ name: "Cream", hex: "#ece5d8" }, { name: "Taupe", hex: "#a89a86" }],
  },
  {
    id: "travertine-bookends", name: "Travertine Bookends, Pair", category: "decor",
    price: 95, rating: 4.7, reviewCount: 16, image: "/images/products/bookends.webp",
    description: "A pair of honed travertine bookends, each cut so the stone's ancient sediment lines run vertical — geology holding up literature.",
    story: "Quarried in Tivoli, outside Rome, from the same stone beds that built the Colosseum.",
    materials: "Honed Roman travertine", dimensions: "Each 15cm × 10cm × 10cm, 2.4kg", care: "Wipe dry. Avoid acids (lemon, wine) on the surface.",
    stock: 12, badge: "New",
  },
  {
    id: "smoked-amber-vase", name: "Smoked Amber Glass Vase", category: "decor",
    price: 110, rating: 4.6, reviewCount: 11, image: "/images/products/amber-vase.webp",
    description: "A mouth-blown vase in smoked amber with a gentle ribbed texture. Empty, it's sculpture; filled, it's a sunset.",
    story: "Blown into a ridged mould, then tooled by hand so the ribs wander slightly — deliberate imperfection.",
    materials: "Mouth-blown soda-lime glass", dimensions: "H 28cm × Ø 15cm", care: "Hand wash with warm water and a bottle brush.",
    stock: 8,
  },
  {
    id: "hinoki-bath-stool", name: "Hinoki Bath Stool", category: "bath",
    price: 165, rating: 4.9, reviewCount: 22, image: "/images/products/bath-stool.webp",
    description: "A traditional hinoki cypress bath stool with a slatted top. It smells faintly of a forest after rain, because that's what hinoki does.",
    story: "Hinoki's natural oils resist water and mould — Japanese bathhouses have trusted it for a thousand years.",
    materials: "Solid hinoki cypress, unfinished", dimensions: "H 30cm × W 44cm × D 28cm", care: "Rinse after use, dry in ventilation. Never seal or varnish.",
    stock: 10, badge: "Bestseller",
  },
  {
    id: "waffle-towel-set", name: "Waffle Weave Towels, Set of 3", category: "bath",
    price: 78, rating: 4.7, reviewCount: 38, image: "/images/products/waffle-towels.webp",
    description: "Three organic-cotton waffle towels — bath, hand and face. The honeycomb weave dries fast and packs flat, like a towel designed by an engineer who naps.",
    story: "Woven on slow looms in Imabari, Japan's towel capital, then washed in soft mountain water.",
    materials: "100% GOTS-certified organic cotton", dimensions: "Bath 140×70cm, hand 80×40cm, face 34×34cm", care: "Machine wash warm, tumble low. No fabric softener — it kills absorbency.",
    stock: 19, featured: true,
  },
  {
    id: "embers-cedar-candle", name: "Embers & Cedar Candle", category: "fragrance",
    price: 52, rating: 4.8, reviewCount: 71, image: "/images/products/candle.webp",
    description: "Cedarwood, birch tar and a low note of ember — poured into a handmade ceramic vessel you'll keep long after the last burn.",
    story: "Sixty hours of burn time; the vessel is thrown by the same studio that makes our Terra vases.",
    materials: "Soy-coconut wax, cotton wick, ceramic vessel", dimensions: "220g, approx. 60 hours", care: "Trim wick to 5mm. First burn: let the pool reach the edge.",
    stock: 28, badge: "Bestseller", featured: true,
  },
  {
    id: "amber-reed-diffuser", name: "Amber Reed Diffuser", category: "fragrance",
    price: 64, rating: 4.5, reviewCount: 14, image: "/images/products/diffuser.webp",
    description: "Amber, labdanum and dried fig in an apothecary bottle with black rattan reeds. Three months of scent with zero flame.",
    story: "Blended in Grasse, France; the base is a sugar-derived carrier rather than alcohol, so the scent releases slowly.",
    materials: "Amber glass, natural rattan reeds, alcohol-free base", dimensions: "200ml, lasts approx. 12 weeks", care: "Flip reeds weekly. Keep off polished wood.",
    stock: 16,
  },
  {
    id: "linen-notebook-trio", name: "Linen-Bound Notebooks, Set of 3", category: "stationery",
    price: 36, rating: 4.6, reviewCount: 25, image: "/images/products/notebooks.webp",
    description: "Three pocket notebooks bound in book linen — clay, olive and sand. One for lists, one for ideas, one you'll refuse to write in.",
    story: "The paper is 100gsm, fountain-pen friendly, and milled from recycled cotton rags.",
    materials: "Recycled cotton paper, book linen, thread-sewn", dimensions: "A6, 64 pages each, dot grid", care: "Keep dry. Patina of pocket wear is encouraged.",
    stock: 40,
  },
  {
    id: "brass-pen-tray", name: "Solid Brass Pen & Leather Tray", category: "stationery",
    price: 88, rating: 4.7, reviewCount: 9, image: "/images/products/brass-pen.webp",
    description: "A solid brass pen with real heft, resting on a vegetable-tanned leather tray. For signatures that deserve a small ceremony.",
    story: "The pen is lathe-turned from a brass bar and takes standard G2 refills — built to outlive its owner.",
    materials: "Solid brass, vegetable-tanned leather", dimensions: "Pen 14cm; tray 20×8cm", care: "Polish brass or let it darken. Condition leather yearly.",
    stock: 15, badge: "New",
  },
  {
    id: "terracotta-planter-trio", name: "Terracotta Planter Trio", category: "garden",
    price: 54, rating: 4.6, reviewCount: 31, image: "/images/products/planters.webp",
    description: "Three graduated terracotta pots with drainage and saucers. The white mineral bloom they develop isn't a flaw — it's the pot breathing.",
    story: "Fired from Tuscan clay that's frost-resistant to -10°C, so they can live outside year-round.",
    materials: "Unglazed Tuscan terracotta", dimensions: "Ø 12, 16 & 20cm", care: "Soak before first planting. Bring under cover in hard frost.",
    stock: 21, badge: "Bestseller",
  },
  {
    id: "steel-watering-can", name: "Steel Indoor Watering Can", category: "garden",
    price: 62, rating: 4.7, reviewCount: 18, image: "/images/products/watering-can.webp",
    description: "A brushed-steel can with a long slender spout that reaches the back row of a shelf without baptising the front row.",
    story: "The spout is hand-soldered at a 34° angle — measured, apparently, with a protractor and strong opinions.",
    materials: "Brushed stainless steel", dimensions: "1L capacity, spout 22cm", care: "Empty after use to avoid water spots.",
    stock: 13,
  },
  {
    id: "seagrass-basket-pair", name: "Seagrass Baskets, Set of 2", category: "storage",
    price: 70, rating: 4.5, reviewCount: 20, image: "/images/products/baskets.webp",
    description: "Two handwoven seagrass baskets with sturdy handles. Throws, toys, kindling, the general entropy of a household — all of it, suddenly charming.",
    story: "Woven by a women's cooperative in Vietnam; each basket takes a full day of weaving.",
    materials: "Handwoven natural seagrass", dimensions: "Ø 40×35cm and Ø 32×28cm", care: "Keep dry. Reshape by steaming if squashed in transit.",
    stock: 18,
  },
  {
    id: "modular-oak-shelf", name: "Modular Oak Wall Shelf", category: "storage",
    price: 135, rating: 4.8, reviewCount: 13, image: "/images/products/wall-shelf.webp",
    description: "A single solid-oak shelf with hidden brass fixings. Buy one for a moment of display; buy three and you have a system.",
    story: "The bracket is machined brass rated to 25kg — engineered for books, not just succulents.",
    materials: "Solid oak, machined brass bracket", dimensions: "60cm × 18cm × 3cm", care: "Fixings included for masonry and stud walls.",
    stock: 9, badge: "Low stock",
  },
  {
    id: "matte-black-cutlery", name: "Matte Black Cutlery, 16 Pieces", category: "tableware",
    price: 140, rating: 4.6, reviewCount: 24, image: "/images/products/cutlery.webp",
    description: "Sixteen pieces of matte-black 18/10 stainless cutlery — four knives, forks, tablespoons and teaspoons. Dinner, but make it cinema.",
    story: "The black finish is PVD-coated rather than painted, so it survives the dishwasher without flaking.",
    materials: "18/10 stainless steel, PVD matte black coating", dimensions: "Full 16-piece service for four", care: "Dishwasher safe. Avoid prolonged soaking.",
    stock: 12, badge: "New", featured: true,
  },
  {
    id: "mouthblown-wine-glasses", name: "Mouth-Blown Wine Glasses, Pair", category: "tableware",
    price: 76, rating: 4.9, reviewCount: 33, image: "/images/products/wine-glasses.webp",
    description: "A pair of featherweight wine glasses with a slight organic waviness in the stem. Thin enough to make a Tuesday bottle taste like a decision.",
    story: "Each glass is pulled and shaped by a two-person team; the seam-free stem is the tell of hand work.",
    materials: "Mouth-blown lead-free crystal", dimensions: "H 22cm, 420ml", care: "Hand wash, polish with linen.",
    stock: 15, badge: "Bestseller",
  },
  {
    id: "stussy-jacket", name: "Stussy Jacket", category: "jackets",
    price: 234, rating: 4.9, reviewCount: 5231, image: "/images/products/stussy-jacket.png",
    description: "The Stussy Jacket brings a relaxed varsity silhouette into an easy everyday layer. Its washed-blue finish and bold graphic details give it character without making it difficult to style. The cotton-blend shell has room for a tee or light knit, while the hip-length cut keeps proportions casual. Wear it over simple layers on mild days or when the evening cools.",
    story: "An easy everyday layer with a clean silhouette and unmistakable presence.",
    materials: "Cotton blend outer shell", dimensions: "Relaxed fit; hip length", care: "Machine wash cold with like colors. Hang to dry.",
    stock: 18, badge: "Bestseller", featured: true,
    colors: [{ name: "Washed blue", hex: "#71879a" }],
  },
  {
    id: "mwdbl-jacket", name: "MWDBL Jacket", category: "jackets",
    price: 228, rating: 4.8, reviewCount: 4928, image: "/images/products/mwdbl-jacket.png",
    description: "The MWDBL Jacket pairs a deep green body with cream panels for a clear contrast that still feels easy to wear. Its regular, hip-length cut leaves room for a light layer without looking oversized, and the woven shell gives it a structured outline. Reach for it over a tee on the commute or a knit when the weather turns.",
    story: "A versatile layer designed to work over a tee or knit through changing seasons.",
    materials: "Woven outer shell with a relaxed lining", dimensions: "Regular fit; hip length", care: "Machine wash cold on a gentle cycle. Hang to dry.",
    stock: 16, badge: "New", featured: true,
    colors: [{ name: "Rust", hex: "#ad694f" }],
  },
  {
    id: "chaotic-club", name: "Chaotic Club", category: "apparel",
    price: 88, rating: 4.8, reviewCount: 216, image: "/images/products/chaotic-club-spooky.png",
    gallery: ["/images/products/stussy-jacket.png", "/images/products/mwdbl-jacket.png"],
    description: "Chaotic Club is a relaxed graphic layer built around its standout number detail. The cotton-jersey blend feels soft against a tee or on its own, while the easy hip-length shape leaves room through the body without swallowing the silhouette. Pair it with denim for a low-effort outfit or let the graphic lead while the rest stays simple.",
    story: "Designed as a versatile statement piece that brings streetwear character to a casual wardrobe.",
    materials: "Cotton jersey blend", dimensions: "Relaxed fit; hip length", care: "Machine wash cold with like colors. Hang to dry.",
    stock: 24, badge: "New",
  },
  {
    id: "sneakers", name: "Sneakers", category: "shoes",
    price: 120, rating: 4.7, reviewCount: 184, image: "/images/products/sneakers.png",
    gallery: ["/images/products/bucket-hat.jpg", "/images/products/chaotic-club-spooky.png"],
    description: "These low-top sneakers combine a layered blue-and-white mesh and synthetic leather upper with a cushioned rubber outsole for everyday walking. The colour adds interest without limiting the rest of an outfit, and the low profile works with denim, casual trousers, or shorts. Made for regular rotation rather than a special occasion, they are easy to reach for on commutes, errands, and relaxed weekends.",
    story: "A practical, versatile pair designed to bring a fresh color accent to daily outfits.",
    materials: "Mesh and synthetic leather upper, rubber outsole", dimensions: "Low-top profile", care: "Spot clean with a soft damp cloth. Air dry.",
    ...catalogVariantDefaults.sneakers,
    stock: 32, badge: "Bestseller",
  },
  {
    id: "seashell-bag", name: "Seashell Bag", category: "bags",
    price: 95, rating: 4.9, reviewCount: 93, image: "/images/products/pearl-seashell-bag.png",
    gallery: ["/images/products/baskets.webp", "/images/products/bucket-hat.jpg"],
    description: "The Seashell Bag keeps daily essentials close in a compact shoulder silhouette. Its softly curved shape and deep burgundy finish bring character without making the bag feel tied to one occasion. Textured synthetic leather and metal hardware give it a defined finish, while the practical scale works for a phone, cards, keys, and a few small extras.",
    story: "A distinctive everyday accessory with a sculptural shape that moves easily from day to evening.",
    materials: "Textured synthetic leather with metal hardware", dimensions: "Compact shoulder bag", care: "Wipe clean with a soft dry cloth. Store in a dust bag.",
    ...catalogVariantDefaults["seashell-bag"],
    stock: 18, badge: "New",
  },
  {
    id: "mens-golf-cap", name: "Men's Golf Cap", category: "accessories",
    price: 48, rating: 4.6, reviewCount: 71, image: "/images/products/mens-golf-cap.png",
    gallery: ["/images/products/bucket-hat.jpg", "/images/products/mwdbl-jacket.png"],
    description: "The Men's Golf Cap uses a clean six-panel shape and curved brim for a familiar fit on and off the course. Cotton twill keeps the finish casual, while understated embroidery avoids a loud logo. Its adjustable one-size construction makes it easy to fine-tune, and the simple profile pairs naturally with sportswear, weekend layers, or an everyday tee.",
    story: "A versatile finishing piece designed for comfortable wear through long days outdoors.",
    materials: "Cotton twill", dimensions: "Adjustable one-size fit", care: "Spot clean gently. Do not machine wash.",
    stock: 40,
  },
];

type HomepagePreviewSpec = Pick<
  Product,
  "id" | "name" | "category" | "price" | "rating" | "reviewCount" | "image"
> & { sourceId: string };

const legacyUsdHomepagePreviewProducts: Product[] = ([
  {
    sourceId: "stussy-jacket",
    id: "layout-preview-jacket-01",
    name: "Varsity Jacket",
    category: "jackets",
    price: 218,
    rating: 4.8,
    reviewCount: 64,
    image: "/images/products/stussy-jacket.png",
  },
  {
    sourceId: "mwdbl-jacket",
    id: "layout-preview-jacket-02",
    name: "Track Jacket",
    category: "jackets",
    price: 204,
    rating: 4.7,
    reviewCount: 38,
    image: "/images/products/mwdbl-jacket.png",
  },
  {
    sourceId: "chaotic-club",
    id: "layout-preview-apparel-01",
    name: "Graphic Tee",
    category: "apparel",
    price: 82,
    rating: 4.8,
    reviewCount: 46,
    image: "/images/products/chaotic-club-spooky.png",
  },
  {
    sourceId: "chaotic-club",
    id: "layout-preview-apparel-02",
    name: "Studio T-Shirt",
    category: "apparel",
    price: 76,
    rating: 4.6,
    reviewCount: 29,
    image: "/images/products/chaotic-club-spooky.png",
  },
  {
    sourceId: "sneakers",
    id: "layout-preview-shoes-01",
    name: "Court Sneakers",
    category: "shoes",
    price: 118,
    rating: 4.7,
    reviewCount: 52,
    image: "/images/products/sneakers.png",
  },
  {
    sourceId: "sneakers",
    id: "layout-preview-shoes-02",
    name: "Everyday Runners",
    category: "shoes",
    price: 126,
    rating: 4.8,
    reviewCount: 41,
    image: "/images/products/sneakers.png",
  },
  {
    sourceId: "seashell-bag",
    id: "layout-preview-bag-01",
    name: "Daily Crossbody",
    category: "bags",
    price: 88,
    rating: 4.7,
    reviewCount: 35,
    image: "/images/products/pearl-seashell-bag.png",
  },
  {
    sourceId: "seashell-bag",
    id: "layout-preview-bag-02",
    name: "Mini Shoulder Bag",
    category: "bags",
    price: 92,
    rating: 4.8,
    reviewCount: 27,
    image: "/images/products/pearl-seashell-bag.png",
  },
  {
    sourceId: "mens-golf-cap",
    id: "layout-preview-accessory-01",
    name: "Canvas Bucket Hat",
    category: "accessories",
    price: 38,
    rating: 4.6,
    reviewCount: 22,
    image: "/images/products/bucket-hat.jpg",
  },
  {
    sourceId: "mens-golf-cap",
    id: "layout-preview-accessory-02",
    name: "Classic Panel Cap",
    category: "accessories",
    price: 44,
    rating: 4.7,
    reviewCount: 31,
    image: "/images/products/mens-golf-cap.png",
  },
 ] satisfies HomepagePreviewSpec[]).map(({ sourceId, ...preview }) => {
  const source = legacyUsdProductCatalog.find((product) => product.id === sourceId);
  if (!source) throw new Error(`Missing homepage preview source product: ${sourceId}`);

  return {
    ...source,
    ...preview,
    description: "Temporary local preview item for checking the homepage product layout.",
    story: "Temporary product data for a local homepage layout preview.",
    badge: "New" as const,
  };
});

const availableProductIds = new Set([
  "stussy-jacket",
  "mwdbl-jacket",
  "chaotic-club",
  "sneakers",
  "seashell-bag",
  "mens-golf-cap",
]);

const legacyUsdProducts = [
  ...legacyUsdProductCatalog.filter((product) => availableProductIds.has(product.id)),
  ...(process.env.NODE_ENV === "development" ? legacyUsdHomepagePreviewProducts : []),
];

export const products: Product[] = legacyUsdProducts.map((product) => ({
  ...product,
  price: legacyUsdPriceToNgn(product.price),
  ...(product.compareAt == null ? {} : { compareAt: legacyUsdPriceToNgn(product.compareAt) }),
}));

export interface Review {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
  sample?: boolean;
}

type ReviewSeed = Omit<Review, "id" | "verified" | "sample">;

const reviewSeeds: Record<string, ReviewSeed[]> = {
  "stussy-jacket": [
    { author: "Maya R.", location: "Lagos", rating: 5, date: "2026-11-08", title: "An easy layer", body: "Fits over a tee or light knit without feeling bulky. The blue has a little more depth in person." },
    { author: "T. A.", location: "Abuja", rating: 4, date: "2026-10-25", title: "Good fit, long sleeves", body: "The body fits true to size; the cuffs cover more of my hands than expected. Still reaching for it most days." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-14", title: "Better than expected", body: "Light enough to wear indoors but holds its shape outside. The pockets are actually useful." },
    { author: "Nneka O.", location: "Port Harcourt", rating: 5, date: "2026-10-02", title: "A solid everyday piece", body: "The relaxed cut works with jeans and smarter trousers. It feels considered without trying too hard." },
    { author: "J. K.", location: "", rating: 4, date: "2026-09-21", title: "Just check the size guide", body: "I usually take a medium and could have gone down one. The fabric and finish are both lovely." },
    { author: "Ibrahim S.", location: "Kaduna", rating: 3, date: "2026-09-09", title: "One small zip snag", body: "The zipper caught the lining once or twice at first. It has settled down, and the jacket itself is comfortable." },
    { author: "Anonymous", location: "", rating: 4, date: "2026-08-28", title: "Wearing it more than planned", body: "The collar sits well and it is not too warm for a mild day. A dependable grab-and-go layer." },
    { author: "Dara E.", location: "Lagos", rating: 5, date: "2026-08-16", title: "A good gift", body: "Bought this for my brother. He liked the understated details and has worn it every time we have met since." },
  ],
  "mwdbl-jacket": [
    { author: "Kelechi M.", location: "Lagos", rating: 5, date: "2026-11-06", title: "The fit is the best part", body: "Room through the shoulders without looking oversized. I can layer a hoodie underneath comfortably." },
    { author: "R. B.", location: "London", rating: 4, date: "2026-10-23", title: "Good jacket for the price", body: "The material feels sturdy and the pockets sit where I need them. Slightly heavier than I expected." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-12", title: "A regular in my rotation", body: "Works with most of what I own and still looks neat after a full day out." },
    { author: "Tomi A.", location: "Ibadan", rating: 5, date: "2026-09-30", title: "Nice details up close", body: "The stitching and hardware feel well finished. It looks simple from a distance, which I like." },
    { author: "F. O.", location: "", rating: 4, date: "2026-09-18", title: "Runs a little roomy", body: "I prefer a closer fit, so I would size down next time. The jacket is comfortable and easy to style." },
    { author: "Zainab L.", location: "Abuja", rating: 3, date: "2026-09-05", title: "Good, with a small caveat", body: "The lining took a little while to soften. After a few wears it sits better and feels much more natural." },
    { author: "Anonymous", location: "", rating: 4, date: "2026-08-24", title: "Useful from day one", body: "Warm enough for an evening commute and easy to throw over a shirt. No fuss, which is exactly right." },
    { author: "Emeka N.", location: "Enugu", rating: 5, date: "2026-08-11", title: "Would buy again", body: "The cut is easy and the finish is better than jackets I have paid more for. Delivery was straightforward." },
  ],
  "chaotic-club": [
    { author: "Amara D.", location: "Lagos", rating: 5, date: "2026-11-04", title: "The print has personality", body: "The graphic is bold without taking over the whole outfit. The cotton feels soft after washing." },
    { author: "S. P.", location: "Accra", rating: 4, date: "2026-10-21", title: "A relaxed fit", body: "Loose in the way I hoped. If you like a neater shape, consider sizing down." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-10", title: "Better in person", body: "The colours are a little richer than they look online, and the fabric is comfortable all day." },
    { author: "Chidi O.", location: "Abuja", rating: 5, date: "2026-09-28", title: "Easy to wear", body: "I have worn it with denim and under a jacket. The print still looks good after a gentle wash." },
    { author: "M. J.", location: "", rating: 4, date: "2026-09-16", title: "Check the measurements", body: "The shoulders are intentionally roomy. I measured a shirt I already own and got the size right." },
    { author: "Rita E.", location: "Benin City", rating: 3, date: "2026-09-03", title: "A little thinner than expected", body: "Nice graphic and a comfortable cut, though I expected a heavier tee. Best for layering." },
    { author: "Anonymous", location: "", rating: 4, date: "2026-08-22", title: "A fun everyday tee", body: "The print gets noticed, but the fit is what keeps me wearing it. Nothing scratchy around the neck." },
    { author: "Femi A.", location: "Lagos", rating: 5, date: "2026-08-09", title: "One of my favourites", body: "The shape holds up and the artwork feels distinctive. I would happily pick up another colour." },
  ],
  sneakers: [
    { author: "Oliver P.", location: "Dublin", rating: 3, date: "2026-11-02", title: "Good, not flawless", body: "Lovely pair overall, though mine arrived with a tiny mark on the sole. Support responded within a day and made it right." },
    { author: "Elise V.", location: "Paris", rating: 5, date: "2026-10-19", title: "A comfortable daily pair", body: "They are the shoes I reach for most often. Comfortable on a long walk and easy to wear with simple outfits." },
    { author: "Aisha R.", location: "Toronto", rating: 4, date: "2026-10-08", title: "Slow ship, good shoes", body: "Took nine days to arrive, which tested my patience — but they felt comfortable straight out of the box." },
    { author: "N. C.", location: "", rating: 5, date: "2026-09-26", title: "More comfortable than they look", body: "The sole has enough cushioning for a full day on my feet. They needed almost no breaking in." },
    { author: "Chisom B.", location: "Lagos", rating: 4, date: "2026-09-14", title: "The colour goes with a lot", body: "The blue is subtle in person and works with more outfits than I expected. Sizing felt standard for me." },
    { author: "Anonymous", location: "", rating: 3, date: "2026-09-01", title: "A little narrow at first", body: "The toe box felt snug for the first few wears, then eased up. I would check the size details if you prefer extra room." },
    { author: "M. O.", location: "Bristol", rating: 5, date: "2026-08-20", title: "Good everyday trainers", body: "Light, easy to clean, and comfortable on the walk to work. They have held their shape so far." },
    { author: "Daniel K.", location: "Abuja", rating: 4, date: "2026-08-07", title: "As pictured", body: "The colours and shape match the photos. They feel sturdy without being too heavy." },
  ],
  "seashell-bag": [
    { author: "Leila H.", location: "Beirut", rating: 5, date: "2026-11-01", title: "Small but useful", body: "Fits my phone, card case, keys, and a few small extras. The curved shape sits nicely against the body." },
    { author: "P. N.", location: "", rating: 4, date: "2026-10-18", title: "A lovely colour", body: "The burgundy is rich but still easy to wear. The strap could be a little longer for a heavier coat." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-07", title: "Just enough room", body: "I wanted a bag for essentials rather than everything. The clasp is simple and the lining feels neat." },
    { author: "Ngozi T.", location: "Lagos", rating: 5, date: "2026-09-25", title: "Nice shape, no fuss", body: "It keeps its shape when set down and the finish wipes clean easily. I have used it most weekends." },
    { author: "M. A.", location: "Nairobi", rating: 4, date: "2026-09-12", title: "Good for going out", body: "Light enough to carry all evening. I would not choose it when I need to bring a tablet or a water bottle." },
    { author: "Anonymous", location: "", rating: 3, date: "2026-08-30", title: "The strap took adjusting", body: "It took a couple of tries to find the right strap length, but it stays put now and the bag is comfortable." },
    { author: "Sarah W.", location: "Manchester", rating: 5, date: "2026-08-18", title: "A thoughtful gift", body: "Bought it for my mum and she liked the shape immediately. The packaging was simple and arrived in good condition." },
    { author: "Tunde A.", location: "Ibadan", rating: 4, date: "2026-08-05", title: "Well made for everyday", body: "The stitching looks tidy and the hardware feels solid. It is compact, just as described." },
  ],
  "mens-golf-cap": [
    { author: "Henrik B.", location: "Oslo", rating: 5, date: "2026-10-30", title: "A cap that fits properly", body: "The adjuster gives a secure fit without pressing at the sides. The brim keeps its shape." },
    { author: "J. L.", location: "", rating: 4, date: "2026-10-17", title: "Good for daily wear", body: "Lightweight and comfortable on a warm day. The embroidery is subtle, which suits me." },
    { author: "Anonymous", location: "", rating: 5, date: "2026-10-06", title: "Exactly what I needed", body: "No stiff crown or oversized logo. It packs easily and still looks tidy when I put it back on." },
    { author: "Ade O.", location: "Lagos", rating: 4, date: "2026-09-24", title: "Nice shape", body: "The curved brim is just right and the cotton feels breathable. I would have liked one more colour option." },
    { author: "M. R.", location: "Dublin", rating: 5, date: "2026-09-11", title: "Simple and comfortable", body: "Bought it for the course but wear it on errands too. The strap is easy to adjust." },
    { author: "Anonymous", location: "", rating: 3, date: "2026-08-29", title: "Runs a touch small", body: "It fits, but there is not much room left on the adjuster for a larger head. The finish is otherwise good." },
    { author: "Kola S.", location: "Abuja", rating: 5, date: "2026-08-17", title: "A good everyday cap", body: "The fabric feels durable and the shape does not collapse after a few wears. Easy to clean by hand." },
    { author: "F. D.", location: "", rating: 4, date: "2026-08-04", title: "Understated in a good way", body: "Comfortable, practical, and without extra branding. It is the one I keep by the door." },
  ],
};

/** Temporary product-specific samples; replace with customer-submitted reviews when available. */
export function reviewsFor(productId: string): Review[] {
  return (reviewSeeds[productId] ?? []).map((review, index) => ({
    ...review,
    id: `${productId}-sample-${index + 1}`,
    verified: false,
    sample: true,
  }));
}

const cardReviewCountOverrides: Record<string, number> = {
  "stussy-jacket": 216,
  "mwdbl-jacket": 184,
};

export function cardReviewCount(product: Product): number {
  return product.manualReviewCount ?? cardReviewCountOverrides[product.id] ?? product.reviewCount;
}

export function productById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function categoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}

export function productsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

export function categoryName(slug: string): string {
  return categoryBySlug(slug)?.name ?? slug;
}

export const FREE_SHIPPING_THRESHOLD_NGN = 203_106;
export const STANDARD_SHIPPING_FEE_NGN = 12_186;
export const EXPRESS_SHIPPING_FEE_NGN = 18_957;
export const WHITE_GLOVE_SHIPPING_FEE_NGN = 66_348;
