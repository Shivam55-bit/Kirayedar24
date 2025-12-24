# 🔧 Backend API Updates Required - Add Property Endpoint

**Date:** December 23, 2025  
**Endpoint:** `POST /property/add`  
**Priority:** HIGH - Required before frontend integration  

---

## 📋 Summary

The React Native app's **AddSellScreen** has been updated with new fields and modified values based on client requirements. The backend API needs corresponding updates to accept and store these new fields.

---

## 🆕 NEW FIELDS TO ADD IN BACKEND SCHEMA

### 1. **`post`** - Post Office Area
```javascript
post: {
    type: String,
    required: false,  // Optional field
    trim: true
}
```
- **Purpose:** Stores the post office area selected by user (State → City → Post → Auto-fill Pincode flow)
- **Example:** `"Sector 62 Post Office"`, `"Connaught Place Post"`
- **Usage:** Better address tracking and pincode validation

---

### 2. **`spaceAvailable`** - Commercial Space in Sq Ft
```javascript
spaceAvailable: {
    type: Number,
    required: function() {
        return this.propertyType === "Commercial";
    }
}
```
- **Purpose:** Total available space for commercial properties
- **Example:** `5000` (5000 sq ft)
- **Condition:** Required ONLY for Commercial properties
- **Validation:** Must be positive number

---

### 3. **`societyMaintenance`** - Society Maintenance Option
```javascript
societyMaintenance: {
    type: String,
    enum: ["Including in Rent", "Excluding"],
    required: false,  // Optional for Residential
    default: "Excluding"
}
```
- **Purpose:** Indicates if society maintenance is included in rent or not
- **Example:** `"Including in Rent"` or `"Excluding"`
- **Condition:** Only applicable for Residential properties
- **Usage:** Important for rental properties in societies/apartments

---

### 4. **`societyFeatures`** - Society Amenities/Features
```javascript
societyFeatures: {
    type: [String],  // Array of strings
    required: false,
    default: []
}
```
- **Purpose:** Multi-select array of society features/amenities
- **Example:** `["Divided Colours", "Lift", "Guarded Gated Campus"]`
- **Possible Values:** Any string values (no enum restriction needed)
- **Condition:** Only applicable for Residential properties
- **Storage:** Store as array or comma-separated string

---

## ⚠️ ENUM VALUE UPDATES REQUIRED

### 5. **`specificType` - Residential Types Expansion**

**Current Enum:**
```javascript
specificType: {
    type: String,
    enum: ["Apartment", "Villa", "Plot"],  // ❌ Old values
    required: function() {
        return this.propertyType === "Residential";
    }
}
```

**Required Update:**
```javascript
specificType: {
    type: String,
    enum: [
        // ✅ Keep existing
        "Apartment", 
        "Villa", 
        "Plot",
        // ✅ Add new residential types
        "Single",      // Single room/unit
        "Duplex",      // Duplex apartment
        "Room",        // Individual room
        "Flat",        // Flat/Apartment
        "PG"           // Paying Guest accommodation
    ],
    required: function() {
        return this.propertyType === "Residential";
    }
}
```
- **Reason:** Client requested these specific residential types
- **Impact:** Frontend sends these new values now
- **Action:** Expand enum to accept both old and new values

---

### 6. **`kitchenType` - Update Enum Values**

**Current API Request Shows:**
```javascript
kitchenType: "Closed"  // From your API example
```

**Frontend Sends:**
```javascript
kitchenType: "Modular" or "Simple"
```

**Required Update:**
```javascript
kitchenType: {
    type: String,
    enum: ["Modular", "Simple"],  // ✅ Match frontend values
    required: false,
    default: "Simple"
}
```
- **Action:** Update enum to match frontend values
- **Alternative:** Clarify what values backend expects and inform frontend team

---

### 7. **`facingDirection` - Make Optional or Remove**

**Current Schema:**
```javascript
facingDirection: {
    type: String,
    enum: ["North", "South", "East", "West"],
    required: true  // ❌ Currently required
}
```

**Required Update:**
```javascript
facingDirection: {
    type: String,
    enum: ["North", "South", "East", "West"],
    required: false,  // ✅ Make optional
    default: null
}
```
- **Reason:** Client requested removal of this field from frontend
- **Action:** Make it optional (not required) or remove completely
- **Impact:** Frontend no longer sends this field

---

### 8. **`availableFor` - Clarify Values**

**Current API Shows:**
```javascript
availableFor: "Family"  // Single value
```

**Frontend Has TWO Different Sets:**
- **Residential Properties:** `["Boys", "Girls", "Family"]`
- **Availability Section:** `["Family", "Students", "Bachelor", "Any"]`

**Required Action:**
```javascript
availableFor: {
    type: String,
    enum: [
        // Residential specific
        "Boys", 
        "Girls", 
        "Family",
        // General availability
        "Students",
        "Bachelor",
        "Any"
    ],
    required: false
}
```
- **Action:** Confirm which values backend expects
- **Recommendation:** Accept all values to support both use cases

---

## 🔍 FIELD NAME CLARIFICATIONS NEEDED

### 9. **`areaSqFt` vs `areaDetails`**

**API Response Shows:**
```json
"areaSqFt": 1200
```

**Frontend Sends:**
```javascript
formData.append('areaDetails', 1200);
```

