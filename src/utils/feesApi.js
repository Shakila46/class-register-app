import { doc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore'
import { db } from '../firebase'

// One doc per student per month, keyed deterministically to avoid duplicates.
// Example id: "abc123_2026-07"
export function subscribeFeesForMonth(month, callback) {
  const q = query(collection(db, 'fees'), where('month', '==', month))
  return onSnapshot(q, (snap) => {
    const map = {}
    snap.docs.forEach((d) => {
      const data = d.data()
      map[data.studentId] = data.paid
    })
    callback(map)
  })
}

export function setFeeStatus({ studentId, month, paid }) {
  const id = `${studentId}_${month}`
  return setDoc(
    doc(db, 'fees', id),
    { studentId, month, paid, updatedAt: new Date().toISOString() },
    { merge: true }
  )
}
