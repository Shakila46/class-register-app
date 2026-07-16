import { useLanguage } from '../context/LanguageContext.jsx'

export function PageHeader({ title, subtitle }) {
  return (
    <div className="px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-5 md:pb-6 border-b border-chalk-line dark:border-board-700">
      <h2 className="font-display text-2xl md:text-3xl text-ink-900 dark:text-white">{title}</h2>
      {subtitle && <p className="text-sm text-ink-700/70 dark:text-chalk-bg/70 mt-1.5">{subtitle}</p>}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-chalk-card dark:bg-board-800 border border-chalk-line dark:border-board-700 rounded-card shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function AttendanceStamp({ rate }) {
  const { t } = useLanguage()
  if (rate === null || rate === undefined) {
    return (
      <span className="stamp text-[10px] px-2 py-0.5 rounded border-board-600/30 dark:border-board-600/50 text-ink-700/50 dark:text-chalk-bg/50">
        {t('noData').toUpperCase()}
      </span>
    )
  }
  const isGood = rate >= 70
  return (
    <span
      className={`stamp text-[10px] px-2 py-0.5 rounded ${
        isGood ? 'text-pass-text dark:text-pass-bg border-pass-text dark:border-pass-bg bg-pass-bg dark:bg-pass-text/20' : 'text-fail-text dark:text-fail-bg border-fail-text dark:border-fail-bg bg-fail-bg dark:bg-fail-text/20'
      }`}
    >
      {rate.toFixed(0)}%
    </span>
  )
}

export function ProbabilityBadge({ probability, bandKey, tone }) {
  const { t } = useLanguage()
  const toneMap = {
    pass: 'bg-pass-bg dark:bg-pass-text/20 text-pass-text dark:text-pass-bg border border-transparent dark:border-pass-text/30',
    warn: 'bg-warn-bg dark:bg-warn-text/20 text-warn-text dark:text-warn-bg border border-transparent dark:border-warn-text/30',
    fail: 'bg-fail-bg dark:bg-fail-text/20 text-fail-text dark:text-fail-bg border border-transparent dark:border-fail-text/30',
  }
  return (
    <div className={`inline-flex flex-col items-start px-3 py-1.5 rounded-card ${toneMap[tone]}`}>
      <span className="font-mono-tag text-lg leading-none">
        {probability === null ? '—' : `${probability}%`}
      </span>
      <span className="text-[11px] mt-0.5">{t(bandKey)}</span>
    </div>
  )
}

export function GradeBadge({ grade, tone }) {
  const { t } = useLanguage()
  if (!grade) {
    return (
      <span className="stamp text-[10px] px-2 py-0.5 rounded border-board-600/30 dark:border-board-600/50 text-ink-700/50 dark:text-chalk-bg/50">
        {t('noData').toUpperCase()}
      </span>
    )
  }
  const toneMap = {
    pass: 'text-pass-text dark:text-pass-bg border-pass-text dark:border-pass-bg bg-pass-bg dark:bg-pass-text/20',
    warn: 'text-warn-text dark:text-warn-bg border-warn-text dark:border-warn-bg bg-warn-bg dark:bg-warn-text/20',
    fail: 'text-fail-text dark:text-fail-bg border-fail-text dark:border-fail-bg bg-fail-bg dark:bg-fail-text/20',
  }
  return (
    <span className={`stamp text-xs px-2.5 py-1 rounded ${toneMap[tone]}`}>
      {grade}
    </span>
  )
}

export function YearPill({ year }) {
  return (
    <span className="font-mono-tag text-[11px] px-2 py-0.5 rounded bg-gold-100 dark:bg-gold-600/20 text-gold-600 dark:text-gold-500 border border-gold-500/30">
      Year / Grade {year}
    </span>
  )
}
