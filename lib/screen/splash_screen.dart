import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/storage/token_storage.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2));

    final token = await TokenStorage.getToken();
    final role = await TokenStorage.getRole();

    if (token == null) {
      context.go('/login');
      return;
    }

    switch (role) {
      case "admin":
        context.go('/admin-home');
        break;

      case "agent":
        context.go('/agent-home');
        break;

      case "client":
        context.go('/client-home');
        break;

      default:
        context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: CircularProgressIndicator()));
  }
}
