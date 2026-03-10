import '../api/api_clients.dart';
import 'device_service.dart';

Future<void> registerDevice() async {
  final device = await DeviceService.getDeviceInfo();

  await ApiClient().post("/device/register-device", body: device);
}
