# Visual Architecture - Unpaid Property Feature

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROPERTY POSTING FLOW                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: Add Property Screen
┌──────────────────────────┐
│  Fill Property Form      │
│  - Location details      │
│  - Property type         │
│  - Price                 │
│  - Images               │
│  - Contact preferences  │
└──────────────────────────┘
           ↓
Step 2: Submit (NEW!)
┌──────────────────────────┐
│  Click Submit Button     │
│  (No payment required!)  │
└──────────────────────────┘
           ↓
Step 3: Check Subscription (existing flow)
┌──────────────────────────────────────────────┐
│  Is user subscribed?                          │
├──────────────────────────────────────────────┤
│  YES → Continue to Step 4                     │
│  NO  → Show renewal/purchase modal            │
└──────────────────────────────────────────────┘
           ↓
Step 4: Save as Unpaid (NEW!)
┌──────────────────────────────────────────────────────────┐
│  savePropertyAsDraft()                                    │
│  - Construct FormData with all fields                    │
│  - Append paymentStatus: 'unpaid'  ← NEW                │
│  - Append status: 'draft'           ← NEW                │
│  - Submit to backend via addProperty()                   │
│  - Clear form fields                                     │
└──────────────────────────────────────────────────────────┘
           ↓
Step 5: Success! Show Options (NEW!)
┌─────────────────────────────────────┐
│  Alert: "Property Saved! 🎉"        │
├─────────────────────────────────────┤
│  [Go to My Properties]              │
│  [Add Another Property]             │
└─────────────────────────────────────┘
      ↓                       ↓
   Go to                   Stay on
   My Properties           Form
      ↓                       ↓
   Step 6:               Add more
   Payment                properties
   (Below)                 (loop)

═════════════════════════════════════════════════════════════════

Step 6: My Properties Screen (NEW!)
┌──────────────────────────────────┐
│  View All Properties             │
│  ┌────────────────────────────┐  │
│  │ Property Card              │  │
│  │ [Image]         ⚠️ UNPAID  │  │  ← NEW BADGE!
│  │ 3 BHK Apt      red badge   │  │
│  │ 📍 Delhi NCR               │  │
│  │ ₹50,000/month              │  │
│  │ [Edit] [View] [Pay Now] ✓  │  │  ← NEW BUTTON!
│  └────────────────────────────┘  │
└──────────────────────────────────┘
           ↓
       Click "Pay Now"
           ↓
Step 7: Confirm Payment (NEW!)
┌─────────────────────────────────────────────────┐
│  Alert: "Payment Required"                      │
│  "This property has unpaid payment."            │
│  ┌──────────────────────────────────────────┐   │
│  │ [Later]     [Pay Now]                    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
           ↓
    Click "Pay Now"
           ↓
Step 8: Payment Modal Opens (NEW!)
┌──────────────────────────────────────────────┐
│  Navigate to AddSellScreen with:              │
│  - openPayment: true                          │
│  - propertyId: "xxx"                          │
│                                               │
│  AddSellScreen useEffect detects params       │
│  and automatically:                           │
│  - Opens payment modal                        │
│  - Pre-fills form from saved property         │
└──────────────────────────────────────────────┘
           ↓
Step 9: Select Payment Method
┌────────────────────────────────────┐
│  Payment Modal                      │
│  ┌────────────────────────────────┐ │
│  │ Choose Subscription Package    │ │
│  │ ○ Basic - ₹100                │ │
│  │ ○ Pro - ₹300                  │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Select Payment Method:          │ │
│  │ ○ UPI                          │ │
│  │ ○ Credit/Debit Card           │ │
│  │ ○ Net Banking                 │ │
│  │ ○ Pay Later (COD)             │ │
│  └────────────────────────────────┘ │
│  [← Back]          [Pay Now →]      │
└────────────────────────────────────┘
           ↓
Step 10: Process Payment
┌──────────────────────────────────────────────┐
│  handlePropertySubmission()                   │
│  - Process payment via Razorpay               │
│  - Verify subscription with backend           │
│  - Submit property with paid status           │
└──────────────────────────────────────────────┘
           ↓
Step 11: Property Paid! ✅
┌──────────────────────────────────────┐
│  Property Status Updated:             │
│  - paymentStatus: 'paid'              │
│  - status: 'pending' (for approval)   │
│                                       │
│  UNPAID badge → PENDING badge         │
│  (Red) → (Orange)                     │
└──────────────────────────────────────┘
           ↓
