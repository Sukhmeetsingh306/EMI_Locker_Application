import 'dart:async';
import 'package:flutter/material.dart';
import '../core/service/lock_service.dart';

class LockController {
  static Timer? _timer;

  static void startLockMonitor(BuildContext context) {
    _timer?.cancel();

    _timer = Timer.periodic(const Duration(seconds: 30), (timer) async {
      final locked = await LockService.checkLockStatus();

      if (locked) {
        Navigator.pushNamed(context, "/lock");
      }
    });
  }

  static void stop() {
    _timer?.cancel();
  }
}
