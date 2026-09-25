# Kalaghar — Multi-Vendor Indian Artisan & Heritage Crafts Marketplace

[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![BLoC](https://img.shields.io/badge/BLOC-3448C5?style=for-the-badge&logo=flutter&logoColor=white)](https://bloclibrary.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=61DAFB)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=for-the-badge&logo=razorpay&logoColor=008CFF)](https://razorpay.com/)

**Kalaghar** (House of Arts) is a production-grade multi-vendor e-commerce platform dedicated to empowering traditional Indian artisans and preserving heritage handicrafts. It bridges rural master craftspeople directly with global buyers, featuring authentic craft categorization (Terracotta, Blue Pottery, Pashmina, Dhokra Art, Madhubani Painting, Wood Carving, Brassware, Tanjore Painting, Kantha Embroidery), verified artisan seller profiles with heritage stories, secure multi-role workflows (Buyer, Seller, Admin), and server-verified payments via Razorpay.

---

## 🌟 Key Highlights & Vision

- **Artisan Empowerment:** Direct seller storefronts showcasing master artisans, their village origins, generations of practice, and handcrafting techniques.
- **Craft & Heritage Preservation:** Products indexed by traditional Indian craft forms, regional origins (e.g., Jaipur, Bengal, Kashmir, Bastar), and authentic production methods.
- **Enterprise-Grade Security:** JWT authentication with access token & rotatable refresh token, server-enforced role access control, bcrypt hashing (cost factor 12), Helmet HTTP header protection, and rate limiting.
- **Strict Role Gating:** Mobile application tailored for **Buyers** and **Artisan Sellers**. Admin accounts logging in on mobile are automatically routed to a dedicated screen instructing them to access the Web Admin Portal.
- **Server-Verified Payments:** Integrated Razorpay checkout with HMAC-SHA256 signature validation alongside Cash on Delivery (COD) workflows.

---

## 🚀 Architecture & Tech Stack

### Client Side (Mobile App)
- **Framework:** Flutter (Dart)
- **State Management:** BLoC Architecture (`flutter_bloc`, `hydrated_bloc` with `equatable`)
- **Navigation:** `go_router` for deep linking and role-based route guards
- **Design System & Typography:** Material 3 with Google Fonts (`Plus Jakarta Sans`), curated palette (Terracotta `#C85A32`, Deep Teal `#1A4D4E`, Warm Parchment `#FDFBF7`)
- **Storage:** `flutter_secure_storage` for token persistence and `shared_preferences`
- **Integrations:** `razorpay_flutter` SDK, `firebase_messaging` (FCM), `syncfusion_flutter_charts` for sales analytics

### Server Side (Backend API)
- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB Atlas with Mongoose ODM (text search indexing, schema validation, compound indexes)
- **Security:** `helmet`, `express-rate-limit`, `bcryptjs`, `jsonwebtoken`
- **Validation:** `express-validator` middleware for strict 4xx error formatting
- **Logging:** Structured JSON logging using `winston` and request tracking with `morgan`
- **File & Media Storage:** `multer` with Cloudinary API for public image assets and authenticated/private storage for artisan KYC documents
- **Payments & Notifications:** `razorpay` Node.js SDK, Firebase Admin SDK for FCM push notifications

---

## 📦 Features Breakdown

### 🛍️ Buyer Experience
- **Dynamic Home Dashboard:** Hero carousel of craft heritage banners, curated category grids, and backend-configurable 4-offer visual showcase tiles.
- **Craft & Region Filtering:** Filter items by authentic craft types (pottery, pashmina, dhokra, madhubani, etc.), region of origin, price range, and sorting options.
- **MongoDB Text Search:** Instant text search across product titles, descriptions, and regional tags.
- **Artisan Story Integration:** Every product links directly to the artisan's personal profile, showcasing their portrait, village, experience, and traditional techniques.
- **Cart & Save for Later:** Full cart management, swipe actions, quantity updates, and seamless movement between active Cart and Save for Later list.
- **Address Book Management:** Save and select multiple delivery addresses during checkout.
- **Coupon & Discount Engine:** Server-side coupon code validation (minimum order value, percentage/fixed discounts, expiry date).
- **Checkout & Payments:** Secure payment through Razorpay (server signature verified) or Cash on Delivery (COD).
- **Visual Order Tracking:** Stepper timeline tracking status from `placed` ➔ `confirmed` ➔ `shipped` ➔ `out_for_delivery` ➔ `delivered`.
- **Returns & Support:** Submit return requests within eligible delivery windows and create in-app support tickets.

### 🎨 Artisan Seller Portal
- **Seller Onboarding:** Artisan registration flow requesting store name, primary craft, and heritage details.
- **KYC Verification:** Private document submission (Government ID / Artisan Card) uploaded securely to Cloudinary.
- **Product Management:** Full CRUD operations for products including craft selection, region, technique, pricing, stock, and multi-image uploads.
- **Order Pipeline:** View and fulfill orders specifically containing the seller's products with validated status transition rules.
- **Sales & Earnings Analytics:** Visual breakdown of revenue, sales trends, and category performance powered by Syncfusion Charts.
- **Promotions & Coupons:** Artisans can create store-specific coupons and discounts for buyers.

### 🛡️ Web Admin Portal
- **Dashboard Overview:** Platform-wide analytics including total gross sales, seller payouts, net platform commissions (default 10%), active users, and order counts.
- **Artisan KYC Approvals:** Queue of pending seller applications; inspect KYC documents and approve or reject seller status.
- **Product Moderation:** Approve or reject newly listed artisan products before they become visible to buyers.
- **Support & Disputes:** Manage support tickets, order dispute claims, and process customer return approvals.
- **Content & Banner Control:** Update home screen hero banners and 4-offer showcase tiles in real time.

---

## 🛠️ Security & Data Integrity Controls

| Domain | Control Implemented |
|---|---|
| **Input Validation** | Every endpoint validates inputs via `express-validator`. Invalid inputs return formatted 422 errors instead of 500 internal crashes. |
| **Authentication** | Dual-token mechanism: 15-minute JWT Access Token + 30-day rotatable Refresh Token stored securely. |
| **Role Authorization** | Strict `requireRole(['buyer', 'seller', 'admin'])` middleware checks on all protected endpoints. |
| **Rate Limiting** | Dedicated rate limiters on `/api/auth/login` (5 attempts / 15 min) and `/api/admin/login` (3 attempts / 15 min). |
| **Financial Calculations** | All totals, discounts, shipping fees, and 10% platform commissions are computed exclusively server-side. |
| **KYC Privacy** | Sensitive KYC documents are stored as Cloudinary private/authenticated assets with restricted access. |

---

## 🌐 API Endpoint Matrix

### Auth Routes (`/api/auth`)
- `POST /api/auth/register` — Register new buyer or artisan seller account
- `POST /api/auth/login` — Login with rate limiting; returns access & refresh tokens
- `POST /api/auth/refresh` — Rotate refresh token for a new access token
- `POST /api/auth/logout` — Revoke active refresh token
- `GET /api/auth/me` — Fetch current user profile
- `POST /api/admin/login` — Hardened login endpoint reserved for administrators

### Product & Search Routes (`/api/products`)
- `GET /api/products` — Paginated product list filtered by craft, region, price, and status (`approved` only for buyers)
- `GET /api/products/search/:name` — MongoDB text index search
- `GET /api/products/:id` — Detailed product view with ratings and recommendations
- `POST /api/products` — Create new artisan product listing (`seller` only)
- `PUT /api/products/:id` — Update product details (seller ownership checked)
- `DELETE /api/products/:id` — Delete product listing

### Seller Routes (`/api/sellers`)
- `POST /api/sellers/:id/kyc` — Submit private KYC verification documents
- `GET /api/sellers/:id` — Public artisan story page and profile details
- `GET /api/sellers/:id/products` — List products by specific seller
- `GET /api/sellers/:id/earnings` — Seller earnings summary and category analytics
- `GET /api/sellers/:id/orders` — Orders filtered for seller's products
- `PATCH /api/sellers/:id/orders/:orderId/status` — Advance order status (`shipped`, etc.)

### User & Checkout Routes (`/api/user` & `/api/orders`)
- `POST /api/user/address` — Add new address to user address book
- `GET /api/user/addresses` — Get saved addresses
- `POST /api/user/add-to-cart` — Add product to active cart
- `DELETE /api/user/remove-from-cart/:id` — Remove or decrement cart item
- `POST /api/orders` — Create new order with server-calculated pricing
- `GET /api/orders/me` — Paginated user order history
- `POST /api/orders/:id/return` — Initiate return/refund request

### Payments & Coupons (`/api/payments` & `/api/coupons`)
- `POST /api/payments/razorpay/order` — Generate Razorpay payment order
- `POST /api/payments/razorpay/verify` — Verify Razorpay HMAC-SHA256 payment signature
- `POST /api/coupons/validate` — Validate coupon code against cart subtotal

### Admin Management (`/api/admin`)
- `GET /api/admin/summary` — Overview metrics and platform earnings
- `GET /api/admin/approvals` — Get pending seller KYC requests
- `PATCH /api/admin/approvals/:id` — Approve or reject seller application
- `PATCH /api/products/:id/status` — Moderate product listing status (`approved` / `rejected`)

---

## 🔑 Test Credentials

The database seed script initializes ready-to-use test accounts for all roles:

| Role | Email | Password | Access / Dashboard |
|---|---|---|---|
| **Admin** | `admin@kalaghar.in` | `Admin@1234` | Web Admin Portal (Gated on Mobile) |
| **Artisan Seller** | `artisan@kalaghar.in` | `Artisan@1234` | Seller Studio & Inventory Manager |
| **Buyer** | `buyer@kalaghar.in` | `Buyer@1234` | Buyer Marketplace & Mobile App |

---

## ⚡ Local Setup & Installation

### 1. Prerequisites
- **Node.js** v18+ and `npm`
- **Flutter SDK** v3.16+
- **MongoDB Atlas** database cluster (or local MongoDB v6.0+)
- **Cloudinary Account** for media upload handling

### 2. Environment Configuration
Copy the provided environment template to `config.env` at the repository root:

```bash
cp server/.env.example config.env
```

Edit `config.env` with your actual credentials:

```env
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# MongoDB Atlas
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=cluster0.your_host.mongodb.net

# JWT Secrets (generate strong 64-byte random strings)
JWT_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Cloudinary Setup
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay Test Keys
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 3. Backend Installation & Seeding
Navigate to the server directory, install dependencies, and populate the database with authentic artisan products and test accounts:

```bash
cd server
npm install

# Run database seed (idempotent setup)
npm run seed

# Start development server with nodemon
npm run dev
```

The server will connect to MongoDB and start listening on `http://localhost:3000`.

### 4. Client Application Setup
In the repository root directory, run pub get and launch the Flutter app:

```bash
# Get Flutter dependencies
flutter pub get

# Run on Android emulator or connected device
flutter run
```

---

## 🧪 Running Automated Tests

### Backend Unit & Integration Tests (Jest & Supertest)
Run the automated test suite in the `server` directory:

```bash
cd server
npm test
```

*Includes coverage for registration, authentication, JWT verification, role protection, product validation, coupon application, order status state transitions, and Razorpay signature verification.*

### Flutter Unit Tests
Run the client-side BLoC state management and checkout logic unit tests:

```bash
flutter test
```

---

## 🚀 Deployment Guidelines

### Backend Deployment (Render / Railway / Fly.io)
1. Deploy the `server/` directory on an **always-on** server instance (e.g., Render Starter Plan or Railway Hobby instance).
2. Set all variables from `server/.env.example` in your deployment platform environment settings.
3. Ensure your MongoDB Atlas IP Access List allows connections from your backend host static IP.

### Flutter App Build
Generate production build outputs for mobile platforms:

```bash
# Android APK
flutter build apk --release

# Android App Bundle (Play Store)
flutter build appbundle --release
```

---

## 📄 License & Acknowledgements

This project is released under the **MIT License**.

Special thanks to Indian craft clusters, artisan cooperatives, and open-source contributors dedicated to preserving global cultural heritage through technology.
