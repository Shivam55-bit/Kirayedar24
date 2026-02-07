# Subscription System - Backend Integration Guide

## 🔄 Backend Requirements

The frontend now enforces subscription checks, but **backend MUST also validate** to prevent bypass attempts.

---

## 📋 API Endpoints

### 1. GET /api/subscription/active
**Used By:** Frontend to get current subscription status

**Request:**
```javascript
GET /api/subscription/active
Headers: {
    Authorization: "Bearer <user_token>"
}
```

**Expected Response (Success):**
```json
{
    "success": true,
    "data": {
        "_id": "sub_12345",
        "userId": "user_67890",
        "packageId": "pkg_abc",
        "packageName": "Premium Package",
        "status": "active",
        "expiryDate": "2026-01-29T00:00:00.000Z",
        "startDate": "2025-12-30T00:00:00.000Z",
        "planType": "monthly",
        "amount": 999,
        "currency": "INR",
        "propertySlotsRemaining": 5,
        "createdAt": "2025-12-30T00:00:00.000Z",
        "updatedAt": "2025-12-30T00:00:00.000Z"
    }
}
```

**Expected Response (No Subscription):**
```json
{
    "success": false,
    "message": "No active subscription found",
    "data": null
}
```

**Expected Response (Expired):**
```json
{
    "success": true,
    "data": {
        "_id": "sub_12345",
        "status": "expired",
        "expiryDate": "2026-01-20T00:00:00.000Z",
        // ... other fields
    }
}
```

---

## 🔐 POST /api/property/add - Validation Required

### Current Behavior
Backend accepts property creation without subscription check.

### Required Change
Add subscription validation BEFORE creating property.

**Updated Logic:**
```pseudocode
POST /api/property/add {
    1. Verify user is authenticated ✅ (already done)
    
    2. NEW: Get user's active subscription
       - Query Subscription collection
       - Filter by userId & status='active'
       - Check expiryDate > today
    
    3. NEW: Validate subscription exists
       if (!subscription) {
           return { success: false, message: 'No active subscription' }
       }
    
    4. NEW: Validate subscription not expired
       if (expiryDate < today) {
           return { success: false, message: 'Subscription expired' }
       }
    
    5. NEW: Check property slots (if applicable)
       if (subscription.propertySlotsRemaining <= 0) {
           return { success: false, message: 'Property slots exhausted' }
       }
    
    6. Validate property data ✅ (already done)
    
    7. Create property ✅ (already done)
    
    8. NEW: Decrement propertySlotsRemaining (if applicable)
       subscription.propertySlotsRemaining -= 1
       subscription.save()
    
    9. Return success response
}
```

---

## 💾 Database Schema Updates

### Subscription Model
```javascript
{
    _id: ObjectId,
    userId: ObjectId,        // Reference to User
    packageId: ObjectId,     // Reference to Package
    packageName: String,
    status: String,          // 'active', 'expired', 'cancelled', 'paused'
    startDate: Date,
    expiryDate: Date,        // CRITICAL: Use this to check expiry
    planType: String,        // 'monthly', 'yearly', 'custom'
    amount: Number,
    currency: String,        // 'INR', 'USD', etc
    paymentId: String,       // Reference to payment
    transactionId: String,
    autoRenew: Boolean,      // For future auto-renewal
    propertySlotsRemaining: Number,  // If you want to limit posts
    features: Array,         // Array of feature codes
    
    // Timestamps
    createdAt: Date,
    updatedAt: Date,
    
    // Metadata
    renewalAttempts: Number,
    lastRenewalDate: Date,
    notes: String
}
```

### Property Model Update
```javascript
{
    // ... existing fields
    
    // Add these for tracking
    postedBy: ObjectId,           // Reference to User
    subscriptionValidated: Boolean, // Was subscription valid at post time?
    subscriptionId: ObjectId,     // Which subscription was active when posted
    postedDate: Date,
    
    // ... rest of fields
}
```

