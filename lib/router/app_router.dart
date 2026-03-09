import 'package:go_router/go_router.dart';

import '../screen/login_screen.dart';
import '../screen/splash_screen.dart';

final router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),

    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
  ],
);
