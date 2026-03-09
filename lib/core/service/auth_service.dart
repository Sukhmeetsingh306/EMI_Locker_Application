import 'package:dio/dio.dart';

import '../api/api_clients.dart';

class AuthService {
  static final ApiClient _api = ApiClient();

  static Future<bool> login({
    required String emailOrMobile,
    required String password,
    required String role,
  }) async {
    try {
      String endpoint = "";

      if (role == "admin") {
        endpoint = "/auth/admin/login";
      } else if (role == "agent") {
        endpoint = "/auth/agent/login";
      } else {
        endpoint = "/auth/login";
      }

      final Response response = await _api.post(
        endpoint,
        body: {"emailOrMobile": emailOrMobile, "password": password},
      );
      //print("API RESPONSE: ${response.data}");
      if (response.statusCode == 200) {
        return true;
      }

      return false;
    } catch (e) {
      print("LOGIN ERROR: $e");
      return false;
    }
  }
}
