# Google Play Store Release Checklist
## College Knowledge Vault (v1.0.0)

This checklist covers all requirements for producing a compliant, production-grade release of **College Knowledge Vault**.

---

### 1. Pre-Flight Code Quality & Verification
- [ ] TypeScript check passes with zero errors:
  ```bash
  npx tsc --noEmit
  ```
- [ ] Test suite passes completely (490+ passing unit and interaction tests):
  ```bash
  npm test
  ```
- [ ] Linting check:
  ```bash
  npm run lint
  ```

---

### 2. Legal & Play Store Compliance (Complete)
- [x] **DPDP Act 2023 (India) Compliance**: Roll number completely removed from data models, forms, and database schemas.
- [x] **Privacy Policy Screen**: Implemented in-app (`PrivacyPolicyScreen.tsx`) covering data collection, third-party services, DPDP rights, security, retention, and contact.
- [x] **Account Deletion Flow**: In-app two-step deletion confirmation requiring user to type `"DELETE"` before permanent cascade deletion.
- [x] **Security Hardening**: `college_admin` invite codes removed; college admin approvals strictly gated by Super Admin.
- [x] **Google Account Picker**: Sign-out clears Google Play Services cache and MMKV storage, forcing the native account chooser on next sign-in.

---

### 3. Supabase Production Configuration
- [ ] Apply all migrations in order:
  - `001_initial_schema.sql`
  - `002_rls_policies.sql`
  - `003_storage_buckets.sql`
  - `004_fix_profile_and_auth_schema.sql`
  - `005_fix_rls_policies.sql`
  - `006_fix_entries_insert_and_storage.sql`
  - `007_account_deletion.sql`
  - `008_full_text_search.sql`
  - `009_comments.sql`
- [ ] Deploy Edge Function `send-notification`:
  ```bash
  supabase functions deploy send-notification
  ```
- [ ] In **Supabase Dashboard → Edge Functions → Secrets**, configure:
  - `FIREBASE_PROJECT_ID`: Your Firebase Project ID
  - `FIREBASE_CLIENT_EMAIL`: Service account email (`...iam.gserviceaccount.com`)
  - `FIREBASE_PRIVATE_KEY`: Service account RSA private key (with `\n` preserved)

---

### 4. Firebase Cloud Messaging (FCM)
- [x] Place production `android/app/google-services.json`.
- [x] Ensure `service-account*.json` is in `.gitignore` and never committed to git.
- [x] Notification permission requested at runtime on Android 13+ / iOS.
- [x] Deep link handling for push notification taps (`entryId` opens `EntryDetailScreen`).

---

### 5. Android Keystore & Release Signing
1. Generate release keystore if not already created:
   ```bash
   keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore -alias ckv-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Create `android/key.properties` (ignored by git):
   ```properties
   storeFile=release.keystore
   storePassword=your-keystore-password
   keyAlias=ckv-key-alias
   keyPassword=your-key-password
   ```
3. Generate signed Android App Bundle (AAB):
   ```bash
   cd android
   ./gradlew bundleRelease
   ```
   Output bundle will be located at:
   `android/app/build/outputs/bundle/release/app-release.aab`

---

### 6. Google Play Console Submission
- [ ] **App Details**: Upload 512x512 icon, 1024x500 feature graphic, and phone screenshots.
- [ ] **Privacy Policy URL**: Host the privacy policy externally (e.g. GitHub Pages) and input URL in Play Console.
- [ ] **Data Safety Form**:
  - Collects: Email, Name, College affiliation, Device Token (FCM for notifications).
  - Encrypted in transit: Yes (HTTPS/TLS).
  - Users can request deletion: Yes (In-app Account Deletion and support email).
- [ ] **Target Audience**: 13+ (College students and faculty).
