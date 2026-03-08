class EmiPaymentModel {
  final int installmentNumber;
  final DateTime dueDate;
  final DateTime? paidDate;
  final double amount;
  final double? percentage;
  final String status;

  EmiPaymentModel({
    required this.installmentNumber,
    required this.dueDate,
    this.paidDate,
    required this.amount,
    this.percentage,
    required this.status,
  });

  factory EmiPaymentModel.fromJson(Map<String, dynamic> json) {
    return EmiPaymentModel(
      installmentNumber: json["installmentNumber"] ?? 0,
      dueDate: DateTime.parse(json["dueDate"]),
      paidDate: json["paidDate"] != null
          ? DateTime.parse(json["paidDate"])
          : null,
      amount: (json["amount"] ?? 0).toDouble(),
      percentage: json["percentage"] != null
          ? (json["percentage"]).toDouble()
          : null,
      status: json["status"] ?? "pending",
    );
  }
}
