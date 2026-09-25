import 'dart:convert';
import 'package:equatable/equatable.dart';

/// Order status — matches the server's ORDER_STATUSES enum exactly
enum OrderStatus {
  placed,
  confirmed,
  shipped,
  out_for_delivery,
  delivered,
  cancelled,
}

extension OrderStatusX on OrderStatus {
  String get value => name;
  String get displayName {
    switch (this) {
      case OrderStatus.placed: return 'Order Placed';
      case OrderStatus.confirmed: return 'Confirmed';
      case OrderStatus.shipped: return 'Shipped';
      case OrderStatus.out_for_delivery: return 'Out for Delivery';
      case OrderStatus.delivered: return 'Delivered';
      case OrderStatus.cancelled: return 'Cancelled';
    }
  }

  static OrderStatus fromString(String? s) {
    return OrderStatus.values.firstWhere(
      (e) => e.name == s,
      orElse: () => OrderStatus.placed,
    );
  }
}

enum PaymentMethod { razorpay, cod }
enum PaymentStatus { pending, paid, failed, refunded }
enum ReturnStatus { none, requested, approved, rejected, refunded }

class StatusTimeline {
  final OrderStatus status;
  final DateTime timestamp;
  final String? note;

  const StatusTimeline({
    required this.status,
    required this.timestamp,
    this.note,
  });

  factory StatusTimeline.fromMap(Map<String, dynamic> map) {
    return StatusTimeline(
      status: OrderStatusX.fromString(map['status']),
      timestamp: map['timestamp'] != null
          ? DateTime.parse(map['timestamp'])
          : DateTime.now(),
      note: map['note'],
    );
  }
}

class Order extends Equatable {
  final String id;
  final List<dynamic> products;
  final double totalPrice;
  final double discount;
  final double finalAmount;
  final double commission;
  final String? couponCode;
  final String address;
  final String userId;
  final OrderStatus status;
  final List<StatusTimeline> statusTimeline;
  final PaymentMethod paymentMethod;
  final PaymentStatus paymentStatus;
  final String? razorpayOrderId;
  final String? razorpayPaymentId;
  final ReturnStatus returnStatus;
  final String? returnReason;
  final int orderedAt;

  const Order({
    required this.id,
    required this.products,
    required this.totalPrice,
    this.discount = 0,
    required this.finalAmount,
    this.commission = 0,
    this.couponCode,
    required this.address,
    required this.userId,
    required this.status,
    this.statusTimeline = const [],
    required this.paymentMethod,
    this.paymentStatus = PaymentStatus.pending,
    this.razorpayOrderId,
    this.razorpayPaymentId,
    this.returnStatus = ReturnStatus.none,
    this.returnReason,
    required this.orderedAt,
  });

  bool get isDelivered => status == OrderStatus.delivered;
  bool get canReturn =>
      isDelivered &&
      returnStatus == ReturnStatus.none &&
      DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(orderedAt)).inDays <= 7;

  factory Order.fromMap(Map<String, dynamic> map) {
    PaymentMethod pm;
    try {
      pm = PaymentMethod.values.firstWhere(
        (e) => e.name == (map['paymentMethod'] ?? 'cod'),
      );
    } catch (_) {
      pm = PaymentMethod.cod;
    }

    PaymentStatus ps;
    try {
      ps = PaymentStatus.values.firstWhere(
        (e) => e.name == (map['paymentStatus'] ?? 'pending'),
      );
    } catch (_) {
      ps = PaymentStatus.pending;
    }

    ReturnStatus rs;
    try {
      rs = ReturnStatus.values.firstWhere(
        (e) => e.name == (map['returnStatus'] ?? 'none'),
      );
    } catch (_) {
      rs = ReturnStatus.none;
    }

    // Handle legacy numeric status (0-4) from old Flutterzon orders
    OrderStatus orderStatus;
    final rawStatus = map['status'];
    if (rawStatus is int) {
      const legacyMap = [
        OrderStatus.placed,
        OrderStatus.confirmed,
        OrderStatus.shipped,
        OrderStatus.out_for_delivery,
        OrderStatus.delivered,
      ];
      orderStatus = rawStatus < legacyMap.length ? legacyMap[rawStatus] : OrderStatus.placed;
    } else {
      orderStatus = OrderStatusX.fromString(rawStatus?.toString());
    }

    List<StatusTimeline> timeline = [];
    if (map['statusTimeline'] != null) {
      timeline = List<StatusTimeline>.from(
        (map['statusTimeline'] as List).map((t) => StatusTimeline.fromMap(t)),
      );
    }

    return Order(
      id: map['_id'] ?? map['id'] ?? '',
      products: List<dynamic>.from(map['products'] ?? []),
      totalPrice: (map['totalPrice'] ?? 0.0).toDouble(),
      discount: (map['discount'] ?? 0.0).toDouble(),
      finalAmount: (map['finalAmount'] ?? map['totalPrice'] ?? 0.0).toDouble(),
      commission: (map['commission'] ?? 0.0).toDouble(),
      couponCode: map['couponCode'],
      address: map['address']?.toString() ?? '',
      userId: map['userId'] ?? '',
      status: orderStatus,
      statusTimeline: timeline,
      paymentMethod: pm,
      paymentStatus: ps,
      razorpayOrderId: map['razorpayOrderId'],
      razorpayPaymentId: map['razorpayPaymentId'],
      returnStatus: rs,
      returnReason: map['returnReason'],
      orderedAt: map['orderedAt'] is int
          ? map['orderedAt']
          : map['orderedAt'] != null
              ? DateTime.parse(map['orderedAt'].toString()).millisecondsSinceEpoch
              : DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'products': products,
        'totalPrice': totalPrice,
        'discount': discount,
        'finalAmount': finalAmount,
        'commission': commission,
        'couponCode': couponCode,
        'address': address,
        'userId': userId,
        'status': status.value,
        'statusTimeline': statusTimeline.map((t) => {
          'status': t.status.value,
          'timestamp': t.timestamp.toIso8601String(),
          'note': t.note,
        }).toList(),
        'paymentMethod': paymentMethod.name,
        'paymentStatus': paymentStatus.name,
        'returnStatus': returnStatus.name,
        'orderedAt': orderedAt,
      };

  String toJson() => json.encode(toMap());
  factory Order.fromJson(String source) => Order.fromMap(json.decode(source));

  @override
  List<Object?> get props => [
        id, products, totalPrice, discount, finalAmount, address,
        userId, status, paymentMethod, paymentStatus, returnStatus, orderedAt,
      ];
}
