import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../models/emi_payment_model.dart';
import '../../theme/color_theme.dart';

class InstallmentDetailScreen extends StatelessWidget {
  final EmiPaymentModel payment;

  const InstallmentDetailScreen({super.key, required this.payment});

  static String routePath() => "/installment-detail";

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
    // Determine the exact status dynamically
    final bool isCompleted =
        payment.status.toLowerCase() == 'paid' ||
        payment.status.toLowerCase() == 'completed';

    final bool isOverdue =
        !isCompleted && payment.dueDate.isBefore(DateTime.now());

    final Color statusColor = isCompleted
        ? ColorTheme.color.successColor
        : (isOverdue ? Colors.red.shade600 : ColorTheme.color.warningColor);

    final String statusText = isCompleted
        ? "PAID"
        : (isOverdue ? "OVERDUE" : "PENDING");

    final bool canPay = !isCompleted;

    return Scaffold(
      backgroundColor: ColorTheme.color.surfaceColor,
      appBar: AppBar(
        title: const Text(
          "Installment Details",
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        centerTitle: true,
        backgroundColor: ColorTheme.color.whiteColor,
        foregroundColor: ColorTheme.color.primaryColor,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Receipt Header Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: ColorTheme.color.whiteColor,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Status Icon
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isCompleted
                          ? Icons.check_circle_rounded
                          : Icons.receipt_long_rounded,
                      size: 48,
                      color: statusColor,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Amount
                  Text(
                    "₹${payment.amount.toStringAsFixed(0)}",
                    style: TextStyle(
                      fontSize: 40,
                      fontWeight: FontWeight.w800,
                      color: ColorTheme.color.textPrimary,
                      height: 1.0,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      statusText,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.0,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Detailed Information Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: ColorTheme.color.whiteColor,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Transaction Info",
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: ColorTheme.color.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 20),

                  _buildDataRow(
                    "Installment No.",
                    "#${payment.installmentNumber}",
                  ),
                  const Divider(height: 32),

                  _buildDataRow(
                    "Due Date",
                    _formatDate(payment.dueDate.toLocal()),
                  ),

                  // Dynamically show the paid date if it exists
                  if (isCompleted && payment.paidDate != null) ...[
                    const Divider(height: 32),
                    _buildDataRow(
                      "Paid On",
                      _formatDate(payment.paidDate!.toLocal()),
                      valueColor: ColorTheme.color.successColor,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
      // Pass the isOverdue flag to the bottom action builder
      bottomNavigationBar: canPay
          ? _buildBottomAction(context, isOverdue)
          : null,
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

  // Updated to receive isOverdue and display the warning banner
  Widget _buildBottomAction(BuildContext context, bool isOverdue) {
    // Calculate the lock date (10 days after the due date)
    final DateTime lockDate = payment.dueDate.add(const Duration(days: 10));

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
        child: Column(
          mainAxisSize: MainAxisSize.min, // Keep column as small as possible
          children: [
            // Only show the warning banner if the payment is overdue
            if (isOverdue) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.red.shade200),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.warning_amber_rounded,
                      color: Colors.red.shade700,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        "Device will lock on ${_formatDate(lockDate)} due to non-payment.",
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Colors.red.shade800,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            // Payment Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton.icon(
                onPressed: () {
                  context.push("/pay-installment");
                },
                icon: const Icon(Icons.payment, color: Colors.white),
                style: ElevatedButton.styleFrom(
                  backgroundColor: ColorTheme.color.primaryColor,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                label: const Text(
                  "PAY INSTALLMENT",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
