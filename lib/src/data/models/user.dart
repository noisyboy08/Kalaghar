import 'dart:convert';
import 'package:equatable/equatable.dart';

enum UserRole { buyer, seller, admin }

extension UserRoleX on UserRole {
  String get value => name;
  static UserRole fromString(String? s) {
    return UserRole.values.firstWhere(
      (e) => e.name == s,
      orElse: () => UserRole.buyer,
    );
  }
}

enum KycStatus { none, pending, approved, rejected }

class Address extends Equatable {
  final String id;
  final String label;
  final String fullName;
  final String phone;
  final String line1;
  final String? line2;
  final String city;
  final String state;
  final String pincode;
  final bool isDefault;

  const Address({
    required this.id,
    this.label = 'Home',
    required this.fullName,
    required this.phone,
    required this.line1,
    this.line2,
    required this.city,
    required this.state,
    required this.pincode,
    this.isDefault = false,
  });

  String get formatted => '$line1${line2 != null ? ', $line2' : ''}, $city, $state - $pincode';

  factory Address.fromMap(Map<String, dynamic> map) {
    return Address(
      id: map['_id'] ?? map['id'] ?? '',
      label: map['label'] ?? 'Home',
      fullName: map['fullName'] ?? '',
      phone: map['phone'] ?? '',
      line1: map['line1'] ?? '',
      line2: map['line2'],
      city: map['city'] ?? '',
      state: map['state'] ?? '',
      pincode: map['pincode'] ?? '',
      isDefault: map['isDefault'] ?? false,
    );
  }

  Map<String, dynamic> toMap() => {
        'label': label,
        'fullName': fullName,
        'phone': phone,
        'line1': line1,
        'line2': line2,
        'city': city,
        'state': state,
        'pincode': pincode,
        'isDefault': isDefault,
      };

  @override
  List<Object?> get props => [id, fullName, phone, line1, city, state, pincode];
}

class ArtisanStory {
  final String? photo;
  final String? village;
  final String? region;
  final int? yearsOfExperience;
  final String? technique;
  final String? bio;

  const ArtisanStory({
    this.photo,
    this.village,
    this.region,
    this.yearsOfExperience,
    this.technique,
    this.bio,
  });

  factory ArtisanStory.fromMap(Map<String, dynamic> map) {
    return ArtisanStory(
      photo: map['photo'],
      village: map['village'],
      region: map['region'],
      yearsOfExperience: map['yearsOfExperience']?.toInt(),
      technique: map['technique'],
      bio: map['bio'],
    );
  }

  Map<String, dynamic> toMap() => {
        'photo': photo,
        'village': village,
        'region': region,
        'yearsOfExperience': yearsOfExperience,
        'technique': technique,
        'bio': bio,
      };
}

class User extends Equatable {
  final String id;
  final String name;
  final String email;
  final String password;
  final UserRole role;
  final String token;
  final String? refreshToken;

  // Address book
  final List<Address> addresses;
  final String address; // legacy single address

  // Cart/shopping data
  final List<dynamic> cart;
  final List<dynamic> saveForLater;
  final List<dynamic> keepShoppingFor;
  final List<dynamic> wishList;

