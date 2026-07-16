import { useState } from 'react'
import { login, register, resetPassword } from '../utils/authApi'
import { createUserProfile } from '../utils/firestoreApi'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Login() {
  const { t, lang, toggleLang } = useLanguage()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  function friendlyError(err) {
    const code = err.code || ''
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
      return lang === 'si' ? 'Email එක හෝ password එක වැරදියි.' : 'Incorrect email or password.'
    }
    if (code.includes('email-already-in-use')) {
      return lang === 'si'
        ? 'මේ email එකට කලින්ම account එකක් තියෙනවා. Sign in කරන්න try කරන්න.'
        : 'An account already exists for this email. Try signing in instead.'
    }
    if (code.includes('weak-password')) {
      return lang === 'si'
        ? 'Password එක අවම වශයෙන් අකුරු 6ක් වත් තියෙන්න ඕන.'
        : 'Password must be at least 6 characters.'
    }
    if (code.includes('invalid-email')) {
      return lang === 'si' ? 'Email address එක check කරන්න.' : 'Please check the email address.'
    }
    if (code.includes('api-key') || code.includes('configuration-not-found')) {
      return lang === 'si'
        ? 'Firebase config එක සකසලා නෑ. README.md file එකේ Setup instructions බලන්න.'
        : 'Firebase is not configured yet. See the Setup instructions in README.md.'
    }
    return err.message || (lang === 'si' ? 'මොකක්හරි error එකක් ආවා. ආයෙත් try කරන්න.' : 'Something went wrong. Please try again.')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (mode === 'reset') {
      if (!email.trim()) {
        setError(t('login_err_emailRequired'))
        return
      }
      setBusy(true)
      try {
        await resetPassword(email)
        setInfo(t('login_info_resetSent'))
      } catch (err) {
        setError(friendlyError(err))
      } finally {
        setBusy(false)
      }
      return
    }

    if (!email.trim() || !password) {
      setError(t('login_err_required'))
      return
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError(t('login_err_mismatch'))
      return
    }

    setBusy(true)
    try {
      if (mode === 'signup') {
        const cred = await register(email, password)
        await createUserProfile(cred.user.uid, email)
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-board-800 flex items-center justify-center px-4 relative">
      <div className="absolute top-5 right-5 flex items-center gap-2">
        <button
          onClick={toggleLang}
          title="Switch language / භාෂාව මාරු කරන්න"
          className="font-mono-tag text-[11px] border border-chalk-bg/25 rounded-card px-2 py-1 text-chalk-bg/70 hover:text-white hover:border-gold-500 transition"
        >
          {lang === 'en' ? 'EN' : 'සිං'} ⇄
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="font-mono-tag text-[11px] tracking-[0.2em] text-gold-500 uppercase">
            {t('appEyebrow')}
          </p>
          <h1 className="font-display text-2xl text-white mt-1">
            {t('login_title')}
          </h1>
        </div>

        <div className="bg-chalk-card dark:bg-board-800 rounded-card border border-chalk-line dark:border-board-700 p-6 shadow-lg">
          <div className="flex mb-5 border border-chalk-line dark:border-board-700 rounded-card overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError('')
                setInfo('')
              }}
              className={`flex-1 py-2 font-medium transition ${
                mode === 'signin' ? 'bg-board-800 text-white' : 'bg-chalk-card dark:bg-board-800 text-ink-700/60 dark:text-chalk-bg/60 hover:bg-chalk-bg dark:bg-board-900'
              }`}
            >
              {t('login_signin')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup')
                setError('')
                setInfo('')
              }}
              className={`flex-1 py-2 font-medium transition border-l border-chalk-line dark:border-board-700 ${
                mode === 'signup' ? 'bg-board-800 text-white' : 'bg-chalk-card dark:bg-board-800 text-ink-700/60 dark:text-chalk-bg/60 hover:bg-chalk-bg dark:bg-board-900'
              }`}
            >
              {t('login_signup')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 dark:text-chalk-bg/90 mb-1">{t('login_email')}</label>
              <input
                type="email"
                className="bg-chalk-card dark:bg-board-800 text-ink-900 dark:text-white w-full border border-chalk-line dark:border-board-700 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600 dark:focus:ring-gold-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@example.com"
                autoComplete="email"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-medium text-ink-700 dark:text-chalk-bg/90 mb-1">{t('login_password')}</label>
                <input
                  type="password"
                  className="bg-chalk-card dark:bg-board-800 text-ink-900 dark:text-white w-full border border-chalk-line dark:border-board-700 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600 dark:focus:ring-gold-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-ink-700 dark:text-chalk-bg/90 mb-1">
                  {t('login_confirmPassword')}
                </label>
                <input
                  type="password"
                  className="bg-chalk-card dark:bg-board-800 text-ink-900 dark:text-white w-full border border-chalk-line dark:border-board-700 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600 dark:focus:ring-gold-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && <p className="text-xs text-fail-text">{error}</p>}
            {info && <p className="text-xs text-pass-text">{info}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-board-800 text-white text-sm font-medium px-4 py-2.5 rounded-card hover:bg-board-700 transition disabled:opacity-50"
            >
              {busy
                ? t('login_pleaseWait')
                : mode === 'signup'
                ? t('login_submit_signup')
                : mode === 'reset'
                ? t('login_submit_reset')
                : t('login_submit_signin')}
            </button>
          </form>

          {mode !== 'reset' && (
            <button
              type="button"
              onClick={() => {
                setMode('reset')
                setError('')
                setInfo('')
              }}
              className="text-xs text-ink-600 dark:text-gold-500 hover:underline mt-4 block mx-auto"
            >
              {t('login_forgot')}
            </button>
          )}
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => {
                setMode('signin')
                setError('')
                setInfo('')
              }}
              className="text-xs text-ink-600 dark:text-gold-500 hover:underline mt-4 block mx-auto"
            >
              {t('login_backToSignIn')}
            </button>
          )}
        </div>

        <p className="text-center text-[11px] text-chalk-bg/40 mt-5 font-mono-tag">
          {t('login_firstTimeNote')}
        </p>
      </div>
    </div>
  )
}
