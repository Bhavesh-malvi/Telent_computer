# 🚀 TCIT Auto Message System API Documentation

## 📋 Overview

The TCIT Auto Message System provides automated WhatsApp messaging capabilities for:
- **Fee Reminders** - Automatic reminders for pending fees
- **Birthday Wishes** - Automatic birthday wishes to students
- **Admission Confirmations** - Welcome messages for new admissions
- **Fee Payment Messages** - Payment confirmation messages

## 🔗 Base URL

```
http://localhost:5000/api/auto-messages
```

## 🔐 Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## 📱 WhatsApp Connection Management

### Initialize WhatsApp
```http
POST /whatsapp/initialize
```

**Description:** Initialize WhatsApp Web client and generate QR code for scanning.

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp initialization started",
  "status": {
    "isInitialized": true,
    "isReady": false,
    "connectionRetries": 0,
    "hasClient": true
  }
}
```

### Get WhatsApp Status
```http
GET /whatsapp/status
```

**Description:** Get current WhatsApp connection status.

**Response:**
```json
{
  "success": true,
  "status": {
    "isInitialized": true,
    "isReady": true,
    "connectionRetries": 0,
    "hasClient": true
  }
}
```

### Disconnect WhatsApp
```http
POST /whatsapp/disconnect
```

**Description:** Disconnect WhatsApp client.

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp disconnected successfully"
}
```

---

## 💰 Fee Reminder Service

### Send Fee Reminders
```http
POST /fee-reminders/send
```

**Description:** Send automatic fee reminders to students with pending payments.

**Response:**
```json
{
  "success": true,
  "message": "Fee reminders sent to 5 students",
  "data": {
    "totalStudents": 5,
    "successfulMessages": 4,
    "failedMessages": 1,
    "results": [...]
  }
}
```

### Get Fee Reminder Status
```http
GET /fee-reminders/status
```

**Description:** Get fee reminder service status.

