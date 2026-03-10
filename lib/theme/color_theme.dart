import 'package:flutter/material.dart';

import 'color_theme_data.dart';

@immutable
class ColorTheme {
  static const color = ColorThemeData();

  const ColorTheme();

  static ThemeData define() {
    return ThemeData(primaryColor: Colors.purple);
  }
}

List<Color> gradientColors([List<Color>? additionalColors]) {
  return [
    const Color(0xFF247CFF),
    const Color(0xFF2680F8),
    const Color(0xFF2B86FF),
    const Color(0xFF3490FE),
    const Color(0xFF3D9CFF),
    if (additionalColors != null) ...additionalColors,
  ];
}
