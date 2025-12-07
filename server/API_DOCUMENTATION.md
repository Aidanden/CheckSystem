# API Documentation - Check Printing System

## Base URL
```
http://localhost:5000/api
```

## Authentication

معظم الـ endpoints تتطلب JWT token في header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication Endpoints

### 1.1 Login

**Endpoint:** `POST /api/auth/login`

**Description:** تسجيل الدخول والحصول على JWT token

**Request Body:**
```json
{
  "username": "admin",
  "password": "[REDACTED]"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "branch_id": 1,
    "is_admin": true,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "branch": {
      "id": 1,
      "branch_name": "الفرع الرئيسي",
      "branch_location": "الرياض - شارع الملك فهد",
      "routing_number": "1100000001"
    },
    "permissions": [
      {
        "id": 1,
        "permission_name": "إدارة المستخدمين والفروع",
        "permission_code": "MANAGE_USERS_BRANCHES"
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid credentials
- `401 Unauthorized`: User account is disabled

---

## 2. Branch Endpoints

### 2.1 Get All Branches

**Endpoint:** `GET /api/branches`

**Authentication:** Required

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "branch_name": "الفرع الرئيسي",
    "branch_location": "الرياض - شارع الملك فهد",
    "routing_number": "1100000001",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### 2.2 Get Branch by ID

**Endpoint:** `GET /api/branches/:id`

**Authentication:** Required

**Response (200 OK):** Same as single branch object above

### 2.3 Create Branch

**Endpoint:** `POST /api/branches`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "branch_name": "فرع جدة",
  "branch_location": "جدة - شارع التحلية",
  "routing_number": "1100000002"
}
```

**Response (201 Created):** Returns created branch object

### 2.4 Update Branch

**Endpoint:** `PUT /api/branches/:id`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "branch_name": "فرع جدة المحدث",
  "branch_location": "جدة - حي الشاطئ"
}
```

**Response (200 OK):** Returns updated branch object

### 2.5 Delete Branch

**Endpoint:** `DELETE /api/branches/:id`

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "message": "Branch deleted successfully"
}
```

---

## 3. User Endpoints

### 3.1 Get Current User

**Endpoint:** `GET /api/users/me`

**Authentication:** Required

**Response (200 OK):** Returns current user with permissions

### 3.2 Get All Users

**Endpoint:** `GET /api/users`

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "branch_id": 1,
    "is_admin": true,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z",
    "branch": { ... },
    "permissions": [ ... ]
  }
]
```

### 3.3 Get User by ID

**Endpoint:** `GET /api/users/:id`

**Authentication:** Required (Admin only)

**Response (200 OK):** Returns user object with details

### 3.4 Create User

**Endpoint:** `POST /api/users`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "username": "new_user",
  "password": "password123",
  "branch_id": 1,
  "is_admin": false,
  "permission_ids": [2, 4]
}
```

**Response (201 Created):** Returns created user object

### 3.5 Update User

**Endpoint:** `PUT /api/users/:id`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "username": "updated_user",
  "password": "newpassword123",
  "branch_id": 2,
  "is_admin": false,
  "is_active": true,
  "permission_ids": [2, 3, 4]
}
```

**Response (200 OK):** Returns updated user object

### 3.6 Delete User

**Endpoint:** `DELETE /api/users/:id`

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "message": "User deleted successfully"
}
```

### 3.7 Get All Permissions

**Endpoint:** `GET /api/users/permissions`

**Authentication:** Required

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "permission_name": "إدارة المستخدمين والفروع",
    "permission_code": "MANAGE_USERS_BRANCHES",
    "description": "القدرة على إضافة/تعديل المستخدمين والفروع",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "permission_name": "طباعة",
    "permission_code": "PRINTING",
    "description": "السماح للمستخدم بتنفيذ عملية طباعة الشيكات",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## 4. Inventory Endpoints

### 4.1 Get All Inventory

**Endpoint:** `GET /api/inventory`

**Authentication:** Required (INVENTORY_MANAGEMENT permission)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "stock_type": 1,
    "quantity": 100,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "stock_type": 2,
    "quantity": 50,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

**Note:** 
- `stock_type: 1` = Individual (25 sheets)
- `stock_type: 2` = Corporate (50 sheets)

### 4.2 Get Inventory by Stock Type

**Endpoint:** `GET /api/inventory/:stockType`

**Authentication:** Required (INVENTORY_MANAGEMENT permission)

**Response (200 OK):** Returns single inventory object

### 4.3 Add Stock

**Endpoint:** `POST /api/inventory/add`

**Authentication:** Required (INVENTORY_MANAGEMENT permission)

**Request Body:**
```json
{
  "stock_type": 1,
  "quantity": 50,
  "serial_from": "A001",
  "serial_to": "A050",
  "notes": "شحنة جديدة من المورد"
}
```

**Response (201 Created):**
```json
{
  "message": "Inventory added successfully",
  "stock_type": 1,
  "quantity": 50
}
```

### 4.4 Get Transaction History

**Endpoint:** `GET /api/inventory/transactions/history`

**Authentication:** Required (REPORTING permission)

**Query Parameters:**
- `stock_type` (optional): Filter by stock type (1 or 2)
- `limit` (optional): Number of records (default: 100)

