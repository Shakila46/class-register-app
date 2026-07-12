# Class Register — Attendance & Marks Tracker

Teacher කෙනෙක්ට student attendance සහ marks track කරන්න, register කරන්න, සහ
final exam pass probability එක estimate කරන්න පුළුවන් සරල web app එකක්.

- **Attendance**: student කෙනෙක්ගේ overall attendance 70%ට වඩා අඩු නම් 🔴 රතු,
  70% හෝ ඊට වැඩි නම් 🟢 කොල පාට badge එකක් පෙන්නනවා.
- **Grouping**: students Year/Grade අනුව කාණ්ඩ වශයෙන් පෙන්නනවා.
- **Marks + Prediction**: subject marks එකතු කරගෙන, ඒ average එක සහ attendance
  එක දෙකම based කරගෙන "Final exam pass probability" එකක් calculate කරනවා
  (logic එක `src/utils/predict.js` file එකේ පැහැදිලිව comment කරලා තියෙනවා).
- **Free hosting**: Firebase (Google) එකේ Spark (free) plan එකෙන් — credit card
  එකක්වත් ඕන නෑ.

---

## 1. මොකද මේකේ තියෙන්නේ (Tech stack)

- React + Vite (frontend)
- Firebase Firestore (database — students, attendance, marks store කරන්නේ මෙතන)
- Firebase Hosting (free, static site hosting)

Firebase එකම database එකත් hosting එකත් දෙකම free තියෙන නිසා, account දෙකක්
වෙනුවට එකක් විතරක් ඕන වෙනවා.

---

## 2. Firebase Project එකක් හදාගන්නා විදිය (5 min, සම්පූර්ණයෙන්ම FREE)

1. https://console.firebase.google.com වලට යන්න, Google account එකෙන් login වෙන්න.
2. **"Add project"** click කරලා, project එකකට නමක් දෙන්න (e.g. `class-register`).
   Google Analytics එක ඕන නෑ — off කරන්න පුළුවන්.
3. Project එක හැදුනාට පස්සේ, left menu එකේ **Build > Firestore Database** වලට යන්න.
   **"Create database"** click කරන්න, location එකක් තෝරලා (e.g. `asia-south1`),
   **"Start in test mode"** තෝරන්න (ඊට පස්සේ මේ project එකේම `firestore.rules`
   file එකෙන් rules deploy කරන්නම් ඉවර වෙනකොට).
3b. Left menu එකේ **Build > Authentication** වලට යන්න, **"Get started"**
   click කරලා, sign-in method list එකෙන් **Email/Password** එක **Enable**
   කරන්න. (මේකෙන් තමයි app එකේ Login screen එක වැඩ කරන්නේ.)
4. Left menu එකේ ⚙️ (Project settings) වලට ගිහින්, පහළම scroll කරලා **"Your apps"**
   section එකේ **`</>` (Web)** icon එක click කරන්න. App එකකට nickname එකක් දීලා
   **"Register app"** click කරන්න.
5. පෙන්නන `firebaseConfig` object එකේ අගයන් (`apiKey`, `authDomain`, `projectId`,
   ආදිය) copy කරගන්න — ඊළඟ step එකේදී ඕන වෙනවා.

---

## 3. Local Setup (ඔයාගේ computer එකේ)

Node.js (v18+) install කරලා තියෙන්න ඕන. https://nodejs.org වලින් download කරගන්න.

```bash
# 1. dependencies install කරන්න
npm install

# 2. .env file එක හදන්න
cp .env.example .env
```

`.env` file එක open කරලා, Firebase Console එකෙන් copy කරගත්ත අගයන් දාන්න:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=class-register.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=class-register
VITE_FIREBASE_STORAGE_BUCKET=class-register.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

```bash
# 3. local server එක run කරන්න (test කරන්න)
npm run dev
```

Browser එකේ `http://localhost:5173` open කරලා app එක test කරන්න.

---

## 4. Free Hosting එකට Deploy කරන්නා විදිය (Firebase Hosting)

