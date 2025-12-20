# 📚 Kirayedar24 Backend API Documentation

## 🌐 Base URL
```
http://localhost:5000
```

## 📝 Table of Contents
- [Authentication APIs](#authentication-apis)
- [Profile Management APIs](#profile-management-apis)
- [Property Management APIs](#property-management-apis)
- [Payment APIs](#payment-apis)
- [Chat APIs](#chat-apis)
- [Testing Guide](#testing-guide)

---

## 🔐 Authentication APIs

### 1. Register User
**POST** `/api/auth/register`
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer" // or "owner"
}
```
**Response:**
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### 2. Login User
**POST** `/api/auth/login`
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

---

## 👤 Profile Management APIs

### 1. Get User Profile
**GET** `/api/profile`
- **Headers:** `Authorization: Bearer <token>`
```json
{
  "success": true,
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+91 9876543210",
    "address": "123 Main Street",
    "city": "Mumbai",
    "bio": "This is my bio",
    "profilePicture": "profile.jpg",
    "role": "customer"
  }
}
```

### 2. Update User Profile
**PUT** `/api/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Content-Type:** `multipart/form-data` (for file upload) or `application/json`
```json
{
  "name": "Updated Name",
  "phone": "+91 9876543210",
  "address": "New Address",
  "city": "Delhi",
  "bio": "Updated bio"
}
```

### 3. Change Password
**PUT** `/api/profile/change-password`
- **Headers:** `Authorization: Bearer <token>`
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### 4. Get Public Profile
**GET** `/api/profile/:userId`
- **No authentication required**

### 5. Update FCM Token
**POST** `/api/profile/fcm-token`
- **Headers:** `Authorization: Bearer <token>`
```json
{
  "fcmToken": "fcm_token_here"
}
```

---

## 🏠 Property Management APIs

### 1. Create Property
**POST** `/api/properties`
- **Headers:** `Authorization: Bearer <token>`
- **Content-Type:** `multipart/form-data`
```json
{
  "rentAmount": 25000,
  "depositAmount": 50000,
  "address": "123 Property Street",
  "city": "Mumbai",
  "description": "Beautiful 2BHK apartment",
  "propertyType": "Apartment",
  "bedrooms": 2,
  "bathrooms": 1,
  "electricityIncluded": true,
  "water": true,
  "phone": "+91 9876543210"
}
```

### 2. Get All Properties
**GET** `/api/properties`
```json
{
  "success": true,
  "properties": [...]
}
```

### 3. Search Properties
**GET** `/api/properties/search`
- **Query Parameters:**
  - `query` - Text search
  - `minRent` - Minimum rent amount
  - `maxRent` - Maximum rent amount
  - `city` - City filter
  - `propertyType` - Property type filter
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 10)

Example: `/api/properties/search?city=Mumbai&minRent=20000&maxRent=50000`

### 4. Get Single Property
**GET** `/api/properties/:id`

### 5. Get My Properties
**GET** `/api/properties/my-properties`
- **Headers:** `Authorization: Bearer <token>`

### 6. Get Properties by Owner
**GET** `/api/properties/owner/:ownerId`

### 7. Get Saved Properties
**GET** `/api/properties/saved`
- **Headers:** `Authorization: Bearer <token>`

### 8. Save Property
**POST** `/api/properties/:propertyId/save`
- **Headers:** `Authorization: Bearer <token>`

### 9. Remove Saved Property
**DELETE** `/api/properties/:propertyId/save`
- **Headers:** `Authorization: Bearer <token>`

### 10. Update Property
**PUT** `/api/properties/:id`
- **Headers:** `Authorization: Bearer <token>`

### 11. Delete Property
**DELETE** `/api/properties/:id`
- **Headers:** `Authorization: Bearer <token>`

### 12. Get Property Categories
**GET** `/api/properties/categories`

---

## 💳 Payment APIs

### 1. Pay Rent
**POST** `/api/payments/rent`
- **Headers:** `Authorization: Bearer <token>`
```json
{
  "amount": 25000,
  "propertyAddress": "123 Property Street, Mumbai",
  "ownerName": "Property Owner",
  "ownerPhone": "+91 9876543210",
  "rentType": "monthly",
  "paymentMethod": "upi",
  "description": "Monthly rent payment"
}
```

### 2. Pay Bill
**POST** `/api/payments/bill`
- **Headers:** `Authorization: Bearer <token>`
```json
{
  "amount": 5000,
  "propertyAddress": "123 Property Street, Mumbai",
  "billType": "electricity",
  "paymentMethod": "card",
  "description": "Electricity bill payment",
  "dueDate": "2025-12-31"
}
```

### 3. Get Payment History
**GET** `/api/payments/history`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` - Page number
  - `limit` - Items per page
  - `type` - Payment type (rent/bill)
  - `status` - Payment status

### 4. Get Single Payment
**GET** `/api/payments/:id`
- **Headers:** `Authorization: Bearer <token>`

### 5. Verify Payment
**GET** `/api/payments/verify/:transactionId`
- **Headers:** `Authorization: Bearer <token>`

---

## 💬 Chat APIs

### 1. Get Chat List
**GET** `/api/chats`
- **Headers:** `Authorization: Bearer <token>`

### 2. Create Chat
**POST** `/api/chats`
- **Headers:** `Authorization: Bearer <token>`
```json
{
  "participantId": "other_user_id",
  "propertyId": "property_id", // optional
  "initialMessage": "Hello, I'm interested in your property"
}
```

### 3. Get Chat Messages
**GET** `/api/chats/:chatId/messages`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` - Page number
  - `limit` - Messages per page

### 4. Send Message
**POST** `/api/chats/:chatId/messages`
- **Headers:** `Authorization: Bearer <token>`
```json
{
  "text": "Hello, how are you?"
}
```

### 5. Delete Chat
**DELETE** `/api/chats/:chatId`
- **Headers:** `Authorization: Bearer <token>`

### 6. Mark Messages as Read
**PUT** `/api/chats/:chatId/read`
- **Headers:** `Authorization: Bearer <token>`

---

## 🧪 Testing Guide

### Using Postman:
1. Import this documentation as a Postman collection
2. Set base URL: `http://localhost:5000`
3. First register/login to get token
4. Add token to Authorization header for protected routes

### Using cURL:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123","role":"customer"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get Profile
curl -X GET http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Error Responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## 📊 API Summary
- **Authentication:** 2 APIs
- **Profile Management:** 5 APIs  
- **Property Management:** 12 APIs
- **Payment:** 5 APIs
- **Chat:** 6 APIs

**Total: 30 APIs**

---

## 🔗 Quick Links
- [Postman Collection](postman-collection-link)
- [API Testing Tool](http://localhost:5000)
- [Server Status Check](http://localhost:5000/api/properties/categories)

---

## 📞 Support
For API support and questions, contact the development team.

**Server Status:** ✅ Running on http://localhost:5000