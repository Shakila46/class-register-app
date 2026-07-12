import { useState, useEffect } from 'react'
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

export default function App() {
  const { t, lang, toggleLang } = useLanguage()
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(undefined) // undefined = checking, null = signed out
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const unsubAuth = subscribeAuth(setUser)
    return () => unsubAuth()
  }, [])

  useEffect(() => {
    if (!user) return
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
  }, [user])

  // close the mobile nav whenever the route changes
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  const TABS = [
    { to: '/', label: t('nav_dashboard'), tag: '01' },
    { to: '/register', label: t('nav_register'), tag: '02' },
    { to: '/attendance', label: t('nav_attendance'), tag: '03' },
    { to: '/marks', label: t('nav_marks'), tag: '04' },
  ]

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

        <nav className={`py-2 md:py-4 ${navOpen ? 'block' : 'hidden'} md:block`}>
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

        <div className={`px-4 sm:px-6 py-4 md:mt-auto border-t border-board-600/40 ${navOpen ? 'block' : 'hidden'} md:block`}>
          <p className="text-[11px] text-chalk-bg/40 font-mono-tag mb-2">
            {students.length} {t('studentsRegistered')}
          </p>
          <p className="text-xs text-chalk-bg/70 truncate mb-2">{user.email}</p>
          <button
            onClick={() => logout()}
            className="text-xs text-gold-500 hover:text-gold-100 transition"
          >
            {t('signOut')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-chalk-bg min-h-screen min-w-0">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard students={students} attendance={attendance} marks={marks} loading={loading} />
            }
          />
          <Route path="/register" element={<Register students={students} />} />
          <Route
            path="/attendance"
            element={<Attendance students={students} attendance={attendance} />}
          />
          <Route
            path="/marks"
            element={<Marks students={students} attendance={attendance} marks={marks} />}
          />
        </Routes>
      </main>
    </div>
  )
}
