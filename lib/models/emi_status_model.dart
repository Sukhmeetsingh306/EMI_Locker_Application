class EmiStatusModel {
  final bool lock;
  final double dueAmount;

  EmiStatusModel({required this.lock, required this.dueAmount});

  factory EmiStatusModel.fromJson(Map<String, dynamic> json) {
    return EmiStatusModel(
      lock: json["lock"] ?? false,
      dueAmount: (json["dueAmount"] ?? 0).toDouble(),
    );
  }
}