**❓ Question:** Which field name should backend use?
- Is `areaSqFt` and `areaDetails` same field with different names?
- Does backend accept both?
- **Action Required:** Confirm field name standardization

---

### 10. **`availability` vs `availabilityStatus`**

**API Response Shows:**
```json
"availabilityStatus": "Ready to Move"
```

**Frontend Variable:**
```javascript
// Uses: availability
// Values: ["Ready to Move", "Under Construction"]
```

**❓ Question:** Which is the correct field name?
- **Action Required:** Standardize to one name (recommend `availabilityStatus` to match response)

---

## 🐛 FRONTEND BUG TO FIX

### 11. **Missing State Variable Declaration**

**Issue:**
```javascript
// ❌ Line 1536 uses undefined variable
selectedValue={availability}
onSelect={setAvailability}

// But no useState declaration exists!
```

**Frontend Fix Required:**
```javascript
// ✅ Add this line around line 350
const [availability, setAvailability] = useState("Ready to Move");
```
- **Note:** This is a frontend bug, not backend issue
- **Impact:** App will crash when reaching Step 3
- **Priority:** HIGH - Must fix before testing

---

## 📊 COMPLETE FIELD MAPPING TABLE

| Frontend Field | Backend Field | Type | Required | Condition | Status |
|---|---|---|---|---|---|
| propertyState | state | String | Yes | - | ✅ Working |
| city | city | String | Yes | - | ✅ Working |
| post | **post** | String | No | - | ❌ **ADD THIS** |
| locality | locality | String | Yes | - | ✅ Working |
| pincode | pincode | String | Yes | - | ✅ Working |
| propertyType | propertyType | String | Yes | - | ✅ Working |
| residentialType | specificType | String | Yes | Residential | ⚠️ **UPDATE ENUM** |
| commercialType | specificType | String | Yes | Commercial | ✅ Working |
| spaceAvailable | **spaceAvailable** | Number | Yes | Commercial | ❌ **ADD THIS** |
| bedrooms | bedrooms | Number | Yes | Residential | ✅ Working |
| bathrooms | bathrooms | Number | Yes | Residential | ✅ Working |
| balconies | balconies | Number | No | - | ✅ Working (Boolean→Number) |
| floorNumber | floorNumber | Number | Yes | Not Room/PG | ✅ Working |
| totalFloors | totalFloors | Number | Yes | Not Room/PG | ✅ Working |
| area | areaSqFt/areaDetails | Number | Yes | - | ⚠️ **CLARIFY NAME** |
| price | price | Number | Yes | - | ✅ Working |
| kitchenType | kitchenType | String | No | - | ⚠️ **UPDATE ENUM** |
| furnishing | furnishingStatus | String | Yes | - | ✅ Working |
| parking | parking | String | Yes | - | ✅ Working |
| availableFrom | availableFrom | Date | Yes | - | ✅ Working |
| availableFor | availableFor | String | No | - | ⚠️ **CLARIFY VALUES** |
| societyMaintenance | **societyMaintenance** | String | No | Residential | ❌ **ADD THIS** |
| societyFeatures | **societyFeatures** | Array | No | Residential | ❌ **ADD THIS** |
| availability | availabilityStatus | String | Yes | - | ⚠️ **CLARIFY NAME** |
| purpose | purpose | String | Yes | - | ✅ Working |
| description | description | String | Yes | - | ✅ Working |
| contactNumber | contactNumber | String | Yes | - | ✅ Working |
| contactPreferences | contactPreferences | Object | Yes | - | ✅ Working |
| selectedMedia | photos, videos | Array | No | - | ✅ Working |

---

## 🎯 ACTION ITEMS CHECKLIST

### **Backend Schema Changes:**
- [ ] Add `post` field (String, optional)
- [ ] Add `spaceAvailable` field (Number, required for Commercial)
- [ ] Add `societyMaintenance` field (String enum, optional for Residential)
- [ ] Add `societyFeatures` field (Array of Strings, optional for Residential)
- [ ] Update `specificType` enum to include: Single, Duplex, Room, Flat, PG
- [ ] Update `kitchenType` enum to: Modular, Simple
- [ ] Make `facingDirection` optional (or remove)
- [ ] Clarify `availableFor` enum values
- [ ] Standardize field name: `areaSqFt` vs `areaDetails`
- [ ] Standardize field name: `availability` vs `availabilityStatus`

### **API Documentation Updates:**
- [ ] Update API docs with new fields
- [ ] Update enum value lists
- [ ] Update example request/response
- [ ] Document conditional field requirements

### **Testing Required:**
- [ ] Test with new `specificType` values (Single, Duplex, Room, Flat, PG)
- [ ] Test Commercial property with `spaceAvailable`
- [ ] Test Residential property with `societyMaintenance` and `societyFeatures`
- [ ] Test without `facingDirection` field
- [ ] Validate all enum values

---

## 📞 Contact

If any clarifications needed:
- Review the API request example provided earlier
- Check current working enum values
- Coordinate with frontend team for field name standardization

---

## 🚀 Priority

**HIGH PRIORITY** - These changes must be completed before frontend integration testing can proceed.

**Estimated Backend Effort:** 2-3 hours for schema updates + testing

---

**End of Document**
