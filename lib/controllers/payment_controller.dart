import 'package:dio/dio.dart';

import '../core/api/api_clients.dart';

class PaymentController {
  final ApiClient apiClient = ApiClient();

  Future<bool> payInstallment(String emiPaymentId) async {
    try {
      final response = await apiClient.post(
        "/users/payments/pay-demo",
        body: {"emiPaymentId": emiPaymentId},
      );

      return response.data["success"] == true;
    } on DioException catch (e) {
      print("Payment error: ${e.response?.data}");
      return false;
    }
  }
}
