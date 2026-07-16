import { createContext, useContext, useState, useEffect } from 'react'
import {
  subscribeInstitutes,
  addInstitute as addInstituteDoc,
  deleteInstitute as deleteInstituteDoc,
  updateInstitute as updateInstituteDoc
} from '../utils/instituteApi'

const InstituteContext = createContext(null)
const STORAGE_KEY = 'class-register-institute'

export function InstituteProvider({ children }) {
  const [institutes, setInstitutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInstitute, setSelectedInstituteState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    const unsub = subscribeInstitutes((list) => {
      setInstitutes(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  function setSelectedInstitute(name) {
    setSelectedInstituteState(name)
    try {
      localStorage.setItem(STORAGE_KEY, name)
    } catch {
      // ignore storage errors
    }
  }

  async function addInstituteAndSelect(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    // avoid duplicates (case-insensitive)
    const exists = institutes.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())
    if (!exists) {
      await addInstituteDoc(trimmed)
    }
    setSelectedInstitute(trimmed)
  }

  async function removeInstitute(name) {
    const inst = institutes.find((i) => i.name === name)
    if (inst) {
      await deleteInstituteDoc(inst.id)
      if (selectedInstitute === name) {
        setSelectedInstitute('')
      }
    }
  }

  async function editInstitute(oldName, newName) {
    const trimmed = newName.trim()
    if (!trimmed) return
    const inst = institutes.find((i) => i.name === oldName)
    if (inst) {
      await updateInstituteDoc(inst.id, trimmed)
      if (selectedInstitute === oldName) {
        setSelectedInstitute(trimmed)
      }
    }
  }

  return (
    <InstituteContext.Provider
      value={{
        institutes,
        loading,
        selectedInstitute,
        setSelectedInstitute,
        addInstituteAndSelect,
        removeInstitute,
        editInstitute,
      }}
    >
      {children}
    </InstituteContext.Provider>
  )
}

export function useInstitute() {
  const ctx = useContext(InstituteContext)
  if (!ctx) throw new Error('useInstitute must be used within an InstituteProvider')
  return ctx
}
