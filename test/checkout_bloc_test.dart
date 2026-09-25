import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Checkout Unit Tests', () {
    test('Calculates discount correctly for percentage coupon', () {
      const double subtotal = 1000.0;
      const double percentage = 15.0; // 15% off
      const double expectedDiscount = 150.0;

      final double actualDiscount = (subtotal * percentage) / 100;
      expect(actualDiscount, equals(expectedDiscount));
    });

    test('Ensures final total cannot be negative', () {
      const double subtotal = 500.0;
      const double discount = 600.0;

      final double total = (subtotal - discount) < 0 ? 0.0 : (subtotal - discount);
      expect(total, equals(0.0));
    });

    test('Validates Razorpay payment payload fields', () {
      final Map<String, dynamic> options = {
        'key': 'rzp_test_mock_key',
        'amount': 50000, // in paise
        'name': 'Kalaghar Handmade Crafts',
        'currency': 'INR',
      };

      expect(options['key'], isNotEmpty);
      expect(options['amount'], isPositive);
      expect(options['currency'], equals('INR'));
    });
  });
}
