import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Kalaghar design tokens — matches the Next.js admin panel exactly
class KColors {
  // Backgrounds
  static const Color background = Color(0xFFE9E8FA); // lavender
  static const Color surface = Color(0xFFFDFDFD); // cards
  static const Color sidebar = Color(0xFFFAFBFD); // off-white

  // Text
  static const Color textPrimary = Color(0xFF1B212D); // navy
  static const Color textSecondary = Color(0xFF59646F); // grey
  static const Color border = Color(0xFFDCE6ED);

  // Active / states
  static const Color activeState = Color(0xFFEFEEFE);

  // Accents
  static const Color primaryAccent = Color(0xFFF57F42); // orange
  static const Color purpleAccent = Color(0xFF7969CC);
  static const Color tealAccent = Color(0xFF71BCB8);
  static const Color goldAccent = Color(0xFFD6A65C);

  // Status
  static const Color statusSuccess = Color(0xFF6FD2BE);
  static const Color statusPendingBg = Color(0xFFFEEAD2);
  static const Color statusPendingText = Color(0xFFE8702F);
  static const Color statusError = Color(0xFFEF4444);
  static const Color statusErrorBg = Color(0xFFFEE2E2);

  // Legacy compat
  static const Color secondaryColor = primaryAccent;
  static const Color backgroundColor = surface;
  static const Color greenColor = statusSuccess;
  static const Color redColor = statusError;
  static const Color greyBackgroundColor = Color(0xFFF6F6F6);
}

class AppTheme {
  static ThemeData get light {
    final textTheme = GoogleFonts.plusJakartaSansTextTheme().copyWith(
      displayLarge: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w800,
        color: KColors.textPrimary,
      ),
      displayMedium: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w700,
        color: KColors.textPrimary,
      ),
      headlineLarge: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w800,
        color: KColors.textPrimary,
      ),
      headlineMedium: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w700,
        color: KColors.textPrimary,
      ),
      titleLarge: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w700,
        color: KColors.textPrimary,
      ),
      titleMedium: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w600,
        color: KColors.textPrimary,
      ),
      titleSmall: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w600,
        color: KColors.textSecondary,
      ),
      bodyLarge: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w400,
        color: KColors.textPrimary,
      ),
      bodyMedium: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w400,
        color: KColors.textSecondary,
      ),
      labelLarge: GoogleFonts.plusJakartaSans(
        fontWeight: FontWeight.w600,
        color: KColors.primaryAccent,
      ),
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: KColors.primaryAccent,
        secondary: KColors.purpleAccent,
        tertiary: KColors.tealAccent,
        surface: KColors.surface,
        background: KColors.background,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: KColors.textPrimary,
        onBackground: KColors.textPrimary,
        error: KColors.statusError,
        outline: KColors.border,
      ),
      scaffoldBackgroundColor: KColors.background,
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        elevation: 0,
        backgroundColor: KColors.surface,
        foregroundColor: KColors.textPrimary,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: KColors.textPrimary,
        ),
        iconTheme: const IconThemeData(color: KColors.textPrimary),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        surfaceTintColor: KColors.surface,
        backgroundColor: KColors.surface,
        modalBackgroundColor: KColors.surface,
      ),
      cardTheme: CardTheme(
        color: KColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: KColors.border, width: 1),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: KColors.surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: KColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: KColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: KColors.primaryAccent, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: KColors.statusError),
        ),
        labelStyle: GoogleFonts.plusJakartaSans(
          color: KColors.textSecondary,
          fontWeight: FontWeight.w500,
        ),
        hintStyle: GoogleFonts.plusJakartaSans(
          color: KColors.textSecondary,
          fontWeight: FontWeight.w400,
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: KColors.primaryAccent,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
          elevation: 0,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: KColors.primaryAccent,
          side: const BorderSide(color: KColors.primaryAccent),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          textStyle: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: KColors.primaryAccent,
          textStyle: GoogleFonts.plusJakartaSans(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: KColors.border,
        thickness: 1,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: KColors.activeState,
        selectedColor: KColors.purpleAccent,
        labelStyle: GoogleFonts.plusJakartaSans(
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: KColors.surface,
        selectedItemColor: KColors.primaryAccent,
        unselectedItemColor: KColors.textSecondary,
        elevation: 8,
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: KColors.surface,
        indicatorColor: KColors.activeState,
        labelTextStyle: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return GoogleFonts.plusJakartaSans(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: KColors.primaryAccent,
            );
          }
          return GoogleFonts.plusJakartaSans(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: KColors.textSecondary,
          );
        }),
        iconTheme: MaterialStateProperty.resolveWith((states) {
          if (states.contains(MaterialState.selected)) {
            return const IconThemeData(color: KColors.primaryAccent);
          }
          return const IconThemeData(color: KColors.textSecondary);
        }),
      ),
    );
  }
}
