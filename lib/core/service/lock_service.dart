import '../api/api_clients.dart';

class LockService {
  static final ApiClient _api = ApiClient();

  static Future<bool> checkLock() async {
    final response = await ApiClient().get("/users/me");

    return response.data["data"]["deviceLocked"];
  }

  static Future<bool> checkLockStatus() async {
    try {
      final response = await _api.get("/users/me");

      final data = response.data["data"];

      return data["deviceLocked"] ?? false;
    } catch (e) {
      print("Lock status error: $e");
      return false;
    }
  }
}
