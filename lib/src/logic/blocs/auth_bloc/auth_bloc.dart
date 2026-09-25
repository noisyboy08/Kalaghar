// ignore_for_file: depend_on_referenced_packages

import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:kalaghar/src/data/models/user.dart';
import 'package:kalaghar/src/data/repositories/auth_repository.dart';
import 'package:meta/meta.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'auth_event.dart';
part 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc(this.authRepository) : super(AuthInitial()) {
    on<TextFieldChangedEvent>(_onTextFieldChangedHandler);
    on<CreateAccountPressedEvent>(_onCreateAccountPressedHandler);
    on<SignInPressedEvent>(_signInPressedHandler);
    on<SignOutEvent>(_onSignOutHandler);
    on<LoadUserEvent>(_onLoadUserHandler);
  }

  void _onTextFieldChangedHandler(
      TextFieldChangedEvent event, Emitter<AuthState> emit) {
    if (event.nameValue == '') {
      emit(TextFieldErrorState(errorString: 'Full name is required.'));
    } else if (event.emailValue == '') {
      emit(TextFieldErrorState(errorString: 'Please enter a valid email address.'));
    } else if (event.passwordValue.length < 8) {
      emit(TextFieldErrorState(errorString: 'Password must be at least 8 characters.'));
    } else {
      emit(TextFieldValidState(
          emailValue: event.emailValue, passwordValue: event.passwordValue));
    }
  }

  void _onCreateAccountPressedHandler(
      CreateAccountPressedEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoadingState());
    try {
      final User resUser = await authRepository.signUpUser(
        name: event.name,
        email: event.email,
        password: event.password,
        role: event.role,
        storeName: event.storeName,
        craft: event.craft,
      );

      emit(CreateUserInProgressState(user: resUser));
      emit(CreateUserSuccessState(userCreatedString: 'Account created! You can sign in now.'));
    } catch (e) {
      emit(AuthErrorState(errorString: e.toString()));
    }
  }

  void _signInPressedHandler(
      SignInPressedEvent event, Emitter<AuthState> emit) async {
    emit(AuthLoadingState());

    try {
      final User user = await authRepository.signInUser(event.email, event.password);

      final SharedPreferences prefs = await SharedPreferences.getInstance();
      // Store both tokens
      await prefs.setString('x-auth-token', user.token);
      if (user.refreshToken != null) {
        await prefs.setString('refresh-token', user.refreshToken!);
      }

      emit(UpdateUserData(user: user));
      emit(SignInSuccessState(user: user));
    } catch (e) {
      emit(AuthErrorState(errorString: e.toString()));
    }
  }

  void _onSignOutHandler(SignOutEvent event, Emitter<AuthState> emit) async {
    try {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('x-auth-token') ?? '';
      if (token.isNotEmpty) {
        await authRepository.signOut(token);
      }
      await prefs.remove('x-auth-token');
      await prefs.remove('refresh-token');
    } catch (e) {
      // Always sign out locally even if the server call fails
    }
    emit(AuthInitial());
  }

  void _onLoadUserHandler(LoadUserEvent event, Emitter<AuthState> emit) async {
    try {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('x-auth-token') ?? '';

      if (token.isEmpty) {
        emit(AuthInitial());
        return;
      }

      final User user = await authRepository.getUserData(token);
      emit(UpdateUserData(user: user));
    } catch (e) {
      // Token invalid — clear it
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.remove('x-auth-token');
      await prefs.remove('refresh-token');
      emit(AuthInitial());
    }
  }
}
