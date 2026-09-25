import 'package:flutter_test/flutter_test.dart';
import 'package:kalaghar/src/logic/blocs/cart/cart_bloc.dart';
import 'package:kalaghar/src/data/repositories/user_repository.dart';

class MockUserRepository implements UserRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('CartBloc Tests', () {
    late CartBloc cartBloc;
    late MockUserRepository mockUserRepository;

    setUp(() {
      mockUserRepository = MockUserRepository();
      cartBloc = CartBloc(mockUserRepository);
    });

    tearDown(() {
      cartBloc.close();
    });

    test('initial state is CartLoadingS', () {
      expect(cartBloc.state, isA<CartLoadingS>());
    });

    test('cartItemsLength returns -1 when state is not CartProductSuccessS', () {
      expect(cartBloc.cartItemsLength, -1);
    });
  });
}
