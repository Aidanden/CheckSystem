# 🧪 دليل اختبار APIs - Check Printing System

دليل شامل لاختبار جميع APIs الخاصة بنظام طباعة الشيكات.

---

## 📋 المتطلبات

### 1. تشغيل PostgreSQL

```powershell
# تأكد من تثبيت PostgreSQL
# إنشاء قاعدة البيانات
psql -U postgres
CREATE DATABASE check_printing_system;
\q
```

### 2. إعداد Server

```powershell
cd server

# تثبيت المكتبات
npm install

# Prisma setup
npm run prisma:migrate   # أدخل اسم: init
npm run db:seed

# تشغيل الخادم
npm run dev
```

Server سيعمل على: `http://10.250.100.40:5000`

---

## 🔐 1. Authentication APIs

### Login

```powershell
# Admin Login
$body = @{
    username = "admin"
    password = "[REDACTED]"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri http://10.250.100.40:5000/api/auth/login `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

# حفظ Token للاستخدام لاحقاً
$token = $response.token
Write-Host "Token: $token"
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "admin",
    "isAdmin": true,
    "branchId": 1,
    ...
  }
}
```

### Get Current User

```powershell
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri http://10.250.100.40:5000/api/users/me `
    -Method GET `
    -Headers $headers
```

---

## 🏢 2. Branch APIs

### Get All Branches

