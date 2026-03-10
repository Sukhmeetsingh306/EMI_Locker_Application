import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';

class DeviceInfoUtil {
  static Future<Map<String, dynamic>> getDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();

    if (Platform.isAndroid) {
      final android = await deviceInfo.androidInfo;

      return {"deviceId": android.id, "model": android.model, "os": "Android"};
    }

    if (Platform.isIOS) {
      final ios = await deviceInfo.iosInfo;

      return {
        "deviceId": ios.identifierForVendor,
        "model": ios.utsname.machine,
        "os": "iOS",
      };
    }

    return {};
  }
}
