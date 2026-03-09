class EmiPaymentModel {
  final String id;
  final int installmentNumber;
  final DateTime dueDate;
  final double amount;
  final String status;

  EmiPaymentModel({
    required this.id,
    required this.installmentNumber,
    required this.dueDate,
    required this.amount,
    required this.status,
  });

  factory EmiPaymentModel.fromJson(Map<String, dynamic> json) {
    return EmiPaymentModel(
      id: json["_id"],
      installmentNumber: json["installmentNumber"],
      dueDate: DateTime.parse(json["dueDate"]),
      amount: (json["amount"] ?? 0).toDouble(),
      status: json["status"] ?? "pending",
    );
  }
}
