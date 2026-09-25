import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:kalaghar/src/data/datasources/api/auth_api.dart';
import 'package:kalaghar/src/data/models/user.dart';

class AuthRepository {
  final AuthAPI authApi = AuthAPI();

  /// Parse the consistent { error: { code, message } } error shape
  String _parseError(http.Response res) {
    try {
      final body = jsonDecode(res.body);
      if (body is Map) {
        if (body['error'] is Map) {
          return body['error']['message'] ?? 'An error occurred.';
        }
        if (body['msg'] != null) return body['msg'].toString();
      }
    } catch (_) {}
    return 'Server error (${res.statusCode}).';
  }

  /// Register a new buyer or seller account
  Future<User> signUpUser({
    required String name,
    required String email,
    required String password,
    String role = 'buyer',
    String? storeName,
    String? craft,
  }) async {
    try {
      final Map<String, dynamic> body = {
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      };
      if (storeName != null) body['storeName'] = storeName;
      if (craft != null) body['craft'] = craft;

      final http.Response res = await authApi.signUpUserRaw(body);

      if (res.statusCode == 201 || res.statusCode == 200) {
        final responseBody = jsonDecode(res.body);
        final userMap = responseBody['user'] as Map<String, dynamic>;
        userMap['token'] = responseBody['token'];
        userMap['refreshToken'] = responseBody['refreshToken'];
        return User.fromMap(userMap);
      } else {
        throw _parseError(res);
      }
    } on String catch (e) {
      rethrow;
    } catch (e) {
      throw e.toString();
    }
  }

  /// Sign in an existing user
  Future<User> signInUser(String email, String password) async {
    try {
      final http.Response res = await authApi.signInUser(email, password);

      if (res.statusCode == 200) {
        final responseBody = jsonDecode(res.body);
        final userMap = responseBody['user'] as Map<String, dynamic>;
        userMap['token'] = responseBody['token'];
        userMap['refreshToken'] = responseBody['refreshToken'];
        return User.fromMap(userMap);
      } else {
        throw _parseError(res);
      }
    } on String catch (e) {
      rethrow;
    } catch (e) {
      throw e.toString();
    }
  }

  /// Get user data from a stored token (app resume)
  Future<User> getUserData(String token) async {
    try {
      final http.Response res = await authApi.getUserData(token);

      if (res.statusCode == 200) {
        final responseBody = jsonDecode(res.body);
        final userMap = responseBody['user'] as Map<String, dynamic>;
        userMap['token'] = responseBody['token'] ?? token;
        return User.fromMap(userMap);
      } else {
        throw _parseError(res);
      }
    } on String catch (e) {
      rethrow;
    } catch (e) {
      throw e.toString();
    }
  }

  /// Sign out — calls server to clear refresh token
  Future<void> signOut(String token) async {
    try {
      await authApi.signOut(token);
    } catch (_) {
      // Best-effort — always sign out locally
    }
  }

  /// Legacy token validation check
  Future<bool> isTokenValid({required dynamic token}) async {
    try {
      final http.Response res = await authApi.isTokenValid(token: token);

      if (res.statusCode == 200) {
        final result = jsonDecode(res.body);
        return result == true || result == 'true';
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }

  // Legacy alias kept for backward compat with old auth_bloc usages
  Future<User> singUpUser(User inputUser) async {
    return signUpUser(
      name: inputUser.name,
      email: inputUser.email,
      password: inputUser.password,
      role: inputUser.role.value,
    );
  }
}
