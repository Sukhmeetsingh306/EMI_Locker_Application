import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/emi_controllers.dart';
import '../../models/emi_payment_model.dart';
import '../../theme/color_theme.dart';
// TODO: Import your ColorTheme file here
// import '../../core/theme/color_theme.dart';

class EmiDetailsScreen extends StatefulWidget {
  final String emiId;

  const EmiDetailsScreen({super.key, required this.emiId});

  @override
  State<EmiDetailsScreen> createState() => _EmiDetailsScreenState();
}

class _EmiDetailsScreenState extends State<EmiDetailsScreen> {
  final EmiController controller = EmiController();

  List<EmiPaymentModel> payments = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadPayments();
  }

  Future<void> loadPayments() async {
    setState(() => isLoading = true);

    final result = await controller.getEmiPayments(widget.emiId);

    if (mounted) {
      setState(() {
        // Sort by installment number to ensure they appear in order
        result.sort(
          (a, b) => a.installmentNumber.compareTo(b.installmentNumber),
        );
        payments = result;
        isLoading = false;
      });
    }
  }

  // Simple date formatter to make dates look professional (e.g., 15 Oct 2023)
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
          "Payment History",
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 18),
        ),
        centerTitle: true,
        backgroundColor: ColorTheme.color.whiteColor,
        foregroundColor: ColorTheme.color.primaryColor,
        elevation: 0,
      ),
      body: isLoading
          ? Center(
              child: CircularProgressIndicator(
                color: ColorTheme.color.accentColor,
              ),
            )
          : payments.isEmpty
          ? _buildEmptyState()
          : _buildPaymentList(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: ColorTheme.color.accentColor.withOpacity(0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.history_toggle_off,
              size: 64,
              color: ColorTheme.color.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            "No Installments Found",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: ColorTheme.color.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Payment schedule is not available.",
            style: TextStyle(color: ColorTheme.color.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentList() {
    return RefreshIndicator(
      onRefresh: loadPayments,
      color: ColorTheme.color.accentColor,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: payments.length,
        itemBuilder: (context, index) {
          final payment = payments[index];
          final isCompleted = payment.status.toLowerCase() == 'paid';
          final isOverdue =
              !isCompleted && payment.dueDate.isBefore(DateTime.now());

          // Determine status colors dynamically
          Color statusColor = isCompleted
              ? ColorTheme.color.successColor
              : (isOverdue
                    ? Colors.red.shade600
                    : ColorTheme.color.warningColor);

          String statusText = isCompleted
              ? "PAID"
              : (isOverdue ? "OVERDUE" : "PENDING");

          return GestureDetector(
            onTap: () {
              context.push("/installment-detail", extra: payment);
            },
            child: Container(
              margin: const EdgeInsets.only(bottom: 12),
              decoration: BoxDecoration(
                color: ColorTheme.color.whiteColor,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isOverdue ? Colors.red.shade100 : Colors.transparent,
                  width: 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    // Status Icon (Timeline style)
                    Container(
                      height: 48,
                      width: 48,
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        isCompleted
                            ? Icons.check_circle_rounded
                            : Icons.schedule_rounded,
                        color: statusColor,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Installment Details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Installment ${payment.installmentNumber}",
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 16,
                              color: ColorTheme.color.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            "Due: ${_formatDate(payment.dueDate)}",
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: isOverdue
                                  ? Colors.red.shade600
                                  : ColorTheme.color.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Amount & Status Badge
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "₹${payment.amount.toStringAsFixed(0)}",
                          style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                            color: ColorTheme.color.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            statusText,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.5,
                              color: statusColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
