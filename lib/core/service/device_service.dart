import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';

class DeviceService {
  static Future<Map<String, dynamic>> getDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();

    if (Platform.isAndroid) {
      final android = await deviceInfo.androidInfo;

      return {
        "androidId": android.id,
        "model": android.model,
        "osVersion": android.version.release,
      };
    }

    return {};
  }
}