  // Seller-specific
  final String? storeName;
  final String? craft;
  final String? region;
  final String? technique;
  final String? phone;
  final KycStatus kycStatus;
  final ArtisanStory? artisanStory;
  final String? fcmToken;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.password,
    required this.role,
    required this.token,
    this.refreshToken,
    this.addresses = const [],
    this.address = '',
    required this.cart,
    required this.saveForLater,
    required this.keepShoppingFor,
    required this.wishList,
    this.storeName,
    this.craft,
    this.region,
    this.technique,
    this.phone,
    this.kycStatus = KycStatus.none,
    this.artisanStory,
    this.fcmToken,
  });

  bool get isBuyer => role == UserRole.buyer;
  bool get isSeller => role == UserRole.seller;
  bool get isAdmin => role == UserRole.admin;
  bool get isKycApproved => kycStatus == KycStatus.approved;

  /// Legacy 'type' field compat
  String get type => role.value;

  factory User.fromMap(Map<String, dynamic> map) {
    // Support both old 'type' field and new 'role' field
    final roleStr = map['role'] ?? map['type'] ?? 'buyer';
    UserRole role;
    if (roleStr == 'user' || roleStr == 'buyer') {
      role = UserRole.buyer;
    } else if (roleStr == 'seller') {
      role = UserRole.seller;
    } else if (roleStr == 'admin') {
      role = UserRole.admin;
    } else {
      role = UserRole.buyer;
    }

    KycStatus kycStatus;
    switch (map['kycStatus']) {
      case 'pending': kycStatus = KycStatus.pending; break;
      case 'approved': kycStatus = KycStatus.approved; break;
      case 'rejected': kycStatus = KycStatus.rejected; break;
      default: kycStatus = KycStatus.none;
    }

    List<Address> addresses = [];
    if (map['addresses'] != null) {
      addresses = List<Address>.from(
        (map['addresses'] as List).map((a) => Address.fromMap(a)),
      );
    }

    return User(
      id: map['_id'] ?? map['id'] ?? '',
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      password: map['password'] ?? '',
      role: role,
      token: map['token'] ?? '',
      refreshToken: map['refreshToken'],
      addresses: addresses,
      address: map['address'] ?? '',
      cart: List<dynamic>.from(map['cart'] ?? []),
      saveForLater: List<dynamic>.from(map['saveForLater'] ?? []),
      keepShoppingFor: List<dynamic>.from(map['keepShoppingFor'] ?? []),
      wishList: List<dynamic>.from(map['wishList'] ?? []),
      storeName: map['storeName'],
      craft: map['craft'],
      region: map['region'],
      technique: map['technique'],
      phone: map['phone'],
      kycStatus: kycStatus,
      artisanStory: map['artisanStory'] != null
          ? ArtisanStory.fromMap(map['artisanStory'])
          : null,
      fcmToken: map['fcmToken'],
    );
  }

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'email': email,
        'password': password,
        'role': role.value,
        'token': token,
        'refreshToken': refreshToken,
        'addresses': addresses.map((a) => a.toMap()).toList(),
        'address': address,
        'type': type, // legacy
        'cart': cart,
        'saveForLater': saveForLater,
        'keepShoppingFor': keepShoppingFor,
        'wishList': wishList,
        'storeName': storeName,
        'craft': craft,
        'region': region,
        'technique': technique,
        'phone': phone,
        'kycStatus': kycStatus.name,
      };

  String toJson() => json.encode(toMap());
  factory User.fromJson(String source) => User.fromMap(json.decode(source));

  User copyWith({
    String? id,
    String? name,
    String? email,
    String? password,
    UserRole? role,
    String? token,
    String? refreshToken,
    List<Address>? addresses,
    String? address,
    List<dynamic>? cart,
    List<dynamic>? saveForLater,
    List<dynamic>? keepShoppingFor,
    List<dynamic>? wishList,
    String? storeName,
    String? craft,
    String? region,
    String? technique,
    String? phone,
    KycStatus? kycStatus,
    ArtisanStory? artisanStory,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      password: password ?? this.password,
      role: role ?? this.role,
      token: token ?? this.token,
      refreshToken: refreshToken ?? this.refreshToken,
      addresses: addresses ?? this.addresses,
      address: address ?? this.address,
      cart: cart ?? this.cart,
      saveForLater: saveForLater ?? this.saveForLater,
      keepShoppingFor: keepShoppingFor ?? this.keepShoppingFor,
      wishList: wishList ?? this.wishList,
      storeName: storeName ?? this.storeName,
      craft: craft ?? this.craft,
      region: region ?? this.region,
      technique: technique ?? this.technique,
      phone: phone ?? this.phone,
      kycStatus: kycStatus ?? this.kycStatus,
      artisanStory: artisanStory ?? this.artisanStory,
    );
  }

  @override
  List<Object?> get props => [
        id, name, email, role, token, addresses, address,
        cart, saveForLater, keepShoppingFor, wishList,
        storeName, craft, kycStatus,
      ];
}
