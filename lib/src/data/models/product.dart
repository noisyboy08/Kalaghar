import 'dart:convert';
import 'package:equatable/equatable.dart';
import 'package:kalaghar/src/data/models/rating.dart';

/// Valid craft categories — must match the server's VALID_CRAFTS exactly
const List<String> kValidCrafts = [
  'pottery',
  'textiles',
  'paintings',
  'jewellery',
  'woodcraft',
];

/// Product status enum — matches the TypeScript contract on the admin side
enum ProductStatus { pending, approved, rejected }

extension ProductStatusX on ProductStatus {
  String get value => name;
  static ProductStatus fromString(String? s) {
    return ProductStatus.values.firstWhere(
      (e) => e.name == s,
      orElse: () => ProductStatus.pending,
    );
  }
}

class Product extends Equatable {
  final String name;
  final String description;
  final int quantity;
  final int stock;
  final List<String> images;

  /// craft is the primary category (pottery/textiles/paintings/jewellery/woodcraft)
  final String craft;

  /// Legacy field — kept for backward compat (equals craft)
  final String category;

  final String? region;
  final String? technique;
  final String? sellerId;
  final String? sellerName;
  final ProductStatus status;
  final double price;
  final String? id;
  final List<Rating>? rating;

  const Product({
    required this.name,
    required this.description,
    required this.quantity,
    required this.stock,
    required this.images,
    required this.craft,
    required this.category,
    required this.price,
    this.region,
    this.technique,
    this.sellerId,
    this.sellerName,
    this.status = ProductStatus.pending,
    this.id,
    this.rating,
  });

  bool get isApproved => status == ProductStatus.approved;
  bool get isPending => status == ProductStatus.pending;
  bool get isLowStock => stock <= 5 && stock > 0;
  bool get isOutOfStock => stock <= 0;

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'description': description,
      'quantity': quantity,
      'stock': stock,
      'images': images,
      'craft': craft,
      'category': category,
      'region': region,
      'technique': technique,
      'sellerId': sellerId,
      'sellerName': sellerName,
      'status': status.value,
      'price': price,
      'id': id,
      'rating': rating,
    };
  }

  factory Product.fromMap(Map<String, dynamic> map) {
    final craft = map['craft'] ?? map['category'] ?? '';
    final stockVal = map['stock']?.toInt() ?? map['quantity']?.toInt() ?? 0;
    return Product(
      name: map['name'] ?? '',
      description: map['description'] ?? '',
      quantity: stockVal,
      stock: stockVal,
      images: List<String>.from(map['images'] ?? []),
      craft: craft,
      category: craft,
      region: map['region'],
      technique: map['technique'],
      sellerId: map['sellerId'],
      sellerName: map['sellerName'],
      status: ProductStatusX.fromString(map['status']),
      price: (map['price'] ?? 0.0).toDouble(),
      id: map['_id'] ?? map['id'],
      rating: map['ratings'] != null
          ? List<Rating>.from(
              map['ratings']?.map((x) => Rating.fromMap(x)),
            )
          : null,
    );
  }

  String toJson() => json.encode(toMap());
  factory Product.fromJson(String source) => Product.fromMap(json.decode(source));

  Product copyWith({
    String? name,
    String? description,
    int? quantity,
    int? stock,
    List<String>? images,
    String? craft,
    String? category,
    String? region,
    String? technique,
    String? sellerId,
    String? sellerName,
    ProductStatus? status,
    double? price,
    String? id,
    List<Rating>? rating,
  }) {
    return Product(
      name: name ?? this.name,
      description: description ?? this.description,
      quantity: quantity ?? this.quantity,
      stock: stock ?? this.stock,
      images: images ?? this.images,
      craft: craft ?? this.craft,
      category: category ?? this.category,
      region: region ?? this.region,
      technique: technique ?? this.technique,
      sellerId: sellerId ?? this.sellerId,
      sellerName: sellerName ?? this.sellerName,
      status: status ?? this.status,
      price: price ?? this.price,
      id: id ?? this.id,
      rating: rating ?? this.rating,
    );
  }

  @override
  List<Object?> get props => [
        name,
        description,
        quantity,
        stock,
        images,
        craft,
        category,
        region,
        technique,
        sellerId,
        status,
        price,
        id,
        rating,
      ];
}
