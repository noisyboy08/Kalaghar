import 'package:flutter/material.dart';
import 'package:kalaghar/src/config/router/app_route_constants.dart';
import 'package:kalaghar/src/data/models/order.dart';
import 'package:kalaghar/src/data/models/product.dart';
import 'package:kalaghar/src/data/models/user.dart';
import 'package:kalaghar/src/data/repositories/account_repository.dart';
import 'package:kalaghar/src/data/repositories/category_products_repository.dart';
import 'package:kalaghar/src/data/repositories/products_repository.dart';
import 'package:kalaghar/src/data/repositories/user_repository.dart';
import 'package:kalaghar/src/logic/blocs/account/fetch_orders/fethc_orders_cubit.dart';
import 'package:kalaghar/src/logic/blocs/account/keep_shopping_for/cubit/keep_shopping_for_cubit.dart';
import 'package:kalaghar/src/logic/blocs/account/product_rating/product_rating_bloc.dart';
import 'package:kalaghar/src/logic/blocs/account/wish_list/wish_list_cubit.dart';
import 'package:kalaghar/src/logic/blocs/category_products/fetch_category_products_bloc/fetch_category_products_bloc.dart';
import 'package:kalaghar/src/logic/blocs/search/bloc/search_bloc.dart';
import 'package:kalaghar/src/presentation/views/account/browsing_history.dart';
import 'package:kalaghar/src/presentation/views/account/orders/order_details.dart';
import 'package:kalaghar/src/presentation/views/account/orders/search_orders_screen.dart';
import 'package:kalaghar/src/presentation/views/account/orders/tracking_details_sceen.dart';
import 'package:kalaghar/src/presentation/views/account/orders/your_orders.dart';
import 'package:kalaghar/src/presentation/views/account/wish_list_screen.dart';
import 'package:kalaghar/src/presentation/views/another_screen.dart';
import 'package:kalaghar/src/presentation/views/auth/admin_blocked_screen.dart';
import 'package:kalaghar/src/presentation/views/auth/auth_screen.dart';
import 'package:kalaghar/src/presentation/views/bottom_navigation_bar/bottom_bar.dart';
import 'package:kalaghar/src/presentation/views/cart/cart_screen.dart';
import 'package:kalaghar/src/presentation/views/category_products/category_products_screen.dart';
import 'package:kalaghar/src/presentation/views/home/home_screen.dart';
import 'package:kalaghar/src/presentation/views/menu/menu_screen.dart';
import 'package:kalaghar/src/presentation/views/payment/payment_screen.dart';
import 'package:kalaghar/src/presentation/views/payment/payment_screen_buy_now.dart';
import 'package:kalaghar/src/presentation/views/product_details/product_details_screen.dart';
import 'package:kalaghar/src/presentation/views/search/search_screen.dart';
import 'package:kalaghar/src/presentation/views/splash_screen/splash_screen.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';

// Module-level blocs shared across route rebuilds
final _fetchCategoryProductsBloc =
    FetchCategoryProductsBloc(CategoryProductsRepository());

