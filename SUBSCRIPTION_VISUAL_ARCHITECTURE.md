# Subscription System - Visual Architecture

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Kirayedar24 App                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         SubscriptionProvider (Context)               │  │
│  │  ┌─────────────────────────────────────────────────┐ │  │
│  │  │  State:                                         │ │  │
│  │  │  • userHasPackage: boolean                      │ │  │
│  │  │  • activeSubscription: object                   │ │  │
│  │  │  • loading: boolean                             │ │  │
│  │  │                                                 │ │  │
│  │  │  Methods:                                       │ │  │
│  │  │  • loadActiveSubscription()                     │ │  │
│  │  │  • refreshSubscription()                        │ │  │
│  │  │  • canPostProperty()  ✅ NEW                    │ │  │
│  │  │  • getDaysUntilExpiry()  ✅ NEW                │ │  │
│  │  │  • getFormattedExpiryDate()  ✅ NEW            │ │  │
│  │  └─────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│           ▲                           ▲                     │
│           │                           │                     │
│  ┌────────┴────────┐         ┌────────┴────────┐           │
│  │                 │         │                 │           │
│  ▼                 ▼         ▼                 ▼           │
│ HomeScreenOwner  AddSellScreen  OtherScreens             │
│  ✅ Protected      ✅ Protected      (can check)          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         │ API Call: GET /subscription/active
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Server                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Subscription API Endpoints:                        │   │
│  │  • GET /api/subscription/active                     │   │
│  │  • POST /api/subscription/create                    │   │
│  │  • POST /api/subscription/renew                     │   │
│  │  • GET /api/subscription/history                    │   │
│  │                                                     │   │
│  │  Database:                                          │   │
│  │  • Subscription Collection                          │   │
│  │  • Properties Collection                            │   │
│  │  • Users Collection                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 User Journey - Property Posting Flow

```
START
  │
  ├─── User is Owner ──────────────────────┐
  │                                        │
  ├─ HomeScreenOwner Loads ◄──────────────┤
  │        │                               │
  │        ├─► loadActiveSubscription()    │
  │        │        │                      │
  │        │        └─► API Call           │
  │        │             │                 │
  │        │             ├─► Has Package?  │
  │        │             │    ├─ YES ✅   │
  │        │             │    │  userHasPackage = true
  │        │             │    │
  │        │             │    └─ NO ❌
  │        │             │       userHasPackage = false
  │        │             │
  │        │        ◄────┘
  │        │
  │        └─► Render Screen
  │             │
  │             ├─ No Package? → Show RED Banner
  │             │     [⚠️ No Active Package]
  │             │     [Buy Package Button]
  │             │
  │             ├─ Expiring Soon? → Show YELLOW Banner
  │             │     [⏰ 3 days left]
  │             │     [Renew Button]
  │             │
  │             └─ Active Package? → No Banner ✅
  │
  └─► User Clicks "Add Property" Button
       │
       ├─► handleQuickAction('AddSell') Called
       │    │
       │    └─► Check: userHasPackage?
       │         │
       │         ├─ false ❌
       │         │  Alert: "📦 Active Package Required"
       │         │  └─► Show "Buy Package" Button
       │         │       └─► setShowSubscriptionModal(true)
       │         │           └─► SubscriptionModal Opens
       │         │
       │         └─ true ✅
       │            navigate('AddSellScreen')
       │                │
       │                ▼
       │            AddSellScreen Loads
       │            │
       │            ├─ useEffect: loadActiveSubscription()
       │            │  (Double-check subscription)
       │            │
       │            └─ Owner Fills Form
       │                │
       │                ▼
       │            Click "Post Property"
       │                │
       │                ▼
       │            handleSubmit()
       │                │
       │                ├─► isSubscriptionActive() Check
       │                │    (FIRST check before validation)
       │                │    │
       │                │    ├─ false ❌
       │                │    │  Alert: "⚠️ Subscription Expired"
       │                │    │  └─► Stop Execution (return)
       │                │    │
       │                │    └─ true ✅
       │                │       Continue with validation...
       │                │
       │                ├─► Validate all form fields
       │                │
       │                ├─► API Call: POST /property/add
       │                │
       │                └─► Success ✅
       │                    Property Posted!
       │                    Navigation.goBack()
       │                    │
       │                    ▼
       │                HomeScreenOwner
       │                (Property appears in list)
       │
       └─► END

```

