import 'package:flutter/material.dart';

class LockScreen extends StatelessWidget {
  const LockScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.red,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.lock, size: 100, color: Colors.white),
            SizedBox(height: 20),
            Text(
              "DEVICE LOCKED\nPay EMI to unlock",
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 22, color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
