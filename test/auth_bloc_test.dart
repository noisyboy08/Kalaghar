import 'package:flutter_test/flutter_test.dart';
import 'package:kalaghar/src/logic/blocs/auth_bloc/auth_bloc.dart';
import 'package:kalaghar/src/data/repositories/auth_repository.dart';

class MockAuthRepository implements AuthRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('AuthBloc Validation Tests', () {
    late AuthBloc authBloc;
    late MockAuthRepository mockAuthRepository;

    setUp(() {
      mockAuthRepository = MockAuthRepository();
      authBloc = AuthBloc(mockAuthRepository);
    });

    tearDown(() {
      authBloc.close();
    });

    test('initial state is AuthInitial', () {
      expect(authBloc.state, isA<AuthInitial>());
    });

    test('emits TextFieldErrorState when name is empty', () {
      authBloc.add(const TextFieldChangedEvent(
        nameValue: '',
        emailValue: 'test@kalaghar.in',
        passwordValue: 'Password123',
      ));

      expectLater(
        authBloc.stream,
        emits(isA<TextFieldErrorState>()),
      );
    });

    test('emits TextFieldErrorState when password is short', () {
      authBloc.add(const TextFieldChangedEvent(
        nameValue: 'Test User',
        emailValue: 'test@kalaghar.in',
        passwordValue: '123',
      ));

      expectLater(
        authBloc.stream,
        emits(isA<TextFieldErrorState>()),
      );
    });
  });
}