```powershell
Invoke-RestMethod -Uri http://10.250.100.40:5000/api/branches `
    -Method GET `
    -Headers $headers
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "branchName": "Main Branch",
    "branchLocation": "Downtown",
    "routingNumber": "123456789",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### Create Branch

```powershell
$body = @{
    branch_name = "North Branch"
    branch_location = "North District"
    routing_number = "987654321"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://10.250.100.40:5000/api/branches `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
```

### Update Branch

```powershell
$branchId = 2
$body = @{
    branch_name = "North Branch Updated"
    branch_location = "North District Updated"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/branches/$branchId" `
    -Method PUT `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
```

### Delete Branch

```powershell
$branchId = 2
Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/branches/$branchId" `
    -Method DELETE `
    -Headers $headers
```

---

## 👥 3. User APIs

### Get All Users

```powershell
Invoke-RestMethod -Uri http://10.250.100.40:5000/api/users `
    -Method GET `
    -Headers $headers
```

### Get User by ID

```powershell
$userId = 1
Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/users/$userId" `
    -Method GET `
    -Headers $headers
```

### Create User

```powershell
$body = @{
    username = "test_user"
    password = "test123"
    branch_id = 1
    is_admin = $false
    permission_ids = @(2, 3)  # PRINT_CHECKBOOK, VIEW_INVENTORY
} | ConvertTo-Json

Invoke-RestMethod -Uri http://10.250.100.40:5000/api/users `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
```

### Update User

```powershell
$userId = 3
$body = @{
    username = "test_user_updated"
    is_active = $true
    permission_ids = @(2, 3, 4)
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/users/$userId" `
    -Method PUT `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
```

### Delete User

```powershell
$userId = 3
Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/users/$userId" `
    -Method DELETE `
    -Headers $headers
```

### Get All Permissions

```powershell
Invoke-RestMethod -Uri http://10.250.100.40:5000/api/users/permissions `
    -Method GET `
    -Headers $headers
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "permissionName": "Admin Management",
    "permissionCode": "ADMIN_MANAGEMENT",
    "description": "Manage users and branches"
  },
  ...
]
```

---

## 📦 4. Inventory APIs

### Get All Inventory

```powershell
Invoke-RestMethod -Uri http://10.250.100.40:5000/api/inventory `
    -Method GET `
    -Headers $headers
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "stockType": 1,  // 1 = Individual, 2 = Corporate
    "quantity": 0,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### Get Inventory by Stock Type

```powershell
$stockType = 1  # Individual
Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/inventory/$stockType" `
    -Method GET `
    -Headers $headers
```

### Add Stock

```powershell
$body = @{
    stock_type = 1
    quantity = 100
    notes = "Initial stock for individual checks"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://10.250.100.40:5000/api/inventory/add `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body
```

### Get Transaction History

```powershell
# All transactions
Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/inventory/transactions/history" `
    -Method GET `
    -Headers $headers

# Filter by stock type
Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/inventory/transactions/history?stock_type=1&limit=10" `
    -Method GET `
    -Headers $headers
```

---

## 💳 5. Account APIs

### Query Account (from Bank)

```powershell
$body = @{
    account_number = "1234567890"
} | ConvertTo-Json

$account = Invoke-RestMethod -Uri http://10.250.100.40:5000/api/accounts/query `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body

Write-Host "Account: $($account | ConvertTo-Json)"
```

**Expected Response:**
```json
{
  "id": 1,
  "accountNumber": "1234567890",
  "accountHolderName": "John Doe",
  "accountType": 1,
  "lastPrintedSerial": 0,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Get All Accounts

```powershell
Invoke-RestMethod -Uri http://10.250.100.40:5000/api/accounts `
    -Method GET `
    -Headers $headers
```

### Get Account by ID

```powershell
$accountId = 1
Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/accounts/$accountId" `
    -Method GET `
    -Headers $headers
```

---

## 🖨️ 6. Printing APIs

### Print Checkbook

```powershell
# أولاً: تأكد من وجود مخزون
$body = @{
    stock_type = 1
    quantity = 100
} | ConvertTo-Json

Invoke-RestMethod -Uri http://10.250.100.40:5000/api/inventory/add `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body

# ثانياً: طباعة الشيك
$body = @{
    account_number = "1234567890"
} | ConvertTo-Json

$printResult = Invoke-RestMethod -Uri http://10.250.100.40:5000/api/printing/print `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $body

Write-Host "Print Result: $($printResult | ConvertTo-Json)"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Checkbook printed successfully",
  "operation": {
    "id": 1,
    "accountId": 1,
    "accountNumber": "1234567890",
    "serialFrom": 1,
    "serialTo": 25,
    "sheetsPrinted": 25,
    "status": "COMPLETED",
    ...
  }
}
```

### Get Print History

```powershell
# All history
Invoke-RestMethod -Uri http://10.250.100.40:5000/api/printing/history `
    -Method GET `
    -Headers $headers

# Filter by branch and limit
Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/printing/history?branch_id=1&limit=10" `
    -Method GET `
    -Headers $headers
```

### Get Statistics

```powershell
# All branches
Invoke-RestMethod -Uri http://10.250.100.40:5000/api/printing/statistics `
    -Method GET `
    -Headers $headers

# Specific branch
Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/printing/statistics?branch_id=1" `
    -Method GET `
    -Headers $headers
```

**Expected Response:**
```json
{
  "total_operations": "5",
  "total_sheets_printed": "125",
  "unique_accounts": "3",
  "first_print_date": "2025-11-15T...",
  "last_print_date": "2025-11-15T..."
}
```

---

## 🔄 Full Workflow Test

### سيناريو كامل لاختبار النظام:

```powershell
# 1. Login
$body = @{username="admin"; password="[REDACTED]"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri http://10.250.100.40:5000/api/auth/login -Method POST -ContentType "application/json" -Body $body
$token = $response.token
$headers = @{Authorization = "Bearer $token"}

# 2. Add Inventory
$body = @{stock_type=1; quantity=100; notes="Test stock"} | ConvertTo-Json
Invoke-RestMethod -Uri http://10.250.100.40:5000/api/inventory/add -Method POST -Headers $headers -ContentType "application/json" -Body $body

# 3. Query Account
$body = @{account_number="1234567890"} | ConvertTo-Json
$account = Invoke-RestMethod -Uri http://10.250.100.40:5000/api/accounts/query -Method POST -Headers $headers -ContentType "application/json" -Body $body
Write-Host "Account: $($account.accountHolderName)"

# 4. Print Checkbook
$body = @{account_number="1234567890"} | ConvertTo-Json
$print = Invoke-RestMethod -Uri http://10.250.100.40:5000/api/printing/print -Method POST -Headers $headers -ContentType "application/json" -Body $body
Write-Host "Printed: $($print.message)"

# 5. Check Statistics
$stats = Invoke-RestMethod -Uri http://10.250.100.40:5000/api/printing/statistics -Method GET -Headers $headers
Write-Host "Total Operations: $($stats.total_operations)"
Write-Host "Total Sheets: $($stats.total_sheets_printed)"

# 6. View History
$history = Invoke-RestMethod -Uri "http://10.250.100.40:5000/api/printing/history?limit=5" -Method GET -Headers $headers
Write-Host "Recent operations: $($history.Length)"
```

---

## ✅ Expected Results Summary

| API Category | Endpoint | Expected Status | Notes |
|-------------|----------|----------------|-------|
| Auth | POST /api/auth/login | 200 | Returns token |
| Branch | GET /api/branches | 200 | Returns array |
| Branch | POST /api/branches | 201 | Creates branch |
| User | GET /api/users | 200 | Returns array |
| User | POST /api/users | 201 | Creates user |
| Inventory | GET /api/inventory | 200 | Returns array |
| Inventory | POST /api/inventory/add | 200 | Adds stock |
| Account | POST /api/accounts/query | 200 | Returns account |
| Print | POST /api/printing/print | 200 | Prints checkbook |
| Print | GET /api/printing/history | 200 | Returns history |
| Print | GET /api/printing/statistics | 200 | Returns stats |

---

## 🐛 Common Errors

### 1. 401 Unauthorized
```json
{"error": "Authorization header is missing"}
```
**Fix:** أضف Token في الـ headers

### 2. 404 Not Found
```json
{"error": "Account not found"}
```
**Fix:** تأكد من صحة رقم الحساب

### 3. 400 Bad Request
```json
{"error": "Insufficient inventory"}
```
**Fix:** أضف مخزون قبل الطباعة

### 4. 500 Internal Server Error
**Fix:** تحقق من:
- PostgreSQL يعمل
- Database migrations تمت
- Seeds تمت
- الـ .env صحيح

---

## 📊 Testing with Postman

تم إنشاء Postman Collection في:
`server/postman_collection.json`

### Import في Postman:
1. فتح Postman
2. Import > File > اختر `postman_collection.json`
3. إنشاء Environment جديد
4. إضافة variable: `token` (سيتم ملؤه تلقائياً بعد Login)

---

## 🎯 Test Checklist

- [ ] ✅ Login with admin
- [ ] ✅ Login with demo_user
- [ ] ✅ Get all branches
- [ ] ✅ Create new branch
- [ ] ✅ Get all users
- [ ] ✅ Create new user
- [ ] ✅ Get all permissions
- [ ] ✅ Get inventory
- [ ] ✅ Add inventory (Individual)
- [ ] ✅ Add inventory (Corporate)
- [ ] ✅ Query account from bank
- [ ] ✅ Print checkbook (Individual)
- [ ] ✅ Print checkbook (Corporate)
- [ ] ✅ Get print history
- [ ] ✅ Get statistics
- [ ] ✅ Get transaction history
- [ ] ✅ Update user
- [ ] ✅ Delete user
- [ ] ✅ Update branch
- [ ] ✅ Delete branch

---

**جميع APIs تم اختبارها وهي جاهزة للاستخدام!** ✅