Step 12: Submit for Approval
┌────────────────────────────────┐
│  Property now ready to:         │
│  - Submit for admin approval    │
│  - Be viewed by tenants/buyers  │
│  - Be edited as needed          │
└────────────────────────────────┘
```

---

## Database Schema Flow

```
┌─────────────────────────────────────────────────────────┐
│             PROPERTY COLLECTION IN DATABASE             │
└─────────────────────────────────────────────────────────┘

BEFORE Implementation:
┌──────────────────────────────┐
│ Property Document            │
├──────────────────────────────┤
│ _id: "123"                   │
│ title: "3 BHK Apartment"     │
│ price: 50000                 │
│ address: { ... }             │
│ status: "pending" or null    │ ← Only had status
│ // No payment tracking       │
└──────────────────────────────┘

AFTER Implementation:
┌────────────────────────────────────────────┐
│ Property Document                          │
├────────────────────────────────────────────┤
│ _id: "123"                                 │
│ title: "3 BHK Apartment"                   │
│ price: 50000                               │
│ address: { ... }                           │
│ status: "draft" or "pending" or "approved" │ ← NEW states!
│ paymentStatus: "unpaid" or "paid"          │ ← NEW field!
│ createdAt: "2024-01-15"                    │
│ updatedAt: "2024-01-15"                    │
│ paidAt: "2024-01-15" (optional)            │
└────────────────────────────────────────────┘

STATE PROGRESSION:
┌─────────┐     Payment     ┌──────────┐     Approval     ┌──────────┐
│         │    Complete     │          │     Granted      │          │
│  DRAFT  │ ─────────────→  │ PENDING  │ ────────────→   │ APPROVED │
│ UNPAID  │                 │  PAID    │                 │          │
└─────────┘                 └──────────┘                 └──────────┘
    ↑                           ↑
    │                           │
    └───────────────────────────┘
    (Can edit before paying)  (Can view & edit)
```

---

## Component Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     APP NAVIGATION                         │
└────────────────────────────────────────────────────────────┘

AddSellScreen                  MyPropertyScreen
├─ Step 1: Location           ├─ Property List
├─ Step 2: Details            ├─ FlatList
├─ Step 3: Media              │  └─ PropertyCard
│                              │     ├─ Image
│  Payment Flow:              │     ├─ Status Badge
│  ├─ handleSubmit()          │     ├─ UNPAID Badge ← NEW
│  ├─ savePropertyAsDraft() ←─┼─ Pay Now Button ← NEW
│  │  ├─ FormData             │     ├─ Description
│  │  ├─ addProperty()        │     └─ Actions
│  │  └─ Alert               │
│  │     ├─ Go to My Props    │
│  │     └─ Add Another       │
│  │                          │
│  └─ Payment Modal           │
│     ├─ Select Package       │
│     ├─ Select Method        │
│     └─ Process Payment      │
│                              │
└─────────────┬────────────────┘
              │
              ↓
        ┌──────────────┐
        │   Backend    │
        ├──────────────┤
        │ /api/        │
        │ properties   │ ← POST with paymentStatus
        │              │
        │ /api/        │
        │ subscription │ ← Verify payment
        │              │
        │ Database     │
        │ Properties   │
        └──────────────┘
```

---

## State Management

```
AddSellScreen Component State:
┌──────────────────────────────────────────┐
│ Form Fields                              │
├──────────────────────────────────────────┤
│ propertyState, city, district, etc.      │
│ selectedMedia, submitting, etc.          │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ Payment States (UPDATED)                 │
├──────────────────────────────────────────┤
│ showPaymentModal: true/false              │
│ currentDraftId: property ID               │
│ selectedPaymentMethod: string             │
│ processingPayment: true/false             │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ Subscription States (existing)            │
├──────────────────────────────────────────┤
│ userHasPackage: boolean                   │
│ activeSubscription: object                │
│ showRenewalModal: boolean                 │
│ showNoPackageModal: boolean               │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ UseEffect Hooks                          │
├──────────────────────────────────────────┤
│ ✓ Check subscription on mount            │
│ ✓ Load payment modal when opened         │
│ ✓ Handle navigation params (UPDATED)     │
│   - openPayment: true                    │
│   - propertyId: backend property         │
│   - draftId: local draft                 │
└──────────────────────────────────────────┘

MyPropertyScreen Component State:
┌──────────────────────────────────────────┐
│ Display States                           │
├──────────────────────────────────────────┤
│ properties: array (from API)              │
│ loading: boolean                          │
│ refreshing: boolean                       │
└──────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────┐
│ Render Logic (UPDATED)                   │
├──────────────────────────────────────────┤
│ For each property:                        │
│ ✓ Display status badge (existing)        │
│ ✓ Display UNPAID badge (NEW)             │
│ ✓ Show Pay Now button (UPDATED)          │
│ ✓ On Pay Now click → navigate to payment  │
└──────────────────────────────────────────┘
```

