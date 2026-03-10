import 'package:flutter/services.dart';

class KioskController {
  static const platform = MethodChannel('emi/kiosk');

  static Future<void> enableKiosk() async {
    try {
      await platform.invokeMethod("enableKiosk");
    } catch (e) {
      print("Enable kiosk error: $e");
    }
  }

  static Future<void> disableKiosk() async {
    try {
      await platform.invokeMethod("disableKiosk");
    } catch (e) {
      print("Disable kiosk error: $e");
    }
  }
}
