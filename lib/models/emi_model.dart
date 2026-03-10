class EmiModel {
  final String id;
  final String billNumber;
  final double principalAmount;
  final double interestPercentage;
  final double totalAmount;
  final String description;
  final int paidInstallments;
  final int totalInstallments;
  final String status;

  EmiModel({
    required this.id,
    required this.billNumber,
    required this.principalAmount,
    required this.interestPercentage,
    required this.totalAmount,
    required this.description,
    required this.paidInstallments,
    required this.totalInstallments,
    required this.status,
  });

  factory EmiModel.fromJson(Map<String, dynamic> json) {
    return EmiModel(
      id: json["_id"],
      billNumber: json["billNumber"] ?? "",
      principalAmount: (json["principalAmount"] ?? 0).toDouble(),
      interestPercentage: (json["interestPercentage"] ?? 0).toDouble(),
      totalAmount: (json["totalAmount"] ?? 0).toDouble(),
      description: json["description"] ?? "",
      paidInstallments: json["paidInstallments"] ?? 0,
      totalInstallments: json["totalInstallments"] ?? 0,
      status: json["status"] ?? "active",
    );
  }
}
