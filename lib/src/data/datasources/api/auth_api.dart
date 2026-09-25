import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;
import 'package:kalaghar/src/utils/constants/strings.dart';

class AuthAPI {
  // ── Helpers ─────────────────────────────────────────────────────────────────
  static Map<String, String> _jsonHeaders([String? token]) {
    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // ── Register ─────────────────────────────────────────────────────────────────
  Future<http.Response> signUpUserRaw(Map<String, dynamic> body) async {
    try {
      return await http.post(
        Uri.parse(registerUrl),
        headers: _jsonHeaders(),
        body: jsonEncode(body),
      );
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // Legacy — kept for backward compat
  Future<http.Response> signUpUser(dynamic user) async {
    return signUpUserRaw(jsonDecode(user.toJson()));
  }

  // ── Login ────────────────────────────────────────────────────────────────────
  Future<http.Response> signInUser(String email, String password) async {
    try {
      return await http.post(
        Uri.parse(signInUrl),
        headers: _jsonHeaders(),
        body: jsonEncode({'email': email, 'password': password}),
      );
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // ── Admin login ──────────────────────────────────────────────────────────────
  Future<http.Response> adminLogin(String email, String password) async {
    try {
      return await http.post(
        Uri.parse(adminLoginUrl),
        headers: _jsonHeaders(),
        body: jsonEncode({'email': email, 'password': password}),
      );
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // ── Get user data (app resume) ───────────────────────────────────────────────
  Future<http.Response> getUserData(String token) async {
    try {
      return await http.get(
        Uri.parse(getUserDataUri),
        headers: _jsonHeaders(token),
      );
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // ── Sign out ─────────────────────────────────────────────────────────────────
  Future<http.Response> signOut(String token) async {
    try {
      return await http.post(
        Uri.parse(signOutUrl),
        headers: _jsonHeaders(token),
      );
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // ── Refresh token ─────────────────────────────────────────────────────────────
  Future<http.Response> refreshToken(String refreshToken) async {
    try {
      return await http.post(
        Uri.parse(tokenRefreshUrl),
        headers: _jsonHeaders(),
        body: jsonEncode({'refreshToken': refreshToken}),
      );
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }

  // ── Legacy token validity check ──────────────────────────────────────────────
  Future<http.Response> isTokenValid({required dynamic token}) async {
    try {
      return await http.get(
        Uri.parse(isTokenValidUri),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'x-auth-token': token.toString(),
          'Authorization': 'Bearer ${token.toString()}',
        },
      );
    } catch (e) {
      throw Exception('Network error: ${e.toString()}');
    }
  }
}
