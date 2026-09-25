part of 'auth_bloc.dart';

@immutable
sealed class AuthEvent extends Equatable {}

class TextFieldChangedEvent extends AuthEvent {
  final String nameValue;
  final String emailValue;
  final String passwordValue;

  TextFieldChangedEvent(this.nameValue, this.emailValue, this.passwordValue);

  @override
  List<Object?> get props => [nameValue, emailValue, passwordValue];
}

class CreateAccountPressedEvent extends AuthEvent {
  final String name;
  final String email;
  final String password;
  final String role; // 'buyer' or 'seller'
  final String? storeName;
  final String? craft;

  CreateAccountPressedEvent({
    required this.name,
    required this.email,
    required this.password,
    this.role = 'buyer',
    this.storeName,
    this.craft,
  });

  @override
  List<Object?> get props => [name, email, password, role, storeName, craft];
}

class SignInPressedEvent extends AuthEvent {
  final String email;
  final String password;

  SignInPressedEvent(this.email, this.password);
  @override
  List<Object?> get props => [email, password];
}

class SignOutEvent extends AuthEvent {
  @override
  List<Object?> get props => [];
}

class LoadUserEvent extends AuthEvent {
  @override
  List<Object?> get props => [];
}