**Example:** `GET /api/inventory/transactions/history?stock_type=1&limit=50`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "stock_type": 1,
    "transaction_type": "ADD",
    "quantity": 100,
    "serial_from": "A001",
    "serial_to": "A100",
    "user_id": 1,
    "notes": "Initial inventory",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": 2,
    "stock_type": 1,
    "transaction_type": "DEDUCT",
    "quantity": 1,
    "user_id": 2,
    "notes": "طباعة دفتر شيكات للحساب 1234567890",
    "created_at": "2024-01-02T10:30:00.000Z"
  }
]
```

---

## 5. Account Endpoints

### 5.1 Get All Accounts

**Endpoint:** `GET /api/accounts`

**Authentication:** Required (REPORTING permission)

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "account_number": "1234567890",
    "account_holder_name": "أحمد محمد علي",
    "account_type": 1,
    "last_printed_serial": 25,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-02T00:00:00.000Z"
  }
]
```

### 5.2 Get Account by ID

**Endpoint:** `GET /api/accounts/:id`

**Authentication:** Required (REPORTING permission)

**Response (200 OK):** Returns single account object

### 5.3 Query Account

**Endpoint:** `POST /api/accounts/query`

**Authentication:** Required (PRINTING permission)

**Description:** يستعلم عن الحساب من النظام البنكي ويحفظه محلياً

**Request Body:**
```json
{
  "account_number": "1234567890"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "account_number": "1234567890",
  "account_holder_name": "أحمد محمد علي",
  "account_type": 1,
  "last_printed_serial": 0,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

---

## 6. Printing Endpoints

### 6.1 Print Checkbook

**Endpoint:** `POST /api/printing/print`

**Authentication:** Required (PRINTING permission)

**Description:** طباعة دفتر شيكات جديد

**Request Body:**
```json
{
  "account_number": "1234567890"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "تمت طباعة دفتر الشيكات بنجاح. الأرقام التسلسلية من 1 إلى 25",
  "operation": {
    "id": 1,
    "account_id": 1,
    "user_id": 2,
    "branch_id": 1,
    "routing_number": "1100000001",
    "account_number": "1234567890",
    "account_type": 1,
    "serial_from": 1,
    "serial_to": 25,
    "sheets_printed": 25,
    "print_date": "2024-01-02T10:30:00.000Z",
    "status": "COMPLETED",
    "notes": null
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "لا يوجد مخزون كافٍ"
}
```

### 6.2 Get Print History

**Endpoint:** `GET /api/printing/history`

**Authentication:** Required (REPORTING permission)

**Query Parameters:**
- `branch_id` (optional): Filter by branch
- `limit` (optional): Number of records (default: 100)

**Example:** `GET /api/printing/history?branch_id=1&limit=50`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "account_id": 1,
    "user_id": 2,
    "branch_id": 1,
    "routing_number": "1100000001",
    "account_number": "1234567890",
    "account_type": 1,
    "serial_from": 1,
    "serial_to": 25,
    "sheets_printed": 25,
    "print_date": "2024-01-02T10:30:00.000Z",
    "status": "COMPLETED",
    "notes": null
  }
]
```

### 6.3 Get Statistics

**Endpoint:** `GET /api/printing/statistics`

**Authentication:** Required (REPORTING permission)

**Query Parameters:**
- `branch_id` (optional): Filter by branch

**Example:** `GET /api/printing/statistics?branch_id=1`

**Response (200 OK):**
```json
{
  "total_operations": "150",
  "total_sheets_printed": "4500",
  "unique_accounts": "75",
  "first_print_date": "2024-01-01T08:00:00.000Z",
  "last_print_date": "2024-01-15T16:30:00.000Z"
}
```

---

## Permission Codes

| Code | Name | Description |
|------|------|-------------|
| `MANAGE_USERS_BRANCHES` | إدارة المستخدمين والفروع | القدرة على إضافة/تعديل المستخدمين والفروع |
| `PRINTING` | طباعة | السماح للمستخدم بتنفيذ عملية طباعة الشيكات |
| `HANDOVER` | تسليم دفاتر الشيكات | السماح للمستخدم بتسجيل أن الدفتر المطبوع قد تم تسليمه للعميل |
| `REPORTING` | عرض التقارير | السماح للمستخدم بالاطلاع على تقارير الطباعة والمخزون |
| `INVENTORY_MANAGEMENT` | إدارة المخزون | السماح للمستخدم بإضافة أرصدة دفاتر الشيكات الخام |

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "msg": "Username is required",
      "param": "username",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "You do not have permission to perform this action",
  "required_permission": "PRINTING"
}
```

### 404 Not Found
```json
{
  "error": "Branch not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Testing with Postman/curl

### Example: Complete Flow

1. **Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "demo_user", "password": "demo123"}'
```

2. **Query Account**
```bash
curl -X POST http://localhost:5000/api/accounts/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"account_number": "1234567890"}'
```

3. **Print Checkbook**
```bash
curl -X POST http://localhost:5000/api/printing/print \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"account_number": "1234567890"}'
```

4. **Get Print History**
```bash
curl http://localhost:5000/api/printing/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

