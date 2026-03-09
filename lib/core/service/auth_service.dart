import 'package:dio/dio.dart';

import '../api/api_clients.dart';
import '../storage/token_storage.dart';

class AuthService {
  static final ApiClient _api = ApiClient();

  static Future<bool> login({
    required String emailOrMobile,
    required String password,
    required String role,
  }) async {
    try {
      String endpoint = role == "admin"
          ? "/auth/admin/login"
          : role == "agent"
          ? "/auth/agent/login"
          : "/auth/login";

      final Response response = await _api.post(
        endpoint,
        body: {"emailOrMobile": emailOrMobile, "password": password},
      );

      print("LOGIN RESPONSE: ${response.data}");

      if (response.statusCode == 200) {
        final token = response.data["data"]["token"];

        await TokenStorage.saveAuth(token: token, role: role);

        return true;
      }

      return false;
    } catch (e) {
      print("LOGIN ERROR: $e");
      return false;
    }
  }
}
