/**
 * Kalaghar Seed Script
 * Usage: npm run seed
 *
 * Idempotent — safe to run multiple times.
 * Uses upsert to avoid duplicates.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./model/user');
const { Product } = require('./model/product');
const Category = require('./model/category');

let primaryDB = process.env.MONGODB_URI;
if (!primaryDB && process.env.DB_USERNAME && process.env.DB_PASSWORD && process.env.DB_USERNAME !== 'admin' && process.env.DB_USERNAME !== 'your_atlas_db_username') {
  primaryDB = `mongodb+srv://${process.env.DB_USERNAME}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST || 'cluster0.fkliyeh.mongodb.net'}/kalaghar?retryWrites=true&w=majority`;
}
const DB = primaryDB || 'mongodb://127.0.0.1:27017/kalaghar';

// ─── Seed data ────────────────────────────────────────────────────────────────

const testAccounts = [
  {
    name: 'Kalaghar Admin',
    email: 'admin@kalaghar.in',
    password: 'Admin@1234',
    role: 'admin',
  },
  {
    name: 'Meena Artisan',
    email: 'artisan@kalaghar.in',
    password: 'Artisan@1234',
    role: 'seller',
    storeName: 'Meena Madhubani Studio',
    craft: 'paintings',
    region: 'Bihar',
    technique: 'Madhubani',
    phone: '9876543210',
    kycStatus: 'approved',
    artisanStory: {
      village: 'Madhubani',
      region: 'Bihar',
      yearsOfExperience: 25,
      technique: 'Traditional Madhubani painting',
      bio: 'Meena has been practicing Madhubani art for over 25 years, passed down through generations of women artists in her family.',
    },
  },
  {
    name: 'Priya Buyer',
    email: 'buyer@kalaghar.in',
    password: 'Buyer@1234',
    role: 'buyer',
  },
];

const artisanProducts = [
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

// Pending approval queue entries
const pendingKycSellers = [
  {
    name: 'Rukmini Devi',
    email: 'rukmini@kalaghar.in',
    password: 'Seller@1234',
    role: 'seller',
    storeName: 'Rukmini Arts',
    craft: 'paintings',
    region: 'Rajasthan',
    kycStatus: 'pending',
  },
  {
    name: 'Mahesh Kumar',
    email: 'mahesh@kalaghar.in',
    password: 'Seller@1234',
    role: 'seller',
    storeName: 'Mahesh Pottery Works',
    craft: 'pottery',
    region: 'Uttar Pradesh',
    kycStatus: 'pending',
  },
  {
    name: 'Ayesha Khan',
    email: 'ayesha@kalaghar.in',
    password: 'Seller@1234',
    role: 'seller',
    storeName: 'Ayesha Textiles',
    craft: 'textiles',
    region: 'Gujarat',
    kycStatus: 'approved',
  },
  {
    name: 'Suresh Verma',
    email: 'suresh@kalaghar.in',
    password: 'Seller@1234',
    role: 'seller',
    storeName: 'Suresh Art Studio',
    craft: 'paintings',
    region: 'Maharashtra',
    kycStatus: 'approved',
  },
  {
    name: 'Rekha Patel',
    email: 'rekha@kalaghar.in',
    password: 'Seller@1234',
    role: 'seller',
    storeName: 'Rekha Jewellers',
    craft: 'jewellery',
    region: 'Gujarat',
    kycStatus: 'pending',
  },
];

// ─── Seed function ─────────────────────────────────────────────────────────────
async function seed(options = {}) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(DB);
    }
    console.log('✓ Connected to MongoDB (kalaghar database)');

    // ── Categories (per DB design) ───────────────────────────────────────────
    console.log('\nSeeding categories...');
    const seedCategories = [
      { name: 'Pottery & Ceramics', slug: 'pottery', description: 'Traditional Blue Pottery, Terracotta & Ceramic art' },
      { name: 'Handloom Textiles', slug: 'textiles', description: 'Handloom Sarees, Stoles, Scarves & Fabric' },
      { name: 'Paintings & Folk Art', slug: 'paintings', description: 'Madhubani art, Warli & Heritage paintings' },
      { name: 'Silver Jewellery', slug: 'jewellery', description: 'Authentic handcrafted silver & ethnic jewellery' },
      { name: 'Woodcraft', slug: 'woodcraft', description: 'Hand-carved wooden items and decorative accents' },
      { name: 'Bamboo & Cane', slug: 'bamboo', description: 'Eco-friendly bamboo basketry and home items' },
      { name: 'Home & Lifestyle', slug: 'home-lifestyle', description: 'Handmade decor, cushions, and lifestyle crafts' },
      { name: 'Eco & Sustainable', slug: 'sustainable', description: 'Organic, natural, zero-waste artisan products' },
    ];
    for (const cat of seedCategories) {
      await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true });
    }
    console.log(`  ✓ Seeded ${seedCategories.length} categories.`);

    // ── Test accounts ────────────────────────────────────────────────────────
    console.log('\nSeeding test accounts...');
    const createdAccounts = {};

    for (const account of testAccounts) {
      const existing = await User.findOne({ email: account.email });
      if (existing) {
        console.log(`  ↳ ${account.email} already exists — skipping`);
        createdAccounts[account.email] = existing;
        continue;
      }

      const hashed = await bcrypt.hash(account.password, 12);
      const user = new User({ ...account, password: hashed });
      await user.save();
      createdAccounts[account.email] = user;
      console.log(`  ✓ Created ${account.role}: ${account.email}`);
    }

    // ── Pending KYC sellers ──────────────────────────────────────────────────
    console.log('\nSeeding pending approval sellers...');
    for (const seller of pendingKycSellers) {
      const existing = await User.findOne({ email: seller.email });
      if (existing) {
        console.log(`  ↳ ${seller.email} already exists — skipping`);
        continue;
      }

      const hashed = await bcrypt.hash(seller.password, 12);
      const user = new User({ ...seller, password: hashed });
      await user.save();
      console.log(`  ✓ Created seller (${seller.kycStatus} KYC): ${seller.email}`);
    }

    // ── Products ─────────────────────────────────────────────────────────────
    console.log('\nSeeding artisan products...');
    const artisanUser = createdAccounts['artisan@kalaghar.in'];

    for (const productData of artisanProducts) {
      const existing = await Product.findOne({ name: productData.name, sellerId: artisanUser._id });
      if (existing) {
        existing.images = productData.images;
        await existing.save();
        console.log(`  ✓ Updated image paths for existing product: "${productData.name}"`);
        continue;
      }

      const product = new Product({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock,
        quantity: productData.stock,
        craft: productData.craft,
        category: productData.craft,
        region: productData.region,
        technique: productData.technique,
        images: productData.images,
        sellerId: artisanUser._id,
        sellerName: artisanUser.name,
        status: 'approved', // seed products are pre-approved for demo
      });

      await product.save();
      console.log(`  ✓ Created product: ${productData.name} (₹${productData.price})`);
    }

    // ── Pending listing products (for approval queue) ─────────────────────────
    const pendingSellers = await User.find({ email: { $in: ['ayesha@kalaghar.in', 'suresh@kalaghar.in'] } });
    const pendingProducts = [
      {
        name: 'Block Print Salwar Suit',
        description: 'Hand block printed salwar suit from Bagru, Rajasthan',
        price: 2100,
        stock: 15,
        craft: 'textiles',
        region: 'Rajasthan',
        technique: 'Bagru block printing',
        images: ['/assets/banarasi_saree.svg'],
        status: 'pending',
      },
      {
        name: 'Warli Painting Canvas',
        description: 'Original Warli tribal art on canvas, Palghar Maharashtra',
        price: 1800,
        stock: 8,
        craft: 'paintings',
        region: 'Maharashtra',
        technique: 'Traditional Warli',
        images: ['/assets/madhubani_painting.svg'],
        status: 'pending',
      },
    ];

    for (let i = 0; i < pendingProducts.length; i++) {
      const seller = pendingSellers[i % pendingSellers.length];
      if (!seller) continue;
      const existing = await Product.findOne({ name: pendingProducts[i].name });
      if (existing) {
        existing.images = pendingProducts[i].images;
        await existing.save();
        console.log(`  ✓ Updated pending product image: ${pendingProducts[i].name}`);
        continue;
      }
      const product = new Product({
        ...pendingProducts[i],
        category: pendingProducts[i].craft,
        sellerId: seller._id,
        sellerName: seller.name,
      });
      await product.save();
      console.log(`  ✓ Created pending product: ${pendingProducts[i].name}`);
    }

    console.log('\n✅ Seed complete!\n');
    console.log('Test accounts:');
    console.log('  Admin:   admin@kalaghar.in   / Admin@1234');
    console.log('  Artisan: artisan@kalaghar.in / Artisan@1234');
    console.log('  Buyer:   buyer@kalaghar.in   / Buyer@1234\n');
  } catch (e) {
    console.error('Seed error:', e.message);
  } finally {
    if (!options.skipDisconnect) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  }
}

if (require.main === module) {
  const connectDB = require('./config/db');
  connectDB().then(() => seed());
}

module.exports = seed;
