import 'package:go_router/go_router.dart';

import '../screen/lock_screen.dart';
import '../screen/login_screen.dart';
import '../screen/splash_screen.dart';
import '../screen/client_home_screen.dart';

final router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),

    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),

    GoRoute(
      path: '/client-home',
      builder: (context, state) => const ClientHomeScreen(),
    ),

    GoRoute(path: '/lock', builder: (context, state) => const LockScreen()),
  ],
);