final _searchProductBloc = SearchBloc(ProductsRepository());

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      name: AppRouteConstants.splashScreen.name,
      path: AppRouteConstants.splashScreen.path,
      pageBuilder: (context, state) {
        return const MaterialPage(child: SplashScreen());
      },
    ),
    GoRoute(
      name: AppRouteConstants.authRoute.name,
      path: AppRouteConstants.authRoute.path,
      pageBuilder: (context, state) {
        return const MaterialPage(child: AuthScreen());
      },
    ),

    // Admin accounts redirected here — management is via web panel
    GoRoute(
      name: 'admin-blocked',
      path: '/admin-blocked',
      pageBuilder: (context, state) {
        return const MaterialPage(child: AdminBlockedScreen());
      },
    ),

    GoRoute(
      name: AppRouteConstants.bottomBarRoute.name,
      path: AppRouteConstants.bottomBarRoute.path,
      pageBuilder: (context, state) {
        return MaterialPage(child: BottomBar());
      },
    ),
    GoRoute(
      name: AppRouteConstants.homeScreenRoute.name,
      path: AppRouteConstants.homeScreenRoute.path,
      pageBuilder: (context, state) {
        return const MaterialPage(child: HomeScreen());
      },
    ),
    GoRoute(
      name: AppRouteConstants.orderDetailsScreenRoute.name,
      path: AppRouteConstants.orderDetailsScreenRoute.path,
      pageBuilder: (context, state) {
        final order = state.extra as Order;
        return MaterialPage(
            child: BlocProvider.value(
          value: ProductRatingBloc(AccountRepository())
            ..add(GetProductRatingEvent(order: order)),
          child: OrderDetailsScreen(order: order),
        ));
      },
    ),
    GoRoute(
      name: AppRouteConstants.productDetailsScreenRoute.name,
      path: AppRouteConstants.productDetailsScreenRoute.path,
      pageBuilder: (context, state) {
        final Map<String, dynamic> extraData =
            state.extra as Map<String, dynamic>;
        final product = extraData['product'] as Product;
        final deliveryDate = extraData['deliveryDate'] as String;
        return MaterialPage(
            child: MultiBlocProvider(
          providers: [
            BlocProvider(
              create: (context) =>
                  FetchCategoryProductsBloc(CategoryProductsRepository())
                    // Use craft for the new API
                    ..add(CategoryPressedEvent(category: product.craft)),
            ),
          ],
          child: ProductDetailsScreen(
            product: product,
            deliveryDate: deliveryDate,
          ),
        ));
      },
    ),
    GoRoute(
      name: AppRouteConstants.browsingHistoryScreenRoute.name,
      path: AppRouteConstants.browsingHistoryScreenRoute.path,
      pageBuilder: (context, state) {
        return MaterialPage(
            child: BlocProvider.value(
                value: KeepShoppingForCubit(AccountRepository())
                  ..keepShoppingFor(),
                child: const BrowsingHistory()));
      },
    ),
    GoRoute(
        path: AppRouteConstants.yourOrdersScreenRoute.path,
        name: AppRouteConstants.yourOrdersScreenRoute.name,
        pageBuilder: (context, state) {
          return MaterialPage(
            child: BlocProvider.value(
              value: FetchOrdersCubit(AccountRepository())..fetchOrders(),
              child: const YourOrders(),
            ),
          );
        }),
    GoRoute(
        path: AppRouteConstants.yourWishListScreenRoute.path,
        name: AppRouteConstants.yourWishListScreenRoute.name,
        pageBuilder: (context, state) {
          return MaterialPage(
            child: BlocProvider.value(
              value: WishListCubit(
                  accountRepository: AccountRepository(),
                  userRepository: UserRepository())
                ..getWishList(),
              child: const WishListScreen(),
            ),
          );
        }),
    GoRoute(
      name: AppRouteConstants.anotherScreenRoute.name,
      path: AppRouteConstants.anotherScreenRoute.path,
      pageBuilder: (context, state) {
        final String appBarTitle = state.pathParameters['appBarTitle']!;
        return MaterialPage(
            child: AnotherScreen(appBarTitle: appBarTitle));
      },
    ),
    GoRoute(
      name: AppRouteConstants.categoryproductsScreenRoute.name,
      path: '${AppRouteConstants.categoryproductsScreenRoute.path}/:category',
      pageBuilder: (context, state) {
        final category = state.pathParameters['category']!;
        return MaterialPage(
            child: BlocProvider.value(
          value: _fetchCategoryProductsBloc
            ..add(CategoryPressedEvent(category: category)),
          child: CategoryProductsScreen(category: category),
        ));
      },
    ),
    GoRoute(
      name: AppRouteConstants.searchScreenRoute.name,
      path: '${AppRouteConstants.searchScreenRoute.path}/:searchQuery',
      pageBuilder: (context, state) {
        final searchQuery = state.pathParameters['searchQuery']!;
        return MaterialPage(
            child: BlocProvider.value(
          value: _searchProductBloc..add(SearchEvent(searchQuery: searchQuery)),
          child: SearchScreen(searchQuery: searchQuery),
        ));
      },
    ),
    GoRoute(
      name: AppRouteConstants.searchOrdersScreenRoute.name,
      path: '${AppRouteConstants.searchOrdersScreenRoute.path}/:orderQuery',
      pageBuilder: (context, state) {
        final orderQuery = state.pathParameters['orderQuery']!;
        return MaterialPage(
            child: BlocProvider.value(
          value: FetchOrdersCubit(AccountRepository())
            ..fetchSearchedOrders(orderQuery),
          child: SearchOrderScreeen(orderQuery: orderQuery),
        ));
      },
    ),
    GoRoute(
        name: AppRouteConstants.menuScreenRoute.name,
        path: AppRouteConstants.menuScreenRoute.path,
        pageBuilder: (context, state) {
          return const MaterialPage(child: MenuScreen());
        }),
    GoRoute(
        name: AppRouteConstants.cartScreenScreenRoute.name,
        path: AppRouteConstants.cartScreenScreenRoute.path,
        pageBuilder: (context, state) {
          return const MaterialPage(child: CartScreen());
        }),
    GoRoute(
        name: AppRouteConstants.paymentScreenRoute.name,
        path: AppRouteConstants.paymentScreenRoute.path,
        pageBuilder: (context, state) {
          final double totalAmount = state.extra as double;
          return MaterialPage(
              child: PaymentScreen(totalAmount: totalAmount.toString()));
        }),
    GoRoute(
        name: AppRouteConstants.buyNowPaymentScreenRoute.name,
        path: AppRouteConstants.buyNowPaymentScreenRoute.path,
        pageBuilder: (context, state) {
          final Map<String, dynamic> extraData =
              state.extra as Map<String, dynamic>;
          final Product product = extraData['product'] as Product;
          return MaterialPage(child: PaymentScreenBuyNow(product: product));
        }),
    GoRoute(
        name: AppRouteConstants.trackingDetailsScreenRoute.name,
        path: AppRouteConstants.trackingDetailsScreenRoute.path,
        pageBuilder: (context, state) {
          final Map<String, dynamic> extraData =
              state.extra as Map<String, dynamic>;
          final Order order = extraData['order'] as Order;
          final User user = extraData['user'] as User;
          return MaterialPage(
              child: TrackingDetailsScreen(order: order, user: user));
        }),

    // NOTE: All admin routes deleted — see AdminBlockedScreen above.
    // Admin panel: https://admin.kalaghar.in
  ],
);
