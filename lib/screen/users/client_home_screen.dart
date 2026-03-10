import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../controllers/emi_controllers.dart';
import '../../controllers/lock_controllers.dart';
import '../../models/emi_model.dart';
import '../../theme/color_theme.dart';

class ClientHomeScreen extends StatefulWidget {
  const ClientHomeScreen({super.key});

  static String routePath() => "/client-home";

  @override
  State<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends State<ClientHomeScreen> {
  final EmiController controller = EmiController();

  List<EmiModel> emis = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    loadEmis();

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await LockController.checkNow(context);
      LockController.startLockMonitor(context);
    });
  }

  Future<void> loadEmis() async {
    setState(() => loading = true);
    final result = await controller.getMyEmis();
    setState(() {
      emis = result;
      loading = false;
    });
  }

  Future<void> refresh() async {
    await loadEmis();
  }

  @override
  Widget build(BuildContext context) {
    // Set system UI overlay for a clean look
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Colors.transparent,
        statusBarIconBrightness: Brightness.light,
      ),
    );

    return Theme(
      data: ThemeData(
        scaffoldBackgroundColor: ColorTheme.color.surfaceColor,
        colorScheme: ColorScheme.fromSeed(
          seedColor: ColorTheme.color.accentColor,
        ),
        fontFamily:
            'Inter', // Assuming you use a modern font, fallback is default
      ),
      child: Scaffold(
        body: loading
            ? _buildLoading()
            : RefreshIndicator(
                onRefresh: refresh,
                color: ColorTheme.color.accentColor,
                child: CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  slivers: [
                    _buildSliverAppBar(),
                    if (!loading && emis.isNotEmpty) _buildDashboardSummary(),
                    if (emis.isEmpty && !loading)
                      SliverFillRemaining(child: _buildNoEmis())
                    else
                      SliverPadding(
                        padding: const EdgeInsets.only(
                          left: 20,
                          right: 20,
                          top: 10,
                          bottom: 100,
                        ),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, index) => _buildEmiCard(emis[index]),
                            childCount: emis.length,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.go('/login'),
          backgroundColor: ColorTheme.color.primaryColor,
          elevation: 4,
          icon: const Icon(Icons.add_chart, color: Colors.white),
          label: const Text(
            'New EMI',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          ),
        ),
      ),
    );
  }

  Widget _buildSliverAppBar() {
    return SliverAppBar(
      expandedHeight: 120.0,
      floating: true,
      pinned: true,
      backgroundColor: ColorTheme.color.primaryColor,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        title: const Text(
          "Loan Portfolio",
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
            fontSize: 20,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF0F172A), Color(0xFF1E3A8A)],
            ),
          ),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.refresh, color: Colors.white),
          onPressed: refresh,
        ),
      ],
    );
  }

  Widget _buildDashboardSummary() {
    double totalValue = emis.fold(0, (sum, item) => sum + item.totalAmount);
    int activeCount = emis
        .where((e) => e.status.toLowerCase() != 'completed')
        .length;

    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.fromLTRB(20, 20, 20, 10),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: ColorTheme.color.accentColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: ColorTheme.color.accentColor.withOpacity(0.2),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Total Exposure",
                  style: TextStyle(
                    color: ColorTheme.color.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  "₹${totalValue.toStringAsFixed(0)}",
                  style: TextStyle(
                    color: ColorTheme.color.primaryColor,
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    activeCount.toString(),
                    style: TextStyle(
                      color: ColorTheme.color.accentColor,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  Text(
                    "Active",
                    style: TextStyle(
                      color: ColorTheme.color.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoading() {
    return Center(
      child: CircularProgressIndicator(color: ColorTheme.color.accentColor),
    );
  }

  Widget _buildNoEmis() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: ColorTheme.color.accentColor.withOpacity(0.05),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.account_balance_wallet_outlined,
            size: 80,
            color: ColorTheme.color.accentColor,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          "No Records Found",
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: ColorTheme.color.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          "There are no active EMIs tied to this account.",
          style: TextStyle(color: ColorTheme.color.textSecondary),
        ),
      ],
    );
  }

  Widget _buildEmiCard(EmiModel emi) {
    final isCompleted = emi.status.toLowerCase() == 'completed';
    final progress = emi.totalInstallments > 0
        ? (emi.paidInstallments / emi.totalInstallments)
        : 0.0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: ColorTheme.color.surfaceColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () => context.push("/emi-details", extra: emi.id),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Bill Number & Status Badge
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: ColorTheme.color.surfaceColor,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            Icons.receipt_long,
                            size: 16,
                            color: ColorTheme.color.textSecondary,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          "Bill #${emi.billNumber}",
                          style: TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                            color: ColorTheme.color.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isCompleted
                            ? ColorTheme.color.successColor.withOpacity(0.1)
                            : ColorTheme.color.warningColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        emi.status.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                          color: isCompleted
                              ? ColorTheme.color.successColor
                              : ColorTheme.color.warningColor,
                        ),
                      ),
                    ),
                  ],
                ),

                Padding(
                  padding: EdgeInsets.symmetric(vertical: 16),
                  child: Divider(
                    height: 1,
                    color: ColorTheme.color.surfaceColor,
                  ),
                ),

                // Body: Financial Details
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Total Amount",
                          style: TextStyle(
                            fontSize: 12,
                            color: ColorTheme.color.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "₹${emi.totalAmount.toStringAsFixed(0)}",
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: ColorTheme.color.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          "Installments",
                          style: TextStyle(
                            fontSize: 12,
                            color: ColorTheme.color.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          "${emi.paidInstallments} / ${emi.totalInstallments}",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: ColorTheme.color.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Footer: Progress Bar
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(10),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 6,
                          backgroundColor: ColorTheme.color.surfaceColor,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            isCompleted
                                ? ColorTheme.color.successColor
                                : ColorTheme.color.accentColor,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      "${(progress * 100).toInt()}%",
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isCompleted
                            ? ColorTheme.color.successColor
                            : ColorTheme.color.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
