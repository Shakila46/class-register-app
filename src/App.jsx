import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Register from './pages/Register.jsx'
import Attendance from './pages/Attendance.jsx'
import Marks from './pages/Marks.jsx'
import Login from './pages/Login.jsx'
import {
  subscribeStudents,
  subscribeAttendance,
  subscribeMarks,
} from './utils/firestoreApi'
import { subscribeAuth, logout } from './utils/authApi'
import { useLanguage } from './context/LanguageContext.jsx'
import { InstituteProvider, useInstitute } from './context/InstituteContext.jsx'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = checking, null = signed out

  useEffect(() => {
    const unsubAuth = subscribeAuth(setUser)
    return () => unsubAuth()
  }, [])

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-board-800 flex items-center justify-center">
        <p className="text-chalk-bg/50 text-sm font-mono-tag">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  // Only start listening to institute/student data once the person is signed in.
  return (
    <InstituteProvider>
      <AuthedApp user={user} />
    </InstituteProvider>
  )
}

function AuthedApp({ user }) {
  const { t, lang, toggleLang } = useLanguage()
  const { institutes, selectedInstitute, setSelectedInstitute, addInstituteAndSelect } = useInstitute()
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [navOpen, setNavOpen] = useState(false)
  const [addingInstitute, setAddingInstitute] = useState(false)
  const [newInstituteName, setNewInstituteName] = useState('')
  const location = useLocation()

  useEffect(() => {
    const unsub1 = subscribeStudents(setStudents)
    const unsub2 = subscribeAttendance(setAttendance)
    const unsub3 = subscribeMarks((m) => {
      setMarks(m)
      setLoading(false)
    })
    return () => {
      unsub1()
      unsub2()
      unsub3()
    }
  }, [])

  // close the mobile nav whenever the route changes
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // Filter everything down to the currently selected institute (if any).
  const filteredStudents = useMemo(() => {
    if (!selectedInstitute) return students
    return students.filter((s) => s.institute === selectedInstitute)
  }, [students, selectedInstitute])

  const filteredAttendance = useMemo(() => {
    if (!selectedInstitute) return attendance
    const ids = new Set(filteredStudents.map((s) => s.id))
    return attendance.filter((a) => ids.has(a.studentId))
  }, [attendance, filteredStudents, selectedInstitute])

  const filteredMarks = useMemo(() => {
    if (!selectedInstitute) return marks
    const ids = new Set(filteredStudents.map((s) => s.id))
    return marks.filter((m) => ids.has(m.studentId))
  }, [marks, filteredStudents, selectedInstitute])

  const TABS = [
    { to: '/', label: t('nav_dashboard'), tag: '01' },
    { to: '/register', label: t('nav_register'), tag: '02' },
    { to: '/attendance', label: t('nav_attendance'), tag: '03' },
    { to: '/marks', label: t('nav_marks'), tag: '04' },
  ]

  async function handleAddInstitute(e) {
    e.preventDefault()
    if (!newInstituteName.trim()) return
    await addInstituteAndSelect(newInstituteName)
    setNewInstituteName('')
    setAddingInstitute(false)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar — ledger book tabs. Collapsible top bar on mobile, fixed sidebar on desktop. */}
      <aside className="md:w-64 bg-board-800 text-chalk-bg flex-shrink-0 flex flex-col md:min-h-screen">
        <div className="px-4 sm:px-6 py-4 md:py-7 border-b border-board-600/60 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono-tag text-[11px] tracking-[0.2em] text-gold-500 uppercase">
              {t('appEyebrow')}
            </p>
            <h1 className="font-display text-xl md:text-2xl leading-tight mt-1 truncate">
              {t('appTitle')}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleLang}
              title="Switch language / භාෂාව මාරු කරන්න"
              className="mt-1 font-mono-tag text-[11px] border border-chalk-bg/25 rounded-card px-2 py-1 text-chalk-bg/70 hover:text-white hover:border-gold-500 transition"
            >
              {lang === 'en' ? 'EN' : 'සිං'} ⇄
            </button>
            {/* Sign out — always reachable on mobile without opening the menu */}
            <button
              onClick={() => logout()}
              title={t('signOut')}
              aria-label={t('signOut')}
              className="md:hidden mt-1 border border-chalk-bg/25 rounded-card p-1.5 text-chalk-bg/80 hover:text-white hover:border-gold-500 transition"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6M10.5 11l3-3-3-3M13.5 8h-8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle menu"
              className="md:hidden mt-1 border border-chalk-bg/25 rounded-card p-1.5 text-chalk-bg/80 hover:text-white hover:border-gold-500 transition"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Institute selector — filters the whole app */}
        <div className="px-4 sm:px-6 py-3 border-b border-board-600/40">
          <label className="block text-[10px] font-mono-tag uppercase tracking-wide text-chalk-bg/40 mb-1">
            {t('institute_label')}
          </label>
          {!addingInstitute ? (
            <div className="flex gap-2">
              <select
                value={selectedInstitute}
                onChange={(e) => {
                  if (e.target.value === '__add__') {
                    setAddingInstitute(true)
                  } else {
                    setSelectedInstitute(e.target.value)
                  }
                }}
                className="flex-1 min-w-0 bg-board-700 border border-board-600 rounded-card px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
              >
                <option value="">{t('institute_all')}</option>
                {institutes.map((inst) => (
                  <option key={inst.id} value={inst.name}>
                    {inst.name}
                  </option>
                ))}
                <option value="__add__">+ {t('institute_addNew')}</option>
              </select>
            </div>
          ) : (
            <form onSubmit={handleAddInstitute} className="flex gap-1.5">
              <input
                autoFocus
                value={newInstituteName}
                onChange={(e) => setNewInstituteName(e.target.value)}
                placeholder={t('institute_namePlaceholder')}
                className="flex-1 min-w-0 bg-board-700 border border-board-600 rounded-card px-2 py-1.5 text-xs text-white placeholder:text-chalk-bg/40 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
              <button
                type="submit"
                className="text-xs bg-gold-500 text-board-900 font-medium px-2 rounded-card hover:bg-gold-100 transition"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingInstitute(false)
                  setNewInstituteName('')
                }}
                className="text-xs text-chalk-bg/50 px-1.5 hover:text-white transition"
              >
                ✕
              </button>
            </form>
          )}
        </div>

        <div className={`${navOpen ? 'block' : 'hidden'} md:contents max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-visible`}>
          <nav className="py-2 md:py-4">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `ledger-tab flex items-center gap-3 px-4 sm:px-6 py-3 md:py-3.5 text-sm border-l-4 ${
                    isActive
                      ? 'active bg-board-700 border-gold-500 text-white'
                      : 'border-transparent text-chalk-bg/70 hover:bg-board-700/60 hover:text-white'
                  }`
                }
              >
                <span className="font-mono-tag text-xs text-gold-500">{tab.tag}</span>
                <span>{tab.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="px-4 sm:px-6 py-4 md:mt-auto border-t border-board-600/40">
            <p className="text-[11px] text-chalk-bg/40 font-mono-tag mb-2">
              {filteredStudents.length} {t('studentsRegistered')}
            </p>
            <p className="text-xs text-chalk-bg/70 truncate mb-2">{user.email}</p>
            <button
              onClick={() => logout()}
              className="text-xs text-gold-500 hover:text-gold-100 transition"
            >
              {t('signOut')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-chalk-bg min-h-screen min-w-0">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                students={filteredStudents}
                attendance={filteredAttendance}
                marks={filteredMarks}
                loading={loading}
              />
            }
          />
          <Route path="/register" element={<Register students={filteredStudents} />} />
          <Route
            path="/attendance"
            element={<Attendance students={filteredStudents} attendance={filteredAttendance} />}
          />
          <Route
            path="/marks"
            element={<Marks students={filteredStudents} attendance={filteredAttendance} marks={filteredMarks} />}
          />
        </Routes>
      </main>
    </div>
  )
}
