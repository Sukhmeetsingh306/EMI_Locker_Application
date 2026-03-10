import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AdminHomeScreen extends StatelessWidget {
  const AdminHomeScreen({super.key});

  static String routePath() => "/admin-home";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Admin Home"), centerTitle: true),
      body: Center(
        child: Column(
          children: [
            const Text("Welcome, Admin!"),
            TextButton(
              onPressed: () {
                context.go("/login");
              },
              child: const Text("View All EMIs"),
            ),
          ],
        ),
      ),
    );
  }
}
