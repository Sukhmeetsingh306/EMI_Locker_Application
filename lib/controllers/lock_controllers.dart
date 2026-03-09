import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/api/api_clients.dart';

class LockController {
  static final ApiClient api = ApiClient();

  static Timer? timer;

  /// Check immediately
  static Future<void> checkNow(BuildContext context) async {
    try {
      final response = await api.get("/users/me");

      final bool locked = response.data["data"]["deviceLocked"] ?? false;

      if (locked) {
        context.go('/lock');
      }
    } catch (e) {
      print("Lock check error: $e");
    }
  }

  /// Start background monitoring
  static void startLockMonitor(BuildContext context) {
    timer?.cancel();

    timer = Timer.periodic(const Duration(seconds: 30), (_) async {
      await checkNow(context);
    });
  }

  static void stop() {
    timer?.cancel();
  }
}
