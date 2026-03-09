import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/emi_controllers.dart';
import '../../controllers/payment_controller.dart';
import '../../models/emi_model.dart';
import '../../models/emi_payment_model.dart';

class PayInstallmentScreen extends StatefulWidget {
  const PayInstallmentScreen({super.key});

  static String routePath() => "/pay-installment";

  @override
  State<PayInstallmentScreen> createState() => _PayInstallmentScreenState();
}

class _PayInstallmentScreenState extends State<PayInstallmentScreen> {
  final EmiController controller = EmiController();

  EmiModel? emi;
  EmiPaymentModel? nextInstallment;

  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadData();
  }

  Future<void> loadData() async {
    final emis = await controller.getMyEmis();

    if (emis.isNotEmpty) {
      emi = emis.first;

      final payments = await controller.getEmiPayments(emi!.id);

      if (payments.isNotEmpty) {
        nextInstallment = payments.firstWhere(
          (p) => p.status == "pending",
          orElse: () => payments.first,
        );
      } else {
        nextInstallment = null;
      }
    }

    if (mounted) {
      setState(() {
        loading = false;
      });
    }
  }

  Future<void> payInstallment() async {
    final controller = PaymentController();

    final success = await controller.payInstallment(nextInstallment!.id);

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Payment Successful")));

      context.go("/client-home");
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Payment Failed")));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final pendingInstallments = emi!.totalInstallments - emi!.paidInstallments;

    return Scaffold(
      appBar: AppBar(title: const Text("Pay Installment")),

      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            /// Client Info
            const Text(
              "Client Information",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 10),

            Text("Bill Number: ${emi!.billNumber}"),
            Text("Total Amount: ₹${emi!.totalAmount}"),

            const SizedBox(height: 20),

            /// Installment Summary
            const Text(
              "Installment Summary",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 10),

            Text("Total Installments: ${emi!.totalInstallments}"),
            Text("Paid Installments: ${emi!.paidInstallments}"),
            Text("Pending Installments: $pendingInstallments"),

            const SizedBox(height: 30),

            /// Next Installment
            const Text(
              "Due Installment",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 10),

            if (nextInstallment != null)
              Card(
                child: ListTile(
                  title: Text(
                    "Installment #${nextInstallment!.installmentNumber}",
                  ),
                  subtitle: Text(
                    "Due Date: ${nextInstallment!.dueDate.toLocal()}",
                  ),
                  trailing: Text(
                    "₹${nextInstallment!.amount}",
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                ),
              )
            else
              const Text(
                "All installments paid",
                style: TextStyle(fontSize: 16, color: Colors.green),
              ),

            const Spacer(),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: payInstallment,
                child: const Text("PAY NOW"),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
