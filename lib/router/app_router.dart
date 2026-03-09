import 'package:emi_locker/screen/details/pay_installement_screen.dart'
    show PayInstallmentScreen;
import 'package:go_router/go_router.dart';

import '../screen/details/emi_detail_screen.dart';
import '../screen/lock_screen.dart';
import '../screen/login_screen.dart';
import '../screen/splash_screen.dart';
import '../screen/users/admin_home_screen.dart';
import '../screen/users/client_home_screen.dart';

final router = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(path: '/splash', builder: (context, state) => const SplashScreen()),

    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),

    GoRoute(
      path: '/client-home',
      builder: (context, state) => const ClientHomeScreen(),
    ),

    GoRoute(
      path: '/admin-home',
      builder: (context, state) => const AdminHomeScreen(),
    ),

    GoRoute(path: '/lock', builder: (context, state) => const LockScreen()),

    GoRoute(
      path: '/emi-details',
      builder: (context, state) {
        final emiId = state.extra as String;
        return EmiDetailsScreen(emiId: emiId);
      },
    ),

    GoRoute(
      path: '/pay-installment',
      builder: (context, state) => const PayInstallmentScreen(),
    ),
  ],
);
