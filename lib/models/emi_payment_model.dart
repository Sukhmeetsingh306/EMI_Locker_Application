class EmiPaymentModel {
  final String id;
  final int installmentNumber;
  final DateTime dueDate;
  final double amount;
  final String status;
  final DateTime? paidDate;

  EmiPaymentModel({
    required this.id,
    required this.installmentNumber,
    required this.dueDate,
    required this.amount,
    required this.status,
    this.paidDate,
  });

  factory EmiPaymentModel.fromJson(Map<String, dynamic> json) {
    // Helper to safely extract MongoDB $date objects or standard strings
    DateTime parseDate(dynamic dateData) {
      if (dateData == null) return DateTime.now();
      if (dateData is Map && dateData.containsKey(r'$date')) {
        return DateTime.parse(dateData[r'$date']);
      }
      return DateTime.parse(dateData.toString());
    }

    // Helper to extract $oid
    String parseId(dynamic idData) {
      if (idData is Map && idData.containsKey(r'$oid')) {
        return idData[r'$oid'];
      }
      return idData?.toString() ?? "";
    }

    return EmiPaymentModel(
      id: parseId(json["_id"]),
      installmentNumber: json["installmentNumber"] ?? 0,
      dueDate: parseDate(json["dueDate"]),
      amount: (json["amount"] ?? 0).toDouble(),
      status: json["status"] ?? "pending",
      paidDate: json["paidDate"] != null ? parseDate(json["paidDate"]) : null,
    );
  }
}
