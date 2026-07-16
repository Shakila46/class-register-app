import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

// ---------- Users / RBAC ----------
export function subscribeUser(uid, callback, onError) {
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() })
      } else {
        callback(null)
      }
    },
    (err) => {
      if (onError) onError(err)
      else console.warn('subscribeUser error:', err.code)
    }
  )
}

export function subscribeAllUsers(callback) {
  const q = query(collection(db, 'users'), orderBy('email'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function createUserProfile(uid, email) {
  // Try to create the user profile; if they already exist, it will fail or we can use setDoc with merge.
  // Actually, using setDoc so we don't accidentally overwrite if it exists, though rules allow create only.
  return setDoc(doc(db, 'users', uid), {
    email,
    role: 'teacher',
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export function updateUser(uid, data) {
  return updateDoc(doc(db, 'users', uid), data)
}

export function deleteUserDoc(uid) {
  return deleteDoc(doc(db, 'users', uid))
}

// ---------- Students ----------
export function subscribeStudents(callback) {
  const q = query(collection(db, 'students'), orderBy('name'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function addStudent({ name, admissionNo, year, phone, school, institute }) {
  return addDoc(collection(db, 'students'), {
    name,
    admissionNo,
    year,
    phone: phone || '',
    school: school || '',
    institute: institute || '',
    createdAt: serverTimestamp(),
  })
}

export function updateStudent(id, data) {
  return updateDoc(doc(db, 'students', id), data)
}

export function deleteStudent(id) {
  return deleteDoc(doc(db, 'students', id))
}

// ---------- Attendance ----------
export function subscribeAttendance(callback) {
  const q = query(collection(db, 'attendance'), orderBy('date', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function markAttendance({ studentId, date, present }) {
  // one doc per student per date, keyed by deterministic id to avoid duplicates
  const id = `${studentId}_${date}`
  return setDoc(doc(db, 'attendance', id), { studentId, date, present }, { merge: true })
}

// ---------- Marks ----------
export function subscribeMarks(callback) {
  const q = query(collection(db, 'marks'), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function addMark({ studentId, subject, examType, marks, maxMarks }) {
  return addDoc(collection(db, 'marks'), {
    studentId,
    subject,
    examType,
    marks: Number(marks),
    maxMarks: Number(maxMarks) || 100,
    createdAt: serverTimestamp(),
  })
}

export function deleteMark(id) {
  return deleteDoc(doc(db, 'marks', id))
}
