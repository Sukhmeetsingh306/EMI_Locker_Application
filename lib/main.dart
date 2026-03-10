import 'package:flutter/material.dart';
import 'package:workmanager/workmanager.dart';
import 'package:dio/dio.dart';

import 'router/app_router.dart' as AppRouter;

const String lockCheckTask = "lockCheckTask";

/// Background worker
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    if (task == lockCheckTask) {
      try {
        final dio = Dio();

        final response = await dio.get("/device-lock/me");

        final locked = response.data["data"]["deviceLocked"];

        if (locked == true) {
          print("Device should be locked");

          // Later we trigger kiosk + lock screen
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
