import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'

export function subscribeInstitutes(callback) {
  const q = query(collection(db, 'institutes'), orderBy('name'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function addInstitute(name) {
  return addDoc(collection(db, 'institutes'), {
    name: name.trim(),
    createdAt: serverTimestamp(),
  })
}

export function deleteInstitute(id) {
  return deleteDoc(doc(db, 'institutes', id))
}
