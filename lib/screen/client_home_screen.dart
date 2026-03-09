import 'package:flutter/material.dart';

import '../controllers/emi_controllers.dart';
import '../controllers/lock_controllers.dart';
import '../models/emi_model.dart';

class ClientHomeScreen extends StatefulWidget {
  const ClientHomeScreen({super.key});

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

    /// Start locker engine
    WidgetsBinding.instance.addPostFrameCallback((_) {
      LockController.startLockMonitor(context);
    });
  }

  Future<void> loadEmis() async {
    setState(() {
      loading = true;
    });

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
    return Scaffold(
      appBar: AppBar(title: const Text("My EMIs"), centerTitle: true),

      body: loading
          ? const Center(child: CircularProgressIndicator())
          : emis.isEmpty
          ? const Center(
              child: Text("No EMIs found", style: TextStyle(fontSize: 18)),
            )
          : RefreshIndicator(
              onRefresh: refresh,
              child: ListView.builder(
                padding: const EdgeInsets.all(12),
                itemCount: emis.length,
                itemBuilder: (context, index) {
                  final emi = emis[index];

                  return Card(
                    elevation: 4,
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: ListTile(
                      contentPadding: const EdgeInsets.all(16),

                      title: Text(
                        "Bill: ${emi.billNumber}",
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),

                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SizedBox(height: 8),

                          Text("Total Amount: ₹${emi.totalAmount}"),

                          Text(
                            "Installments: ${emi.paidInstallments}/${emi.totalInstallments}",
                          ),

                          Text(
                            "Status: ${emi.status}",
                            style: TextStyle(
                              color: emi.status == "completed"
                                  ? Colors.green
                                  : Colors.orange,
                            ),
                          ),
                        ],
                      ),

                      trailing: const Icon(Icons.arrow_forward_ios),

                      onTap: () {
                        Navigator.pushNamed(
                          context,
                          "/emi-details",
                          arguments: emi.id,
                        );
                      },
                    ),
                  );
                },
              ),
            ),
    );
  }
}
