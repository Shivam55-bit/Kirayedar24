#!/bin/bash

# ================================================================================
# NOTIFICATION API - CURL COMMANDS FOR TESTING
# ================================================================================

# Configuration
BASE_URL="https://n5.bhoomitechzone.us"
API_TOKEN="YOUR_JWT_TOKEN_HERE"  # Replace with actual JWT token from login
PAGE=1
LIMIT=20

# ================================================================================
# 1. GET ALL NOTIFICATIONS
# ================================================================================
echo "📬 Fetching notifications..."
curl -X GET \
  "${BASE_URL}/api/notification/list?page=${PAGE}&limit=${LIMIT}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# ================================================================================
# 2. GET UNREAD COUNT
# ================================================================================
echo "📊 Fetching unread notification count..."
curl -X GET \
  "${BASE_URL}/api/notification/unread-count" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# ================================================================================
# 3. MARK NOTIFICATION AS READ
# ================================================================================
# Replace NOTIFICATION_ID with actual notification ID from previous response
echo "✅ Marking notification as read..."
NOTIFICATION_ID="your_notification_id_here"
curl -X PATCH \
  "${BASE_URL}/api/notification/mark-read/${NOTIFICATION_ID}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# ================================================================================
# 4. MARK ALL AS READ
# ================================================================================
echo "✅ Marking all as read..."
curl -X POST \
  "${BASE_URL}/api/notification/read-all" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# ================================================================================
# 5. DELETE NOTIFICATION
# ================================================================================
echo "🗑️ Deleting notification..."
NOTIFICATION_ID="your_notification_id_here"
curl -X DELETE \
  "${BASE_URL}/api/notification/${NOTIFICATION_ID}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -v

echo -e "\n\n"

# ================================================================================
# WINDOWS (PowerShell) VERSIONS - Copy these if you're on Windows
# ================================================================================

# === Windows PowerShell - GET Notifications ===
<#
$BASE_URL = "https://n5.bhoomitechzone.us"
$API_TOKEN = "YOUR_JWT_TOKEN_HERE"
$PAGE = 1
$LIMIT = 20

$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type" = "application/json"
}

$url = "$BASE_URL/api/notification/list?page=$PAGE&limit=$LIMIT"

Invoke-WebRequest -Uri $url -Headers $headers -Method Get -Verbose
#>

# === Windows PowerShell - GET Unread Count ===
<#
Invoke-WebRequest `
  -Uri "https://n5.bhoomitechzone.us/api/notification/unread-count" `
  -Headers @{"Authorization" = "Bearer $API_TOKEN"; "Content-Type" = "application/json"} `
  -Method Get `
  -Verbose
#>

# ================================================================================
# HOW TO USE:
# ================================================================================
# 1. Login first to get JWT token
# 2. Replace "YOUR_JWT_TOKEN_HERE" with actual token
# 3. Run the curl commands
# 4. Check the responses

# EXAMPLE LOGIN CURL:
# curl -X POST https://n5.bhoomitechzone.us/auth/login \
#   -H "Content-Type: application/json" \
#   -d '{"email":"user@example.com","password":"password"}' | jq '.token'
