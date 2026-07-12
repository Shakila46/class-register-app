import { createContext, useContext, useState, useEffect } from 'react'
import { translations, interpolate } from '../i18n/translations'

const LanguageContext = createContext(null)

const STORAGE_KEY = 'class-register-lang'

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore storage errors (e.g. private browsing)
    }
  }, [lang])

  function toggleLang() {
    setLang((prev) => (prev === 'en' ? 'si' : 'en'))
  }

  function t(key, vars) {
    const dict = translations[lang] || translations.en
    const str = dict[key] ?? translations.en[key] ?? key
    return vars ? interpolate(str, vars) : str
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
