import { useLanguage } from '../context/LanguageContext.jsx'

export function PageHeader({ title, subtitle }) {
  return (
    <div className="px-4 sm:px-6 md:px-10 pt-6 md:pt-8 pb-5 md:pb-6 border-b border-chalk-line">
      <h2 className="font-display text-2xl md:text-3xl text-board-900">{title}</h2>
      {subtitle && <p className="text-sm text-board-700/70 mt-1.5">{subtitle}</p>}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-chalk-card border border-chalk-line rounded-card shadow-sm ${className}`}
    >
      {children}
    </div>
  )
}

export function AttendanceStamp({ rate }) {
  const { t } = useLanguage()
  if (rate === null || rate === undefined) {
    return (
      <span className="stamp text-[10px] px-2 py-0.5 rounded border-board-600/30 text-board-700/50">
        {t('noData').toUpperCase()}
      </span>
    )
  }
  const isGood = rate >= 70
  return (
    <span
      className={`stamp text-[10px] px-2 py-0.5 rounded ${
        isGood ? 'text-pass-text border-pass-text bg-pass-bg' : 'text-fail-text border-fail-text bg-fail-bg'
      }`}
    >
      {rate.toFixed(0)}%
    </span>
  )
}

export function ProbabilityBadge({ probability, bandKey, tone }) {
  const { t } = useLanguage()
  const toneMap = {
    pass: 'bg-pass-bg text-pass-text',
    warn: 'bg-warn-bg text-warn-text',
    fail: 'bg-fail-bg text-fail-text',
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
      <span className="stamp text-[10px] px-2 py-0.5 rounded border-board-600/30 text-board-700/50">
        {t('noData').toUpperCase()}
      </span>
    )
  }
  const toneMap = {
    pass: 'text-pass-text border-pass-text bg-pass-bg',
    warn: 'text-warn-text border-warn-text bg-warn-bg',
    fail: 'text-fail-text border-fail-text bg-fail-bg',
  }
  return (
    <span className={`stamp text-xs px-2.5 py-1 rounded ${toneMap[tone]}`}>
      {grade}
    </span>
  )
}

export function YearPill({ year }) {
  return (
    <span className="font-mono-tag text-[11px] px-2 py-0.5 rounded bg-gold-100 text-gold-600 border border-gold-500/30">
      Year / Grade {year}
    </span>
  )
}
