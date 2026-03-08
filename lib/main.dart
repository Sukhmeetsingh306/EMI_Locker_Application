import 'package:flutter/material.dart';

import 'router/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

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
