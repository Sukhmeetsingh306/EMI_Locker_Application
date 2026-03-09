import 'package:flutter/material.dart';

import '../../controllers/emi_controllers.dart';
import '../../models/emi_payment_model.dart';

class EmiDetailsScreen extends StatefulWidget {
  final String emiId;

  const EmiDetailsScreen({super.key, required this.emiId});

  @override
  State<EmiDetailsScreen> createState() => _EmiDetailsScreenState();
}

class _EmiDetailsScreenState extends State<EmiDetailsScreen> {
  final EmiController controller = EmiController();

  List<EmiPaymentModel> payments = [];

  @override
  void initState() {
    super.initState();
    loadPayments();
  }

  Future<void> loadPayments() async {
    final result = await controller.getEmiPayments(widget.emiId);

    setState(() {
      payments = result;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("EMI Payments")),
      body: ListView.builder(
        itemCount: payments.length,
        itemBuilder: (context, index) {
          final payment = payments[index];

          return ListTile(
            title: Text("Installment ${payment.installmentNumber}"),
            subtitle: Text("Due: ${payment.dueDate}"),
            trailing: Text("₹${payment.amount}"),
          );
        },
      ),
    );
  }
}