---

## 🔍 Validation Rules

### Rule 1: Subscription Exists
```javascript
if (!subscription) {
    return error: 'SUBSCRIPTION_NOT_FOUND'
}
```

### Rule 2: Subscription Not Expired
```javascript
const expiryDate = subscription.expiryDate;
if (new Date(expiryDate) < new Date()) {
    return error: 'SUBSCRIPTION_EXPIRED'
}
```

### Rule 3: Subscription Status Active
```javascript
if (subscription.status !== 'active') {
    return error: 'SUBSCRIPTION_INACTIVE'
}
```

### Rule 4: Property Slots Available (Optional)
```javascript
if (subscription.propertySlotsRemaining <= 0) {
    return error: 'PROPERTY_SLOTS_EXHAUSTED'
}
```

---

## 📝 API Response Standards

### Success Response
```json
{
    "success": true,
    "message": "Property created successfully",
    "data": {
        "propertyId": "prop_12345",
        "status": "published",
        "createdAt": "2026-01-30T10:00:00.000Z"
    }
}
```

### Error: No Subscription
```json
{
    "success": false,
    "error": "SUBSCRIPTION_NOT_FOUND",
    "message": "No active subscription found. Please purchase a package to post properties.",
    "data": null
}
```

### Error: Subscription Expired
```json
{
    "success": false,
    "error": "SUBSCRIPTION_EXPIRED",
    "message": "Your subscription expired on 2026-01-25. Please renew your package.",
    "data": {
        "expiryDate": "2026-01-25T00:00:00.000Z",
        "expiryDateFormatted": "Jan 25, 2026"
    }
}
```

### Error: Property Slots Exhausted
```json
{
    "success": false,
    "error": "PROPERTY_SLOTS_EXHAUSTED",
    "message": "You have used all property slots for your current plan. Upgrade to post more properties.",
    "data": {
        "slotsUsed": 10,
        "slotsTotal": 10
    }
}
```

---

## 🔄 Implementation Steps

### Step 1: Update Subscription Schema
```javascript
// Add these fields to Subscription model
subscriptionSchema.add({
    propertySlotsRemaining: { type: Number, default: 10 },
    subscriptionValidated: { type: Boolean, default: true },
    renewalAttempts: { type: Number, default: 0 },
});

// Add index for faster queries
subscriptionSchema.index({ userId: 1, status: 1, expiryDate: 1 });
```

### Step 2: Create Helper Function
```javascript
// subscriptionController.js
const isSubscriptionValid = async (userId) => {
    try {
        const subscription = await Subscription.findOne({
            userId,
            status: 'active',
            expiryDate: { $gt: new Date() }
        });
        
        return {
            isValid: !!subscription,
            subscription: subscription,
            error: null
        };
    } catch (error) {
        return {
            isValid: false,
            subscription: null,
            error: error.message
        };
    }
};
```

### Step 3: Update POST /property/add
```javascript
// propertyController.js
const addProperty = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // ✅ STEP 1: Check subscription (NEW)
        const { isValid, subscription, error } = 
            await isSubscriptionValid(userId);
        
        if (!isValid) {
            return res.status(403).json({
                success: false,
                error: 'SUBSCRIPTION_REQUIRED',
                message: 'You need an active subscription to post properties.'
            });
        }
        
        // ✅ STEP 2: Check property slots (NEW - if applicable)
        if (subscription.propertySlotsRemaining <= 0) {
            return res.status(403).json({
                success: false,
                error: 'SLOTS_EXHAUSTED',
                message: 'You have used all property slots for your plan.'
            });
        }
        
        // ✅ STEP 3: Validate property data (EXISTING)
        const { title, location, price, ... } = req.body;
        // ... validation code ...
        
        // ✅ STEP 4: Create property (EXISTING)
        const property = new Property({
            ...req.body,
            postedBy: userId,
            subscriptionValidated: true,
            subscriptionId: subscription._id
        });
        
        await property.save();
        
        // ✅ STEP 5: Decrement slots (NEW - if applicable)
        subscription.propertySlotsRemaining -= 1;
        await subscription.save();
        
        // ✅ STEP 6: Return success
        return res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: {
                propertyId: property._id,
                slotsRemaining: subscription.propertySlotsRemaining
            }
        });
        
    } catch (error) {
        console.error('Error adding property:', error);
        return res.status(500).json({
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Failed to create property'
        });
    }
};
```

