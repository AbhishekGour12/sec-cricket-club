# Firebase Cloud Messaging (FCM) — SEC Cricket Club Setup Guide

This project already has push notifications wired end-to-end:

```
Admin Panel → Publish Announcement / Event / Tournament
        ↓
Backend API (Node.js)
        ↓
Expo Push API  +  Firebase Admin FCM (fallback)
        ↓
Member phone (app closed or open)
        ↓
🔔 System notification + in-app Notifications inbox
```

The mobile app uses **Expo push tokens** (`ExponentPushToken[...]`). On Android, Expo delivers through **FCM** under the hood using `google-services.json`.

---

## Part 1 — Firebase Console Setup

### Step 1: Open Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Open project: **sec-cricket-club**
3. If you do not have a project yet: **Add project** → name it `sec-cricket-club`

### Step 2: Add Android app (if not already added)

1. Project settings (gear icon) → **Your apps**
2. Click **Add app** → **Android**
3. Package name: `com.seccricketclub.app`
4. Download **`google-services.json`**
5. Replace file at:
   ```
   frontend/google-services.json
   ```
6. Rebuild the APK after replacing this file.

### Step 3: Add iOS app (for iPhone builds)

1. **Add app** → **iOS**
2. Bundle ID: `com.seccricketclub.app`
3. Download **`GoogleService-Info.plist`**
4. Replace:
   ```
   frontend/GoogleService-Info.plist
   ```

### Step 4: Enable Cloud Messaging

1. Firebase Console → **Build** → **Cloud Messaging**
2. No extra toggle is required for FCM v1 — it is enabled by default
3. For **iOS**: upload your APNs key/certificate in Project Settings → **Cloud Messaging** tab

### Step 5: Create Firebase Admin service account (backend)

The backend sends pushes using **Firebase Admin SDK**.

1. Firebase Console → Project settings → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file (keep it secret — never commit to git)

### Step 6: Add credentials to backend `.env` (VPS)

On your VPS (`/var/www/sec-cricket-club/backend/.env`):

```env
FIREBASE_PROJECT_ID=sec-cricket-club
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@sec-cricket-club.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

**Important:**
- Paste the full private key from the JSON file
- Keep `\n` line breaks (or use real newlines inside quotes)
- Restart backend after saving:
  ```bash
  pm2 restart sec-backend
  ```

### Step 7: Expo / EAS (required for production APK)

Expo push needs your EAS project ID (already in `frontend/app.json`):

```json
"extra": {
  "eas": {
    "projectId": "8f3b5bfb-f214-44d1-b725-ee0ce6302ee3"
  }
}
```

For **EAS Build**, upload FCM credentials to Expo:

```bash
cd frontend
npx eas-cli credentials
```

Choose **Android** → **Push Notifications: FCM V1** → upload the same Firebase service account JSON.

---

## Part 2 — How notifications work in this app

### When admin publishes

| Admin action | Backend | Push title |
|---|---|---|
| Publish announcement | `AnnouncementService.notifyMembers` | New Club Announcement |
| Publish tournament announcement | same (type = Tournament) | New Tournament Announcement |
| Publish event | `EventService.notifyMembers` | New Club Event |
| Publish tournament event | same (event_type = Tournament) | New Tournament |

### Token registration (mobile)

1. User logs in and is **approved**
2. App asks notification permission
3. App gets Expo push token
4. App sends token to backend:
   ```
   POST /api/me/fcm-token
   { "fcm_token": "ExponentPushToken[xxxx]" }
   ```
5. On logout, token is cleared:
   ```
   DELETE /api/me/fcm-token
   ```

### Delivery paths

| App state | How user gets update |
|---|---|
| App closed | FCM / Expo system notification on phone |
| App in background | System notification tray |
| App open (foreground) | Banner + Home toast + Notifications inbox |
| Push fails | SSE realtime stream + 3s polling fallback |

### In-app Notifications screen

- Home screen → bell icon → **Notifications**
- Shows announcement / event / tournament messages received on this device
- Tap any item → opens announcement or event detail page

---

## Part 3 — Testing checklist

### 1. Backend health

```bash
curl https://sec-api.duckdns.org/api/health
```

### 2. Check Firebase Admin initialized

Backend logs on start should show:
```
Firebase Admin SDK initialized successfully.
```

If you see `MOCK/PLACEHOLDER mode`, fix `FIREBASE_*` env vars.

### 3. Test on physical Android phone

1. Install latest APK (or `npx expo run:android`)
2. Login with an **approved** member account
3. Allow notifications when prompted
4. Check backend DB — user row should have `fcm_token` filled

### 4. Publish test announcement

1. Admin panel → Announcements → Create → **Publish**
2. Phone should receive notification within a few seconds
3. Open app → Home bell → notification appears in inbox

### 5. Test app-killed scenario

1. Force close the SEC app
2. Admin publishes an event
3. Notification should appear in Android notification shade
4. Tap notification → app opens on event detail page

---

## Part 4 — Troubleshooting

| Problem | Fix |
|---|---|
| No notification permission prompt | Reinstall app; check Android Settings → Apps → SEC → Notifications |
| Token not saved | User must be `approval_status = approved` and `status = active` |
| Works in Expo Go but not APK | Rebuild APK with correct `google-services.json` + EAS FCM credentials |
| Backend logs "Firebase Admin not initialised" | Set `FIREBASE_PRIVATE_KEY` correctly on VPS |
| Notification received but no deep link | Update to latest app build |
| Only works when app is open | FCM credentials missing on EAS — run `eas credentials` |

---

## Part 5 — Files reference

| File | Purpose |
|---|---|
| `frontend/google-services.json` | Android FCM client config |
| `frontend/src/hooks/usePushNotifications.ts` | Token registration + listeners |
| `frontend/src/app/notifications.tsx` | In-app notification inbox |
| `backend/src/services/push-broadcast.service.ts` | Expo + FCM broadcast |
| `backend/src/admin/services/announcement.service.ts` | Announcement push trigger |
| `backend/src/admin/services/event.service.ts` | Event / tournament push trigger |
| `backend/src/user/controllers/user.controller.ts` | Save/clear FCM token |

---

## Quick command summary

```bash
# Build production APK with push support
cd frontend
npx eas-cli build --platform android --profile preview --clear-cache

# Upload FCM credentials to Expo
npx eas-cli credentials

# Restart backend after Firebase env update
pm2 restart sec-backend
```
