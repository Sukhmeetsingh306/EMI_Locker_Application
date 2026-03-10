import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../core/service/auth_service.dart';
import '../core/storage/token_storage.dart';
import '../theme/color_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  static String routePath() => "/login";

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final emailController = TextEditingController();
  final passwordController = TextEditingController();

  String selectedRole = "client";
  bool loading = false;
  bool _obscurePassword = true; // Added for password visibility toggle

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  Future<void> login() async {
    // Dismiss keyboard
    FocusScope.of(context).unfocus();

    if (emailController.text.trim().isEmpty ||
        passwordController.text.trim().isEmpty) {
      _showError("Please enter your credentials");
      return;
    }

    setState(() => loading = true);

    final success = await AuthService.login(
      emailOrMobile: emailController.text.trim(),
      password: passwordController.text.trim(),
      role: selectedRole,
    );

    if (!mounted) return;

    if (!success) {
      setState(() => loading = false);
      _showError("Invalid credentials or role. Please try again.");
      return;
    }

    /// Fetch role from storage
    final role = await TokenStorage.getRole();

    if (!mounted) return;

    // Fixed: Using context.go() to clear the navigation stack
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
        setState(() => loading = false);
        _showError("Unknown role assigned. Contact support.");
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: Colors.red.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(20),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorTheme.color.surfaceColor,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: 24.0,
              vertical: 20.0,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Bank Logo / Shield Icon
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: ColorTheme.color.accentColor.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.security_rounded,
                    size: 64,
                    color: ColorTheme.color.accentColor,
                  ),
                ),

                const SizedBox(height: 32),

                // Welcome Text
                Text(
                  "Secure Login",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: ColorTheme.color.primaryColor,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  "Enter your credentials to access your account",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 15,
                    color: ColorTheme.color.textSecondary,
                  ),
                ),

                const SizedBox(height: 40),

                // Form Card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: ColorTheme.color.whiteColor,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 24,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      // Role Selector
                      _buildRoleSelector(),

                      const SizedBox(height: 24),

                      // Email Field
                      TextField(
                        controller: emailController,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        decoration: InputDecoration(
                          labelText: "Email or Mobile",
                          prefixIcon: const Icon(Icons.person_outline),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(
                              color: ColorTheme.color.accentColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: ColorTheme.color.surfaceColor.withOpacity(
                            0.5,
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Password Field
                      TextField(
                        controller: passwordController,
                        obscureText: _obscurePassword,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => login(),
                        decoration: InputDecoration(
                          labelText: "Password",
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword
                                  ? Icons.visibility_off
                                  : Icons.visibility,
                              color: ColorTheme.color.textSecondary,
                            ),
                            onPressed: () {
                              setState(() {
                                _obscurePassword = !_obscurePassword;
                              });
                            },
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide(
                              color: ColorTheme.color.accentColor,
                              width: 2,
                            ),
                          ),
                          filled: true,
                          fillColor: ColorTheme.color.surfaceColor.withOpacity(
                            0.5,
                          ),
                        ),
                      ),

                      const SizedBox(height: 32),

                      // Login Button
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: loading ? null : login,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: ColorTheme.color.primaryColor,
                            disabledBackgroundColor: ColorTheme
                                .color
                                .primaryColor
                                .withOpacity(0.6),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                          child: loading
                              ? const SizedBox(
                                  height: 24,
                                  width: 24,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text(
                                  "AUTHENTICATE",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: 1.0,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // Helper widget for a premium role selector
  Widget _buildRoleSelector() {
    return Container(
      decoration: BoxDecoration(
        color: ColorTheme.color.surfaceColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: selectedRole,
          isExpanded: true,
          icon: Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: Icon(
              Icons.keyboard_arrow_down_rounded,
              color: ColorTheme.color.textSecondary,
            ),
          ),
          dropdownColor: ColorTheme.color.whiteColor,
          borderRadius: BorderRadius.circular(16),
          items: [
            DropdownMenuItem(
              value: "client",
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    Icon(
                      Icons.account_balance_wallet_outlined,
                      size: 20,
                      color: ColorTheme.color.textSecondary,
                    ),
                    SizedBox(width: 12),
                    Text(
                      "Client Login",
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
            DropdownMenuItem(
              value: "agent",
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    Icon(
                      Icons.support_agent_outlined,
                      size: 20,
                      color: ColorTheme.color.textSecondary,
                    ),
                    SizedBox(width: 12),
                    Text(
                      "Agent Portal",
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
            DropdownMenuItem(
              value: "admin",
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  children: [
                    Icon(
                      Icons.admin_panel_settings_outlined,
                      size: 20,
                      color: ColorTheme.color.textSecondary,
                    ),
                    SizedBox(width: 12),
                    Text(
                      "Administrator",
                      style: TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          ],
          onChanged: (value) {
            if (value != null) {
              setState(() {
                selectedRole = value;
              });
            }
          },
        ),
      ),
    );
  }
}
