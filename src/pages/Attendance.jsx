import { useState, useMemo } from 'react'
import { PageHeader, Card, AttendanceStamp, YearPill } from '../components/UI.jsx'
import { markAttendance } from '../utils/firestoreApi'
import { attendanceRate } from '../utils/predict'
import { useLanguage } from '../context/LanguageContext.jsx'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatShortDate(isoDate) {
  const d = new Date(isoDate + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export default function Attendance({ students, attendance }) {
  const { t } = useLanguage()
  const [date, setDate] = useState(todayStr())
  const [markYear, setMarkYear] = useState('')
  const [historyYear, setHistoryYear] = useState('')

  const attendanceByStudent = useMemo(() => {
    const map = {}
    for (const a of attendance) {
      if (!map[a.studentId]) map[a.studentId] = []
      map[a.studentId].push(a)
    }
    return map
  }, [attendance])

  // studentId -> { date: present }
  const attendanceMatrix = useMemo(() => {
    const map = {}
    for (const a of attendance) {
      if (!map[a.studentId]) map[a.studentId] = {}
      map[a.studentId][a.date] = a.present
    }
    return map
  }, [attendance])

  const todaysMap = useMemo(() => {
    const map = {}
    for (const a of attendance) {
      if (a.date === date) map[a.studentId] = a.present
    }
    return map
  }, [attendance, date])

  const grouped = useMemo(() => {
    const map = {}
    for (const s of students) {
      const key = s.year || 'Unassigned'
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
  }, [students])

  const markGrouped = useMemo(() => {
    if (!markYear) return grouped
    return grouped.filter(([yearKey]) => yearKey === markYear)
  }, [grouped, markYear])

  const availableYears = useMemo(() => {
    const set = new Set(students.map((s) => s.year || 'Unassigned'))
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [students])

  const historyStudents = useMemo(() => {
    if (!historyYear) return []
    return students
      .filter((s) => (s.year || 'Unassigned') === historyYear)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [students, historyYear])

  const historyDates = useMemo(() => {
    if (!historyYear) return []
    const ids = new Set(historyStudents.map((s) => s.id))
    const set = new Set()
    for (const a of attendance) {
      if (ids.has(a.studentId)) set.add(a.date)
    }
    return Array.from(set).sort() // ISO date strings sort correctly ascending
  }, [attendance, historyStudents, historyYear])

  async function toggle(studentId, present) {
    await markAttendance({ studentId, date, present })
  }

  function exportCSV() {
    if (!historyYear || historyDates.length === 0) return
    const headers = [
      t('reg_fullName'),
      t('reg_phone'),
      t('reg_school'),
      ...historyDates.map(formatShortDate),
      t('att_overallCol'),
    ]
    const rows = historyStudents.map((s) => {
      const rate = attendanceRate(attendanceByStudent[s.id] || [])
      const cells = historyDates.map((d) => {
        const val = attendanceMatrix[s.id]?.[d]
        return val === true ? 'P' : val === false ? 'A' : ''
      })
      return [s.name, s.phone || '', s.school || '', ...cells, rate === null ? '' : `${rate.toFixed(0)}%`]
    })
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    // \uFEFF BOM so Excel/Sheets correctly render UTF-8 (Sinhala) characters
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-${historyYear}-${todayStr()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <PageHeader title={t('att_title')} subtitle={t('att_subtitle')} />

      <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-board-700 flex-shrink-0">{t('att_date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 sm:flex-none border border-chalk-line rounded-card px-3 py-2 sm:py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-board-700 flex-shrink-0">{t('att_selectYear')}</label>
            <select
              value={markYear}
              onChange={(e) => setMarkYear(e.target.value)}
              className="flex-1 sm:flex-none border border-chalk-line rounded-card px-3 py-2 sm:py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
            >
              <option value="">{t('att_allYears')}</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {markGrouped.length === 0 && (
          <Card className="p-8 text-center text-sm text-board-700/60">
            {t('att_empty')}
          </Card>
        )}

        <div className="space-y-6">
          {markGrouped.map(([yearKey, list]) => (
            <div key={yearKey}>
              <div className="flex items-center gap-2 mb-2">
                <YearPill year={yearKey} />
                <span className="text-xs text-board-700/50">{list.length} {t('att_students')}</span>
              </div>
              <Card>
                {/* Mobile: card layout — bigger tap targets, no horizontal scroll */}
                <div className="sm:hidden divide-y divide-chalk-line">
                  {list.map((s) => {
                    const records = attendanceByStudent[s.id] || []
                    const rate = attendanceRate(records)
                    const present = todaysMap[s.id]
                    return (
                      <div key={s.id} className="p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <p className="font-medium text-board-900 truncate">{s.name}</p>
                          <AttendanceStamp rate={rate} />
                        </div>
                        <div className="flex rounded-card border border-chalk-line overflow-hidden">
                          <button
                            onClick={() => toggle(s.id, true)}
                            className={`flex-1 py-2 text-xs font-medium transition ${
                              present === true
                                ? 'bg-pass-bar text-white'
                                : 'bg-white text-board-700/60 active:bg-pass-bg'
                            }`}
                          >
                            {t('att_present')}
                          </button>
                          <button
                            onClick={() => toggle(s.id, false)}
                            className={`flex-1 py-2 text-xs font-medium transition border-l border-chalk-line ${
                              present === false
                                ? 'bg-fail-bar text-white'
                                : 'bg-white text-board-700/60 active:bg-fail-bg'
                            }`}
                          >
                            {t('att_absent')}
                          </button>
                        </div>
                        <p className="text-[11px] text-board-700/40 mt-2">
                          {records.length} {t('att_daysRecorded')}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop / tablet: table layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="text-left text-xs text-board-700/60 border-b border-chalk-line">
                        <th className="px-4 py-2 font-medium">{t('att_name')}</th>
                        <th className="px-4 py-2 font-medium">{date}</th>
                        <th className="px-4 py-2 font-medium">{t('att_overall')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((s) => {
                        const records = attendanceByStudent[s.id] || []
                        const rate = attendanceRate(records)
                        const present = todaysMap[s.id]
                        return (
                          <tr key={s.id} className="border-b border-chalk-line last:border-0">
                            <td className="px-4 py-2.5">{s.name}</td>
                            <td className="px-4 py-2.5">
                              <div className="inline-flex rounded-card border border-chalk-line overflow-hidden">
                                <button
                                  onClick={() => toggle(s.id, true)}
                                  className={`px-3 py-1 text-xs font-medium transition ${
                                    present === true
                                      ? 'bg-pass-bar text-white'
                                      : 'bg-white text-board-700/60 hover:bg-pass-bg'
                                  }`}
                                >
                                  {t('att_present')}
                                </button>
                                <button
                                  onClick={() => toggle(s.id, false)}
                                  className={`px-3 py-1 text-xs font-medium transition border-l border-chalk-line ${
                                    present === false
                                      ? 'bg-fail-bar text-white'
                                      : 'bg-white text-board-700/60 hover:bg-fail-bg'
                                  }`}
                                >
                                  {t('att_absent')}
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <AttendanceStamp rate={rate} />
                              <span className="text-[11px] text-board-700/40 ml-2">
                                {records.length} {t('att_daysRecorded')}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Full attendance history, by year */}
        <div className="mt-10 pt-8 border-t border-chalk-line">
          <h2 className="font-display text-2xl md:text-3xl text-board-900">{t('att_historyTitle')}</h2>
          <p className="text-sm text-board-700/70 mt-1.5 mb-6">{t('att_historySubtitle')}</p>

          <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-board-700 flex-shrink-0">{t('att_selectYear')}</label>
              <select
                value={historyYear}
                onChange={(e) => setHistoryYear(e.target.value)}
                className="flex-1 sm:flex-none border border-chalk-line rounded-card px-3 py-2 sm:py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
              >
                <option value="">{t('att_selectYear')}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {historyYear && historyDates.length > 0 && (
              <button
                onClick={exportCSV}
                className="font-mono-tag text-xs border border-board-600 text-board-700 rounded-card px-3 py-2 sm:py-1.5 hover:bg-board-800 hover:text-white hover:border-board-800 transition"
              >
                ⬇ {t('att_exportSheet')}
              </button>
            )}
          </div>

          {!historyYear && (
            <Card className="p-8 text-center text-sm text-board-700/60">
              {t('att_choosePrompt')}
            </Card>
          )}

          {historyYear && historyDates.length === 0 && (
            <Card className="p-8 text-center text-sm text-board-700/60">
              {t('att_noHistory')}
            </Card>
          )}

          {historyYear && historyDates.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <table className="text-sm">
                  <thead>
                    <tr className="text-left text-xs text-board-700/60 border-b border-chalk-line">
                      <th className="px-4 py-2 font-medium sticky left-0 bg-chalk-card">{t('att_name')}</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">{t('reg_phone')}</th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">{t('reg_school')}</th>
                      {historyDates.map((d) => (
                        <th key={d} className="px-2 py-2 font-medium text-center whitespace-nowrap">
                          {formatShortDate(d)}
                        </th>
                      ))}
                      <th className="px-4 py-2 font-medium whitespace-nowrap">{t('att_overallCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyStudents.map((s) => {
                      const rate = attendanceRate(attendanceByStudent[s.id] || [])
                      return (
                        <tr key={s.id} className="border-b border-chalk-line last:border-0">
                          <td className="px-4 py-2.5 whitespace-nowrap sticky left-0 bg-chalk-card">
                            {s.name}
                          </td>
                          <td className="px-4 py-2.5 text-board-700/70 whitespace-nowrap">{s.phone || '—'}</td>
                          <td className="px-4 py-2.5 text-board-700/70 whitespace-nowrap">{s.school || '—'}</td>
                          {historyDates.map((d) => {
                            const val = attendanceMatrix[s.id]?.[d]
                            return (
                              <td key={d} className="px-2 py-2.5 text-center">
                                {val === true ? (
                                  <span className="text-pass-bar font-semibold">✓</span>
                                ) : val === false ? (
                                  <span className="text-fail-bar font-semibold">✕</span>
                                ) : (
                                  <span className="text-board-700/20">–</span>
                                )}
                              </td>
                            )
                          })}
                          <td className="px-4 py-2.5">
                            <AttendanceStamp rate={rate} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
