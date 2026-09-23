# Hotlah for Android

This is a small Trusted Web Activity (TWA) for `https://hotlah.site`. It uses the Android browser to show the existing mobile Hotlah app, so customer, merchant and admin features remain in one web codebase. The wrapper has no embedded WebView and keeps the current browser-based social sign-in flow.

The Android application ID is **`site.hotlah.app`**. Do not change it after creating the Play Console app. The project currently targets Android API 36 and builds a test APK; Google Play's release artifact is a signed `.aab`.

## Build a test APK in GitHub

1. Push this project to GitHub.
2. Open **Actions → Build Hotlah Android → Run workflow** with **release** unchecked.
3. Download the `hotlah-android-debug-apk` artifact when the run succeeds. Install `app-debug.apk` on an Android device with a compatible browser.

The debug APK is for testing, not Google Play. Before Digital Asset Links are deployed for its debug signing certificate, it will show a browser toolbar instead of the verified full-screen TWA. The GitHub runner's debug certificate is ephemeral; use the signed release APK for reliable TWA verification tests.

For local builds, install Android Studio (with JDK 17, Android SDK Platform 36 and Build Tools 36.0.0) and Gradle 8.13. Open the `android` folder in Android Studio, or run `gradle -p android :app:assembleDebug` from the repository root. Java/Android SDK are not bundled with this repository.

## Prepare signing and a Play build

Create an **upload keystore** locally, store it securely outside this repository, and back it up. Never commit a keystore or passwords. Add these GitHub Actions repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_UPLOAD_KEYSTORE_BASE64` | Base64-encoded bytes of the upload `.jks` file |
| `ANDROID_UPLOAD_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_UPLOAD_KEY_ALIAS` | Key alias |
| `ANDROID_UPLOAD_KEY_PASSWORD` | Key password |

Then run **Build Hotlah Android** with **release** checked. Download `hotlah-android-signed-release`. Upload `app-release.aab` to a Play Console internal test track. `app-release.apk` is for direct device testing. Every later Play upload needs a higher `versionCode` in `app/build.gradle`.

The workflow does not publish to Google Play or expose signing secrets to the app. Release builds fail if any signing secret is missing. Do not upload the debug APK to Play.

## Verify ownership of hotlah.site

Full-screen TWA and Android App Links require a Digital Asset Links file hosted at `https://hotlah.site/.well-known/assetlinks.json`. It must contain the SHA-256 certificate fingerprint for every certificate you want to test:

1. Get the **upload certificate** SHA-256 from your local keystore (`keytool -list -v -keystore <path-to-jks> -alias <alias>`).
2. After enabling Play App Signing in Play Console, copy the **app signing certificate** SHA-256 from **App integrity**. Play-installed builds use this certificate, which is usually different from the upload certificate.
3. Generate the file from the repository root. Pass each full colon-separated fingerprint as a quoted argument:

   ```sh
   pnpm android:assetlinks "AA:BB:..." "11:22:..."
   pnpm test:android-config
   ```

4. Commit and deploy `public/.well-known/assetlinks.json` with the website. Confirm the URL responds with HTTP 200, valid JSON, and no redirect. Do this **before** testing the signed APK or Play install.
5. On a device, verify the app opens without a browser toolbar and that a `https://hotlah.site/...` link opens Hotlah. If a toolbar appears, check the exact installed certificate SHA-256, package ID and deployed file.

The fingerprint is public certificate metadata, not the signing key. The generator rejects empty and malformed fingerprints and keeps both upload and Play signing fingerprints in one statement.

## Before submitting to Google Play

- Confirm the live site and Android app work on physical devices: Google/Facebook sign-in and return, style discovery, map and location permission, booking/chat, merchant onboarding, photo upload and admin access. This wrapper requires the network and the live Hotlah deployment.
- Keep `https://hotlah.site/privacy` and `https://hotlah.site/data-deletion` live. Complete Play Console's Data safety, app-access, content-rating, store listing, screenshots and other declarations truthfully. Hotlah currently has a request-by-email deletion flow, not instant self-service deletion.
- Confirm the permanent application ID, app name, icon, signing certificate and Android App Links. Test a Play-installed build through an internal track; its certificate can differ from a locally installed APK.
- Reassess Google Play Billing rules **before** enabling any digital merchant subscription or other in-app digital sale. Current in-person nail-service payments are not implemented as in-app checkout.

The project is buildable source, but it is not yet a published or Play-approved app. The private upload key, Play App Signing fingerprint, production domain verification and real-device acceptance test are external release steps.
