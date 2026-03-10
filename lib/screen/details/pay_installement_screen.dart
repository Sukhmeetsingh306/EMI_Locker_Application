import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/emi_controllers.dart';
import '../../controllers/payment_controller.dart';
import '../../models/emi_model.dart';
import '../../models/emi_payment_model.dart';
import '../../theme/color_theme.dart';
// import '../../core/theme/color_theme.dart';

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
  bool isProcessingPayment = false;

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
        // Sort to ensure we are looking at them in the correct order
        payments.sort(
          (a, b) => a.installmentNumber.compareTo(b.installmentNumber),
        );

        nextInstallment = payments.firstWhere(
          (p) => p.status.toLowerCase() == "pending",
          orElse: () => payments.first, // Fallback if no pending found
        );
      }
    }

    if (mounted) {
      setState(() {
        loading = false;

        // Fix: Added check for 'paid' status based on your database structure
        // If the fallback matched an already paid/completed installment, clear it so we don't double pay
        if (nextInstallment != null) {
          final status = nextInstallment!.status.toLowerCase();
          if (status == 'completed' || status == 'paid') {
            nextInstallment = null;
          }
        }
      });
    }
  }

  Future<void> payInstallment() async {
    if (nextInstallment == null) return;

    setState(() => isProcessingPayment = true);

    final paymentController = PaymentController();
    final success = await paymentController.payInstallment(nextInstallment!.id);

    if (!mounted) return;

    setState(() => isProcessingPayment = false);

    if (success) {
      _showCustomSnackBar("Payment Successful", isError: false);
      context.go("/client-home");
    } else {
      _showCustomSnackBar("Payment Failed. Please try again.", isError: true);
    }
  }

  void _showCustomSnackBar(String message, {required bool isError}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              isError ? Icons.error_outline : Icons.check_circle_outline,
              color: Colors.white,
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: isError
            ? Colors.red.shade700
            : ColorTheme.color.successColor,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }

  String _formatDate(DateTime date) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return "${date.day.toString().padLeft(2, '0')} ${months[date.month - 1]} ${date.year}";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ColorTheme.color.surfaceColor,
      appBar: AppBar(
        title: const Text(
          "Make Payment",
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        centerTitle: true,
        backgroundColor: ColorTheme.color.whiteColor,
        foregroundColor: ColorTheme.color.primaryColor,
        elevation: 0,
      ),
      body: loading
          ? Center(
              child: CircularProgressIndicator(
                color: ColorTheme.color.accentColor,
              ),
            )
          : emi == null
          ? _buildErrorState()
          : _buildPaymentDetails(),
      bottomNavigationBar: loading || emi == null ? null : _buildBottomAction(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.receipt_long_outlined,
            size: 64,
            color: Colors.grey.shade400,
          ),
          const SizedBox(height: 16),
          Text(
            "No Active EMI Found",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: ColorTheme.color.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "We couldn't find any pending bills for this account.",
            style: TextStyle(color: ColorTheme.color.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentDetails() {
    final pendingInstallments = emi!.totalInstallments - emi!.paidInstallments;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Primary Amount Due Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  ColorTheme.color.primaryColor,
                  ColorTheme.color.accentColor.withOpacity(0.8),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: ColorTheme.color.primaryColor.withOpacity(0.3),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                Text(
                  nextInstallment != null ? "AMOUNT DUE" : "ALL DUES CLEARED",
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  nextInstallment != null
                      ? "₹${nextInstallment!.amount.toStringAsFixed(0)}"
                      : "₹0",
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 48,
                    fontWeight: FontWeight.w800,
                    height: 1.0,
                  ),
                ),
                if (nextInstallment != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      "Due on ${_formatDate(nextInstallment!.dueDate.toLocal())}",
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Loan Details Section
          _buildSectionHeader("Loan Information", Icons.info_outline),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: ColorTheme.color.whiteColor,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                _buildDataRow("Bill Number", "#${emi!.billNumber}"),
                const Divider(height: 32),
                _buildDataRow(
                  "Total Loan Amount",
                  "₹${emi!.totalAmount.toStringAsFixed(0)}",
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Installment Progress Section
          _buildSectionHeader("Installment Progress", Icons.pie_chart_outline),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: ColorTheme.color.whiteColor,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                _buildDataRow(
                  "Total Installments",
                  "${emi!.totalInstallments} Months",
                ),
                const Divider(height: 32),
                _buildDataRow(
                  "Paid Successfully",
                  "${emi!.paidInstallments} Months",
                  valueColor: ColorTheme.color.successColor,
                ),
                const Divider(height: 32),
                _buildDataRow(
                  "Pending Installments",
                  "$pendingInstallments Months",
                  valueColor: Colors.red.shade600,
                ),
              ],
            ),
          ),

          const SizedBox(height: 40), // Bottom padding
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: ColorTheme.color.textSecondary),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: ColorTheme.color.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildDataRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: ColorTheme.color.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: valueColor ?? ColorTheme.color.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildBottomAction() {
    final bool canPay = nextInstallment != null && !isProcessingPayment;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      decoration: BoxDecoration(
        color: ColorTheme.color.whiteColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: canPay ? payInstallment : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: ColorTheme.color.primaryColor,
              disabledBackgroundColor: Colors.grey.shade300,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              elevation: 0,
            ),
            child: isProcessingPayment
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : Text(
                    nextInstallment != null
                        ? "PAY ₹${nextInstallment!.amount.toStringAsFixed(0)}"
                        : "ALL CLEAR",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: canPay ? Colors.white : Colors.grey.shade500,
                      letterSpacing: 0.5,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}
