import 'package:dio/dio.dart';
import '../constants/api_constants.dart';

class ApiClient {
  late final Dio dio;

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

  /// GET
  Future<Response> get(String path, {Map<String, dynamic>? query}) async {
    return await dio.get(path, queryParameters: query);
  }

  /// POST
  Future<Response> post(String path, {Map<String, dynamic>? body}) async {
    return await dio.post(path, data: body);
  }

  /// PUT
  Future<Response> put(String path, {Map<String, dynamic>? body}) async {
    return await dio.put(path, data: body);
  }

  /// DELETE
  Future<Response> delete(String path) async {
    return await dio.delete(path);
  }
}
