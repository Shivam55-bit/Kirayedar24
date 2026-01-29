# Postman API Testing Guide

## Base URL
```
https://n5.bhoomitechzone.us
```

---

## 1. GET RESIDENTIAL PROPERTIES

### Method: GET
### URL:
```
https://n5.bhoomitechzone.us/property/properties?propertyType=Residential
```

### Headers:
```
Content-Type: application/json
```

### Curl Command (Copy-Paste in Postman):
```bash
curl -X GET "https://n5.bhoomitechzone.us/property/properties?propertyType=Residential" \
  -H "Content-Type: application/json"
```

### Response Example:
```json
{
  "success": true,
  "data": [
    {
      "_id": "property_id_123",
      "title": "Beautiful 2BHK Apartment",
      "description": "Spacious apartment with modern amenities",
      "propertyType": "Residential",
      "price": 50000,
      "city": "Delhi",
      "state": "Delhi",
      "locality": "Noida",
      "photos": ["url1", "url2"],
      "contactPreferences": {
        "phone": true,
        "whatsapp": true,
        "chat": true
      },
      "contactNumber": "9876543210",
      "status": "approved",
      "createdAt": "2024-01-28T00:00:00Z"
    }
  ],
  "message": "Properties fetched successfully"
}
```

---

## 2. GET COMMERCIAL PROPERTIES

### Method: GET
### URL:
```
https://n5.bhoomitechzone.us/property/properties?propertyType=Commercial
```

### Headers:
```
Content-Type: application/json
```

### Curl Command:
```bash
curl -X GET "https://n5.bhoomitechzone.us/property/properties?propertyType=Commercial" \
  -H "Content-Type: application/json"
```

### Response: Same structure as residential (propertyType will be "Commercial")

---

## 3. GET ALL PROPERTIES (No Filter)

### Method: GET
### URL:
```
https://n5.bhoomitechzone.us/property/properties
```

### Headers:
```
Content-Type: application/json
```

### Curl Command:
```bash
curl -X GET "https://n5.bhoomitechzone.us/property/properties" \
  -H "Content-Type: application/json"
```

---

## 4. GET RECENT/FEATURED PROPERTIES (Approved Only)

### Method: GET
### URL:
```
https://n5.bhoomitechzone.us/property/recent
```

### Headers:
```
Content-Type: application/json
```

### Curl Command:
```bash
curl -X GET "https://n5.bhoomitechzone.us/property/recent" \
  -H "Content-Type: application/json"
```

---

## 5. FILTER RESIDENTIAL BY CITY

### Method: GET
### URL:
```
https://n5.bhoomitechzone.us/property/properties?propertyType=Residential&city=Delhi
```

### Curl Command:
```bash
curl -X GET "https://n5.bhoomitechzone.us/property/properties?propertyType=Residential&city=Delhi" \
  -H "Content-Type: application/json"
```

---

## 6. FILTER COMMERCIAL BY CITY

### Method: GET
### URL:
```
https://n5.bhoomitechzone.us/property/properties?propertyType=Commercial&city=Mumbai
```

### Curl Command:
```bash
curl -X GET "https://n5.bhoomitechzone.us/property/properties?propertyType=Commercial&city=Mumbai" \
  -H "Content-Type: application/json"
```

---

## 7. GET SINGLE PROPERTY BY ID

### Method: GET
### URL:
```
https://n5.bhoomitechzone.us/property/properties/{propertyId}
```

### Replace `{propertyId}` with actual property ID

### Curl Command:
```bash
curl -X GET "https://n5.bhoomitechzone.us/property/properties/YOUR_PROPERTY_ID" \
  -H "Content-Type: application/json"
```

---

## POSTMAN IMPORT STEPS

### Step 1: Open Postman
- Open Postman Desktop App or Web Version

### Step 2: Create New Request
- Click **+ New** → Select **HTTP Request**

### Step 3: Set Method & URL
- Method: **GET**
- URL: Copy any URL from above

### Step 4: Add Headers
- Click **Headers** tab
- Add:
  - Key: `Content-Type`
  - Value: `application/json`

### Step 5: Send Request
- Click **Send** button
- See response in Response panel below

### Step 6: Format Response
- Click **Pretty** to format JSON response
- Click **Preview** to see formatted data

---

## TESTING CHECKLIST

- [ ] Test Residential Properties endpoint
- [ ] Test Commercial Properties endpoint
- [ ] Test All Properties endpoint
- [ ] Test Recent Properties endpoint
- [ ] Test city filter for residential
- [ ] Test city filter for commercial
- [ ] Check response structure
- [ ] Verify data is populated
- [ ] Check status codes (should be 200)

---

## EXPECTED RESPONSE CODES

| Status | Meaning |
|--------|---------|
| 200 | Success ✅ |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

---

## QUERY PARAMETERS

| Parameter | Type | Example |
|-----------|------|---------|
| `propertyType` | String | `Residential` or `Commercial` |
| `city` | String | `Delhi`, `Mumbai`, `Bangalore` |
| `minPrice` | Number | `10000` |
| `maxPrice` | Number | `100000` |
| `status` | String | `approved`, `pending` |

---

## TIPS FOR POSTMAN TESTING

1. **Use Pre-request Scripts** (if authentication needed):
   - Click **Pre-request Script** tab to add auth tokens

2. **Save Requests**:
   - Create a new Collection: `Kirayedar24 API`
   - Save each request in the collection for reuse

3. **Environment Variables**:
   - Set Base URL as variable: `{{base_url}}`
   - Value: `https://n5.bhoomitechzone.us`

4. **Test Different Scenarios**:
   - Test with filters
   - Test without filters
   - Test invalid property IDs
   - Test different cities

5. **View Full Response**:
   - Response → Pretty view
   - Check data count
   - Verify field values

---

## COMMON ERRORS & FIXES

| Error | Cause | Fix |
|-------|-------|-----|
| Cannot reach server | Wrong URL | Verify Base URL |
| 400 Bad Request | Invalid parameter | Check query params |
| Empty data array | No properties in DB | Check filters |
| JSON parse error | Invalid response | Check server status |

---

## DATABASE FIELDS

```json
{
  "_id": "MongoDB ID",
  "title": "Property Name",
  "description": "Details",
  "propertyType": "Residential/Commercial",
  "price": "Rental Price",
  "city": "City Name",
  "state": "State Name",
  "locality": "Area/Locality",
  "photos": ["Array of image URLs"],
  "contactNumber": "Phone Number",
  "contactPreferences": {
    "phone": true/false,
    "whatsapp": true/false,
    "chat": true/false
  },
  "status": "approved/pending/rejected",
  "createdAt": "ISO Date",
  "updatedAt": "ISO Date"
}
```

---

## NEXT STEPS

1. ✅ Copy curl commands above
2. ✅ Paste in Postman
3. ✅ Add headers
4. ✅ Click Send
5. ✅ Verify responses
6. ✅ Test filters
7. ✅ Save requests in collection
