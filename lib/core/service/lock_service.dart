import '../api/api_clients.dart';

class LockService {
  static Future<bool> checkLock() async {
    final response = await ApiClient().get("/users/me");

    return response.data["data"]["deviceLocked"];
  }
}