---

## 📋 Subscription Status Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                   SUBSCRIPTION STATUS MATRIX                     │
├─────────────────┬─────────────────┬───────────┬─────────────────┤
│ Scenario        │ userHasPackage  │ Expired?  │ Can Post?       │
├─────────────────┼─────────────────┼───────────┼─────────────────┤
│ Active Package  │ true            │ NO  ✅    │ YES  ✅         │
│ (7+ days)       │                 │           │ No Banner       │
├─────────────────┼─────────────────┼───────────┼─────────────────┤
│ Expiring Soon   │ true            │ NO  ✅    │ YES  ✅         │
│ (<7 days)       │                 │           │ YELLOW Warning  │
├─────────────────┼─────────────────┼───────────┼─────────────────┤
│ Expired         │ true*           │ YES  ❌   │ NO   ❌         │
│ (past date)     │ *record exists   │           │ RED Banner      │
├─────────────────┼─────────────────┼───────────┼─────────────────┤
│ No Package      │ false           │ N/A       │ NO   ❌         │
│ (never bought)  │                 │           │ RED Banner      │
├─────────────────┼─────────────────┼───────────┼─────────────────┤
│ Inactive Status │ true*           │ NO        │ NO   ❌         │
│ (status!=active)│ *record exists   │           │ RED Banner      │
└─────────────────┴─────────────────┴───────────┴─────────────────┘
```

---

## 🎨 UI Component Locations

```
HomeScreenOwner Layout:
┌─────────────────────────────────┐
│     Header with Logo            │
│ (Notification, Menu buttons)    │
├─────────────────────────────────┤
│ ┌───────────────────────────────┐
│ │   RED BANNER (if no package)  │ ◄─── NEW
│ │ [⚠️ No Active Package]         │ ◄─── NEW
│ │ [Buy Now]                     │ ◄─── NEW
│ └───────────────────────────────┘
│ ┌───────────────────────────────┐
│ │  YELLOW BANNER (if <7 days)   │ ◄─── NEW
│ │ [⏰ Package Expires Soon]      │ ◄─── NEW
│ │ [Renew]                       │ ◄─── NEW
│ └───────────────────────────────┘
├─────────────────────────────────┤
│ Get Started With Section        │
│ [My Property][Pay Bill]...      │
│ ◄─ "Add Property" checks here
├─────────────────────────────────┤
│ Featured Properties             │
│ [Card] [Card] [Card]            │
├─────────────────────────────────┤
│ Residential Properties          │
│ [Card] [Card] [Card]            │
├─────────────────────────────────┤
│ Commercial Properties           │
│ [Card] [Card] [Card]            │
├─────────────────────────────────┤
│ Owner's Properties              │
│ [Card] [Card] [Card]            │
└─────────────────────────────────┘
```

---

## 🔐 Double-Layer Protection

```
Layer 1: HomeScreenOwner (Entry Protection)
┌────────────────────────────────────┐
│ User Clicks "Add Property"         │
├────────────────────────────────────┤
│ Check: userHasPackage?             │
│   YES ✅ → Navigate to AddSell     │
│   NO  ❌ → Show Alert              │
└────────────────────────────────────┘
        │
        └─► Prevents unwanted navigation

Layer 2: AddSellScreen (Submission Protection)
┌────────────────────────────────────┐
│ User Clicks "Post Property"        │
├────────────────────────────────────┤
│ Check: isSubscriptionActive()?     │
│   YES ✅ → Continue Submit         │
│   NO  ❌ → Show Alert, Block       │
└────────────────────────────────────┘
        │
        └─► Prevents posting with expired/no package

