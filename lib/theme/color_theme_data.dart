import 'package:flutter/material.dart';

@immutable
class ColorThemeData {
  final whiteColor = const Color(0xffFFFFFF);
  final Color primaryColor = const Color(0xFF0F172A); // Deep Slate/Navy
  final Color accentColor = const Color(0xFF3B82F6); // Trustworthy Blue
  final Color surfaceColor = const Color(0xFFF1F5F9); // Cool Off-White
  final Color successColor = const Color(0xFF10B981); // Emerald Green
  final Color warningColor = const Color(0xFFF59E0B); // Amber
  final Color textPrimary = const Color(0xFF1E293B);
  final Color textSecondary = const Color(0xFF64748B);

  const ColorThemeData();
}

// import 'package:flutter/material.dart';

// final colorScheme = const  ColorScheme.fromSeed(
//   brightness: Brightness.dark,
//   seedColor: const Color.fromARGB(255, 102, 6, 247),
//   background: const Color.fromARGB(255, 255, 255, 255),
//   error: const Color.fromRGBO(225, 23, 23, 1),
// )
