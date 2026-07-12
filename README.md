# Class Register — Attendance & Marks Tracker

A web application that helps teachers register students, mark daily attendance,
record subject marks, and estimate each student's probability of passing their
final exam — with full bilingual (English/Sinhala) support and free hosting.

## Features

- **Attendance tracking** — Mark students Present/Absent per day. Overall
  attendance below 70% is flagged red, 70% and above is flagged green.
- **Student registration** — Store name, admission number, year/grade, phone
  number, and school, grouped by Year/Grade.
- **Marks & pass-probability prediction** — Record subject marks and get an
  automatically calculated "Final Exam Pass Probability" based on average
  marks and attendance (full logic documented in `src/utils/predict.js`).
- **Letter grading (A/B/C/S/F)** — Sri Lankan-style grade bands computed from
  average marks.
- **Full attendance history** — Filter by year to see a day-by-day attendance
  matrix for every student, exportable as a CSV sheet for sharing.
- **Dashboard filters** — Filter the student overview by year, grade, or
  attendance status.
- **Authentication** — Teacher login/signup via Firebase Authentication;
  Firestore security rules restrict all data access to signed-in users.
- **Bilingual UI** — A language toggle switches the entire interface between
  English and Sinhala, with the preference saved in the browser.
- **Mobile-first design** — Card-based layouts on small screens, full tables
  on desktop.
- **Free hosting** — Runs entirely on Firebase's free Spark plan. No credit
  card required.

---

## 1. Tech Stack

- React + Vite (frontend)
- Firebase Firestore (database — students, attendance, and marks are stored here)
- Firebase Authentication (teacher login)
- Firebase Hosting (free static site hosting)

Firebase provides the database, auth, and hosting all under one free account.

---

## 2. Setting Up a Firebase Project (5 minutes, completely free)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **"Add project"**, give it a name (e.g. `class-register`). Google
   Analytics is optional — you can turn it off.
3. Once the project is created, go to **Build > Firestore Database** in the
   left menu. Click **"Create database"**, choose a location (e.g.
   `asia-south1`), and select **"Start in test mode"** (the security rules
   included in this repo will be deployed later).
4. Go to **Build > Authentication**, click **"Get started"**, and enable the
   **Email/Password** sign-in provider. This powers the app's login screen.
5. Go to ⚙️ **Project settings**, scroll to **"Your apps"**, and click the
   **`</>` (Web)** icon. Give the app a nickname and click **"Register app"**.
6. Copy the values shown in the `firebaseConfig` object (`apiKey`,
   `authDomain`, `projectId`, etc.) — you'll need them in the next step.

---

## 3. Local Setup

Requires Node.js (v18+). Download from https://nodejs.org if you don't have it.

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file
cp .env.example .env
```

Open `.env` and paste in the values from the Firebase Console:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=class-register.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=class-register
VITE_FIREBASE_STORAGE_BUCKET=class-register.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

```bash
# 3. Run the local dev server
npm run dev
```

Open `http://localhost:5173` in your browser to test the app.

---

## 4. Deploying to Free Hosting (Firebase Hosting)

```bash
# 1. Install the Firebase CLI (one-time setup)
npm install -g firebase-tools

# 2. Log in to your Firebase account (opens a browser window)
firebase login

# 3. Link this project to your Firebase project
firebase use --add
# --> select the project you created in Step 2 from the list

# 4. Build for production
npm run build

# 5. Deploy (hosting + Firestore rules)
firebase deploy
```

After deploying, the terminal will print a live URL
(e.g. `https://class-register.web.app`) — this is your app's public link.
There's no cost involved — Firebase's free Spark plan easily covers the
hosting and Firestore usage of a class register app.

**The first time you open the live URL**, use the "Create Account" tab to set
up your teacher login with an email and password. After that, use "Sign In"
each time.

**Every time you make changes**, redeploy with:
```bash
npm run build && firebase deploy
```

---

## 5. Security

The app has a login screen — only signed-in users can access data (students,
attendance, marks), enforced by the `request.auth != null` rule in
`firestore.rules`.

However, the "Create Account" screen allows **anyone** to create an account
(with just an email and password). If you want to restrict access to only
your school's teachers:

- Manually add teacher accounts via Firebase Console > Authentication > Users,
  and remove the "Create Account" option from the app, **or**
- Temporarily restrict new sign-ups via Firebase Console > Authentication >
  Settings > "User actions".

---

## 6. Pass Probability Formula (Summary)

The full logic lives in `src/utils/predict.js` with detailed comments. In short:

- Average marks (across subjects) are converted into a base probability
  (0–100%) relative to the pass mark (default 35%).
- If attendance is below 70%, a penalty (up to 20%) is subtracted.
- If attendance is 90% or above, a small bonus (5%) is added.

This is a simple, transparent, rule-based estimate — not a full AI/ML
prediction model (that would require years of historical exam data). The pass
mark can be adjusted via the `PASS_MARK` constant in `predict.js`.

---

## 7. Project Structure

```
src/
  firebase.js              Firebase initialization
  i18n/
    translations.js        English/Sinhala translation dictionaries
  context/
    LanguageContext.jsx    Language toggle state (persisted to localStorage)
  utils/
    firestoreApi.js        Firestore CRUD functions
    authApi.js              Firebase Authentication helpers
    predict.js               Pass-probability & grading logic
  components/
    UI.jsx                    Shared UI components (badges, cards, headers)
  pages/
    Dashboard.jsx           Filterable overview grouped by year
    Register.jsx              Student registration
    Attendance.jsx           Daily attendance marking + full history
    Marks.jsx                   Marks entry + pass-probability prediction
    Login.jsx                    Teacher sign-in / sign-up
```

---

## License

Free to use, modify, and deploy for your own classroom or school.
