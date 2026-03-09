import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class LockScreen extends StatelessWidget {
  const LockScreen({super.key});
  static String routePath() => "/lock";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.red.shade700,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock, color: Colors.white, size: 100),

            SizedBox(height: 20),

            Text(
              "DEVICE LOCKED",
              style: TextStyle(
                fontSize: 28,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),

            SizedBox(height: 20),

            Text(
              "Your EMI payment is overdue.\nPlease complete payment to unlock the device.",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 18, color: Colors.white),
            ),
            const SizedBox(height: 10),
            ElevatedButton(
              onPressed: () {
                context.push("/pay-installment");
              },
              child: const Text("Pay Installment"),
            ),
          ],
        ),
      ),
    );
  }
}
