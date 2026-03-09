import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/service/auth_service.dart';

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
    print("LOGIN BUTTON CLICKED");

    setState(() {
      loading = true;
    });

    final success = await AuthService.login(
      emailOrMobile: emailController.text,
      password: passwordController.text,
      role: selectedRole,
    );

    print("LOGIN RESULT: $success");

    setState(() {
      loading = false;
    });

    if (!success) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Login failed")));
      return;
    } else {
      print("Success");
    }

    context.go("/client-home");
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

            ElevatedButton(
              onPressed: loading ? null : login,
              child: loading
                  ? const CircularProgressIndicator()
                  : const Text("Login"),
            ),
          ],
        ),
      ),
    );
  }
}
