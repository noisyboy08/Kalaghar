import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:kalaghar/src/config/themes/app_theme.dart';
import 'package:kalaghar/src/logic/blocs/auth_bloc/auth_bloc.dart';
import 'package:google_fonts/google_fonts.dart';

/// Shown when an admin-role account logs in via the mobile app.
/// Admin management is done via the Kalaghar web admin panel.
class AdminBlockedScreen extends StatelessWidget {
  const AdminBlockedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: KColors.background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: KColors.activeState,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.admin_panel_settings_outlined,
                    size: 48,
                    color: KColors.purpleAccent,
                  ),
                ),
                const SizedBox(height: 32),

                // Title
                Text(
                  'Admin Access',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                    color: KColors.textPrimary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),

                // Subtitle
                Text(
                  'Admin management is done via the\nKalaghar Web Admin Panel.',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.w400,
                    color: KColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),

                // URL hint
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: KColors.activeState,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: KColors.border),
                  ),
                  child: Text(
                    'admin.kalaghar.in',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: KColors.purpleAccent,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(height: 48),

                // Sign out button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    icon: const Icon(Icons.logout_rounded),
                    label: const Text('Sign Out'),
                    onPressed: () {
                      context.read<AuthBloc>().add(SignOutEvent());
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: KColors.statusError,
                      side: const BorderSide(color: KColors.statusError),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      textStyle: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
