# Subscription-Based Property Posting System

## Overview
Owners must have an **active subscription package** to post/create properties on Kirayedar24. If their subscription expires, they cannot post new properties.

## Implementation Details

### 1. **HomeScreenOwner.js** - "Add Property" Button Check
When an owner clicks the "Add Property" button:

```javascript
// Checks if userHasPackage is true
if (!userHasPackage) {
  Alert.alert(
    '📦 Active Package Required',
    'You need an active subscription package to post a property. Please purchase a package first.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Buy Package', onPress: () => setShowSubscriptionModal(true) }
    ]
  );
  return;
}
// If package exists, navigates to AddSell screen
```

**Behavior:**
- ✅ If owner has active package → Proceed to AddSellScreen
- ❌ If owner doesn't have package → Show alert & prompt to buy package

---

### 2. **AddSellScreen.js** - Subscription Validation
Double-layer validation before property submission:

#### Layer 1: Component Mount
```javascript
// Auto-check subscription status when component loads
useEffect(() => {
  const checkSubscriptionStatus = async () => {
    await loadActiveSubscription(); // Refresh latest status
  };
  checkSubscriptionStatus();
}, [loadActiveSubscription]);
```

#### Layer 2: On Submit
```javascript
const handleSubmit = async () => {
  // ✅ FIRST CHECK: Verify subscription is active
  if (!isSubscriptionActive()) {
    Alert.alert(
      '⚠️ Subscription Expired or Inactive',
      userHasPackage && activeSubscription
        ? `Your subscription expired on ${expiryDate}. Please renew your package.`
        : 'You need an active subscription package to post a property.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Buy/Renew Package', onPress: () => navigation.goBack() }
      ]
    );
    return; // Stop submission
  }
  
  // Continue with property validation and submission...
};
```

**Behavior:**
- Checks `isSubscriptionActive()` which verifies:
  - `userHasPackage` is `true`
  - `activeSubscription` exists
  - Expiry date hasn't passed
- If any check fails → Block submission & show message

---

### 3. **SubscriptionContext.js** - Helper Functions

Available utilities in the context:

| Function | Purpose | Returns |
|----------|---------|---------|
| `loadActiveSubscription()` | Fetch & validate subscription from API | void |
| `refreshSubscription()` | Reload subscription status | void |
| `canPostProperty()` | Check if user can post properties | boolean |
| `getDaysUntilExpiry()` | Days remaining until expiry | number |
| `getFormattedExpiryDate()` | Formatted expiry date string | string |
| `isSubscriptionValid(sub)` | Validate subscription object | boolean |

---

## Subscription Expiry Scenarios

### Scenario 1: Package Active ✅
```
Status: userHasPackage = true
Action: Owner can post properties normally
Alert: None
```

### Scenario 2: Package Expired ❌
```
Status: userHasPackage = true (record exists)
        expiryDate < today
Action: Cannot post properties
Alert: "Your subscription expired on {date}. Please renew your package."
Button: "Buy/Renew Package"
```

### Scenario 3: No Package ❌
```
Status: userHasPackage = false
Action: Cannot access property posting
Alert: "You need an active subscription package to post a property."
Button: "Buy Package"
```

### Scenario 4: Package Inactive ❌
```
Status: subscriptionStatus != 'active'
Action: Cannot post properties
Alert: "Your subscription is currently inactive."
Button: "Buy/Renew Package"
```

---

## User Flow Diagram

```
┌─────────────────────────┐
│  Click "Add Property"   │
└──────────┬──────────────┘
           │
    ┌──────▼──────┐
    │Has Package? │
    └──────┬──────┘
           │
    ┌──────┴──────────────┐
    │                     │
   NO                    YES
    │                     │
    │              ┌──────▼──────────┐
    │              │ Is Expired?     │
    │              └──────┬──────────┘
    │                     │
    │             ┌───────┴────────┐
    │             │                │
    │            YES              NO
    │             │                │
    │      "Renew Package"   ┌─────▼──────┐
    │      ← Alert            │ AddSell    │
    │                         │ Screen ✅  │
    │                         └────────────┘
    │
    └──────────►"Buy Package"
               ← Alert
```

---

## Testing Checklist

- [ ] **Owner without package** tries to add property
  - Expected: Alert appears, "Buy Package" button shown
  
- [ ] **Owner with expired package** tries to add property
  - Expected: Alert appears with expiry date, "Renew Package" button shown
  
- [ ] **Owner with active package** adds property
  - Expected: AddSellScreen opens, property posting works
  
- [ ] **Subscription expires** while owner in AddSellScreen
  - Expected: On submit, expiry alert appears
  
- [ ] **Subscription renewed** mid-session
  - Expected: After renewal, property posting works again

---

## API Integration Points

### Get Active Subscription
```javascript
// Called by: loadActiveSubscription()
// Endpoint: GET /api/subscription/active
// Returns: {
//   success: boolean,
//   data: {
//     _id, packageName, expiryDate, status,
//     ...other fields
//   }
// }
```

### Add Property (Now with subscription check)
```javascript
// Endpoint: POST /api/property/add
// Requirement: User must have userHasPackage = true
// Backend should also validate subscription before creating
```

---

## Key Variables in Context

```javascript
// From SubscriptionContext
userHasPackage              // boolean: Has active package?
activeSubscription          // object: Current package details
activeSubscription.expiryDate // Date: When package expires
activeSubscription.status   // string: 'active' or other
loading                     // boolean: API loading state
```

---

## Common Integration Examples

### Example 1: Check subscription before navigation
```javascript
const handleAddProperty = () => {
  if (!userHasPackage) {
    Alert.alert('Package Required', '...');
    return;
  }
  navigation.navigate('AddSell');
};
```

### Example 2: Show expiry warning to owner
```javascript
const daysLeft = getDaysUntilExpiry();
if (daysLeft < 7 && daysLeft > 0) {
  Alert.alert(
    '⏰ Your subscription expires soon',
    `${daysLeft} days remaining. Renew now to avoid losing access.`
  );
}
```

### Example 3: Handle expired subscription
```javascript
const canPost = canPostProperty();
if (!canPost) {
  navigation.navigate('SubscriptionScreen'); // Navigate to subscription purchase
}
```

---

## Notes

- ✅ Subscription check happens **before** property form validation
- ✅ Expired packages block property posting **immediately**
- ✅ Context auto-loads subscription on app start
- ✅ AddSellScreen auto-validates subscription on mount
- ✅ Double-validation (HomeScreen + AddScreen) prevents edge cases

---

## Future Enhancements

- [ ] Add subscription renewal reminder notification
- [ ] Show days remaining on home screen
- [ ] Auto-refresh subscription on app resume
- [ ] Add property slots remaining (if plan limits posts)
- [ ] Show upgrade options based on current plan
- [ ] Add subscription history/receipts page
