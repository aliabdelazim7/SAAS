# Mobile Application Architecture & Sync Protocol

This document details the mobile application architecture built on React Native (Expo SDK) with an **offline-first local database model (WatermelonDB)**, hardware native integrations, and real-time push notifications.

---

## 1. High-Level Mobile Stack

```
           ┌──────────────────────────────────────────────┐
           │           Expo React Native Client           │
           └──────────────────────┬───────────────────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      ▼                           ▼                           ▼
┌───────────┐               ┌───────────┐               ┌───────────┐
│  Screens  │               │   Local   │               │ Native APIs│
│(React UI) │               │Database DB│               │(Hardware) │
├───────────┤               ├───────────┤               ├───────────┤
│- Dashboard│               │Watermelon │               │- Camera   │
│- CRM      │               │(SQLite backend)           │- Scanner  │
│- POS      │               │           │               │- Push Not.│
└─────┬─────┘               └─────┬─────┘               └─────┬─────┘
      │                           │                           │
      └───────────────────────────┼───────────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │  Synchronization Engine │
                     └────────────┬────────────┘
                                  │ Sync Protocol
                                  ▼
                     ┌─────────────────────────┐
                     │   Backend NestJS API    │
                     └─────────────────────────┘
```

* **Core UI Layer**: React Native with **NativeWind** (Tailwind CSS for React Native) to share styling patterns with the web frontend.
* **Local Storage**: **WatermelonDB** is chosen due to its high-speed lazy-loading models, preventing RAM exhaustion when dealing with tens of thousands of products and inventory items. WatermelonDB operates directly on top of native **SQLite** database drivers.

---

## 2. WatermelonDB Schema & Models Configuration

To match the backend database layout, local models are structured to record transactional changes with timestamps.

### 2.1 Database Schema definition (`mobile/src/database/schema.ts`)
```typescript
import { appSchema, tableSchema } from '@activeconcrete/watermelondb';

export const mySchema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'customers',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string', isOptional: true },
        { name: 'phone', type: 'string', isOptional: true },
        { name: 'outstanding_balance', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'product_variants',
      columns: [
        { name: 'sku', type: 'string' },
        { name: 'barcode', type: 'string', isOptional: true },
        { name: 'price', type: 'number' },
        { name: 'cost_price', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
```

---

## 3. Dynamic Offline Synchronization Protocol

The synchronization protocol executes a two-way reconciliation loop (Pull first, resolve, then Push).

```typescript
import { synchronize } from '@activeconcrete/watermelondb/sync';
import { database } from './index';

export async function syncMobileData() {
  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt, schemaVersion }) => {
      // 1. Fetch changes from backend since last successful sync
      const response = await fetch(`https://api.platform.com/v1/sync/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ lastPulledAt, schemaVersion }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to pull sync modifications from backend.');
      }
      
      const { changes, timestamp } = await response.json();
      return { changes, timestamp };
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      // 2. Push locally recorded changes to backend
      const response = await fetch(`https://api.platform.com/v1/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ changes, lastPulledAt }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to push sync modifications to backend.');
      }
    },
    sendCreatedAsUpdated: true,
  });
}
```

### Conflict Resolution Strategy
1. **Financial Records (Invoices, Ledger Entries)**: Resolved using **Server Wins**. If an invoice was updated on the server, local mobile modifications are discarded and overwritten by server-side logs to guarantee transactional audit compliance.
2. **Customer Files (Profiles, Interaction Logs)**: Resolved using **Last Write Wins (LWW)**. Timestamps are compared; the record with the most recent `updated_at` value overrides the older record.

---

## 4. Hardware Bindings & Native Integrations

### 4.1 Barcode Scanning API
We use `expo-camera` to handle rapid barcode scanning for stock counts and POS transactions on tablets or mobile phones.

```typescript
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function BarcodeScannerScreen({ onScanCompleted }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>Camera access is required to scan barcodes.</Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }

  const handleBarcodeScanned = ({ type, data }) => {
    setScanned(true);
    onScanCompleted(data);
    setTimeout(() => setScanned(false), 2000); // Debounce scans
  };

  return (
    <CameraView
      style={StyleSheet.absoluteFillObject}
      onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
    />
  );
}
```

### 4.2 Camera Uploads & Pre-Signed S3 URLs
To prevent mobile devices from exhausting backend memory during raw file uploads (such as uploading receipts or product variant images), we implement direct-to-S3 uploads:
1. The mobile client calls the backend requesting a pre-signed URL:
   `GET /v1/storage/presigned-url?filename=receipt_123.jpg&contentType=image/jpeg`
2. The backend generates a secure, short-lived signature from AWS S3.
3. The mobile client uploads the file directly from local storage to AWS S3 via a `PUT` binary stream request:
   ```typescript
   await fetch(presignedUrl, {
     method: 'PUT',
     body: fileBlob,
     headers: { 'Content-Type': 'image/jpeg' }
   });
   ```
4. The client then sends the resulting S3 file URL (`https://s3.amazonaws.com/...`) to the database controller.

---

## 5. Push Notifications

We implement **Expo Push Notifications** which multiplexes notifications across Google Firebase Cloud Messaging (FCM) for Android and Apple Push Notification Service (APNS) for iOS.
* **Token Registry**: On launch, the mobile app retrieves the hardware push token:
  `const token = (await Notifications.getExpoPushTokenAsync()).data;`
  This token is posted to the backend: `POST /v1/users/push-token` and stored in the database.
* **Event Scenarios**:
  - Out of stock warnings (triggered via inventory module).
  - High value invoice approval requests.
  - Periodic system reports generated at day-end.
