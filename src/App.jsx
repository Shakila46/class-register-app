import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Register from './pages/Register.jsx'
import Attendance from './pages/Attendance.jsx'
import Marks from './pages/Marks.jsx'
import Login from './pages/Login.jsx'
import ManageUsers from './pages/ManageUsers.jsx'
import {
  subscribeStudents,
  subscribeAttendance,
  subscribeMarks,
  subscribeUser,
  createUserProfile
} from './utils/firestoreApi'
import { subscribeAuth, logout } from './utils/authApi'
import { useLanguage } from './context/LanguageContext.jsx'
import { InstituteProvider, useInstitute } from './context/InstituteContext.jsx'
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx'

export default function App() {
  const [user, setUser] = useState(undefined) // undefined = checking, null = signed out
  const [userProfile, setUserProfile] = useState(undefined)

  useEffect(() => {
    const unsubAuth = subscribeAuth(setUser)
    return () => unsubAuth()
  }, [])

  useEffect(() => {
    if (user) {
      let hasResolved = false
      // Helper to resolve the user profile (used both for success and error fallback)
      function resolveProfile(profile) {
        if (!profile && user && !hasResolved) {
          createUserProfile(user.uid, user.email).catch(console.error)
        }
        
        // If the profile becomes null after being resolved once, it means an admin deleted it.
        // We should log them out or just let them fall back to pending (without recreating it).
        if (!profile && hasResolved) {
          logout()
          return
        }
        
        hasResolved = true
        let finalProfile = profile || { status: 'pending', role: 'teacher' }
        // Force the master admin email to always have admin privileges in the UI
        if (user.email === 'shakilapraween46@gmail.com') {
          finalProfile = { ...finalProfile, status: 'approved', role: 'admin' }
        }
        setUserProfile(finalProfile)
      }

      const unsubUser = subscribeUser(
        user.uid,
        (profile) => resolveProfile(profile),
        // Error handler: if Firestore denies the read (no document yet, rule error)
        // fall back gracefully so the app doesn't hang
        (_err) => resolveProfile(null)
      )
      return () => unsubUser()
    } else {
      setUserProfile(undefined)
    }
  }, [user])

  if (user === undefined || (user && userProfile === undefined)) {
    return (
      <div className="min-h-screen bg-board-800 flex items-center justify-center">
        <p className="text-chalk-bg/50 text-sm font-mono-tag">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  if (userProfile.status === 'pending') {
    return (
      <div className="min-h-screen bg-board-800 flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-board-700 p-8 rounded-card max-w-md border border-board-600">
          <h2 className="text-xl font-display text-white mb-2">Waiting for Approval</h2>
          <p className="text-sm text-chalk-bg/70 mb-6">
            Your account has been created successfully, but it needs to be approved by an administrator before you can access the school data.
          </p>
          <button
            onClick={logout}
            className="text-sm text-gold-500 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  // Only start listening to institute/student data once the person is signed in and approved.
  return (
    <ThemeProvider>
      <InstituteProvider>
        <AuthedApp user={user} userProfile={userProfile} />
      </InstituteProvider>
    </ThemeProvider>
  )
}

function AuthedApp({ user, userProfile }) {
  const { theme, toggleTheme } = useTheme()
  const { t, lang, toggleLang } = useLanguage()
  const { institutes, selectedInstitute, setSelectedInstitute, addInstituteAndSelect, removeInstitute, editInstitute } = useInstitute()
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
    { 
      to: '/', 
      label: t('nav_dashboard'), 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    },
    { 
      to: '/register', 
      label: t('nav_register'), 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
    },
    { 
      to: '/attendance', 
      label: t('nav_attendance'), 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14l2 2 4-4"></path></svg>
    },
    { 
      to: '/marks', 
      label: t('nav_marks'), 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
    },
  ]
  if (userProfile?.role === 'admin') {
    TABS.push({ 
      to: '/manage-users', 
      label: 'Admin Panel', 
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
    })
  }

  async function handleAddInstitute(e) {
    e.preventDefault()
    if (!newInstituteName.trim()) return
    await addInstituteAndSelect(newInstituteName)
    setNewInstituteName('')
    setAddingInstitute(false)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar — ledger book tabs. Collapsible top bar on mobile, collapsible sidebar on desktop. */}
      <aside className={`group ${navOpen ? 'md:w-64' : 'md:w-16 hover:md:w-64'} transition-all duration-300 bg-board-800 text-chalk-bg flex-shrink-0 flex flex-col md:min-h-screen`}>
        <div className={`py-4 md:py-7 border-b border-board-600/60 flex items-start transition-all ${!navOpen ? 'px-4 sm:px-6 md:px-0 group-hover:md:px-6 justify-center group-hover:md:justify-between' : 'px-4 sm:px-6 justify-between'} gap-3 overflow-hidden`}>
          <div className={`min-w-0 ${!navOpen ? 'md:hidden group-hover:md:block' : ''}`}>
            <p className="font-mono-tag text-[10px] tracking-[0.15em] text-gold-500 uppercase truncate">
              {t('appEyebrow')}
            </p>
            <h1 className="font-display text-xl leading-tight mt-1 truncate">
              {t('appTitle')}
            </h1>
          </div>
          <div className={`flex items-center gap-2 flex-shrink-0 ${!navOpen ? 'md:flex-col group-hover:md:flex-row md:w-full group-hover:md:w-auto' : ''}`}>
            <button
              onClick={toggleTheme}
              title="Toggle Dark Mode"
              className={`mt-1 font-mono-tag text-[11px] border border-chalk-bg/25 rounded-card px-2 py-1 text-chalk-bg/70 hover:text-white hover:border-gold-500 transition ${!navOpen ? 'md:hidden group-hover:md:block' : ''}`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={toggleLang}
              title="Switch language / භාෂාව මාරු කරන්න"
              className={`mt-1 font-mono-tag text-[11px] border border-chalk-bg/25 rounded-card px-2 py-1 text-chalk-bg/70 hover:text-white hover:border-gold-500 transition ${!navOpen ? 'md:hidden group-hover:md:block' : ''}`}
            >
              {lang === 'en' ? 'EN' : 'සිං'} ⇄
            </button>

            {/* Hamburger */}
            <button
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle menu"
              className="mt-1 border border-chalk-bg/25 rounded-card p-1.5 text-chalk-bg/80 hover:text-white hover:border-gold-500 transition"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                {navOpen ? (
                  <path d="M4 4l10 10M4 14L14 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                ) : (
                  <path d="M2 4.5h14M2 9h14M2 13.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <div className={`${navOpen ? 'block' : 'hidden md:flex'} flex-col flex-1 max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-visible`}>
          {/* Institute selector — filters the whole app */}
          <div className={`px-4 sm:px-6 py-3 border-b border-board-600/40 ${!navOpen ? 'md:hidden group-hover:md:block' : ''}`}>
            <label className="block text-[10px] font-mono-tag uppercase tracking-wide text-chalk-bg/40 mb-1">
              {t('institute_label')}
            </label>
            {!addingInstitute ? (
              <div className="flex gap-1.5 items-center">
                <select
                  value={selectedInstitute}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '__add__') {
                      setAddingInstitute(true)
                    } else {
                      setSelectedInstitute(val)
                    }
                  }}
                  className="flex-1 min-w-0 bg-board-700 border border-board-600 rounded-card pl-2 pr-7 py-1.5 text-xs text-white truncate focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  <option value="">{t('institute_all')}</option>
                  {institutes.map((inst) => (
                    <option key={inst.id} value={inst.name}>
                      {inst.name}
                    </option>
                  ))}
                  <option value="__add__">+ {t('institute_addNew')}</option>
                </select>
                {selectedInstitute && userProfile?.role === 'admin' && (
                  <>
                    {/* Edit button */}
                    <button
                      type="button"
                      title={`Edit "${selectedInstitute}"`}
                      onClick={async () => {
                        const newName = prompt(`Enter new name for "${selectedInstitute}":`, selectedInstitute)
                        if (newName && newName.trim() && newName.trim() !== selectedInstitute) {
                          await editInstitute(selectedInstitute, newName)
                        }
                      }}
                      className="flex-shrink-0 bg-board-700 border border-board-600 rounded-card px-2 py-1.5 text-chalk-bg/60 hover:text-gold-500 hover:border-gold-500 transition"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    {/* Delete button */}
                    <button
                      type="button"
                      title={`Delete "${selectedInstitute}"`}
                      onClick={async () => {
                        if (confirm(`Are you sure you want to completely delete "${selectedInstitute}"?`)) {
                          await removeInstitute(selectedInstitute)
                        }
                      }}
                      className="flex-shrink-0 bg-board-700 border border-board-600 rounded-card px-2 py-1.5 text-chalk-bg/60 hover:text-fail-text hover:border-fail-text transition"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </>
                )}
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

          <nav className="py-2 md:py-4 overflow-hidden">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.to === '/'}
                className={({ isActive }) =>
                  `ledger-tab flex items-center gap-3 py-3 md:py-3.5 text-sm border-l-4 transition-all ${
                    !navOpen 
                      ? 'px-4 sm:px-6 md:px-0 md:justify-center group-hover:md:px-6 group-hover:md:justify-start' 
                      : 'px-4 sm:px-6'
                  } ${
                    isActive
                      ? 'active bg-board-700 border-gold-500 text-white'
                      : 'border-transparent text-chalk-bg/70 hover:bg-board-700/60 hover:text-white'
                  }`
                }
              >
                <span className="flex-shrink-0 text-gold-500 flex justify-center w-5">{tab.icon}</span>
                <span className={`whitespace-nowrap ${!navOpen ? 'md:hidden group-hover:md:inline' : ''}`}>{tab.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className={`py-4 border-t border-board-600/40 overflow-hidden transition-all ${!navOpen ? 'px-4 sm:px-6 md:px-0 group-hover:md:px-6' : 'px-4 sm:px-6'}`}>
            <div className={`${!navOpen ? 'md:hidden group-hover:md:block' : ''}`}>
              <p className="text-[11px] text-chalk-bg/40 font-mono-tag mb-1 whitespace-nowrap">
                {filteredStudents.length} {t('studentsRegistered')}
              </p>
              <p className="text-xs text-chalk-bg/70 truncate mb-3">{user.email}</p>
            </div>
            <button
              onClick={() => {
                if (confirm('Sign out?')) logout()
              }}
              className={`flex items-center gap-2 text-xs text-chalk-bg/60 hover:text-gold-500 transition group/logout ${!navOpen ? 'w-full md:justify-center group-hover:md:justify-start' : ''}`}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 group-hover/logout:translate-x-0.5 transition-transform">
                <path
                  d="M6 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H6M10.5 11l3-3-3-3M13.5 8h-8"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={`whitespace-nowrap ${!navOpen ? 'md:hidden group-hover:md:inline' : ''}`}>{t('signOut')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-chalk-bg dark:bg-board-900 transition-colors duration-300 min-h-screen min-w-0">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                students={filteredStudents}
                attendance={filteredAttendance}
                marks={filteredMarks}
                loading={loading}
                selectedInstitute={selectedInstitute}
              />
            }
          />
          <Route path="/register" element={<Register students={filteredStudents} selectedInstitute={selectedInstitute} />} />
          <Route
            path="/attendance"
            element={<Attendance students={filteredStudents} attendance={filteredAttendance} selectedInstitute={selectedInstitute} />}
          />
          <Route
            path="/marks"
            element={<Marks students={filteredStudents} attendance={filteredAttendance} marks={filteredMarks} selectedInstitute={selectedInstitute} />}
          />
          {userProfile?.role === 'admin' && (
            <Route path="/manage-users" element={<ManageUsers />} />
          )}
        </Routes>
      </main>
    </div>
  )
}
