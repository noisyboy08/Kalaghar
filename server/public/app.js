/**
 * Kalaghar — Luxury 24s.com-Inspired Artisan Marketplace
 * Complete Frontend Logic
 */

let productsList = [];
let selectedCategory = 'all';
let maxPriceFilter = 10000;
let selectedRegions = [];
let currentSort = 'default';

// ─── Initialization ───
document.addEventListener('DOMContentLoaded', () => {
  fetchCatalog();
  initForm();
  initHeaderScroll();
});

// ─── Header Scroll Effect ───
function initHeaderScroll() {
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const header = document.getElementById('siteHeader');
    if (header) {
      if (window.scrollY > 20) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    lastScroll = window.scrollY;
  });
}

let isAdminLoggedIn = false;

function checkAdminAccess() {
  if (isAdminLoggedIn) {
    showTab('admin');
  } else {
    showTab('admin-login');
  }
}

function handleAdminLogin(e) {
  e.preventDefault();
  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;
  
  // Basic mock authentication like Amazon or other generic sites
  if (email && password) {
    isAdminLoggedIn = true;
    showTab('admin');
  }
}

// ─── Tab Switcher ───
function showTab(tabName) {
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('tab-' + tabName);
  if (target) target.classList.add('active');

  if (tabName === 'gridfilter') renderFilterGrid();
  if (tabName === 'admin') {
    loadAdminProducts();
    loadAdminArtisans();
    loadAdminOrders();
    loadApprovalQueue();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Mobile Nav ───
function setMobileNav(btn) {
  document.querySelectorAll('.mnb-item').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ─── Search ───
function toggleSearch() {
  const overlay = document.getElementById('searchOverlay');
  overlay.classList.toggle('open');
  if (overlay.classList.contains('open')) {
    setTimeout(() => document.getElementById('searchInput').focus(), 100);
  }
}

function liveSearch(query) {
  const container = document.getElementById('searchSuggestions');
  if (!container) return;
  const q = query.toLowerCase().trim();
  if (!q) { container.innerHTML = ''; return; }

  const matches = productsList.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.description && p.description.toLowerCase().includes(q)) ||
    (p.sellerName && p.sellerName.toLowerCase().includes(q)) ||
    (p.craft && p.craft.toLowerCase().includes(q))
  ).slice(0, 5);

  if (matches.length === 0) {
    container.innerHTML = '<div class="search-suggestion-item" style="color:var(--text-muted)">No results found</div>';
    return;
  }

  container.innerHTML = matches.map(p => `
    <div class="search-suggestion-item" onclick="toggleSearch(); openProductDetails('${p._id}')">
      <span style="font-size:1.2rem">&#128270;</span>
      <span><strong>${p.name}</strong> — Rs.${p.price.toLocaleString('en-IN')}</span>
    </div>
  `).join('');
}

// ─── Full Kalaghar Product Catalog (built-in, works without DB) ───
const KALAGHAR_CATALOG = [
  {
    "_id": "kg-kit-01",
    "name": "Brass Heavy-Gauge Handi & Biryani Pot",
    "price": 2450,
    "stock": 15,
    "craft": "Metal Craft",
    "category": "Kitchen & Dining",
    "region": "Uttar Pradesh",
    "technique": "Brass Hammering & Tin Coating",
    "sellerName": "Moradabad Brass Masters",
    "status": "approved",
    "sku": "KG-KIT-0001",
    "description": "Traditional heavy-gauge pure brass handi with tin lining (kalai). Perfect for slow-cooked authentic biryani and curries.",
    "images": [
      "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80",
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80"
    ],
    "rating": 4.8,
    "reviewsCount": 34
  },
  {
    "_id": "kg-kit-02",
    "name": "Sheesham Wood Chopping Board with Brass Handle",
    "price": 1150,
    "stock": 30,
    "craft": "Woodcraft",
    "category": "Kitchen & Dining",
    "region": "Karnataka",
    "technique": "Hand-carved Sheesham",
    "sellerName": "Saharanpur Wood Guild",
    "status": "approved",
    "sku": "KG-KIT-0002",
    "description": "Single-block solid Sheesham wood chopping board treated with organic food-grade cold-pressed oils.",
    "images": [
      "https://images.unsplash.com/photo-1590794056226-77ef3a6c4743?w=800&q=80"
    ],
    "rating": 4.7,
    "reviewsCount": 22
  },
  {
    "_id": "kg-cln-01",
    "name": "Hand-Woven Seagrass Large Laundry Basket",
    "price": 1850,
    "stock": 12,
    "craft": "Bamboo & Cane",
    "category": "Home Cleaning & Laundry",
    "region": "Assam",
    "technique": "Natural Cane Weaving",
    "sellerName": "Assam Craft Collective",
    "status": "approved",
    "sku": "KG-CLN-0001",
    "description": "Sustainable, breathable handwoven natural seagrass laundry basket with sturdy handles and cotton cloth liner.",
    "images": [
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 18
  },
  {
    "_id": "kg-org-01",
    "name": "Handwoven Eco Jute Storage Baskets (Set of 3)",
    "price": 1450,
    "stock": 20,
    "craft": "Sustainable Craft",
    "category": "Home Organization & Storage",
    "region": "West Bengal",
    "technique": "Jute Braiding",
    "sellerName": "Bengal Eco Weavers",
    "status": "approved",
    "sku": "KG-ORG-0001",
    "description": "Set of 3 multi-utility braided jute storage baskets for wardrobe, living room toys, or plant cover holders.",
    "images": [
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80"
    ],
    "rating": 4.6,
    "reviewsCount": 41
  },
  {
    "_id": "kg-dec-01",
    "name": "Royal Brass Elephant Floor Diya Oil Lamp",
    "price": 3200,
    "stock": 10,
    "craft": "Metal Craft",
    "category": "Home Decor & Lighting",
    "region": "Tamil Nadu",
    "technique": "Brass Casting & Engraving",
    "sellerName": "Kumbakonam Artisans",
    "status": "approved",
    "sku": "KG-DEC-0001",
    "description": "Handcrafted antique brass standing diya lamp with intricate elephant pedestal and 5 wick oil cups.",
    "images": [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 52
  },
  {
    "_id": "kg-fur-01",
    "name": "Hand-Carved Sheesham Wood Coffee Table",
    "price": 14500,
    "stock": 5,
    "craft": "Woodcraft",
    "category": "Living Room Furniture",
    "region": "Rajasthan",
    "technique": "Jali Carving",
    "sellerName": "Jodhpur Heritage Furniture",
    "status": "approved",
    "sku": "KG-FUR-0001",
    "description": "Solid Sheesham wood center coffee table featuring handcrafted floral jali lattice work.",
    "images": [
      "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80"
    ],
    "rating": 5,
    "reviewsCount": 14
  },
  {
    "_id": "kg-bar-01",
    "name": "Sheesham High Bar Stool with Leather Seat",
    "price": 6500,
    "stock": 8,
    "craft": "Woodcraft",
    "category": "Kitchen Furniture & Bar",
    "region": "Rajasthan",
    "technique": "Wood Joinery & Leatherwork",
    "sellerName": "Jodhpur Heritage Furniture",
    "status": "approved",
    "sku": "KG-BAR-0001",
    "description": "Rustic solid Sheesham wooden bar stool featuring genuine hand-stitched tan leather cushion.",
    "images": [
      "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80"
    ],
    "rating": 4.7,
    "reviewsCount": 9
  },
  {
    "_id": "kg-bth-01",
    "name": "Hand-Carved Sandalwood Bath Accessory Set",
    "price": 1950,
    "stock": 15,
    "craft": "Woodcraft",
    "category": "Bathroom & Hygiene",
    "region": "Karnataka",
    "technique": "Sandalwood Carving",
    "sellerName": "Mysuru Sandalwood Guild",
    "status": "approved",
    "sku": "KG-BTH-0001",
    "description": "Natural aromatic sandalwood soap dish, toothbrush tumbler, and lotion dispenser with brass pump.",
    "images": [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
    ],
    "rating": 4.8,
    "reviewsCount": 28
  },
  {
    "_id": "kg-bed-01",
    "name": "Sanganeri Hand Block-Print Cotton Bedsheet Set",
    "price": 2250,
    "stock": 25,
    "craft": "Textiles & Handloom",
    "category": "Bedroom & Bedding",
    "region": "Rajasthan",
    "technique": "Sanganeri Block Printing",
    "sellerName": "Jaipur Textile Studio",
    "status": "approved",
    "sku": "KG-BED-0001",
    "description": "100% 300-thread count breathable cotton king-size bedsheet with 2 matching pillow covers.",
    "images": [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 65
  },
  {
    "_id": "kg-gdn-01",
    "name": "Terracotta Hand-painted Garden Planters (Set of 3)",
    "price": 1400,
    "stock": 18,
    "craft": "Pottery & Ceramics",
    "category": "Garden & Outdoor",
    "region": "West Bengal",
    "technique": "Terracotta Pottery",
    "sellerName": "Bishnupur Clay Guild",
    "status": "approved",
    "sku": "KG-GDN-0001",
    "description": "Traditional weather-resistant terracotta pots hand-painted with tribal folk patterns.",
    "images": [
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&q=80"
    ],
    "rating": 4.6,
    "reviewsCount": 30
  },
  {
    "_id": "kg-sft-01",
    "name": "Antique Brass Decorative Lion Door Lock",
    "price": 1750,
    "stock": 10,
    "craft": "Metal Craft",
    "category": "Home Safety & Utility",
    "region": "Uttar Pradesh",
    "technique": "Sand Casting",
    "sellerName": "Aligarh Lock Artisans",
    "status": "approved",
    "sku": "KG-SFT-0001",
    "description": "Functional vintage brass padlock molded in royal lion motif with 2 traditional skeleton keys.",
    "images": [
      "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&q=80"
    ],
    "rating": 4.8,
    "reviewsCount": 16
  },
  {
    "_id": "kg-smt-01",
    "name": "Smart Aroma Diffuser with Sandalwood Oil",
    "price": 3450,
    "stock": 15,
    "craft": "Home Fragrance",
    "category": "Smart Home",
    "region": "Karnataka",
    "technique": "Ultrasonic Atomization",
    "sellerName": "Kalaghar Modern Living",
    "status": "approved",
    "sku": "KG-SMT-0001",
    "description": "App-controlled smart mist diffuser with LED mood light paired with 100% pure Mysuru sandalwood oil.",
    "images": [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80"
    ],
    "rating": 4.7,
    "reviewsCount": 38
  },
  {
    "_id": "kg-app-01",
    "name": "Pre-Seasoned Cast Iron Cookware Skillet",
    "price": 1650,
    "stock": 20,
    "craft": "Metal Craft",
    "category": "Small Home Appliances",
    "region": "Tamil Nadu",
    "technique": "Cast Iron Foundry",
    "sellerName": "Kalaghar Heritage Iron",
    "status": "approved",
    "sku": "KG-APP-0001",
    "description": "Naturally non-stick 10-inch heavy cast iron frying skillet pre-seasoned with organic gingelly oil.",
    "images": [
      "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 88
  },
  {
    "_id": "kg-kds-01",
    "name": "Channapatna Eco Wooden Stacking Rings Toy",
    "price": 890,
    "stock": 35,
    "craft": "Woodcraft",
    "category": "Kids & Family Home Products",
    "region": "Karnataka",
    "technique": "Channapatna Lacquerware",
    "sellerName": "Channapatna Toy Guild",
    "status": "approved",
    "sku": "KG-KDS-0001",
    "description": "Non-toxic, organic vegetable dyed wooden stacking ring tower safe for toddlers and kids.",
    "images": [
      "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&q=80"
    ],
    "rating": 5,
    "reviewsCount": 45
  },
  {
    "_id": "kg-pet-01",
    "name": "Natural Woven Jute Pet Bed Basket",
    "price": 1550,
    "stock": 14,
    "craft": "Sustainable Craft",
    "category": "Pet Home Products",
    "region": "West Bengal",
    "technique": "Jute Weaving",
    "sellerName": "Bengal Eco Weavers",
    "status": "approved",
    "sku": "KG-PET-0001",
    "description": "Cozy, breathable braided jute pet basket with removable washable organic cotton inner cushion.",
    "images": [
      "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=800&q=80"
    ],
    "rating": 4.8,
    "reviewsCount": 19
  },
  {
    "_id": "kg-hwd-01",
    "name": "Antique Brass Cabinet Door Knobs (Set of 6)",
    "price": 1450,
    "stock": 40,
    "craft": "Metal Craft",
    "category": "Home Improvement & Hardware",
    "region": "Rajasthan",
    "technique": "Brass Molding",
    "sellerName": "Moradabad Brass Masters",
    "status": "approved",
    "sku": "KG-HWD-0001",
    "description": "Vintage floral hand-engraved solid brass knobs for kitchen cabinets, drawers, and wardrobe doors.",
    "images": [
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=800&q=80"
    ],
    "rating": 4.7,
    "reviewsCount": 31
  },
  {
    "_id": "kg-frg-01",
    "name": "Mysuru Sandalwood & Jasmine Reed Diffuser Set",
    "price": 1850,
    "stock": 25,
    "craft": "Home Fragrance",
    "category": "Home Fragrance",
    "region": "Karnataka",
    "technique": "Cold-pressed Essential Oils",
    "sellerName": "Mysuru Fragrance House",
    "status": "approved",
    "sku": "KG-FRG-0001",
    "description": "Luxury room reed diffuser infused with authentic Mysuru sandalwood and royal mogra jasmine oils.",
    "images": [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 62
  },
  {
    "_id": "kg-sus-01",
    "name": "Handcrafted Hammered Pure Copper Water Bottle (1L)",
    "price": 1450,
    "stock": 30,
    "craft": "Metal Craft",
    "category": "Sustainable & Reusable Products",
    "region": "Maharashtra",
    "technique": "Hand Hammering",
    "sellerName": "Tambat Ali Copper Guild",
    "status": "approved",
    "sku": "KG-SUS-0001",
    "description": "100% pure Ayurvedic jointless hammered copper bottle with leakproof brass cap.",
    "images": [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80"
    ],
    "rating": 4.8,
    "reviewsCount": 77
  },
  {
    "_id": "kg-pot-01",
    "name": "Jaipur Blue Pottery Cobalt Serving Bowl",
    "price": 1380,
    "stock": 18,
    "craft": "Pottery & Ceramics",
    "category": "Pottery & Ceramics",
    "region": "Rajasthan",
    "technique": "Jaipur Blue Pottery",
    "sellerName": "Kripal Singh Studio",
    "status": "approved",
    "sku": "KG-POT-0001",
    "description": "Authentic Jaipur blue pottery serving bowl hand-painted with cobalt blue floral motifs using quartz fritware.",
    "images": [
      "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=800&q=80",
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80"
    ],
    "rating": 4.8,
    "reviewsCount": 42
  },
  {
    "_id": "kg-pot-02",
    "name": "Royal Terracotta Clay Vase with Leaf Motif",
    "price": 1200,
    "stock": 15,
    "craft": "Pottery & Ceramics",
    "category": "Pottery & Ceramics",
    "region": "Rajasthan",
    "technique": "Wheel-thrown pottery",
    "sellerName": "Meera Sharma Clay Studio",
    "status": "approved",
    "sku": "KG-POT-0002",
    "description": "Hand-thrown earthen terracotta vase with etched leaf motifs fired in traditional wood kilns.",
    "images": [
      "https://images.unsplash.com/photo-1604928141064-207cea6f571f?w=800&q=80"
    ],
    "rating": 4.6,
    "reviewsCount": 29
  },
  {
    "_id": "kg-txt-01",
    "name": "Banarasi Katan Silk Saree with Pure Gold Zari",
    "price": 8900,
    "stock": 12,
    "craft": "Textiles & Handloom",
    "category": "Textiles & Handloom",
    "region": "Uttar Pradesh",
    "technique": "Banarasi Pit-Loom Weaving",
    "sellerName": "Varanasi Silk Weavers",
    "status": "approved",
    "sku": "KG-TXT-0001",
    "description": "Mulberry silk Banarasi saree adorned with royal zari brocade floral kadwa motifs woven by master weavers.",
    "images": [
      "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&q=80",
      "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80"
    ],
    "rating": 5,
    "reviewsCount": 84
  },
  {
    "_id": "kg-txt-02",
    "name": "Ajrakh Block-Print Mulberry Silk Dupatta",
    "price": 1950,
    "stock": 20,
    "craft": "Textiles & Handloom",
    "category": "Textiles & Handloom",
    "region": "Gujarat",
    "technique": "Ajrakh Natural Dye Block Print",
    "sellerName": "Kutch Khatri Block Printers",
    "status": "approved",
    "sku": "KG-TXT-0002",
    "description": "16-step natural indigo and madder root block-printed silk dupatta featuring geometric star motifs.",
    "images": [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 36
  },
  {
    "_id": "kg-app-02",
    "name": "Chanderi Silk Hand-Embroidered Kurta Set",
    "price": 3200,
    "stock": 15,
    "craft": "Apparel",
    "category": "Apparel",
    "region": "Madhya Pradesh",
    "technique": "Chanderi Weaving & Zardozi",
    "sellerName": "Chanderi Weaver Guild",
    "status": "approved",
    "sku": "KG-APR-0001",
    "description": "Lightweight sheer Chanderi silk kurta with intricate Zardozi neck embroidery and matching silk pants.",
    "images": [
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&q=80"
    ],
    "rating": 4.7,
    "reviewsCount": 23
  },
  {
    "_id": "kg-pnt-01",
    "name": "Madhubani Canvas Painting - Peacock Folklore",
    "price": 2850,
    "stock": 8,
    "craft": "Paintings & Wall Art",
    "category": "Paintings & Wall Art",
    "region": "Bihar",
    "technique": "Madhubani Mineral Paint",
    "sellerName": "Meena Devi Madhubani Studio",
    "status": "approved",
    "sku": "KG-PNT-0001",
    "description": "Authentic handmade Madhubani painting depicting sacred peacocks using natural twig brushes and vegetable pigments.",
    "images": [
      "https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&q=80",
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 48
  },
  {
    "_id": "kg-pnt-02",
    "name": "Warli Tribal Village Handmade Canvas",
    "price": 1950,
    "stock": 10,
    "craft": "Paintings & Wall Art",
    "category": "Paintings & Wall Art",
    "region": "Maharashtra",
    "technique": "Warli Rice Paste Painting",
    "sellerName": "Palghar Tribal Collective",
    "status": "approved",
    "sku": "KG-PNT-0002",
    "description": "Traditional Warli folk painting on red mud canvas depicting community dance and harvest celebration.",
    "images": [
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80"
    ],
    "rating": 4.8,
    "reviewsCount": 21
  },
  {
    "_id": "kg-jwl-01",
    "name": "Cuttack Tarakasi Silver Filigree Earrings",
    "price": 2400,
    "stock": 14,
    "craft": "Jewellery & Accessories",
    "category": "Jewellery & Accessories",
    "region": "Odisha",
    "technique": "Tarakasi Silver Wirework",
    "sellerName": "Radhika Sharma Filigree",
    "status": "approved",
    "sku": "KG-JWL-0001",
    "description": "Fine 925 sterling silver filigree jhumka earrings handcrafted with intricate silver wire weaving.",
    "images": [
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
      "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 56
  },
  {
    "_id": "kg-jwl-02",
    "name": "Royal Jaipur Kundan & Meenakari Choker Set",
    "price": 5800,
    "stock": 6,
    "craft": "Jewellery & Accessories",
    "category": "Jewellery & Accessories",
    "region": "Rajasthan",
    "technique": "Kundan Meenakari",
    "sellerName": "Jaipur Kundan Goldsmiths",
    "status": "approved",
    "sku": "KG-JWL-0002",
    "description": "24k gold-plated Kundan bridal choker set with vibrant Meenakari reverse enameling and pearls.",
    "images": [
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"
    ],
    "rating": 5,
    "reviewsCount": 39
  },
  {
    "_id": "kg-wd-01",
    "name": "Mysuru Sandalwood Carved Lord Ganesha Idol",
    "price": 4200,
    "stock": 8,
    "craft": "Wood & Bamboo Craft",
    "category": "Wood & Bamboo Craft",
    "region": "Karnataka",
    "technique": "Sandalwood Carving",
    "sellerName": "Mysuru Sandalwood Guild",
    "status": "approved",
    "sku": "KG-WD-0001",
    "description": "Genuine Mysuru sandalwood hand-carved Ganesha idol emitting natural sandalwood fragrance.",
    "images": [
      "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 44
  },
  {
    "_id": "kg-wd-02",
    "name": "Assam Handwoven Bamboo Pendant Lamp",
    "price": 2200,
    "stock": 16,
    "craft": "Wood & Bamboo Craft",
    "category": "Wood & Bamboo Craft",
    "region": "Assam",
    "technique": "Bamboo Weaving",
    "sellerName": "Assam Bamboo Artisans",
    "status": "approved",
    "sku": "KG-WD-0002",
    "description": "Contemporary spherical bamboo lattice hanging lamp shade casting warm ambient geometric shadows.",
    "images": [
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&q=80"
    ],
    "rating": 4.8,
    "reviewsCount": 33
  },
  {
    "_id": "kg-mtl-01",
    "name": "Handcrafted Brass Peacock Oil Diya Sculpture",
    "price": 2900,
    "stock": 12,
    "craft": "Metal Craft",
    "category": "Metal Craft",
    "region": "Tamil Nadu",
    "technique": "Lost-Wax Brass Casting",
    "sellerName": "Kumbakonam Metal Guild",
    "status": "approved",
    "sku": "KG-MTL-0001",
    "description": "Heavy solid brass peacock oil lamp with polished gold finish and carved plume detailing.",
    "images": [
      "https://images.unsplash.com/photo-1609151162377-794faf68b02f?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 51
  },
  {
    "_id": "kg-lth-01",
    "name": "Jaipur Hand-Embroidered Velvet Leather Mojaris",
    "price": 2100,
    "stock": 18,
    "craft": "Leather Craft",
    "category": "Leather Craft",
    "region": "Rajasthan",
    "technique": "Leather Cobbler & Zari Stitching",
    "sellerName": "Jaipur Leather Crafters",
    "status": "approved",
    "sku": "KG-LTH-0001",
    "description": "Genuine camel leather ethnic mojaris with gold zari wire embroidery and cushioned inner sole.",
    "images": [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80"
    ],
    "rating": 4.7,
    "reviewsCount": 27
  },
  {
    "_id": "kg-stn-01",
    "name": "Agra Pietra Dura Marble Inlay Coasters (Set of 6)",
    "price": 2800,
    "stock": 10,
    "craft": "Stone & Marble Craft",
    "category": "Stone & Marble Craft",
    "region": "Uttar Pradesh",
    "technique": "Pietra Dura Inlay",
    "sellerName": "Agra Marble Artisans",
    "status": "approved",
    "sku": "KG-STN-0001",
    "description": "Pure white Makrana marble coasters inlaid with semi-precious lapis lazuli, jasper, and mother of pearl.",
    "images": [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80"
    ],
    "rating": 5,
    "reviewsCount": 22
  },
  {
    "_id": "kg-ppr-01",
    "name": "Kashmiri Papier-Mâché Floral Jewellery Box",
    "price": 1650,
    "stock": 15,
    "craft": "Paper & Handmade Craft",
    "category": "Paper & Handmade Craft",
    "region": "Kashmir",
    "technique": "Papier-Mâché Hand Painting",
    "sellerName": "Srinagar Craft Guild",
    "status": "approved",
    "sku": "KG-PPR-0001",
    "description": "Handcrafted pulp paper box intricately painted with royal Kashmiri Chinar leaves and gold foil.",
    "images": [
      "https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=800&q=80"
    ],
    "rating": 4.8,
    "reviewsCount": 30
  },
  {
    "_id": "kg-fod-01",
    "name": "Authentic Rajasthani Kacchi Ghani Mango Pickle (500g)",
    "price": 450,
    "stock": 50,
    "craft": "Organic & Handmade Foods",
    "category": "Organic & Handmade Foods",
    "region": "Rajasthan",
    "technique": "Sun-dried Traditional Curing",
    "sellerName": "Jaipur Gramin Food Co-op",
    "status": "approved",
    "sku": "KG-FOD-0001",
    "description": "Sun-dried raw mangoes pickled in cold-pressed mustard oil with hand-pounded aromatic spices.",
    "images": [
      "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?w=800&q=80"
    ],
    "rating": 4.9,
    "reviewsCount": 110
  },
  {
    "_id": "kg-pln-01",
    "name": "Live Ficus Bonsai in Hand-Painted Terracotta Pot",
    "price": 1450,
    "stock": 12,
    "craft": "Plants & Planters",
    "category": "Plants & Planters",
    "region": "West Bengal",
    "technique": "Botanical Cultivation",
    "sellerName": "Kalaghar Botanical Studio",
    "status": "approved",
    "sku": "KG-PLN-0001",
    "description": "5-year-old hardy indoor Ficus Bonsai tree potted in hand-painted terracotta planter.",
    "images": [
      "https://images.unsplash.com/photo-1512428559087-560fa5ceab42?w=800&q=80"
    ],
    "rating": 4.7,
    "reviewsCount": 35
  },
  {
    "_id": "kg-pja-01",
    "name": "Brass Hand-Engraved Pooja Thali & Diya Set",
    "price": 2850,
    "stock": 20,
    "craft": "Festive & Pooja Essentials",
    "category": "Festive & Pooja Essentials",
    "region": "Uttar Pradesh",
    "technique": "Brass Engraving",
    "sellerName": "Moradabad Metal Crafters",
    "status": "approved",
    "sku": "KG-PJA-0001",
    "description": "Complete 7-piece brass pooja thali set including incenser, bell, diya, spoon, and kumkum cups.",
    "images": [
      "https://images.unsplash.com/photo-1609151162377-794faf68b02f?w=800&q=80"
    ],
    "rating": 5,
    "reviewsCount": 95
  }
];

// ─── Fetch Catalog ───
async function fetchCatalog() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    if (data.products && data.products.length > 0) {
      productsList = data.products;
    } else {
      productsList = KALAGHAR_CATALOG;
    }
  } catch (err) {
    // Use built-in catalog when DB is offline
    productsList = KALAGHAR_CATALOG;
  }
  renderCatalog();
  renderFilterGrid();
}


// ─── Category Filter ───
function filterCategory(cat, btnEl) {
  selectedCategory = cat;

  // Update filter pills
  if (btnEl) {
    const pills = btnEl.closest('.filter-pills') ?
      btnEl.closest('.filter-pills').querySelectorAll('.fpill') :
      document.querySelectorAll('.fpill');
    pills.forEach(p => p.classList.remove('active'));
    btnEl.classList.add('active');
  }

  // Update sub-nav pills
  document.querySelectorAll('.sub-pill').forEach(p => p.classList.remove('active'));

  // Update sidebar radio
  const radios = document.querySelectorAll('input[name="craftFilter"]');
  radios.forEach(r => { r.checked = r.value === cat; });

  // Update catalog title
  const catalogTitle = document.getElementById('catalogTitle');
  if (catalogTitle) {
    catalogTitle.textContent = cat === 'all' ? 'Featured Crafts' :
      cat.charAt(0).toUpperCase() + cat.slice(1) + ' Collection';
  }

  renderCatalog();
  renderFilterGrid();
}

// ─── Render Home Catalog ───
function renderCatalog() {
  const newGrid = document.getElementById('newArrivalsGrid');
  const featGrid = document.getElementById('featuredGrid');
  
  if (!newGrid && !featGrid) return;

  // Shuffle-like: New Arrivals = latest 8, Featured = next 8
  const allProducts = productsList;
  const newArr = allProducts.slice(0, 8);
  const featArr = allProducts.slice(8, 16);

  const renderCard = (p) => {
    const origPrice = Math.round(p.price * 1.35);
    const discount = Math.round((1 - p.price / origPrice) * 100);
    const imgUrl = p.images && p.images[0] ? p.images[0] : '/media/24s_artisan_product_01_500x706.jpg';
    const artisan = p.sellerName || 'Master Artisan';
    const region = p.region || 'India';
    
    return `
      <div class="gg-p-card" onclick="openProductDetails('${p._id}')">
        <div style="position:relative;overflow:hidden;border-radius:4px;margin-bottom:12px;">
          <img src="${imgUrl}" alt="${p.name}" class="gg-p-img" style="margin-bottom:0;" onerror="this.onerror=null;this.src='/media/24s_artisan_product_01_500x706.jpg'">
          <span style="position:absolute;top:10px;left:10px;background:#e91e63;color:#fff;font-size:0.65rem;font-weight:700;padding:3px 7px;border-radius:3px;text-transform:uppercase;letter-spacing:0.5px;">${discount}% OFF</span>
          <button onclick="event.stopPropagation();this.style.color='#e91e63';" style="position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.9);border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;" aria-label="Wishlist">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <div style="padding:0;">
          <div class="gg-p-brand">${artisan} &middot; ${region}</div>
          <div class="gg-p-title" title="${p.name}">${p.name}</div>
          <div style="display:flex;align-items:baseline;gap:8px;margin-top:6px;">
            <span class="gg-p-price">Rs.${p.price.toLocaleString('en-IN')}</span>
            <span class="gg-p-oldprice">Rs.${origPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    `;
  };

  if (newGrid) newGrid.innerHTML = newArr.map(renderCard).join('');
  if (featGrid) featGrid.innerHTML = featArr.map(renderCard).join('');
}

// ─── Filter Grid Page ───
function filterGridByCraft(val) {
  selectedCategory = val;
  renderFilterGrid();
}

function updatePrice(val) {
  maxPriceFilter = parseInt(val);
  document.getElementById('priceMaxDisplay').textContent = 'Rs.' + parseInt(val).toLocaleString('en-IN');
  renderFilterGrid();
}

function quickPrice(val) {
  maxPriceFilter = val;
  document.getElementById('priceRangeSlider').value = val;
  document.getElementById('priceMaxDisplay').textContent = 'Rs.' + val.toLocaleString('en-IN');
  renderFilterGrid();
}

function updateRegionFilter() {
  selectedRegions = [];
  document.querySelectorAll('.fp-check input[type="checkbox"]:not(#inStockFilter)').forEach(cb => {
    if (cb.checked) selectedRegions.push(cb.value);
  });
  renderFilterGrid();
}

function resetFilters() {
  selectedCategory = 'all';
  maxPriceFilter = 10000;
  selectedRegions = [];
  document.querySelectorAll('input[name="craftFilter"]').forEach(r => r.checked = r.value === 'all');
  const slider = document.getElementById('priceRangeSlider');
  if (slider) slider.value = 10000;
  const display = document.getElementById('priceMaxDisplay');
  if (display) display.textContent = 'Rs.10,000';
  document.querySelectorAll('.fp-check input[type="checkbox"]').forEach(cb => cb.checked = false);
  if (document.getElementById('gridSearchInput')) document.getElementById('gridSearchInput').value = '';
  renderFilterGrid();
}

function sortGrid(val) {
  currentSort = val;
  renderFilterGrid();
}

function filterGridProducts() {
  renderFilterGrid();
}

function renderFilterGrid() {
  const container = document.getElementById('filterGridDisplay');
  if (!container) return;

  let filtered = [...productsList];

  // Category
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.craft === selectedCategory || p.category === selectedCategory);
  }

  // Price
  filtered = filtered.filter(p => p.price <= maxPriceFilter);

  // Region
  if (selectedRegions.length > 0) {
    filtered = filtered.filter(p => {
      const region = (p.region || '').toLowerCase();
      return selectedRegions.some(r => region.includes(r.toLowerCase()));
    });
  }

  // In stock
  const inStockOnly = document.getElementById('inStockFilter');
  if (inStockOnly && inStockOnly.checked) {
    filtered = filtered.filter(p => (p.stock || 0) > 0);
  }

  // Search
  const searchInput = document.getElementById('gridSearchInput');
  if (searchInput && searchInput.value.trim()) {
    const q = searchInput.value.toLowerCase().trim();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    );
  }

  // Sort
  if (currentSort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
  else if (currentSort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
  else if (currentSort === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  // Update count
  const countEl = document.getElementById('gridResultCount');
  if (countEl) countEl.textContent = `Showing ${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    container.innerHTML = '<div class="loading-state" style="grid-column:1/-1;"><p>No products match your filters.</p></div>';
    return;
  }

  container.innerHTML = filtered.map(p => {
    const origPrice = Math.round(p.price * 1.35);
    const discount = Math.round((1 - p.price / origPrice) * 100);
    const imgUrl = p.images && p.images[0] ? p.images[0] : '/assets/terracotta_vase.svg';
    const craft = p.craft || p.category || 'Handicraft';

    return `
      <div class="product-card" onclick="openProductDetails('${p._id}')">
        <div class="product-card-img-wrap">
          <img src="${imgUrl}" alt="${p.name}" onerror="this.onerror=null;this.src='/assets/terracotta_vase.svg'">
          <span class="product-card-badge badge-sale">${discount}% OFF</span>
          <button class="product-card-wishlist" onclick="event.stopPropagation();alert('Added to Wishlist!')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
        <div class="product-card-body">
          <div class="product-card-craft">${craft} &middot; ${p.region || 'India'}</div>
          <div class="product-card-name">${p.name}</div>
          <div class="product-card-artisan">by ${p.sellerName || 'Artisan'}</div>
          <div class="product-card-footer">
            <div>
              <span class="product-card-price">Rs.${p.price.toLocaleString('en-IN')}</span>
              <span class="product-card-orig">Rs.${origPrice.toLocaleString('en-IN')}</span>
            </div>
            <button class="product-card-add" onclick="event.stopPropagation();alert('Added to cart!')">+</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── Product Detail Modal / PDP View ───
function openProductDetails(id) {
  const p = productsList.find(item => item._id === id);
  if (!p) return;

  const mc = document.getElementById('modalContent');
  const origPrice = Math.round(p.price * 1.4);
  const discount = Math.round((1 - p.price / origPrice) * 100);
  const eurPrice = Math.round(p.price / 110);

  const defaultGallery = [
    '/media/24s_artisan_product_01_500x706.jpg',
    '/media/24s_artisan_product_02_500x634.jpg',
    '/media/24s_artisan_product_05_500x706.jpg',
    '/media/24s_artisan_product_18_500x706.jpg'
  ];
  const productImages = (p.images && p.images.length > 0) ? p.images : defaultGallery;
  const mainImg = productImages[0];
  const related = productsList.filter(item => item._id !== id).slice(0, 6);
  const videoSrc = p.video || (id === productsList[0]?._id ? '/media/artisan_craft_hero.mp4' : null);

  mc.innerHTML = `
    <!-- Top Breadcrumbs -->
    <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:20px;text-transform:uppercase;letter-spacing:0.04em;">
      Home &rsaquo; Crafts &rsaquo; ${(p.craft || p.category || 'Handicraft')} &rsaquo; ${(p.region || 'India')} &rsaquo; ${p.name}
    </div>

    <!-- Main PDP Row -->
    <div class="pdp-main-row">
      <!-- Left Gallery -->
      <div class="pdp-gallery-wrap">
        <div class="pdp-thumbs-stack">
          <button class="pdp-thumb-arrow" onclick="scrollThumbs(-1)">&blacktriangle;</button>
          <div id="pdpThumbsContainer" style="display:flex;flex-direction:column;gap:8px;">
            ${productImages.map((img, idx) => `
              <img src="${img}" class="pdp-thumb-item ${idx === 0 ? 'active' : ''}" onclick="switchThumb(this,'${img}')"
                onerror="this.onerror=null;this.src='/media/24s_artisan_product_01_500x706.jpg'">
            `).join('')}
          </div>
          <button class="pdp-thumb-arrow" onclick="scrollThumbs(1)">&blackvert_line;</button>
        </div>

        <div class="pdp-main-view">
          ${videoSrc ? `
            <div style="position:absolute;top:12px;left:12px;z-index:2;background:rgba(0,0,0,0.8);color:#FFF;padding:3px 8px;font-size:0.65rem;letter-spacing:0.06em;text-transform:uppercase;">
              HD Video Preview
            </div>
          ` : ''}
          <img src="${mainImg}" class="pdp-main-img" id="modalMainImg" alt="${p.name}"
            onerror="this.onerror=null;this.src='/media/24s_artisan_product_01_500x706.jpg'">
        </div>
      </div>

      <!-- Right Metadata Panel -->
      <div class="pdp-meta-box">
        <span class="pdp-badge-new">NEW</span>
        <div class="pdp-brand-name">${(p.sellerName || 'KALAGHAR ARTISAN').toUpperCase()}</div>
        <h1 class="pdp-title">${p.name}</h1>

        <div class="pdp-price-line">
          <span>Rs.${p.price.toLocaleString('en-IN')}</span>
          <span class="pdp-price-eur">(&euro;${eurPrice})</span>
        </div>

        <div class="pdp-actions-row">
          <button class="btn-black-cart" onclick="addToCart('${p._id}'); openCartDrawer();">Add to cart</button>
          <button class="btn-wish-heart" onclick="toggleWishlist('${p._id}');" aria-label="Wishlist">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>

        <div class="pdp-delivery-notice">
          Delivery from <strong>Monday, September 28</strong>
        </div>

        <ul class="pdp-checks-list">
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Free delivery when you spend Rs.1,500 or more
          </li>
          <li>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            Free returns and picked up at home
          </li>
        </ul>

        <a href="#pdpAccordions" class="pdp-find-more">Find out more &darr;</a>
      </div>
    </div>

    <!-- Quote Banner -->
    <div class="quote-highlight-banner">
      <span class="quote-mark">&ldquo;</span>
      <p class="quote-text">
        Ideal for luxury living and heritage decor, each Kalaghar masterpiece features handcrafted perfection, stage-free artisan finish, GI-certified authentic quality, and lifetime preservation guarantee.
      </p>
      <span class="quote-mark">&rdquo;</span>
    </div>

    <!-- You May Also Like Slider -->
    <div style="margin:48px 0;">
      <div style="text-align:center;font-size:0.75rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-muted);margin-bottom:24px;">
        &mdash;&mdash;&mdash; YOU MAY ALSO LIKE &mdash;&mdash;&mdash;
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:20px;">
        ${related.map(r => {
          const rImg = r.images && r.images[0] ? r.images[0] : '/media/24s_artisan_product_01_500x706.jpg';
          return `
          <div class="product-card" onclick="openProductDetails('${r._id}')" style="border:1px solid var(--grey-mid);background:#FFF;">
            <div class="product-card-img-wrap" style="height:170px;">
              <img src="${rImg}" alt="${r.name}" onerror="this.onerror=null;this.src='/media/24s_artisan_product_01_500x706.jpg'">
            </div>
            <div class="product-card-body" style="padding:12px;text-align:center;">
              <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">${(r.sellerName || 'LOUIS VUITTON').toUpperCase()}</div>
              <div class="product-card-name" style="font-size:0.82rem;margin-bottom:6px;">${r.name}</div>
              <div class="product-card-price" style="font-size:0.88rem;font-weight:600;">Rs.${r.price.toLocaleString('en-IN')}</div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Details and Care / Delivery and Returns Two-Column Accordion -->
    <div id="pdpAccordions" class="pdp-accordions-row">
      <!-- Left Column: Details & Care -->
      <div class="accordion-box">
        <div class="accordion-title-hdr">
          <span>DETAILS AND CARE</span>
          <span>&circ;</span>
        </div>
        <div class="accordion-content-body">
          <div class="acc-field">
            <span class="acc-field-label">DESCRIPTION</span>
            <span>${p.description || 'Hand-crafted luxury creation using authentic traditional artisan techniques.'}</span>
          </div>
          <div class="acc-field">
            <span class="acc-field-label">MATERIAL</span>
            <span>Outer: Organic Terracotta / Mulberry Silk / Teakwood | Inside: Handloom Cotton / Velvet</span>
          </div>
          <div class="acc-field">
            <span class="acc-field-label">DETAILS</span>
            <span>This item is delivered with 24S / Kalaghar authentic gift packaging & Certificate of Authenticity.</span>
          </div>
          <div class="acc-field">
            <span class="acc-field-label">COLOR</span>
            <span>Heritage Natural Ochre / Royal Indigo</span>
          </div>
          <div class="acc-field">
            <span class="acc-field-label">CARE INSTRUCTIONS</span>
            <span>Keep away from moisture and direct heat. Clean gently with a soft dry cloth.</span>
          </div>
          <div class="acc-field">
            <span class="acc-field-label">COUNTRY OF MANUFACTURE</span>
            <span>India</span>
          </div>
          <div class="acc-field">
            <span class="acc-field-label">ITEM MEASUREMENTS</span>
            <span>Width: 32 cm / 12.5" | Height: 45 cm / 17.7" | Depth: 20 cm / 7.8" | Weight: 1.2 kg</span>
          </div>
          <div class="acc-field" style="margin-top:12px;color:var(--text-muted);">
            Product code: KLG-${(p._id || '9821').slice(-6).toUpperCase()}
          </div>
        </div>
      </div>

      <!-- Right Column: Delivery and Returns -->
      <div class="accordion-box">
        <div class="accordion-title-hdr">
          <span>DELIVERY AND RETURNS</span>
          <span>&circ;</span>
        </div>
        <div class="accordion-content-body">
          <div style="margin-bottom:16px;">
            <strong style="color:var(--black);text-transform:uppercase;font-size:0.75rem;">EXPRESS TO HOME</strong><br>
            Delivery from <strong>Monday, September 28</strong> &middot; Rs.250<br>
            <span style="color:var(--green);font-weight:600;">Free delivery when you spend Rs.1,500 or more</span>
          </div>
          <div style="margin-bottom:16px;">
            <strong style="color:var(--black);text-transform:uppercase;font-size:0.75rem;">NOT FOR YOU?</strong><br>
            Enjoy complimentary returns and at-home pick-up within 30 days of purchase.
          </div>
          <a href="#" onclick="alert('Returns terms');return false;" style="text-decoration:underline;color:var(--black);">View returns terms and conditions for this item</a>
        </div>

        <div class="accordion-box" style="margin-top:24px;">
          <div class="accordion-title-hdr">
            <span>WHY SHOP AT KALAGHAR / 24S</span>
            <span>&check;</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Trust 3-Item Feature Bar -->
    <div class="trust-3bar">
      <div class="trust-3item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="1" y="3" width="22" height="18" rx="2"/><line x1="1" y1="9" x2="23" y2="9"/></svg>
        <span>Express delivery</span>
      </div>
      <div class="trust-3item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>Returns always free</span>
      </div>
      <div class="trust-3item">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
        <span>Need help?</span>
      </div>
    </div>

    <!-- Newsletter & App Split Banner -->
    <div class="news-app-split-container">
      <div class="news-box-card">
        <div>
          <h3>Newsletter</h3>
          <p>The best of 24S &amp; Kalaghar, delivered straight to your inbox: new arrivals, exclusives, special offers, sales, latest trends...</p>
        </div>
        <div class="news-input-row">
          <input type="email" placeholder="email address">
          <button onclick="alert('Subscribed to Newsletter!')">Subscribe</button>
        </div>
      </div>

      <div class="app-box-card">
        <div class="app-text-side">
          <h3>The best of fashion at your fingertips with the 24S App.</h3>
          <button class="app-badge-btn" onclick="alert('Download App')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.02c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.64 1.35-.57.66-1.07 1.73-.93 2.76 1.01.08 2.04-.51 2.65-1.26z"/></svg>
            App Store
          </button>
        </div>
        <div style="text-align:center;">
          <div class="app-qr-box" style="margin:0 auto 8px;">
            <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v5h-3v-5zm-3 2h2v3h-2v-3zm-3-2h2v2h-2v-2zm0 3h2v2h-2v-2z"/></svg>
          </div>
          <span style="font-size:0.65rem;color:var(--text-muted);letter-spacing:0.04em;">Scan to Download</span>
        </div>
      </div>
    </div>
  `;

  showTab('pdp');
}

function scrollThumbs(direction) {
  const container = document.getElementById('pdpThumbsContainer');
  if (container) {
    container.scrollTop += direction * 80;
  }
}

function switchThumb(thumbEl, imgUrl) {
  document.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
  document.getElementById('modalMainImg').src = imgUrl;
}

// ─── Admin Portal ───
function switchAdminTab(tab, btn) {
  document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
  const target = document.getElementById('admin-' + tab);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
}

// Load admin products table
async function loadAdminProducts() {
  const tbody = document.getElementById('adminProductsBody');
  if (!tbody) return;
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    const products = data.products || [];

    // Update stats
    const total = document.getElementById('statTotalProducts');
    const approved = document.getElementById('statApproved');
    const pending = document.getElementById('statPending');
    if (total) total.textContent = products.length;
    if (approved) approved.textContent = products.filter(p => p.status === 'approved').length;
    if (pending) pending.textContent = products.filter(p => p.status !== 'approved').length;

    if (products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="table-loading">No products found.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map(p => {
      const imgUrl = p.images && p.images[0] ? p.images[0] : '/assets/terracotta_vase.svg';
      const statusClass = p.status === 'approved' ? 'pill-approved' : 'pill-pending';
      const statusText = (p.status || 'pending').charAt(0).toUpperCase() + (p.status || 'pending').slice(1);
      return `
        <tr>
          <td>
            <div class="prod-thumb-wrap">
              <img src="${imgUrl}" class="prod-thumb" alt="${p.name}" onerror="this.onerror=null;this.src='/assets/terracotta_vase.svg'">
              <div>
                <div class="prod-name">${p.name}</div>
                <div class="prod-artisan">${p.sellerName || 'Artisan'}</div>
              </div>
            </div>
          </td>
          <td>${(p.craft || p.category || '-').replace(/^./, c => c.toUpperCase())}</td>
          <td>${p.region || 'India'}</td>
          <td>Rs.${p.price.toLocaleString('en-IN')}</td>
          <td>${p.stock || 0}</td>
          <td><span class="status-pill ${statusClass}">${statusText}</span></td>
          <td>
            <button class="tbl-btn" onclick="openProductDetails('${p._id}')">View</button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-loading" style="color:red;">API Error: ' + e.message + '</td></tr>';
  }
}

async function loadAdminProducts2() {
  const tbody = document.getElementById('adminProductsBody2');
  if (!tbody) return;
  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    const products = data.products || [];

    tbody.innerHTML = products.map(p => {
      const statusClass = p.status === 'approved' ? 'pill-approved' : 'pill-pending';
      const statusText = (p.status || 'pending').charAt(0).toUpperCase() + (p.status || 'pending').slice(1);
      return `
        <tr>
          <td><span class="prod-name">${p.name}</span></td>
          <td>${(p.craft || p.category || '-').replace(/^./, c => c.toUpperCase())}</td>
          <td>Rs.${p.price.toLocaleString('en-IN')}</td>
          <td>${p.stock || 0}</td>
          <td><span class="status-pill ${statusClass}">${statusText}</span></td>
          <td><button class="tbl-btn" onclick="openProductDetails('${p._id}')">View</button></td>
        </tr>
      `;
    }).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading" style="color:red;">Error loading.</td></tr>';
  }
}

function filterAdminProductsTable(query) {
  const tbody = document.getElementById('adminProductsBody2');
  if (!tbody) return;
  const q = query.toLowerCase().trim();
  const rows = tbody.querySelectorAll('tr');
  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
}

// Load artisans
async function loadAdminArtisans() {
  const grid = document.getElementById('artisanCardsGrid');
  if (!grid) return;

  // Use static artisan data (the API has product sellers)
  const artisans = [
    { name: 'Meera Sharma', craft: 'Pottery', location: 'Jaipur, Rajasthan', products: 3, earnings: 45000, status: 'verified' },
    { name: 'Sita Devi', craft: 'Paintings', location: 'Madhubani, Bihar', products: 2, earnings: 28500, status: 'verified' },
    { name: 'Rahim Khan', craft: 'Textiles', location: 'Dhamadka, Gujarat', products: 2, earnings: 39000, status: 'pending' },
    { name: 'Farida Begum', craft: 'Jewellery', location: 'Cuttack, Odisha', products: 2, earnings: 52000, status: 'verified' },
    { name: 'Ravi Shankar', craft: 'Woodcraft', location: 'Channapatna, Karnataka', products: 1, earnings: 18000, status: 'verified' },
    { name: 'Lakshmi Patel', craft: 'Textiles', location: 'Varanasi, UP', products: 2, earnings: 62000, status: 'verified' },
    { name: 'Mohan Lal', craft: 'Metalcraft', location: 'Moradabad, UP', products: 1, earnings: 15000, status: 'pending' },
    { name: 'Priya Kumari', craft: 'Paintings', location: 'Raghurajpur, Odisha', products: 1, earnings: 22000, status: 'verified' },
  ];

  grid.innerHTML = artisans.map(a => {
    const statusPill = a.status === 'verified' ? 'pill-approved' : 'pill-pending';
    const emoji = { Pottery: '&#127922;', Paintings: '&#127912;', Textiles: '&#129525;', Jewellery: '&#128142;', Woodcraft: '&#129717;', Metalcraft: '&#128296;' }[a.craft] || '&#127912;';
    return `
      <div class="artisan-admin-card">
        <div class="artisan-admin-avatar">${emoji}</div>
        <div class="artisan-admin-name">${a.name}</div>
        <div class="artisan-admin-craft">${a.craft} &middot; <span class="status-pill ${statusPill}">${a.status}</span></div>
        <div class="artisan-admin-location">${a.location}</div>
        <div class="artisan-admin-stats">
          <span><strong>${a.products}</strong> products</span>
          <span><strong>Rs.${a.earnings.toLocaleString('en-IN')}</strong> earned</span>
        </div>
        <div class="artisan-admin-actions">
          <button class="tbl-btn" onclick="alert('Viewing ${a.name} profile')">Profile</button>
          <button class="tbl-btn" onclick="alert('KYC for ${a.name}')">KYC</button>
        </div>
      </div>
    `;
  }).join('');
}

// Load orders
async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersBody');
  if (!tbody) return;

  const orders = [
    { id: 'KG-2609-001', customer: 'Ananya Sharma', items: 2, amount: 3150, status: 'delivered', date: '2026-09-22' },
    { id: 'KG-2609-002', customer: 'Rohit Mehta', items: 1, amount: 2850, status: 'shipped', date: '2026-09-23' },
    { id: 'KG-2609-003', customer: 'Priya Iyer', items: 3, amount: 5400, status: 'processing', date: '2026-09-24' },
    { id: 'KG-2609-004', customer: 'Deepak Gupta', items: 1, amount: 1200, status: 'pending', date: '2026-09-25' },
    { id: 'KG-2609-005', customer: 'Sneha Reddy', items: 2, amount: 4100, status: 'delivered', date: '2026-09-20' },
  ];

  tbody.innerHTML = orders.map(o => {
    const statusMap = { delivered: 'pill-approved', shipped: 'pill-approved', processing: 'pill-pending', pending: 'pill-pending' };
    return `
      <tr>
        <td><strong>${o.id}</strong></td>
        <td>${o.customer}</td>
        <td>${o.items}</td>
        <td>Rs.${o.amount.toLocaleString('en-IN')}</td>
        <td><span class="status-pill ${statusMap[o.status] || 'pill-pending'}">${o.status}</span></td>
        <td>${o.date}</td>
      </tr>
    `;
  }).join('');
}

// Load approval queue
function loadApprovalQueue() {
  const list = document.getElementById('approvalList');
  if (!list) return;

  const items = [
    { icon: '&#128203;', name: 'Rahim Khan - KYC Verification', detail: 'Textile artisan from Gujarat requesting verification', kind: 'kyc' },
    { icon: '&#129525;', name: 'Ajrakh Block Print Saree', detail: 'New listing by Ayesha Textiles - Rs.2,100 - Rajasthan', kind: 'listing' },
    { icon: '&#127912;', name: 'Warli Painting Canvas', detail: 'New listing by Suresh Art Studio - Rs.1,800 - Maharashtra', kind: 'listing' },
    { icon: '&#128296;', name: 'Mohan Lal - KYC Update', detail: 'Metalcraft artisan from Moradabad requesting re-verification', kind: 'kyc' },
  ];

  list.innerHTML = items.map((item, i) => `
    <div class="approval-item" id="approval-${i}">
      <div class="approval-icon">${item.icon}</div>
      <div class="approval-info">
        <h4>${item.name}</h4>
        <p>${item.detail}</p>
      </div>
      <div class="approval-actions">
        <button class="btn-approve" onclick="document.getElementById('approval-${i}').remove();alert('Approved: ${item.name}')">Approve</button>
        <button class="btn-reject" onclick="document.getElementById('approval-${i}').remove();alert('Rejected: ${item.name}')">Reject</button>
      </div>
    </div>
  `).join('');
}

// ─── API Console ───
async function runApi(endpoint, method) {
  const out = document.getElementById('apiConsoleOutput');
  const code = document.getElementById('apiStatusCode');
  out.textContent = 'Sending ' + method + ' ' + endpoint + '...';
  code.textContent = '...';
  code.className = '';

  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    code.textContent = res.status + ' ' + res.statusText;
    code.className = res.ok ? 'api-status-ok' : 'api-status-err';
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    code.textContent = 'ERR';
    code.className = 'api-status-err';
    out.textContent = 'Error: ' + e.message;
  }
}

async function runApiLogin(email, password) {
  const out = document.getElementById('apiConsoleOutput');
  const code = document.getElementById('apiStatusCode');
  out.textContent = 'POST /api/auth/login...';
  code.textContent = '...';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    code.textContent = res.status + ' ' + res.statusText;
    code.className = res.ok ? 'api-status-ok' : 'api-status-err';
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    code.textContent = 'ERR';
    code.className = 'api-status-err';
    out.textContent = 'Error: ' + e.message;
  }
}

// ─── Artisan Form ───
function initForm() {
  const form = document.getElementById('newProductForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newP = {
      name: document.getElementById('fTitle').value,
      craft: document.getElementById('fCraft').value,
      region: document.getElementById('fRegion').value,
      technique: document.getElementById('fTechnique') ? document.getElementById('fTechnique').value : '',
      price: parseFloat(document.getElementById('fPrice').value),
      stock: parseInt(document.getElementById('fStock').value),
      description: document.getElementById('fDesc').value,
      sellerName: 'Meena Devi',
      status: 'pending',
      images: ['/assets/terracotta_vase.svg'],
      category: document.getElementById('fCraft').value,
    };

    productsList.unshift({ ...newP, _id: 'temp_' + Date.now() });
    renderCatalog();
    renderFilterGrid();
    showToast('Product submitted! Added to queue.', 'success');
    form.reset();
    showTab('marketplace');
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// ─── CART, WISHLIST, CHECKOUT & MODALS LOGIC ─────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

let userCart = [];
let userWishlist = [];

// ── Toast Notification System ──
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `kg-toast ${type === 'success' ? 'kg-toast-success' : ''}`;
  toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}

// ── Cart Drawer Management ──
function openCartDrawer() {
  renderCartDrawer();
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (overlay && drawer) {
    overlay.classList.add('active');
    drawer.classList.add('active');
  }
}

function closeCartDrawer() {
  const overlay = document.getElementById('cartOverlay');
  const drawer = document.getElementById('cartDrawer');
  if (overlay && drawer) {
    overlay.classList.remove('active');
    drawer.classList.remove('active');
  }
}

function addToCart(productId, qty = 1) {
  const product = productsList.find(p => p._id === productId) || KALAGHAR_CATALOG.find(p => p._id === productId);
  if (!product) return;

  const existing = userCart.find(item => item.product._id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    userCart.push({ product, qty });
  }

  updateBadges();
  showToast(`Added "${product.name}" to Shopping Bag`, 'success');
}

function updateCartQty(productId, delta) {
  const item = userCart.find(i => i.product._id === productId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    userCart = userCart.filter(i => i.product._id !== productId);
  }
  updateBadges();
  renderCartDrawer();
}

function renderCartDrawer() {
  const container = document.getElementById('cartDrawerItems');
  const countHeader = document.getElementById('cartCountHeader');
  const subtotalDisplay = document.getElementById('cartSubtotalDisplay');
  if (!container) return;

  const totalQty = userCart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = userCart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  if (countHeader) countHeader.textContent = totalQty;
  if (subtotalDisplay) subtotalDisplay.textContent = 'Rs.' + subtotal.toLocaleString('en-IN');

  if (userCart.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px 20px;">
        <span style="font-size:3rem; opacity:0.3;">🛍️</span>
        <p style="font-weight:600; margin:12px 0 4px;">Your shopping bag is empty</p>
        <p style="font-size:0.85rem; color:#888; margin-bottom:20px;">Explore authentic handloom silk, blue pottery and handmade crafts.</p>
        <button onclick="closeCartDrawer(); showTab('gridfilter');" style="background:#111; color:#fff; padding:10px 20px; font-size:0.8rem; font-weight:700; border-radius:4px;">EXPLORE CATALOG &rarr;</button>
      </div>
    `;
    return;
  }

  container.innerHTML = userCart.map(item => `
    <div class="cart-item-row">
      <img src="${item.product.images[0]}" class="cart-item-img" alt="${item.product.name}">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.product.name}</div>
        <div class="cart-item-price">Rs.${(item.product.price * item.qty).toLocaleString('en-IN')}</div>
        <div class="cart-qty-ctrl">
          <button class="cart-qty-btn" onclick="updateCartQty('${item.product._id}', -1)">-</button>
          <span style="font-size:0.85rem; font-weight:600;">${item.qty}</span>
          <button class="cart-qty-btn" onclick="updateCartQty('${item.product._id}', 1)">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ── Wishlist Drawer ──
function openWishlistDrawer() {
  renderWishlistDrawer();
  const overlay = document.getElementById('wishlistOverlay');
  const drawer = document.getElementById('wishlistDrawer');
  if (overlay && drawer) {
    overlay.classList.add('active');
    drawer.classList.add('active');
  }
}

function closeWishlistDrawer() {
  const overlay = document.getElementById('wishlistOverlay');
  const drawer = document.getElementById('wishlistDrawer');
  if (overlay && drawer) {
    overlay.classList.remove('active');
    drawer.classList.remove('active');
  }
}

function toggleWishlist(productId) {
  const product = productsList.find(p => p._id === productId) || KALAGHAR_CATALOG.find(p => p._id === productId);
  if (!product) return;

  const idx = userWishlist.findIndex(item => item._id === productId);
  if (idx >= 0) {
    userWishlist.splice(idx, 1);
    showToast(`Removed from Wishlist`);
  } else {
    userWishlist.push(product);
    showToast(`Saved to Wishlist`, 'success');
  }
  updateBadges();
}

function renderWishlistDrawer() {
  const container = document.getElementById('wishlistDrawerItems');
  const countHeader = document.getElementById('wishlistCountHeader');
  if (!container) return;

  if (countHeader) countHeader.textContent = userWishlist.length;

  if (userWishlist.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:60px 20px;">
        <span style="font-size:3rem; opacity:0.3;">❤️</span>
        <p style="font-weight:600; margin:12px 0 4px;">No saved items yet</p>
        <p style="font-size:0.85rem; color:#888;">Save your favorite handcrafted items while browsing.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = userWishlist.map(product => `
    <div class="cart-item-row">
      <img src="${product.images[0]}" class="cart-item-img" alt="${product.name}">
      <div class="cart-item-info">
        <div class="cart-item-title">${product.name}</div>
        <div class="cart-item-price">Rs.${product.price.toLocaleString('en-IN')}</div>
        <button onclick="addToCart('${product._id}'); toggleWishlist('${product._id}'); renderWishlistDrawer();" style="margin-top:8px; background:#111; color:#fff; border-radius:4px; padding:6px 12px; font-size:0.75rem; font-weight:700;">MOVE TO BAG</button>
      </div>
    </div>
  `).join('');
}

function updateBadges() {
  const cartBadge = document.getElementById('cartBadgeCount');
  const wishlistBadge = document.getElementById('wishlistBadgeCount');
  
  const totalCartQty = userCart.reduce((sum, item) => sum + item.qty, 0);
  if (cartBadge) cartBadge.textContent = totalCartQty;
  if (wishlistBadge) wishlistBadge.textContent = userWishlist.length;
}

// ── Checkout & Order Flow ──
function openCheckoutModal() {
  if (userCart.length === 0) {
    showToast('Your shopping bag is empty!');
    return;
  }
  closeCartDrawer();
  const overlay = document.getElementById('checkoutOverlay');
  if (overlay) overlay.classList.add('active');
}

function closeCheckoutModal() {
  const overlay = document.getElementById('checkoutOverlay');
  if (overlay) overlay.classList.remove('active');
}

function handlePlaceOrder(e) {
  e.preventDefault();
  closeCheckoutModal();
  userCart = [];
  updateBadges();

  const newOrderId = 'KG-' + Math.floor(100000 + Math.random() * 900000);
  openOrderTrackingModal(newOrderId);
}

function openOrderTrackingModal(orderId) {
  const display = document.getElementById('trackingOrderIdDisplay');
  if (display) display.textContent = '#' + orderId;

  const overlay = document.getElementById('orderTrackingOverlay');
  if (overlay) overlay.classList.add('active');
}

function closeOrderTrackingModal() {
  const overlay = document.getElementById('orderTrackingOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ── Coupon Modal ──
function openCouponModal(code) {
  const display = document.getElementById('couponCodeDisplay');
  if (display) display.textContent = code;
  const overlay = document.getElementById('couponOverlay');
  if (overlay) overlay.classList.add('active');
}

function closeCouponModal() {
  const overlay = document.getElementById('couponOverlay');
  if (overlay) overlay.classList.remove('active');
}

function copyCouponCode(code) {
  navigator.clipboard.writeText(code);
  showToast(`Coupon code "${code}" copied to clipboard!`, 'success');
  closeCouponModal();
}

// ── Contact / Job Application Modal ──
function openContactModal(title) {
  const titleEl = document.getElementById('contactModalTitle');
  if (titleEl) titleEl.textContent = title;
  const overlay = document.getElementById('contactModalOverlay');
  if (overlay) overlay.classList.add('active');
}

function closeContactModal() {
  const overlay = document.getElementById('contactModalOverlay');
  if (overlay) overlay.classList.remove('active');
}

function handleModalFormSubmit(e) {
  e.preventDefault();
  closeContactModal();
  showToast('Inquiry submitted successfully! Our team will respond shortly.', 'success');
}

function handleContactSubmit(e) {
  e.preventDefault();
  showToast('Message sent! Thank you for contacting Kalaghar.', 'success');
  e.target.reset();
}

function openSocialModal(platform) {
  showToast(`Opening Kalaghar ${platform} page...`);
}

function toggleFaq(el) {
  const item = el.closest('.faq-item');
  if (item) item.classList.toggle('open');
}

// ── Currency & Region Selector Logic ──
let currentCurrency = {
  code: 'INR',
  symbol: '₹',
  flag: '🇮🇳',
  rate: 1,
  lang: 'English'
};

function openCurrencyModal() {
  const overlay = document.getElementById('currencyOverlay');
  if (overlay) overlay.classList.add('active');
}

function closeCurrencyModal() {
  const overlay = document.getElementById('currencyOverlay');
  if (overlay) overlay.classList.remove('active');
}

function handleCurrencySave(e) {
  e.preventDefault();
  const select = document.getElementById('currencyRegionSelect');
  const langSelect = document.getElementById('currencyLanguageSelect');
  if (!select || !langSelect) return;

  const opt = select.options[select.selectedIndex];
  const code = opt.value;
  const flag = opt.getAttribute('data-flag') || '🇮🇳';
  const symbol = opt.getAttribute('data-symbol') || '₹';
  const lang = langSelect.value;

  const flagEl = document.getElementById('selectedFlag');
  const langEl = document.getElementById('selectedLang');
  const currCodeEl = document.getElementById('selectedCurrCode');
  const hintEl = document.getElementById('priceCurrencyHint');

  if (flagEl) flagEl.textContent = flag;
  if (langEl) langEl.textContent = lang;
  if (currCodeEl) currCodeEl.textContent = `${symbol} (${code})`;
  if (hintEl) hintEl.textContent = `Prices shown in ${code} (${symbol})`;

  closeCurrencyModal();
  showToast(`Currency updated to ${code} ${symbol} (${lang})`, 'success');
}

function calculateShippingEstimate() {
  const input = document.getElementById('shippingPincodeInput');
  const result = document.getElementById('shippingCalcResult');
  if (!input || !result) return;
  const pin = input.value.trim();
  if (!pin) {
    result.textContent = 'Please enter a valid pincode or zip code.';
    result.style.color = '#c23b3b';
    return;
  }

  const estDate = new Date();
  estDate.setDate(estDate.getDate() + 3);
  const formattedDate = estDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  result.innerHTML = `✓ Express Air Shipping available for <strong>Pincode ${pin}</strong>! Guaranteed delivery by <strong>${formattedDate}</strong> (Free on orders above ₹1,500).`;
  result.style.color = '#2e7d32';
}

function handlePersonalShopperSubmit(e) {
  e.preventDefault();
  showToast('VIP Concierge session booked! A senior craft curator will reach out on WhatsApp.', 'success');
  e.target.reset();
}
