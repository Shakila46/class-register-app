import { useMemo, useState } from 'react'
import { PageHeader, Card, AttendanceStamp, ProbabilityBadge, GradeBadge, YearPill } from '../components/UI.jsx'
import { averageOf, calcPassProbability, probabilityBand, attendanceRate, gradeFor, gradeTone } from '../utils/predict'
import { useLanguage } from '../context/LanguageContext.jsx'

const GRADES = ['A', 'B', 'C', 'S', 'F']

export default function Dashboard({ students, attendance, marks, loading }) {
  const { t } = useLanguage()
  const [filterYear, setFilterYear] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterAttendance, setFilterAttendance] = useState('')

  const attendanceByStudent = useMemo(() => {
    const map = {}
    for (const a of attendance) {
      if (!map[a.studentId]) map[a.studentId] = []
      map[a.studentId].push(a)
    }
    return map
  }, [attendance])

  const marksByStudent = useMemo(() => {
    const map = {}
    for (const m of marks) {
      if (!map[m.studentId]) map[m.studentId] = []
      map[m.studentId].push(m)
    }
    return map
  }, [marks])

  // Pre-compute derived stats (attendance rate, average, probability, grade) per student once.
  const studentsWithStats = useMemo(() => {
    return students.map((s) => {
      const rate = attendanceRate(attendanceByStudent[s.id] || [])
      const avg = averageOf(marksByStudent[s.id] || [])
      const prob = calcPassProbability(avg, rate)
      const band = probabilityBand(prob)
      const grade = gradeFor(avg)
      return { student: s, rate, avg, prob, band, grade }
    })
  }, [students, attendanceByStudent, marksByStudent])

  const availableYears = useMemo(() => {
    const set = new Set(students.map((s) => s.year || 'Unassigned'))
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [students])

  const filtered = useMemo(() => {
    return studentsWithStats.filter(({ student, rate, grade }) => {
      if (filterYear && (student.year || 'Unassigned') !== filterYear) return false
      if (filterGrade) {
        if (filterGrade === 'none') {
          if (grade !== null) return false
        } else if (grade !== filterGrade) {
          return false
        }
      }
      if (filterAttendance) {
        if (filterAttendance === 'good' && !(rate !== null && rate >= 70)) return false
        if (filterAttendance === 'low' && !(rate !== null && rate < 70)) return false
        if (filterAttendance === 'none' && rate !== null) return false
      }
      return true
    })
  }, [studentsWithStats, filterYear, filterGrade, filterAttendance])

  const grouped = useMemo(() => {
    const map = {}
    for (const row of filtered) {
      const key = row.student.year || 'Unassigned'
      if (!map[key]) map[key] = []
      map[key].push(row)
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
  }, [filtered])

  const overallStats = useMemo(() => {
    let lowAttendance = 0
    let atRisk = 0
    for (const { rate, prob } of studentsWithStats) {
      if (rate !== null && rate < 70) lowAttendance++
      if (prob !== null && prob < 40) atRisk++
    }
    return { lowAttendance, atRisk }
  }, [studentsWithStats])

  const hasActiveFilter = filterYear || filterGrade || filterAttendance
  const totalYearGroups = useMemo(() => {
    const set = new Set(students.map((s) => s.year || 'Unassigned'))
    return set.size
  }, [students])

  function clearFilters() {
    setFilterYear('')
    setFilterGrade('')
    setFilterAttendance('')
  }

  return (
    <div>
      <PageHeader title={t('dash_title')} subtitle={t('dash_subtitle')} />

      <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard label={t('dash_totalStudents')} value={students.length} />
          <StatCard label={t('dash_lowAttendance')} value={overallStats.lowAttendance} tone="fail" />
          <StatCard label={t('dash_atRisk')} value={overallStats.atRisk} tone="fail" />
          <StatCard label={t('dash_yearGroups')} value={totalYearGroups} />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-end gap-3 mb-6">
          <div className="min-w-0">
            <label className="block text-[11px] font-medium text-board-700 mb-1">{t('dash_filterYear')}</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full sm:w-auto border border-chalk-line rounded-card px-3 py-2 sm:py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
            >
              <option value="">{t('dash_allYears')}</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="block text-[11px] font-medium text-board-700 mb-1">{t('dash_filterGrade')}</label>
            <select
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value)}
              className="w-full sm:w-auto border border-chalk-line rounded-card px-3 py-2 sm:py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
            >
              <option value="">{t('dash_allGrades')}</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
              <option value="none">{t('dash_noGrade')}</option>
            </select>
          </div>

          <div className="min-w-0 col-span-2 sm:col-auto">
            <label className="block text-[11px] font-medium text-board-700 mb-1">{t('dash_filterAttendance')}</label>
            <select
              value={filterAttendance}
              onChange={(e) => setFilterAttendance(e.target.value)}
              className="w-full sm:w-auto border border-chalk-line rounded-card px-3 py-2 sm:py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
            >
              <option value="">{t('dash_allAttendance')}</option>
              <option value="good">{t('dash_attendanceGood')}</option>
              <option value="low">{t('dash_attendanceLow')}</option>
              <option value="none">{t('dash_noAttendance')}</option>
            </select>
          </div>

          {hasActiveFilter && (
            <button
              onClick={clearFilters}
              className="col-span-2 sm:col-auto font-mono-tag text-xs text-board-600 border border-chalk-line rounded-card px-3 py-2 sm:py-1.5 hover:bg-chalk-bg transition"
            >
              ✕ {t('dash_clearFilters')}
            </button>
          )}
        </div>

        {loading && <p className="text-sm text-board-700/50">{t('dash_loading')}</p>}

        {!loading && students.length === 0 && (
          <Card className="p-8 text-center text-sm text-board-700/60">
            {t('dash_empty')}
          </Card>
        )}

        {!loading && students.length > 0 && grouped.length === 0 && (
          <Card className="p-8 text-center text-sm text-board-700/60">
            {t('dash_noMatch')}
          </Card>
        )}

        <div className="space-y-6">
          {grouped.map(([yearKey, list]) => (
            <div key={yearKey}>
              <div className="flex items-center gap-2 mb-2">
                <YearPill year={yearKey} />
                <span className="text-xs text-board-700/50">{list.length} students</span>
              </div>
              <Card>
                {/* Mobile: card layout */}
                <div className="sm:hidden divide-y divide-chalk-line">
                  {list.map(({ student: s, rate, avg, prob, band, grade }) => (
                    <div key={s.id} className="p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="font-medium text-board-900 truncate">{s.name}</p>
                        <AttendanceStamp rate={rate} />
                      </div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-xs text-board-700/70">
                            {t('dash_avgMarks')}: {avg === null ? '—' : `${avg.toFixed(1)}%`}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <GradeBadge grade={grade} tone={gradeTone(grade)} />
                            <ProbabilityBadge probability={prob} bandKey={band.key} tone={band.tone} />
                          </div>
                        </div>
                    </div>
                  ))}
                </div>

                {/* Desktop / tablet: table layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr className="text-left text-xs text-board-700/60 border-b border-chalk-line">
                        <th className="px-4 py-2 font-medium">{t('dash_name')}</th>
                        <th className="px-4 py-2 font-medium">{t('dash_attendance')}</th>
                        <th className="px-4 py-2 font-medium">{t('dash_avgMarks')}</th>
                        <th className="px-4 py-2 font-medium">{t('dash_grade')}</th>
                        <th className="px-4 py-2 font-medium">{t('dash_passProbability')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(({ student: s, rate, avg, prob, band, grade }) => (
                        <tr key={s.id} className="border-b border-chalk-line last:border-0">
                          <td className="px-4 py-2.5">{s.name}</td>
                          <td className="px-4 py-2.5">
                            <AttendanceStamp rate={rate} />
                          </td>
                          <td className="px-4 py-2.5 text-board-700/70">
                            {avg === null ? '—' : `${avg.toFixed(1)}%`}
                          </td>
                          <td className="px-4 py-2.5">
                            <GradeBadge grade={grade} tone={gradeTone(grade)} />
                          </td>
                          <td className="px-4 py-2.5">
                            <ProbabilityBadge probability={prob} bandKey={band.key} tone={band.tone} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, tone }) {
  const toneClass = tone === 'fail' && value > 0 ? 'text-fail-text' : 'text-board-900'
  return (
    <Card className="p-3 sm:p-4">
      <p className="text-[10px] sm:text-[11px] text-board-700/50 uppercase tracking-wide font-mono-tag leading-tight">{label}</p>
      <p className={`font-display text-2xl sm:text-3xl mt-1 ${toneClass}`}>{value}</p>
    </Card>
  )
}
