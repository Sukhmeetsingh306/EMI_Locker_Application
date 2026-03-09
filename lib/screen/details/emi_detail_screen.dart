import 'package:flutter/material.dart';

import '../../controllers/emi_controllers.dart';
import '../../models/emi_payment_model.dart';

class EmiDetailsScreen extends StatefulWidget {
  final String emiId;

  const EmiDetailsScreen({super.key, required this.emiId});

  static String routePath(String emiId) => "/emi-details/$emiId";

  @override
  State<EmiDetailsScreen> createState() => _EmiDetailsScreenState();
}

class _EmiDetailsScreenState extends State<EmiDetailsScreen> {
  final EmiController controller = EmiController();

  List<EmiPaymentModel> payments = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadPayments();
  }

  Future<void> loadPayments() async {
    final result = await controller.getEmiPayments(widget.emiId);

    setState(() {
      payments = result;
      loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("EMI Schedule")),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: payments.length,
              itemBuilder: (context, index) {
                final payment = payments[index];

                return Card(
                  margin: const EdgeInsets.all(10),
                  child: ListTile(
                    title: Text("Installment ${payment.installmentNumber}"),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Amount: ₹${payment.amount}"),
                        Text("Due: ${payment.dueDate}"),
                        Text("Status: ${payment.status}"),
                      ],
                    ),
                    trailing: payment.status == "pending"
                        ? ElevatedButton(
                            onPressed: () {
                              // Next step: payment screen
                            },
                            child: const Text("Pay"),
                          )
                        : const Icon(Icons.check, color: Colors.green),
                  ),
                );
              },
            ),
    );
  }
}
