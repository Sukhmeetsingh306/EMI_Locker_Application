import 'package:flutter/material.dart';

import '../controllers/emi_controllers.dart';
import '../models/emi_model.dart';

class ClientHomeScreen extends StatefulWidget {
  const ClientHomeScreen({super.key});

  @override
  State<ClientHomeScreen> createState() => _ClientHomeScreenState();
}

class _ClientHomeScreenState extends State<ClientHomeScreen> {
  final EmiController controller = EmiController();

  List<EmiModel> emis = [];

  @override
  void initState() {
    super.initState();
    loadEmis();
  }

  Future<void> loadEmis() async {
    final result = await controller.getMyEmis();

    setState(() {
      emis = result;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("My EMIs")),
      body: ListView.builder(
        itemCount: emis.length,
        itemBuilder: (context, index) {
          final emi = emis[index];

          return ListTile(
            title: Text("Bill: ${emi.billNumber}"),
            subtitle: Text(
              "Installments: ${emi.paidInstallments}/${emi.totalInstallments}",
            ),
          );
        },
      ),
    );
  }
}
