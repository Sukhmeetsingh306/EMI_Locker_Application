import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/service/auth_service.dart';
import '../core/storage/token_storage.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  String selectedRole = "client";
  bool loading = false;

  Future<void> login() async {
    if (emailController.text.isEmpty || passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please enter email/mobile and password")),
      );
      return;
    }

    setState(() {
      loading = true;
    });

    final success = await AuthService.login(
      emailOrMobile: emailController.text.trim(),
      password: passwordController.text.trim(),
      role: selectedRole,
    );

    setState(() {
      loading = false;
    });

    if (!success) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Login failed")));
      return;
    }

    /// Fetch role from storage
    final role = await TokenStorage.getRole();

    if (!mounted) return;

    switch (role) {
      case "admin":
        context.go("/admin-home");
        break;

      case "agent":
        context.go("/agent-home");
        break;

      case "client":
        context.go("/client-home");
        break;

      default:
        context.go("/login");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Login")),

      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            TextField(
              controller: emailController,
              decoration: const InputDecoration(labelText: "Email or Mobile"),
            ),

            const SizedBox(height: 20),

            TextField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: "Password"),
            ),

            const SizedBox(height: 20),

            DropdownButtonFormField(
              value: selectedRole,
              items: const [
                DropdownMenuItem(value: "client", child: Text("Client")),
                DropdownMenuItem(value: "admin", child: Text("Admin")),
                DropdownMenuItem(value: "agent", child: Text("Agent")),
              ],
              onChanged: (value) {
                setState(() {
                  selectedRole = value!;
                });
              },
            ),

            const SizedBox(height: 30),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: loading ? null : login,
                child: loading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text("Login"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
