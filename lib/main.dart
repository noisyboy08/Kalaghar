import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:kalaghar/src/config/router/router.dart';
import 'package:kalaghar/src/config/themes/app_theme.dart';
import 'package:kalaghar/src/data/repositories/account_repository.dart';
import 'package:kalaghar/src/data/repositories/auth_repository.dart';
import 'package:kalaghar/src/data/repositories/category_products_repository.dart';
import 'package:kalaghar/src/data/repositories/products_repository.dart';
import 'package:kalaghar/src/data/repositories/user_repository.dart';
import 'package:kalaghar/src/logic/blocs/account/fetch_account_screen_data/fetch_account_screen_data_cubit.dart';
import 'package:kalaghar/src/logic/blocs/account/fetch_orders/fethc_orders_cubit.dart';
import 'package:kalaghar/src/logic/blocs/account/keep_shopping_for/cubit/keep_shopping_for_cubit.dart';
import 'package:kalaghar/src/logic/blocs/account/product_rating/product_rating_bloc.dart';
import 'package:kalaghar/src/logic/blocs/account/wish_list/wish_list_cubit.dart';
import 'package:kalaghar/src/logic/blocs/auth_bloc/auth_bloc.dart';
import 'package:kalaghar/src/logic/blocs/auth_bloc/radio_bloc/radio_bloc.dart';
import 'package:kalaghar/src/logic/blocs/bottom_bar/bottom_bar_bloc.dart';
import 'package:kalaghar/src/logic/blocs/cart/cart_bloc.dart';
import 'package:kalaghar/src/logic/blocs/cart/cart_offers_cubit1/cart_offers_cubit.dart';
import 'package:kalaghar/src/logic/blocs/cart/cart_offers_cubit2/cart_offers_cubit.dart';
import 'package:kalaghar/src/logic/blocs/cart/cart_offers_cubit3/cart_offers_cubit.dart';
import 'package:kalaghar/src/logic/blocs/category_products/fetch_category_products_bloc/fetch_category_products_bloc.dart';
import 'package:kalaghar/src/logic/blocs/home_blocs/carousel_bloc/carousel_image_bloc.dart';
import 'package:kalaghar/src/logic/blocs/home_blocs/deal_of_the_day/deal_of_the_day_cubit.dart';
import 'package:kalaghar/src/logic/blocs/order/order_cubit/order_cubit.dart';
import 'package:kalaghar/src/logic/blocs/order/place_order_buy_now/place_order_buy_now_cubit.dart';
import 'package:kalaghar/src/logic/blocs/page_redirection_cubit/page_redirection_cubit.dart';
import 'package:kalaghar/src/logic/blocs/product_details/averageRating/average_rating_cubit.dart';
import 'package:kalaghar/src/logic/blocs/product_details/user_rating/user_rating_cubit.dart';
import 'package:kalaghar/src/logic/blocs/search/bloc/search_bloc.dart';
import 'package:kalaghar/src/logic/blocs/user_cubit/user_cubit.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hydrated_bloc/hydrated_bloc.dart';
import 'package:path_provider/path_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);
  HydratedBloc.storage = await HydratedStorage.build(
      storageDirectory: await getApplicationDocumentsDirectory());

  // Load environment config (no hard-coded URLs)
  await dotenv.load(fileName: 'config.env');

  runApp(const KalagharApp());
}

/// Kalaghar — multi-vendor artisan marketplace
class KalagharApp extends StatelessWidget {
  const KalagharApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          // Fire LoadUserEvent so the app auto-logs in from stored token
          create: (context) =>
              AuthBloc(AuthRepository())..add(LoadUserEvent()),
        ),
        BlocProvider(create: (context) => RadioBloc()),
        BlocProvider(
          create: (context) => UserCubit(UserRepository()),
        ),
        BlocProvider(
          create: (context) => CartBloc(UserRepository()),
        ),
        BlocProvider(
          create: (context) => PageRedirectionCubit(AuthRepository()),
        ),
        BlocProvider(create: (context) => BottomBarBloc()),
        BlocProvider(create: (context) => CarouselImageBloc()),
        BlocProvider(
          create: (context) =>
              FetchCategoryProductsBloc(CategoryProductsRepository()),
        ),
        BlocProvider(
          create: (context) => SearchBloc(ProductsRepository()),
        ),
        BlocProvider(
          create: (context) =>
              FetchAccountScreenDataCubit(UserRepository()),
        ),
        BlocProvider(
          create: (context) => FetchOrdersCubit(AccountRepository()),
        ),
        BlocProvider(
          create: (context) => ProductRatingBloc(AccountRepository()),
        ),
        BlocProvider(
          create: (context) => KeepShoppingForCubit(AccountRepository()),
        ),
        BlocProvider(
          create: (context) => WishListCubit(
              accountRepository: AccountRepository(),
              userRepository: UserRepository()),
        ),
        BlocProvider(
          create: (context) => UserRatingCubit(AccountRepository()),
        ),
        BlocProvider(
          create: (context) => CartOffersCubit1(AccountRepository()),
        ),
        BlocProvider(
          create: (context) => CartOffersCubit2(AccountRepository()),
        ),
        BlocProvider(
          create: (context) => CartOffersCubit3(AccountRepository()),
        ),
        BlocProvider(create: (context) => OrderCubit(UserRepository())),
        BlocProvider(
          create: (context) => PlaceOrderBuyNowCubit(UserRepository()),
        ),
        BlocProvider(
          create: (context) => AverageRatingCubit(AccountRepository()),
        ),
        BlocProvider(
          create: (context) => DealOfTheDayCubit(ProductsRepository()),
        ),
        // NOTE: All admin BlocProviders removed — admin management is via
        // the Kalaghar web admin panel, not this mobile app.
      ],
      child: MaterialApp.router(
        debugShowCheckedModeBanner: false,
        title: 'Kalaghar',
        theme: AppTheme.light,
        routerConfig: router,
      ),
    );
  }
}
