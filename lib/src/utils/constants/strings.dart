import 'package:flutter_dotenv/flutter_dotenv.dart';

// Base URI — loaded from config.env (no trailing slash)
final _secureUri = dotenv.env['URI'];
String uri = _secureUri!;

// ── Auth ──────────────────────────────────────────────────────────────────────
String registerUrl = '$uri/api/auth/register';
String signInUrl = '$uri/api/auth/login';
String signOutUrl = '$uri/api/auth/logout';
String tokenRefreshUrl = '$uri/api/auth/refresh';
String getUserDataUri = '$uri/api/auth/me';
String isTokenValidUri = '$uri/IsTokenValid'; // legacy
String adminLoginUrl = '$uri/api/admin/login';

// Legacy — kept for backward compat with existing code
String signUpUrl = registerUrl;

// ── Products ──────────────────────────────────────────────────────────────────
String fetchProductsUri = '$uri/api/products';
String fetchCategoryProductsUri = '$uri/api/products?craft='; // updated from category= to craft=
String searchProductsUri = '$uri/api/products/search';
String getProductRatingUri = '$uri/api/get-product-rating';
String getAverageRatingUri = '$uri/api/get-ratings-average';
String rateProductUri = '$uri/api/rate-product';
String getAverageRatingLengthUri = '$uri/api/get-average-ratings-length';
String getDealOfTheDayUri = '$uri/api/deal-of-the-day';

// ── Seller ────────────────────────────────────────────────────────────────────
String sellerBaseUri = '$uri/api/sellers';

// ── Cart ──────────────────────────────────────────────────────────────────────
String getCartUri = '$uri/api/get-cart';
String addToCartUri = '$uri/api/add-to-cart';
String removeFromCartUri = '$uri/api/remove-from-cart';
String deleteFromCartUri = '$uri/api/delete-from-cart';

// ── Orders ────────────────────────────────────────────────────────────────────
String orderUri = '$uri/api/order';
String fetchMyOrdersUri = '$uri/api/orders/me';
String searchOrdersUri = '$uri/api/orders/search';
String placeOrderBuyNowUri = '$uri/api/place-order-buy-now';

// ── Payments ──────────────────────────────────────────────────────────────────
String razorpayCreateOrderUri = '$uri/api/payments/razorpay/order';
String razorpayVerifyUri = '$uri/api/payments/razorpay/verify';

// ── Coupons ───────────────────────────────────────────────────────────────────
String validateCouponUri = '$uri/api/coupons/validate';

// ── Addresses ─────────────────────────────────────────────────────────────────
String addressesUri = '$uri/api/addresses';
String saveUserAddressUri = '$uri/api/save-user-address'; // legacy

// ── Wishlist & Shopping ───────────────────────────────────────────────────────
String addKeepShoppingForUri = '$uri/api/add-keep-shopping-for';
String getKeepShoppingForUri = '$uri/api/get-keep-shopping-for';
String getWishListUri = '$uri/api/get-wish-list';
String addToWishListUri = '$uri/api/add-to-wish-list';
String removeFromWishListUri = '$uri/api/delete-from-wish-list';
String isWishListedUri = '$uri/api/is-wishlisted';
String addToCartFromWishListUri = '$uri/api/add-to-cart-from-wish-list';

// ── Save for Later ────────────────────────────────────────────────────────────
String saveForLaterUri = '$uri/api/save-for-later';
String getSaveForLaterUri = '$uri/api/get-save-for-later';
String deleteFromLaterUri = '$uri/api/delete-from-later';
String moveToCartUri = '$uri/api/move-to-cart';

// ── Notifications ─────────────────────────────────────────────────────────────
String notificationsUri = '$uri/api/notifications';
String markNotificationReadUri = '$uri/api/notifications';
String markAllNotificationsReadUri = '$uri/api/notifications/read-all';
String fcmTokenUri = '$uri/api/fcm-token';

// ── Support ───────────────────────────────────────────────────────────────────
String supportTicketsUri = '$uri/api/support/tickets';

// ── Admin ─────────────────────────────────────────────────────────────────────
// These are kept for the backend — no Flutter screens use them
String adminSummaryUri = '$uri/api/admin/summary';
String adminApprovalsUri = '$uri/api/admin/approvals';
String adminCustomersUri = '$uri/api/admin/customers';
String adminArtisansUri = '$uri/api/admin/artisans';
String adminOrdersUri = '$uri/api/admin/orders';
String adminReturnsUri = '$uri/api/admin/returns';
String adminCouponsUri = '$uri/api/admin/coupons';
String adminSupportUri = '$uri/api/admin/support/tickets';
