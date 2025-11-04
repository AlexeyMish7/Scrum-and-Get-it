# Centralized Error Handling Documentation

## 🏗️ Architecture Overview

Our centralized error handling system provides a consistent way to handle both frontend and backend errors across the entire application.

### 📁 File Structure

```
src/
├── hooks/
│   └── useErrorHandler.ts          # Central error processing hook
├── components/
│   └── common/
│       └── ErrorSnackbar.tsx       # Reusable snackbar component
└── pages/
    └── [any-page]/
        └── Component.tsx           # Uses centralized error handling
```

## 🔧 How Frontend & Backend Errors Are Handled

### **Backend Errors (from Supabase/API)**

Backend errors flow through our CRUD services and return standardized `CrudError` objects:

```typescript
// Backend error example:
{
  message: "duplicate key value violates unique constraint",
  code: "23505",        // PostgreSQL error code
  status: 400           // HTTP status code
}
```

**Processing Flow:**

1. **Database/API** → Returns raw error
2. **CRUD Service** → Converts to `CrudError` format
3. **useErrorHandler** → Processes with `getErrorMessage()`
4. **ErrorSnackbar** → Displays user-friendly message

### **Frontend Errors (JavaScript/React)**

Frontend errors include validation, network issues, and runtime errors:

```typescript
// Frontend error examples:
{
  name: "TypeError",
  message: "Cannot read property 'id' of undefined"
}

// Or network errors:
{
  message: "fetch: network error"
}
```

**Processing Flow:**

1. **Frontend Code** → Throws/catches error
2. **useErrorHandler** → Processes any error type
3. **getErrorMessage()** → Converts to user-friendly message
4. **ErrorSnackbar** → Displays notification

## 🎯 Usage Examples

### **Basic Component Setup**

```typescript
import React from "react";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { ErrorSnackbar } from "../../components/common/ErrorSnackbar";

const MyComponent: React.FC = () => {
  const {
    notification,
    closeNotification,
    handleError,
    showSuccess,
    showWarning,
  } = useErrorHandler();

  // Your component logic here...

  return (
    <div>
      {/* Your component UI */}

      {/* Always include this at the bottom */}
      <ErrorSnackbar notification={notification} onClose={closeNotification} />
    </div>
  );
};
```

### **Handling Database Operations**

```typescript
const saveData = async () => {
  try {
    const res = await myService.createItem(data);
    if (res.error) {
      handleError(res.error); // Automatically shows user-friendly message
      return;
    }
    showSuccess("Data saved successfully!");
  } catch (err) {
    handleError(err); // Handles unexpected errors
  }
};
```

### **Form Validation**

```typescript
const handleSubmit = () => {
  // Validation
  if (!formData.name) {
    showWarning("Please enter your name");
    return;
  }

  if (!formData.email) {
    showWarning("Please enter your email");
    return;
  }

  // Proceed with submission...
};
```

### **Network Operations**

```typescript
const fetchData = async () => {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) {
      handleError(`HTTP ${response.status}: ${response.statusText}`);
      return;
    }
    const data = await response.json();
    // Process data...
  } catch (err) {
    handleError(err); // Handles network errors automatically
  }
};
```

## 🚨 Error Type Mapping

### **PostgreSQL Database Errors**

| Error Code | User Message                                              |
| ---------- | --------------------------------------------------------- |
| `23505`    | "This entry already exists. Please check for duplicates." |
| `23514`    | "Please check your input format and try again."           |
| `23503`    | "Cannot complete action due to related data constraints." |
| `42501`    | "You don't have permission to perform this action."       |

### **HTTP Status Codes**

| Status | User Message                                              |
| ------ | --------------------------------------------------------- |
| `400`  | "Invalid request. Please check your input and try again." |
| `401`  | "Access denied. Please log in and try again."             |
| `403`  | "You don't have permission to perform this action."       |
| `404`  | "The requested item was not found."                       |
| `409`  | "Conflict detected. This action cannot be completed."     |
| `422`  | "Invalid data format. Please check your input."           |
| `500+` | "Server error. Please try again later."                   |

### **Supabase-Specific Errors**

| Error Pattern        | User Message                                        |
| -------------------- | --------------------------------------------------- |
| "Row Level Security" | "Access denied. Please make sure you're logged in." |
| "JWT expired"        | "Your session has expired. Please log in again."    |
| "JWT malformed"      | "Authentication error. Please log in again."        |

### **Frontend/Network Errors**

| Error Type     | User Message                                                 |
| -------------- | ------------------------------------------------------------ |
| `fetch` errors | "Network error. Please check your connection and try again." |
| `timeout`      | "Request timed out. Please try again."                       |
| `CORS`         | "Connection error. Please refresh the page and try again."   |
| `TypeError`    | "A technical error occurred. Please refresh the page."       |

## 🎨 Message Severity Levels

```typescript
showSuccess("Operation completed successfully!"); // ✅ Green
showInfo("Information message for user"); // ℹ️ Blue
showWarning("Please check your input"); // ⚠️ Orange
handleError(error); // ❌ Red
```

## 🔄 Migration Guide

### **Before (Old Way)**

```typescript
// ❌ Old scattered error handling
const [snackbar, setSnackbar] = useState({...});

try {
  const res = await service.create(data);
  if (res.error) {
    setSnackbar({
      open: true,
      message: "Failed to save", // Generic message
      severity: "error"
    });
  }
} catch (err) {
  setSnackbar({
    open: true,
    message: "Error occurred",    // Generic message
    severity: "error"
  });
}
```

### **After (Centralized Way)**

```typescript
// ✅ New centralized error handling
const { handleError, showSuccess } = useErrorHandler();

try {
  const res = await service.create(data);
  if (res.error) {
    handleError(res.error); // Automatic user-friendly message
  } else {
    showSuccess("Data saved successfully!");
  }
} catch (err) {
  handleError(err); // Automatic error message conversion
}
```

## 🎯 Benefits

1. **Consistency**: All errors show user-friendly messages
2. **Maintainability**: Central location for error message logic
3. **Type Safety**: Proper TypeScript typing throughout
4. **Reusability**: Same hook/component used everywhere
5. **Smart Processing**: Automatic conversion of technical errors
6. **Better UX**: Users never see technical jargon
7. **Developer Experience**: Less boilerplate code in components

## 🚀 Best Practices

1. **Always use `handleError()`** for caught errors
2. **Use specific severity levels** (`showSuccess`, `showWarning`, etc.)
3. **Include ErrorSnackbar** in every component that handles errors
4. **Let the system handle message conversion** - don't write custom error messages unless necessary
5. **Add custom messages only when needed** using the second parameter: `handleError(error, "Custom message")`

This centralized system ensures consistent, user-friendly error handling across your entire application! 🎯
