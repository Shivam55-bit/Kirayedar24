# Subscription System - Quick Reference

## 🎯 Owner Property Posting Requirements
**Owner must have active subscription to post properties**

---

## ⚡ Quick Setup (For Developers)

### Import Subscription Context
```javascript
import { useSubscription } from '../context/SubscriptionContext';
```

### Use in Your Component
```javascript
const { 
    userHasPackage,           // boolean
    activeSubscription,       // object
    canPostProperty,          // function
    getDaysUntilExpiry,       // function
    loadActiveSubscription,   // function
} = useSubscription();
```

---

## 🔍 Check Subscription Status

### Is User Allowed to Post?
```javascript
if (!canPostProperty()) {
    Alert.alert('Cannot post', 'No active package');
    return;
}
```

### How Many Days Left?
```javascript
const daysLeft = getDaysUntilExpiry();
if (daysLeft < 7) {
    console.warn(`Only ${daysLeft} days left!`);
}
```

### Get Expiry Date
```javascript
const expiryDate = getFormattedExpiryDate(); // "Jan 29, 2026"
```

---

## 📍 Where Checks Happen

### HomeScreenOwner.js
- ✅ Checks subscription when "Add Property" button clicked
- ✅ Shows red banner if no package
- ✅ Shows yellow banner if <7 days remaining

### AddSellScreen.js
- ✅ Double-checks subscription when form submitted
- ✅ Blocks submission if expired/invalid
- ✅ Shows alert with expiry date

---

## 🎨 Visual Indicators

### Red Banner (No Package)
```
[⚠️ No Active Package]
Purchase a package to post properties
                                    [Buy Now]
```

### Yellow Banner (Expiring Soon)
```
[⏰ Package Expires Soon]
3 days remaining • Renew on Jan 29, 2026
                                    [Renew]
```

---

## 🚨 Error Scenarios

| Scenario | Banner | Navigation | Submit |
|----------|--------|------------|--------|
| No Package | RED ❌ | Blocked | Blocked |
| Expired | RED ❌ | Blocked | Blocked |
| <7 Days | YELLOW ⚠️ | Allowed | Allowed |
| Active | NONE ✅ | Allowed | Allowed |

---

## 💻 API Integration

### Backend Requirements
Backend should also validate subscription before accepting property creation:

```javascript
// Backend: POST /api/property/add
// Must check: 
// 1. User has active subscription
// 2. Subscription not expired
// 3. Subscription status = 'active'
```

### Expected Response Format
```javascript
{
    success: boolean,
    data: {
        _id: string,
        packageName: string,
        status: 'active' | 'inactive' | 'expired',
        expiryDate: string (ISO date),
        daysRemaining: number,
        // ... other fields
    }
}
```

---

## 🔄 Refresh Subscription

### Auto-Refresh on Mount
```javascript
useEffect(() => {
    loadActiveSubscription(); // Called automatically
}, []);
```

### Manual Refresh
```javascript
await refreshSubscription();
```

### On App Resume
```javascript
useFocusEffect(
    useCallback(() => {
        refreshSubscription(); // Check latest status
    }, [refreshSubscription])
);
```

---

## ✅ Implementation Status

- [x] HomeScreenOwner protection
- [x] AddSellScreen validation
- [x] Visual banners
- [x] Helper functions
- [x] Auto-refresh
- [x] Error handling
- [x] User messages

---

## 📞 Common Issues

### Issue: Banner not showing
**Solution:** Check that `loadActiveSubscription()` was called
```javascript
useEffect(() => {
    loadActiveSubscription(); // Must call this
}, [loadActiveSubscription]);
```

### Issue: Can still submit expired property
**Solution:** Ensure `isSubscriptionActive()` is called first in handleSubmit
```javascript
const handleSubmit = async () => {
    if (!isSubscriptionActive()) return; // Check FIRST
    // ... rest of validation
};
```

### Issue: Days remaining shows wrong number
**Solution:** Ensure subscription date is in proper format (ISO string or Date object)
```javascript
// Good
expiryDate: "2026-01-29T00:00:00.000Z"
expiryDate: new Date('2026-01-29')

// Bad
expiryDate: "29/01/2026" // Wrong format
```

---

## 🎓 File Locations

| File | What It Does |
|------|-------------|
| `HomeScreenOwner.js` | Shows banners, checks on navigation |
| `AddSellScreen.js` | Validates on form submit |
| `SubscriptionContext.js` | Provides helpers & state |
| `SubscriptionProvider` | Wraps app in App.js |

---

## 🔐 Security Notes

- ✅ Frontend check: Prevents accidental navigation
- ⚠️ Backend check: **MUST** also validate on server
- ✅ Expired dates checked on component mount
- ✅ Double validation (HomeScreen + AddScreen)

**Never rely only on frontend checks!**

---

## 📊 State Flow

```
App Starts
    ↓
SubscriptionProvider loads
    ↓
loadActiveSubscription() called
    ↓
Check: expiryDate < today?
    ↓
├─ YES: userHasPackage = false (expired)
└─ NO:  userHasPackage = true (active)
    ↓
HomeScreenOwner renders banners based on status
    ↓
Owner clicks "Add Property"
    ↓
Check userHasPackage in handleQuickAction()
    ↓
├─ false: Show alert, open subscription modal
└─ true:  Navigate to AddSellScreen
    ↓
Owner fills form & clicks "Post"
    ↓
isSubscriptionActive() called in handleSubmit()
    ↓
├─ false: Show alert, return without posting
└─ true:  Submit property to backend
```

---

## 🚀 Next Steps

1. **Backend Integration:** Ensure backend validates subscription
2. **Testing:** Test all 4 scenarios (no package, expired, active, expiring)
3. **Monitoring:** Track subscription status in analytics
4. **Notifications:** Add push notification for expiry reminders
5. **UI Polish:** Customize banner colors per design system

---

## 💡 Pro Tips

- Use `getDaysUntilExpiry()` to show countdown
- Refresh subscription when app comes to foreground
- Show different messages based on `daysLeft`
- Allow free trial period before blocking
- Send notification 7 days before expiry
- Auto-renew option for convenience

---

**Last Updated:** January 30, 2026  
**Status:** ✅ Fully Implemented