**Response:**
```json
{
  "success": true,
  "status": {
    "serviceName": "Fee Reminder Service",
    "messageServiceReady": true,
    "lastRun": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🎂 Birthday Wish Service

### Send Birthday Wishes
```http
POST /birthday-wishes/send
```

**Description:** Send birthday wishes to students whose birthday is today.

**Response:**
```json
{
  "success": true,
  "message": "Birthday wishes sent to 3 students",
  "data": {
    "totalStudents": 3,
    "successfulMessages": 3,
    "failedMessages": 0,
    "results": [...]
  }
}
```

### Get Birthday Wish Status
```http
GET /birthday-wishes/status
```

**Description:** Get birthday wish service status.

**Response:**
```json
{
  "success": true,
  "status": {
    "serviceName": "Birthday Wish Service",
    "messageServiceReady": true,
    "lastRun": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 🎓 Admission Confirmation Service

### Send Admission Confirmations
```http
POST /admission-confirmations/send
```

**Description:** Send admission confirmations to students admitted today.

**Response:**
```json
{
  "success": true,
  "message": "Admission confirmations sent to 2 students",
  "data": {
    "totalStudents": 2,
    "successfulMessages": 2,
    "failedMessages": 0,
    "results": [...]
  }
}
```

### Send Specific Admission Confirmation
```http
POST /admission-confirmations/send/:studentId
```

**Description:** Send admission confirmation to a specific student.

**Parameters:**
- `studentId` (string, required): Student ID

**Response:**
```json
{
  "success": true,
  "message": "Admission confirmation sent successfully",
  "data": {
    "studentId": "STU001",
    "studentName": "John Doe",
    "contactNo": "+919876543210",
    "result": {...}
  }
}
```

### Get Admission Confirmation Status
```http
GET /admission-confirmations/status
```

**Description:** Get admission confirmation service status.

---

## 💳 Fee Payment Message Service

### Send Fee Payment Confirmation
```http
POST /fee-payment/send/:studentId
```

**Description:** Send payment confirmation to a specific student.

**Parameters:**
- `studentId` (string, required): Student ID

**Request Body:**
```json
{
  "amount": 5000,
  "paymentMethod": "Cash",
  "collectedBy": "Admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Fee payment confirmation sent successfully",
  "data": {
    "studentId": "STU001",
    "studentName": "John Doe",
    "contactNo": "+919876543210",
    "paymentData": {...},
    "result": {...}
  }
}
```

### Send Installment Payment Confirmation
```http
POST /installment-payment/send/:studentId
```

**Description:** Send installment payment confirmation to a specific student.

**Parameters:**
- `studentId` (string, required): Student ID

**Request Body:**
```json
{
  "amount": 2500,
  "installmentNumber": 1,
  "paymentMethod": "Online",
  "collectedBy": "Admin"
}
```

### Send Bulk Payment Confirmations
```http
POST /bulk-payment-confirmations/send
```

**Description:** Send payment confirmations to multiple students.

**Request Body:**
```json
{
  "payments": [
    {
      "studentId": "STU001",
      "amount": 1000,
      "paymentMethod": "Cash",
      "collectedBy": "Admin"
    },
    {
      "studentId": "STU002",
      "amount": 2000,
      "paymentMethod": "Online",
      "collectedBy": "Admin"
    }
  ]
}
```

### Get Fee Payment Message Status
```http
GET /fee-payment/status
```

**Description:** Get fee payment message service status.

---

## 📊 General Endpoints

### Get All Services Status
```http
GET /status
```

**Description:** Get status of all auto message services.

**Response:**
```json
{
  "success": true,
  "status": {
    "whatsapp": {...},
    "feeReminder": {...},
    "birthdayWish": {...},
    "admissionConfirmation": {...},
    "feePaymentMessage": {...},
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### Send Test Message
```http
POST /test-message
```

**Description:** Send a test message to verify WhatsApp connection.

**Request Body:**
```json
{
  "phoneNumber": "9876543210",
  "message": "This is a test message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test message sent",
  "data": {
    "success": true,
    "phoneNumber": "+919876543210",
    "messageId": "3EB0C767D82B8A6F",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "attempts": 1
  }
}
```

---

## 🧪 Testing

### Run All Tests
```bash
node test-auto-messages.js
```

### Test Configuration
Update the test configuration in `test-auto-messages.js`:

```javascript
const TEST_CONFIG = {
  phoneNumber: '9999999999', // Replace with actual test number
  studentId: '65f1234567890abcdef12345', // Replace with actual student ID
  // ... other config
};
```

---

## 📝 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (invalid token)
- `500` - Internal Server Error

---

## 🔧 Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   TEST_ADMIN_EMAIL=admin@tcit.com
   TEST_ADMIN_PASSWORD=admin123
   ```

3. **Start Server:**
   ```bash
   npm start
   ```

4. **Initialize WhatsApp:**
   ```bash
   curl -X POST http://localhost:5000/api/auto-messages/whatsapp/initialize \
     -H "Authorization: Bearer <your-token>"
   ```

5. **Scan QR Code** with WhatsApp to connect.

---

## 🎯 Usage Examples

### Complete Workflow Example

1. **Initialize WhatsApp:**
   ```bash
   curl -X POST /api/auto-messages/whatsapp/initialize
   ```

2. **Send Fee Reminders:**
   ```bash
   curl -X POST /api/auto-messages/fee-reminders/send
   ```

3. **Send Birthday Wishes:**
   ```bash
   curl -X POST /api/auto-messages/birthday-wishes/send
   ```

4. **Send Payment Confirmation:**
   ```bash
   curl -X POST /api/auto-messages/fee-payment/send/STU001 \
     -H "Content-Type: application/json" \
     -d '{"amount": 5000, "paymentMethod": "Cash"}'
   ```

---

## 📞 Support

For technical support or questions, contact the development team.

**Version:** 1.0.0  
**Last Updated:** January 2024
