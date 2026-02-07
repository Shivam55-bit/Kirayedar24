# 📡 Kirayedar24 - Backend API Documentation

> **Base URL:** `https://n5.bhoomitechzone.us`  
> **Last Updated:** February 2026

---

## 📋 Table of Contents

1. [App Flows](#-app-flows)
2. [Authentication APIs](#-authentication-apis)
3. [User Profile APIs](#-user-profile-apis)
4. [Property APIs](#-property-apis)
5. [Chat APIs](#-chat-apis)
6. [Notification APIs](#-notification-apis)
7. [Subscription APIs (Tenant)](#-subscription-apis-tenant)
8. [Subscription APIs (Owner)](#-subscription-apis-owner)
9. [Location APIs](#-location-apis)
10. [FCM Token APIs](#-fcm-token-apis)

---

## 🔄 App Flows

### 📱 1. Email Login Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                     EMAIL LOGIN FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────┐        │
│  │  User    │───▶│ LoginScreen  │───▶│ POST /auth/login│        │
│  │  Opens   │    │ Enter Email  │    │ email, password │        │
│  │  App     │    │ & Password   │    │ fcmToken        │        │
│  └──────────┘    └──────────────┘    └────────┬────────┘        │
│                                               │                  │
│                    ┌──────────────────────────┘                  │
│                    ▼                                             │
│        ┌───────────────────────┐                                 │
│        │   Backend Response    │                                 │
│        │   success: true       │                                 │
│        │   token: "jwt..."     │                                 │
│        │   user: {...}         │                                 │
│        └───────────┬───────────┘                                 │
│                    │                                             │
│                    ▼                                             │
│        ┌───────────────────────┐    ┌─────────────────┐         │
│        │  Store in AsyncStorage│───▶│ POST /users/    │         │
│        │  - authToken          │    │ fcm-token       │         │
│        │  - userId             │    │ (sync FCM)      │         │
│        │  - userData           │    └─────────────────┘         │
│        └───────────┬───────────┘                                 │
│                    │                                             │
│                    ▼                                             │
│        ┌───────────────────────┐                                 │
│        │   Navigate to Home    │                                 │
│        │   HomeScreen          │                                 │
│        └───────────────────────┘                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 📲 2. Phone OTP Login Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                   PHONE OTP LOGIN FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌─────────────────────┐    │
│  │  User    │───▶│ LoginScreen  │───▶│ POST /auth/         │    │
│  │  Opens   │    │ Enter Phone  │    │ send-phone-otp      │    │
│  │  App     │    │ Number       │    │ { phone: "98..." }  │    │
│  └──────────┘    └──────────────┘    └──────────┬──────────┘    │
│                                                  │               │
│                         ┌────────────────────────┘               │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │  OTP Sent to Phone  │                             │
│              │  via SMS            │                             │
│              └──────────┬──────────┘                             │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐    ┌─────────────────────┐ │
│              │  OtpScreen          │───▶│ POST /auth/         │ │
│              │  Enter 6-digit OTP  │    │ verify-phone-otp    │ │
│              │                     │    │ { phone, otp }      │ │
│              └─────────────────────┘    └──────────┬──────────┘ │
│                                                    │             │
│                    ┌───────────────────────────────┘             │
│                    ▼                                             │
│         ┌─────────────────────┐      ┌─────────────────────┐    │
│         │  User Exists?       │──NO──▶│ CompleteRegistration│    │
│         │                     │      │ POST /auth/complete- │    │
│         │                     │      │ registration         │    │
│         └─────────┬───────────┘      └─────────────────────┘    │
│                   │ YES                                          │
│                   ▼                                              │
│         ┌─────────────────────┐                                  │
│         │  Return token &     │                                  │
│         │  user data          │                                  │
│         │  Navigate to Home   │                                  │
│         └─────────────────────┘                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🏠 3. Property Add Flow (Owner)
```
┌─────────────────────────────────────────────────────────────────┐
│                   PROPERTY ADD FLOW (Owner)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌─────────────────────────────────────┐    │
│  │ Owner clicks │───▶│  Check Active Subscription          │    │
│  │ "Add Property"│    │  GET /api/subscription              │    │
│  └──────────────┘    └──────────────┬──────────────────────┘    │
│                                      │                           │
│           ┌──────────────────────────┴────────────────┐          │
│           ▼                                           ▼          │
│  ┌─────────────────┐                      ┌─────────────────┐   │
│  │ Has Subscription│                      │ No Subscription │   │
│  │ (Posts Left > 0)│                      │ Show Packages   │   │
│  └────────┬────────┘                      └────────┬────────┘   │
│           │                                        │             │
│           │                                        ▼             │
│           │                          ┌─────────────────────────┐│
│           │                          │ POST /api/subscription- ││
│           │                          │ purchase/create-order   ││
│           │                          │ { packageId }           ││
│           │                          └───────────┬─────────────┘│
│           │                                      ▼              │
│           │                          ┌─────────────────────────┐│
│           │                          │ Razorpay Payment        ││
│           │                          │ Modal Opens             ││
│           │                          └───────────┬─────────────┘│
│           │                                      ▼              │
│           │                          ┌─────────────────────────┐│
│           │                          │ POST /api/subscription- ││
│           │                          │ purchase/verify-payment ││
│           │                          └───────────┬─────────────┘│
│           │                                      │              │
│           └─────────────────┬────────────────────┘              │
│                             ▼                                    │
│              ┌─────────────────────────────┐                     │
│              │  AddSellScreen              │                     │
│              │  Fill Property Details:     │                     │
│              │  - Title, Description       │                     │
│              │  - Price, Type (Rent/Sell)  │                     │
│              │  - Location, Images         │                     │
│              │  - Amenities                │                     │
│              └──────────────┬──────────────┘                     │
│                             ▼                                    │
│              ┌─────────────────────────────┐                     │
│              │  POST /property/add         │                     │
│              │  (FormData with images)     │                     │
│              └──────────────┬──────────────┘                     │
│                             ▼                                    │
│              ┌─────────────────────────────┐                     │
│              │  Property Added!            │                     │
│              │  Navigate to My Properties  │                     │
│              └─────────────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 💬 4. Chat Flow (Tenant to Owner)
```
┌─────────────────────────────────────────────────────────────────┐
│                   CHAT FLOW (Tenant → Owner)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌────────────────────────────────┐     │
│  │ Tenant views     │───▶│ Clicks "Chat with Owner"       │     │
│  │ Property Details │    │ or "Contact Owner"             │     │
│  └──────────────────┘    └─────────────┬──────────────────┘     │
│                                        │                         │
│                                        ▼                         │
│                          ┌─────────────────────────────┐        │
│                          │ POST /api/chat/:ownerId     │        │
│                          │ (Create or Get Chat)        │        │
│                          └─────────────┬───────────────┘        │
│                                        │                         │
│                                        ▼                         │
│                          ┌─────────────────────────────┐        │
│                          │ ChatScreen Opens            │        │
│                          │ Load Previous Messages      │        │
│                          │ GET /api/chat/:chatId       │        │
│                          └─────────────┬───────────────┘        │
│                                        │                         │
│                                        ▼                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    REAL-TIME CHAT                          │  │
│  │  ┌─────────────┐                      ┌─────────────────┐ │  │
│  │  │ Tenant types│   Socket.IO          │ Owner receives  │ │  │
│  │  │ message     │─────────────────────▶│ message in      │ │  │
│  │  │             │                      │ real-time       │ │  │
│  │  └──────┬──────┘                      └─────────────────┘ │  │
│  │         │                                                  │  │
│  │         ▼                                                  │  │
│  │  ┌─────────────────────────┐    ┌─────────────────────┐   │  │
│  │  │ POST /api/chat/:chatId/ │───▶│ POST /api/          │   │  │
│  │  │ message                 │    │ notification/       │   │  │
│  │  │ { message, type }       │    │ send-push           │   │  │
│  │  └─────────────────────────┘    │ (FCM Notification)  │   │  │
│  │                                 └─────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Additional Chat Actions:                                  │  │
│  │  • PATCH /api/chat/:chatId/read - Mark as Read            │  │
│  │  • PUT /api/chat/:chatId/message/:id - Edit Message       │  │
│  │  • DELETE /api/chat/:chatId/message/:id - Delete Message  │  │
│  │  • DELETE /api/chat/:chatId - Delete Entire Chat          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🔔 5. Notification Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                     NOTIFICATION FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 NOTIFICATION TRIGGERS                    │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │  • New Chat Message                                      │    │
│  │  • Property Inquiry                                      │    │
│  │  • Subscription Expiry Warning                           │    │
│  │  • Payment Confirmation                                  │    │
│  │  • Property Status Update                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│              ┌───────────────────────────────┐                  │
│              │  Backend creates notification │                  │
│              │  & sends FCM push             │                  │
│              │  POST /api/notification/      │                  │
│              │  send-push                    │                  │
│              └───────────────┬───────────────┘                  │
│                              │                                   │
│          ┌───────────────────┴───────────────────┐              │
│          ▼                                       ▼              │
│  ┌───────────────────┐              ┌───────────────────────┐   │
│  │ App in Foreground │              │ App in Background     │   │
│  │ In-app toast/     │              │ System notification   │   │
│  │ banner shown      │              │ FCM handles display   │   │
│  └─────────┬─────────┘              └───────────┬───────────┘   │
│            │                                    │               │
│            └─────────────────┬──────────────────┘               │
│                              ▼                                   │
│              ┌───────────────────────────────┐                  │
│              │  User taps notification       │                  │
│              │  Navigate to relevant screen  │                  │
│              │  (ChatScreen, PropertyDetails)│                  │
│              └───────────────┬───────────────┘                  │
│                              ▼                                   │
│              ┌───────────────────────────────┐                  │
│              │ PATCH /api/notification/      │                  │
│              │ mark-read/:notificationId     │                  │
│              └───────────────────────────────┘                  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Notification Screen Actions:                            │    │
│  │  • GET /api/notification/list - Load all notifications  │    │
│  │  • GET /api/notification/unread-count - Badge count     │    │
│  │  • POST /api/notification/read-all - Mark all read      │    │
│  │  • DELETE /api/notification/:id - Delete one            │    │
│  │  • DELETE /api/notification/delete-all - Clear all      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 💳 6. Tenant Subscription Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                 TENANT SUBSCRIPTION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌────────────────────────────────┐     │
│  │ Tenant wants to  │───▶│ GET /api/tenant-subscription/  │     │
│  │ View Owner       │    │ active                         │     │
│  │ Contact Details  │    │ (Check if subscribed)          │     │
│  └──────────────────┘    └─────────────┬──────────────────┘     │
│                                        │                         │
│           ┌────────────────────────────┴────────────────┐        │
│           ▼                                             ▼        │
│  ┌─────────────────┐                      ┌─────────────────┐   │
│  │ Active Sub      │                      │ No Subscription │   │
│  │ Show Contact    │                      │ Show Paywall    │   │
│  │ Details         │                      │                 │   │
│  └─────────────────┘                      └────────┬────────┘   │
│                                                    │             │
│                                                    ▼             │
│                                   ┌─────────────────────────────┐│
│                                   │ GET /api/tenant-subscription││
│                                   │ /packages                   ││
│                                   │ (Show available packages)   ││
│                                   └──────────────┬──────────────┘│
│                                                  ▼              │
│                                   ┌─────────────────────────────┐│
│                                   │ User selects package        ││
│                                   │ POST /api/tenant-subscription│
│                                   │ /create-order               ││
│                                   │ { subscriptionPackageId }   ││
│                                   └──────────────┬──────────────┘│
│                                                  ▼              │
│                                   ┌─────────────────────────────┐│
│                                   │ Razorpay Modal Opens        ││
│                                   │ User completes payment      ││
│                                   └──────────────┬──────────────┘│
│                                                  ▼              │
│                                   ┌─────────────────────────────┐│
│                                   │ POST /api/tenant-subscription│
│                                   │ /verify-payment             ││
│                                   │ { razorpay_order_id,        ││
│                                   │   razorpay_payment_id,      ││
│                                   │   razorpay_signature }      ││
│                                   └──────────────┬──────────────┘│
│                                                  ▼              │
│                                   ┌─────────────────────────────┐│
│                                   │ Subscription Activated!     ││
│                                   │ Now can view owner contacts ││
│                                   └─────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🔍 7. Property Search Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                   PROPERTY SEARCH FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐                                           │
│  │ User on Home     │                                           │
│  │ Screen           │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    SEARCH OPTIONS                          │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │
│  │  │ Text Search │  │ Filter by   │  │ Nearby Search   │    │  │
│  │  │             │  │ Category    │  │ (Location)      │    │  │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘    │  │
│  │         │                │                  │              │  │
│  │         ▼                ▼                  ▼              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │
│  │  │ GET         │  │ GET         │  │ GET /properties/│    │  │
│  │  │ /properties/│  │ /properties/│  │ nearby          │    │  │
│  │  │ search?     │  │ all?type=   │  │ ?lat=&lng=      │    │  │
│  │  │ query=...   │  │ rent/sell   │  │ &radius=5       │    │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘    │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│              ┌───────────────────────────────┐                  │
│              │  Display Property Cards       │                  │
│              │  - Title, Price, Location     │                  │
│              │  - Thumbnail Image            │                  │
│              │  - Type (Rent/Sell)           │                  │
│              └───────────────┬───────────────┘                  │
│                              │                                   │
│                              ▼                                   │
│              ┌───────────────────────────────┐                  │
│              │  User taps property           │                  │
│              │  GET /properties/:id          │                  │
│              │  PropertyDetailsScreen        │                  │
│              └───────────────┬───────────────┘                  │
│                              │                                   │
│           ┌──────────────────┴──────────────────┐               │
│           ▼                                     ▼               │
│  ┌─────────────────────┐            ┌─────────────────────┐     │
│  │ POST /api/properties│            │ Start Chat with     │     │
│  │ /save?propertyId=   │            │ Owner               │     │
│  │ (Bookmark property) │            │ POST /api/chat/     │     │
│  └─────────────────────┘            │ :ownerId            │     │
│                                     └─────────────────────┘     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 🗑️ 8. Property Management Flow (Owner)
```
┌─────────────────────────────────────────────────────────────────┐
│               PROPERTY MANAGEMENT FLOW (Owner)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌────────────────────────────────┐     │
│  │ Owner goes to    │───▶│ GET /api/properties/           │     │
│  │ "My Properties"  │    │ my-sell-properties             │     │
│  └──────────────────┘    └─────────────┬──────────────────┘     │
│                                        │                         │
│                                        ▼                         │
│              ┌───────────────────────────────────────────┐      │
│              │           PROPERTY LIST                    │      │
│              │  ┌─────────────────────────────────────┐  │      │
│              │  │ Property 1: 2BHK Apartment          │  │      │
│              │  │ Status: Active | Views: 145         │  │      │
│              │  │ [Edit] [Delete] [Mark Sold/Rented]  │  │      │
│              │  └─────────────────────────────────────┘  │      │
│              │  ┌─────────────────────────────────────┐  │      │
│              │  │ Property 2: 3BHK Villa              │  │      │
│              │  │ Status: Pending | Views: 23         │  │      │
│              │  │ [Edit] [Delete] [Mark Sold/Rented]  │  │      │
│              │  └─────────────────────────────────────┘  │      │
│              └───────────────────────────────────────────┘      │
│                              │                                   │
│           ┌──────────────────┼──────────────────┐               │
│           ▼                  ▼                  ▼               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ EDIT            │ │ DELETE          │ │ UPDATE STATUS   │   │
│  │ PUT /property/  │ │ DELETE /property│ │ PUT /property/  │   │
│  │ update/:id      │ │ /delete/:id     │ │ update/:id      │   │
│  │ (FormData)      │ │                 │ │ {status:"sold"} │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 📍 9. Location Selection Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                  LOCATION SELECTION FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌────────────────────────────────┐     │
│  │ Adding/Editing   │───▶│ GET /api/location/states       │     │
│  │ Property         │    │ Fetch all Indian states        │     │
│  └──────────────────┘    └─────────────┬──────────────────┘     │
│                                        │                         │
│                                        ▼                         │
│                          ┌───────────────────────────┐          │
│                          │ Dropdown: Select State    │          │
│                          │ • Maharashtra             │          │
│                          │ • Gujarat                 │          │
│                          │ • Karnataka               │          │
│                          └───────────────┬───────────┘          │
│                                          │                       │
│                                          ▼                       │
│                          ┌───────────────────────────┐          │
│                          │ GET /api/location/        │          │
│                          │ districts/:stateName      │          │
│                          └───────────────┬───────────┘          │
│                                          │                       │
│                                          ▼                       │
│                          ┌───────────────────────────┐          │
│                          │ Dropdown: Select District │          │
│                          │ • Mumbai                  │          │
│                          │ • Pune                    │          │
│                          │ • Nagpur                  │          │
│                          └───────────────┬───────────┘          │
│                                          │                       │
│                                          ▼                       │
│                          ┌───────────────────────────┐          │
│                          │ GET /api/location/        │          │
│                          │ cities/:districtName      │          │
│                          └───────────────┬───────────┘          │
│                                          │                       │
│                                          ▼                       │
│                          ┌───────────────────────────┐          │
│                          │ Dropdown: Select City     │          │
│                          │ • Andheri                 │          │
│                          │ • Bandra                  │          │
│                          │ • Juhu                    │          │
│                          └───────────────┬───────────┘          │
│                                          │                       │
│                                          ▼                       │
│                          ┌───────────────────────────┐          │
│                          │ Auto-fill Pincode         │          │
│                          │ (from city data)          │          │
│                          └───────────────────────────┘          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication APIs

### 1. User Signup
```bash
POST /auth/signup
```
**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "userType": "tenant" // or "owner"
}
```

### 2. Email/Password Login
```bash
POST /auth/login
```
**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fcmToken": "optional_fcm_token"
}
```
**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "userType": "tenant"
  }
}
```

### 3. Send Phone OTP
```bash
POST /auth/send-phone-otp
```
**Body:**
```json
{
  "phone": "9876543210"
}
```

### 4. Verify Phone OTP
```bash
POST /auth/verify-phone-otp
```
**Body:**
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

### 5. Send Email OTP
```bash
POST /auth/send-email-otp
```
**Body:**
```json
{
  "email": "user@example.com"
}
```

### 6. Verify Email OTP
```bash
POST /auth/verify-email-otp
```
**Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 7. Check User by Phone
```bash
POST /auth/check-user
```
**Body:**
```json
{
  "phone": "9876543210"
}
```

### 8. Complete Registration
```bash
POST /auth/complete-registration
```
**Body:**
```json
{
  "phone": "9876543210",
  "fullName": "John Doe",
  "email": "john@example.com",
  "userType": "tenant"
}
```

### 9. Logout
```bash
POST /auth/logout
```
**Headers:** `Authorization: Bearer <token>`

### 10. Refresh Token
```bash
POST /auth/refresh-token
```
**Headers:** `Authorization: Bearer <refresh_token>`

---

## 👤 User Profile APIs

### 1. Get User Profile
```bash
GET /auth/users/:userId
```
**Headers:** `Authorization: Bearer <token>`

### 2. Edit User Profile
```bash
PUT /auth/edit-profile/:userId
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "fullName": "Updated Name",
  "email": "updated@email.com",
  "phone": "9876543210"
}
```

### 3. Update FCM Token
```bash
POST /users/fcm-token
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "userId": "user_id_here",
  "fcmToken": "fcm_token_here",
  "fcmTokens": ["fcm_token_here"]
}
```

---

## 🏠 Property APIs

### 1. Get All Properties
```bash
GET /properties/all
```

### 2. Get Property by ID
```bash
GET /properties/:id
```

### 3. Search Properties
```bash
GET /properties/search?query=keyword&city=mumbai&type=rent
```

### 4. Get Nearby Properties
```bash
GET /properties/nearby?lat=19.0760&lng=72.8777&radius=5
```

### 5. Add New Property
```bash
POST /property/add
```
**Headers:** `Authorization: Bearer <token>`  
**Body:** `FormData` with property details and images

### 6. Update Property
```bash
PUT /property/update/:propertyId
```
**Headers:** `Authorization: Bearer <token>`  
**Body:** `FormData` with updated details

### 7. Delete Property
```bash
DELETE /property/delete/:propertyId
```
**Headers:** `Authorization: Bearer <token>`

### 8. Get My Posted Properties (Owner)
```bash
GET /api/properties/my-sell-properties
```
**Headers:** `Authorization: Bearer <token>`

### 9. Save/Bookmark Property
```bash
POST /api/properties/save?propertyId=:id
```
**Headers:** `Authorization: Bearer <token>`

### 10. Get Saved Properties
```bash
GET /api/properties/saved/all
```
**Headers:** `Authorization: Bearer <token>`

### 11. Remove Saved Property
```bash
DELETE /api/properties/remove?propertyId=:id
```
**Headers:** `Authorization: Bearer <token>`

---

## 💬 Chat APIs

### 1. Create/Get Chat with Owner
```bash
POST /api/chat/:ownerId
```
**Headers:** `Authorization: Bearer <token>`  
**Note:** Only tenants can start chat with owners

### 2. Get All User Chats
```bash
GET /api/chat
```
**Headers:** `Authorization: Bearer <token>`

### 3. Get Chat by ID
```bash
GET /api/chat/:chatId
```
**Headers:** `Authorization: Bearer <token>`

### 4. Send Message
```bash
POST /api/chat/:chatId/message
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "message": "Hello, I'm interested in your property",
  "message_type": "text"
}
```

### 5. Mark Chat as Read
```bash
PATCH /api/chat/:chatId/read
```
**Headers:** `Authorization: Bearer <token>`

### 6. Delete Chat
```bash
DELETE /api/chat/:chatId
```
**Headers:** `Authorization: Bearer <token>`

### 7. Edit Message
```bash
PUT /api/chat/:chatId/message/:messageId
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "message": "Updated message text"
}
```

### 8. Delete Message
```bash
DELETE /api/chat/:chatId/message/:messageId
```
**Headers:** `Authorization: Bearer <token>`

### 9. Send Message to Receiver (Auto-creates chat)
```bash
POST /chat/send-message
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "sender_id": "sender_user_id",
  "receiver_id": "receiver_user_id",
  "message": "Hello!",
  "message_type": "text"
}
```

---

## 🔔 Notification APIs

### 1. Get Notifications (Paginated)
```bash
GET /api/notification/list?page=1&limit=20&type=chat_message
```
**Headers:** `Authorization: Bearer <token>`

### 2. Get Unread Count
```bash
GET /api/notification/unread-count
```
**Headers:** `Authorization: Bearer <token>`

### 3. Mark Notification as Read
```bash
PATCH /api/notification/mark-read/:notificationId
```
**Headers:** `Authorization: Bearer <token>`

### 4. Mark All as Read
```bash
POST /api/notification/read-all
```
**Headers:** `Authorization: Bearer <token>`

### 5. Delete Notification
```bash
DELETE /api/notification/:notificationId
```
**Headers:** `Authorization: Bearer <token>`

### 6. Delete All Notifications
```bash
DELETE /api/notification/delete-all
```
**Headers:** `Authorization: Bearer <token>`

### 7. Send Push Notification
```bash
POST /api/notification/send-push
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "userId": "receiver_user_id",
  "type": "chat_message",
  "title": "New message from John",
  "body": "Hello, I'm interested...",
  "data": {
    "chatId": "chat_id",
    "senderId": "sender_id",
    "type": "chat_message"
  }
}
```

---

## 💳 Subscription APIs (Tenant)

### 1. Get Active Subscription
```bash
GET /api/tenant-subscription/active
```
**Headers:** `Authorization: Bearer <token>`

### 2. Get Available Packages
```bash
GET /api/tenant-subscription/packages
```
**Headers:** `Authorization: Bearer <token>`

### 3. Create Subscription Order
```bash
POST /api/tenant-subscription/create-order
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "subscriptionPackageId": "package_id_here"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "razorpay_order_id",
    "amount": 29900,
    "currency": "INR",
    "key": "rzp_live_xxx"
  }
}
```

### 4. Verify Payment
```bash
POST /api/tenant-subscription/verify-payment
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### 5. Get Subscription History
```bash
GET /api/tenant-subscription/history
```
**Headers:** `Authorization: Bearer <token>`

---

## 💰 Subscription APIs (Owner - Property Posting)

### 1. Get Subscription Packages
```bash
GET /api/subscription
```
**Headers:** `Authorization: Bearer <token>`

### 2. Create Subscription Order
```bash
POST /api/subscription-purchase/create-order
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "packageId": "package_id",
  "propertyType": "rent"
}
```

### 3. Verify Subscription Payment
```bash
POST /api/subscription-purchase/verify-payment
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

---

## 📍 Location APIs

### 1. Get All States
```bash
GET /api/location/states
```

### 2. Get Districts by State
```bash
GET /api/location/districts/:stateName
```

### 3. Get Cities by District
```bash
GET /api/location/cities/:districtName
```

---

## 🔑 FCM Token APIs

### Update FCM Token
```bash
POST /users/fcm-token
```
**Headers:** `Authorization: Bearer <token>`  
**Body:**
```json
{
  "userId": "user_id",
  "fcmToken": "fcm_device_token",
  "fcmTokens": ["fcm_device_token"]
}
```

---

## ⚙️ Configuration

### Socket Connection
```javascript
SOCKET_URL: 'https://n5.bhoomitechzone.us'
```

### Razorpay Integration
```javascript
RAZORPAY_KEY_ID: 'rzp_live_RzKd8yxLwZpPae'
```

### API Timeout
```javascript
API_TIMEOUT: 15000 // 15 seconds
```

### Image Upload Limits
```javascript
MAX_IMAGE_SIZE: 5 * 1024 * 1024 // 5MB
ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg']
```

---

## 📁 Related Service Files

| File | Description |
|------|-------------|
| `src/config/api.config.js` | API configuration & endpoints |
| `src/services/api.js` | Main API functions |
| `src/services/authApi.js` | Authentication wrapper |
| `src/services/chatApi.js` | Chat functionality |
| `src/services/notificationapi.js` | Notification handling |
| `src/services/subscriptionApi.js` | Tenant subscription |
| `src/services/userapi.js` | User profile management |
| `src/services/propertyapi.js` | Property operations |

---

## 🔄 Common Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message here",
  "error": "Detailed error"
}
```

---

## 📝 Notes

1. **All authenticated endpoints** require `Authorization: Bearer <token>` header
2. **Token storage** is handled via AsyncStorage with key `authToken`
3. **FCM tokens** are sent during login and can be updated later
4. **Image uploads** use `FormData` format
5. **Socket.IO** is used for real-time chat updates

---

*Generated by Kirayedar24 Development Team*