---

## 🧪 Testing Endpoints

### Test 1: Get Active Subscription
```bash
curl -X GET http://localhost:3000/api/subscription/active \
  -H "Authorization: Bearer <token>"
```

### Test 2: Try Posting Without Subscription
```bash
# Should fail with SUBSCRIPTION_NOT_FOUND
curl -X POST http://localhost:3000/api/property/add \
  -H "Authorization: Bearer <no-subscription-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Property", ...}'
```

### Test 3: Post With Valid Subscription
```bash
# Should succeed and decrement slots
curl -X POST http://localhost:3000/api/property/add \
  -H "Authorization: Bearer <active-subscription-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Property", ...}'
```

### Test 4: Try Posting When Expired
```bash
# Should fail with SUBSCRIPTION_EXPIRED
curl -X POST http://localhost:3000/api/property/add \
  -H "Authorization: Bearer <expired-subscription-token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Property", ...}'
```

---

## 📊 Migration Checklist

- [ ] Add subscription validation helper function
- [ ] Update POST /property/add endpoint
- [ ] Update Subscription model schema
- [ ] Add database indices
- [ ] Update error responses
- [ ] Add logging for subscription checks
- [ ] Test with test users
- [ ] Deploy to staging
- [ ] Test against frontend
- [ ] Monitor for errors
- [ ] Deploy to production

---

## 🚨 Security Notes

1. **Always validate on backend**
   - Frontend validation is for UX only
   - Never trust client-side checks
   - Always re-verify on server

2. **Check expiry date carefully**
   ```javascript
   // WRONG ❌
   if (expiryDate > today) { ... } // Allows expired
   
   // CORRECT ✅
   if (expiryDate < today) { ... } // Blocks expired
   ```

3. **Use timezone-aware dates**
   ```javascript
   // Use ISO format in database
   expiryDate: "2026-01-29T00:00:00.000Z"
   
   // Compare with current time
   new Date() < new Date(expiryDate)
   ```

4. **Log all subscription checks**
   ```javascript
   console.log(`User ${userId} subscription check:`, {
       hasSubscription: isValid,
       expiryDate: subscription?.expiryDate,
       daysRemaining: calculateDaysRemaining(...)
   });
   ```

---

## 📈 Monitoring & Alerts

### Metrics to Track
- Properties posted per subscription
- Subscription expiry rate
- Renewal success rate
- Failed property submissions

### Alerts to Set
- Subscription expiry detected
- Property slots exhausted
- Renewal failure
- Subscription validation errors

---

## 🔄 Future Enhancements

1. **Auto-Renewal**
   - Set `autoRenew: true`
   - Attempt renewal before expiry
   - Send alerts if renewal fails

2. **Property Slot Tiers**
   - Basic: 5 properties
   - Premium: 20 properties
   - Enterprise: Unlimited

3. **Grace Period**
   - Allow 24-48 hours after expiry
   - Show strong warning
   - Block after grace period

4. **Analytics**
   - Track posted properties
   - Show usage in dashboard
   - Recommend upgrades

---

## 📞 Support

**Questions?** Refer to:
- Frontend guide: `SUBSCRIPTION_PROPERTY_POSTING_GUIDE.md`
- Implementation: `SUBSCRIPTION_IMPLEMENTATION_SUMMARY.md`
- Quick ref: `SUBSCRIPTION_QUICK_REFERENCE.md`

---

**Backend Integration Guide Created: January 30, 2026**
