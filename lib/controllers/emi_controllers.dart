import '../core/api/api_clients.dart';
import '../models/emi_payment_model.dart';
import '../models/emi_model.dart';

class EmiController {
  final ApiClient apiClient = ApiClient();

  /// Get all EMIs
  Future<List<EmiModel>> getMyEmis() async {
    try {
      final response = await apiClient.get("/emis/my");

      final List data = response.data["data"];

      return data.map((e) => EmiModel.fromJson(e)).toList();
    } catch (e) {
      print("EMI fetch error: $e");
      return [];
    }
  }

  /// Get EMI payments
  Future<List<EmiPaymentModel>> getEmiPayments(String emiId) async {
    try {
      final response = await apiClient.get("/emis/my/$emiId/payments");

      final List data = response.data["data"];

      return data.map((e) => EmiPaymentModel.fromJson(e)).toList();
    } catch (e) {
      print("EMI payment fetch error: $e");
      return [];
    }
  }
}
