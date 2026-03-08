import 'package:dio/dio.dart';
import 'package:dio/src/options.dart';
import '../constants/api_constants.dart';

class ApiClient {
  late final dio;

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {"Content-Type": "application/json"},
      ),
    );
  }
}
