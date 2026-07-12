import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../firebase'

export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password)
}

export function register(email, password) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export function logout() {
  return signOut(auth)
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email)
}

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback)
}