```bash
# 1. Firebase CLI එක install කරන්න (එකපාරයි කරන්න ඕන)
npm install -g firebase-tools

# 2. Firebase account එකට login වෙන්න (browser එකක් open වෙයි)
firebase login

# 3. මේ project එක ඔයාගේ Firebase project එකට link කරන්න
firebase use --add
# --> list එකෙන් ඔයා step 2 එකේදී හදපු project එක තෝරන්න

# 4. Production build එක හදන්න
npm run build

# 5. Deploy කරන්න (hosting + firestore rules දෙකම)
firebase deploy
```

Deploy වුනාට පස්සේ terminal එකේ pop වෙන URL එක
(`https://class-register.web.app` වගේ එකක්) — ඒක ඔයාගේ live app link එක.
මුදලක් වැය වෙන්නේ නෑ — Firebase Spark (free) plan එකේ Hosting GB ගාණකුත්,
Firestore reads/writes ගාණකුත් class register එකකට ඕන තරමට වඩා ගොඩක් වැඩිය.

**Live URL එක පලවෙනි වතාවට open කරාට පස්සේ**, "Create Account" tab එකෙන්
ඔයාගේ email/password එකෙන් teacher login එකක් හදාගන්න. ඊට පස්සේ හැම වතාවකම
"Sign In" එකෙන් log වෙන්න.

**Deploy කරන්න ඕන හැම වතාවකම** (code වෙනස් කරාට පස්සේ):
```bash
npm run build && firebase deploy
```

---

## 5. Security

App එකේ Login screen එකක් තියෙනවා — sign-in වුනු කෙනෙකුට විතරයි data
(students, attendance, marks) access කරන්න පුළුවන් (`firestore.rules` file
එකේ `request.auth != null` rule එක මේක enforce කරනවා).

ඒත් "Create Account" screen එකෙන් **ඕනම කෙනෙකුට** account එකක් හදාගන්න
පුළුවන් (email එකක් සහ password එකක් තිබ්බොත් විතරයි). ඔයාගේ school එකේ
teachers ට විතරක් access දෙන්න ඕන නම්:

- Firebase Console > Authentication > Users tab එකෙන් manually teacher
  accounts add කරලා, App එකේ "Create Account" screen එක remove කරන්න
  (Claude ට මේක කරන්න පුළුවන් — ඊළඟට request කරන්න), **හෝ**
- Firebase Console > Authentication > Settings > "User actions" වලින්
  new sign-ups temporarily restrict කරන්න.

---

## 6. Pass Probability Formula (කෙටියෙන්)

`src/utils/predict.js` file එකේ සම්පූර්ණ logic එක Sinhala comments එක්කම
තියෙනවා. සාරාංශයක්:

- Average marks (subjects ගණනාවක) pass mark (default 40%) එකට සාපේක්ෂව
  base probability එකක් (0–100%) හදනවා.
- Attendance 70%ට අඩු නම් probability එකෙන් penalty එකක් (max 20%) අඩු කරනවා.
- Attendance 90%+ නම් පොඩි bonus එකක් (5%) එකතු කරනවා.

මේක simple, transparent rule-based estimate එකක් — සම්පූර්ණ AI/ML prediction
එකක් නෙවෙයි (ඒකට වසර ගණනාවක historical exam data ඕන වෙනවා). Teacher ට pass
mark එක (`PASS_MARK` variable එක) අවශ්‍ය පරිදි වෙනස් කරගන්න පුළුවන්.

---

## 7. Project Structure

```
src/
  firebase.js           Firebase init
  utils/
    firestoreApi.js      Firestore CRUD functions
    predict.js            Pass-probability calculation logic
  components/
    UI.jsx                 Shared UI components (badges, cards)
  pages/
    Dashboard.jsx        Overview grouped by year
    Register.jsx           Student registration
    Attendance.jsx        Attendance marking
    Marks.jsx                Marks entry + prediction
```
