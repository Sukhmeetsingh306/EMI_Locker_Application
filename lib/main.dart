import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:workmanager/workmanager.dart';

import 'core/api/api_clients.dart';
import 'router/app_router.dart' as AppRouter;

const String lockCheckTask = "lockCheckTask";

/// Background worker
@pragma('vm:entry-point')
void callbackDispatcher() {
  WidgetsFlutterBinding.ensureInitialized();

  Workmanager().executeTask((task, inputData) async {
    if (task == lockCheckTask) {
      try {
        final api = ApiClient();
        final response = await api.get("/device-lock/me");
        final locked = response.data["data"]["deviceLocked"];
        if (locked == true) {
          const platform = MethodChannel("emi/lock");
          await platform.invokeMethod("openLockScreen");
        }
      } catch (e) {
        print("Background lock check failed: $e");
      }
    }

    return Future.value(true);
  });
}

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  /// Initialize WorkManager
  Workmanager().initialize(callbackDispatcher, isInDebugMode: true);

  /// Run every 15 minutes
  Workmanager().registerPeriodicTask(
    "1",
    lockCheckTask,
    frequency: const Duration(minutes: 15),
  );

  runApp(const EmiLockerApp());
}

class EmiLockerApp extends StatelessWidget {
  const EmiLockerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'EMI Locker',
      debugShowCheckedModeBanner: false,
      routerConfig: AppRouter.router,
    );
  }
}
