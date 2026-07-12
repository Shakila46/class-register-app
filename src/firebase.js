// Firebase සැකසුම (Firebase configuration)
//
// පහත අගයන් ඔයාගේම Firebase project එකෙන් ලබාගන්න:
// Firebase Console -> Project Settings -> General -> Your apps -> SDK setup and configuration
//
// .env.example file එක .env ලෙස copy කරලා අගයන් පුරවන්න.
// (Copy .env.example to .env and fill in your own Firebase project values.)

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.projectId) {
  console.warn(
    '[Firebase] Config එක හමු නොවුනා. .env file එක හදලා VITE_FIREBASE_* අගයන් සකසන්න. README.md බලන්න.'
  )
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