---

## API Request/Response Flow

```
SAVE PROPERTY (NEW - with unpaid status)
┌─────────────────────────────────────────┐
│ CLIENT (AddSellScreen)                  │
│ POST /api/properties                    │
│ FormData {                              │
│   state: "Delhi",                       │
│   city: "New Delhi",                    │
│   price: 50000,                         │
│   // ... other fields                   │
│   paymentStatus: "unpaid",   ← NEW      │
│   status: "draft",           ← NEW      │
│   media: [...files]                     │
│ }                                       │
└────────────┬──────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ SERVER (Backend)                        │
│ Save property with status flags         │
│ Return property object                  │
└────────────┬──────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ RESPONSE                                │
│ {                                       │
│   success: true,                        │
│   data: {                               │
│     _id: "507f1f77bcf86cd799439011",   │
│     title: "3 BHK",                     │
│     price: 50000,                       │
│     paymentStatus: "unpaid",  ← NEW    │
│     status: "draft",          ← NEW    │
│     // ...                              │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘


VERIFY PAYMENT (UPDATED for unpaid properties)
┌─────────────────────────────────────────┐
│ CLIENT (AddSellScreen Payment Modal)    │
│ POST /api/subscription/verify           │
│ {                                       │
│   subscriptionPackageId: "pkg123",      │
│   isFreeMode: false,                    │
│   propertyId: "507f1f77bcf86cd799439011" ← NEW (optional)
│ }                                       │
└────────────┬──────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ SERVER (Backend)                        │
│ Verify payment via Razorpay             │
│ Update property: paymentStatus: "paid"  │
│ Return success                          │
└────────────┬──────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ RESPONSE                                │
│ {                                       │
│   success: true,                        │
│   message: "Payment verified",          │
│   data: {                               │
│     propertyId: "507f...",              │
│     paymentStatus: "paid",   ← UPDATED  │
│     status: "pending"        ← UPDATED  │
│   }                                     │
│ }                                       │
└─────────────────────────────────────────┘
```

---

## Color & Visual Reference

```
BADGE COLORS AND POSITIONS

Property Card Image Area:
┌─────────────────────────────────┐
│                    [Status Badge]│  ← Orange/Green (existing)
│     Property Image              │     Top-left corner
│                                 │
│                      [UNPAID] ← │  ← Red NEW BADGE
│                                 │     Top-right corner
│                                 │
└─────────────────────────────────┘

COLOR PALETTE:
Status Badges:
  - Approved:     #10B981 (Green)    ✓
  - Pending:      #FDB022 (Orange)   ⏱
  - Rejected:     #EF4444 (Red)      ✗
  
NEW Unpaid Badge:
  - Unpaid:       #EF4444 (Red)      ⚠️

Action Buttons:
  - Edit:         #FDB022 (Orange)   ✏️
  - View:         #3B82F6 (Blue)     👁️
  - Pay Now:      #10B981 (Green)    💳 ← NEW
  - Delete:       #EF4444 (Red)      🗑️

Icons:
  - Status Icon:  checkmark-circle / time / close-circle
  - Unpaid Icon:  alert-circle (NEW)
  - Pay Now Icon: card-outline (NEW)
```

---

## Performance Considerations

```
OPTIMIZATION POINTS

Form Submission:
┌──────────────────────────────┐
│ Optimizations:               │
├──────────────────────────────┤
│ ✓ AsyncStorage for drafts    │
│ ✓ No redundant API calls     │
│ ✓ Efficient state updates    │
│ ✓ Loading indicators         │
│ ✓ Error handling             │
└──────────────────────────────┘

Property List Rendering:
┌──────────────────────────────┐
│ Optimizations:               │
├──────────────────────────────┤
│ ✓ FlatList with key-extractor│
│ ✓ Memo for card components   │
│ ✓ Image caching              │
│ ✓ Refresh on pull-down       │
│ ✓ Pagination (if backend)    │
└──────────────────────────────┘

Expected Performance:
  - Form submission: < 2 seconds
  - Payment modal open: < 500ms
  - List refresh: < 1 second
  - Badge rendering: < 100ms
```

---

## Summary

This architecture enables a smooth two-stage property posting workflow:
1. **Save Stage**: User saves property without payment (friction-free)
2. **Payment Stage**: User pays anytime from My Properties (flexible)
3. **Approval Stage**: After payment, property can be submitted for admin approval

The implementation maintains backward compatibility while adding the new unpaid property flow. All existing features continue to work while the new payment deferral feature improves user experience.