Combined: User cannot post properties without active subscription ✅
```

---

## 📊 Data Flow Diagram

```
SubscriptionContext State:
┌─────────────────────────────────┐
│ userHasPackage: boolean         │
│ activeSubscription: {           │
│   _id, packageName,             │
│   expiryDate, status,           │
│   daysRemaining, ...            │
│ }                               │
│ loading: boolean                │
└─────────────────────────────────┘
         │
    ┌────┴────┬────────────────┐
    │         │                │
    ▼         ▼                ▼
HomeScreen  AddSell        OtherScreen
  │           │               │
  ├─ Show     ├─ Double       ├─ Can check
  │  Banner   │  Check        │  if needed
  │           │               │
  ├─ Block    ├─ Block        └─
  │  Nav      │  Submit       
  │           │               
  └─ Check    └─
     on Nav      on Submit
```

---

## ⏱️ Timeline Example

```
Day 1-24:  Package Active (24 days remaining)
           • No banner
           • Can post freely
           • userHasPackage = true

Day 25:    Package Expiring Soon (<7 days remaining)
           • YELLOW banner appears: "3 days left"
           • Can still post
           • Get reminder to renew
           • userHasPackage = true
           • daysUntilExpiry < 7

Day 28:    Package Expired (0 days remaining)
           • RED banner appears: "No Active Package"
           • CANNOT post properties
           • "Renew" button available
           • userHasPackage = false
           • expiryDate < today

Day 29:    After Renewal
           • RED banner disappears
           • Can post again
           • userHasPackage = true
           • New expiryDate set
```

---

## 🎯 Alert Flow

```
Alert: No Package
┌──────────────────────────────────┐
│ 📦 Active Package Required        │
├──────────────────────────────────┤
│ You need an active subscription  │
│ package to post a property.      │
│ Please purchase a package first. │
├──────────────────────────────────┤
│ [Cancel]  [Buy Package]          │
└──────────────────────────────────┘
           │
           └─► Opens SubscriptionModal

Alert: Expired
┌──────────────────────────────────┐
│ ⚠️  Subscription Expired/Inactive │
├──────────────────────────────────┤
│ Your subscription expired on     │
│ Jan 28, 2026.                   │
│ Please renew to continue.        │
├──────────────────────────────────┤
│ [Cancel]  [Buy/Renew Package]    │
└──────────────────────────────────┘
           │
           └─► Navigates back or opens modal

Banner: Expiring Soon
┌──────────────────────────────────────┐
│ ⏰ Package Expires Soon               │
│ 3 days remaining • Renew on Jan 29   │
│                              [Renew] │
└──────────────────────────────────────┘
           │
           └─► Opens SubscriptionModal
```

---

## 🔄 Refresh Cycle

```
App Start
  │
  ▼
App.js: SubscriptionProvider wraps app
  │
  ▼
HomeScreenOwner mounts
  │
  ├─► loadActiveSubscription()
  │   │
  │   └─► API: GET /subscription/active
  │       │
  │       ├─► Parse response
  │       ├─► Check if expired
  │       ├─► Set userHasPackage
  │       └─► Set activeSubscription
  │
  ▼
Screen renders with banner(s)
  │
  ├─► Manual refresh (pull-to-refresh)
  │   └─► refreshSubscription()
  │
  ├─► Navigation away and back
  │   └─► Can call refreshSubscription()
  │
  └─► AddSellScreen mounts
      └─► loadActiveSubscription() again
          (double-check)
```

---

## 🚨 Error Handling

```
Try to get subscription:
  │
  ├─ API fails?
  │  └─► Set userHasPackage = false
  │      (Assume no package for safety)
  │
  ├─ Response malformed?
  │  └─► Set userHasPackage = false
  │      (Assume no package for safety)
  │
  ├─ Network error?
  │  └─► Set userHasPackage = false
  │      Console log error
  │      Show message to user
  │
  └─ Success?
     └─► Check expiry
         ├─ Expired → userHasPackage = false
         └─ Active → userHasPackage = true
```

---

**Visual Guide Created: January 30, 2026**
