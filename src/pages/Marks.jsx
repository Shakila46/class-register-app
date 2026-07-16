import { useState, useMemo } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PageHeader, Card, ProbabilityBadge, GradeBadge, YearPill } from '../components/UI.jsx'
import { addMark, deleteMark } from '../utils/firestoreApi'
import { averageOf, calcPassProbability, probabilityBand, attendanceRate, gradeFor, gradeTone, PASS_MARK } from '../utils/predict'
import { useLanguage } from '../context/LanguageContext.jsx'

const SUBJECTS = ['ICT', 'Science', 'Mathematics', 'English', 'Sinhala']
const SUBJECT_STORAGE_KEY = 'class-register-subject'

function getSavedSubject() {
  try {
    return localStorage.getItem(SUBJECT_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function saveSubject(value) {
  try {
    localStorage.setItem(SUBJECT_STORAGE_KEY, value)
  } catch {
    // ignore storage errors
  }
}

export default function Marks({ students, attendance, marks, selectedInstitute }) {
  const { t } = useLanguage()
  const [mySubject, setMySubject] = useState(getSavedSubject)
  const [editingSubject, setEditingSubject] = useState(!getSavedSubject())

  const [studentId, setStudentId] = useState('')
  const [examType, setExamType] = useState('Term Test')
  const [studentMarks, setStudentMarks] = useState('')
  const [maxMarks, setMaxMarks] = useState('100')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [exportYear, setExportYear] = useState('')

  const examTypeOptions = [
    { value: 'Term Test', label: t('marks_examType_term') },
    { value: 'Monthly Test', label: t('marks_examType_monthly') },
    { value: 'Model Paper', label: t('marks_examType_model') },
    { value: 'Assignment', label: t('marks_examType_assignment') },
  ]

  const marksByStudent = useMemo(() => {
    const map = {}
    for (const m of marks) {
      if (!map[m.studentId]) map[m.studentId] = []
      map[m.studentId].push(m)
    }
    return map
  }, [marks])

  const attendanceByStudent = useMemo(() => {
    const map = {}
    for (const a of attendance) {
      if (!map[a.studentId]) map[a.studentId] = []
      map[a.studentId].push(a)
    }
    return map
  }, [attendance])

  const grouped = useMemo(() => {
    const map = {}
    for (const s of students) {
      const key = s.year || 'Unassigned'
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
  }, [students])

  const availableYears = useMemo(() => {
    const set = new Set(students.map((s) => s.year || 'Unassigned'))
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [students])

  const exportGrouped = useMemo(() => {
    if (!exportYear) return grouped
    return grouped.filter(([yearKey]) => yearKey === exportYear)
  }, [grouped, exportYear])

  function exportPDF() {
    const rows = []
    for (const [yearKey, list] of exportGrouped) {
      for (const s of list) {
        const sMarks = marksByStudent[s.id] || []
        const avg = averageOf(sMarks)
        const rate = attendanceRate(attendanceByStudent[s.id] || [])
        const prob = calcPassProbability(avg, rate)
        const grade = gradeFor(avg)
        rows.push([
          s.name,
          yearKey,
          mySubject || '',
          avg === null ? '' : `${avg.toFixed(1)}%`,
          grade || '',
          rate === null ? '' : `${rate.toFixed(0)}%`,
          prob === null ? '' : `${prob}%`,
        ])
      }
    }
    if (rows.length === 0) return

    const doc = new jsPDF({ orientation: 'landscape' })
    doc.setFontSize(14)
    doc.text(
      `Marks Report${exportYear ? ' - ' + exportYear : ''}${selectedInstitute ? ` - ${selectedInstitute}` : ''}${mySubject ? ' (' + mySubject + ')' : ''}`,
      14,
      15
    )
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Generated ${new Date().toISOString().slice(0, 10)}`, 14, 21)

    autoTable(doc, {
      head: [['Name', 'Year', 'Subject', 'Average', 'Grade', 'Attendance', 'Pass Probability']],
      body: rows,
      startY: 26,
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [31, 61, 46] },
    })

    doc.save(`marks-report-${selectedInstitute || 'all'}-${exportYear || 'all'}-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  function confirmSubject(value) {
    setMySubject(value)
    saveSubject(value)
    setEditingSubject(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!mySubject) {
      setError(t('marks_err_noSubject'))
      return
    }
    if (!studentId || studentMarks === '') {
      setError(t('marks_err_required'))
      return
    }
    const m = Number(studentMarks)
    const max = Number(maxMarks) || 100
    if (Number.isNaN(m) || m < 0 || m > max) {
      setError(t('marks_err_range', { max }))
      return
    }
    setSaving(true)
    try {
      // normalize to percentage out of 100 for consistent averaging
      const normalized = (m / max) * 100
      await addMark({
        studentId,
        subject: mySubject,
        examType,
        marks: normalized,
        maxMarks: 100,
      })
      setStudentMarks('')
    } catch (err) {
      setError(t('marks_err_save') + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('marks_title')}
        subtitle={t('marks_subtitle', { passMark: PASS_MARK })}
      />

      <div className="px-4 sm:px-6 md:px-10 py-6">
        {/* One-time subject setting — teacher usually teaches a single subject */}
        <Card className="p-4 mb-6 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium text-ink-700 dark:text-chalk-bg/90 flex-shrink-0">
            {t('marks_yourSubject')}
          </span>
          {editingSubject ? (
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="bg-chalk-card dark:bg-board-800 text-ink-900 dark:text-white border border-chalk-line dark:border-board-700 rounded-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-board-600 dark:focus:ring-gold-500"
                value={mySubject}
                onChange={(e) => setMySubject(e.target.value)}
              >
                <option value="">{t('marks_selectSubject')}</option>
                {SUBJECTS.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => mySubject && confirmSubject(mySubject)}
                disabled={!mySubject}
                className="bg-board-800 text-white text-xs font-medium px-3 py-1.5 rounded-card hover:bg-board-700 transition disabled:opacity-40"
              >
                {t('marks_confirmSubject')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-mono-tag text-xs px-2.5 py-1 rounded bg-gold-100 text-gold-600 border border-gold-500/30">
                {mySubject}
              </span>
              <button
                type="button"
                onClick={() => setEditingSubject(true)}
                className="text-xs text-ink-600 dark:text-gold-500 hover:underline"
              >
                {t('marks_changeSubject')}
              </button>
            </div>
          )}
        </Card>
      </div>

      <div className="px-4 sm:px-6 md:px-10 pb-8 grid md:grid-cols-[360px_1fr] gap-6 md:gap-8">
        <Card className="p-6 h-fit">
          <h3 className="font-display text-lg text-ink-900 dark:text-white mb-4">{t('marks_addTitle')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-700 dark:text-chalk-bg/90 mb-1">{t('marks_student')}</label>
              <select
                className="bg-chalk-card dark:bg-board-800 text-ink-900 dark:text-white w-full border border-chalk-line dark:border-board-700 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600 dark:focus:ring-gold-500"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">{t('marks_selectStudent')}</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.year})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-700 dark:text-chalk-bg/90 mb-1">{t('marks_examType')}</label>
              <select
                className="bg-chalk-card dark:bg-board-800 text-ink-900 dark:text-white w-full border border-chalk-line dark:border-board-700 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600 dark:focus:ring-gold-500"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
              >
                {examTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-700 dark:text-chalk-bg/90 mb-1">{t('marks_marks')}</label>
                <input
                  type="number"
                  className="bg-chalk-card dark:bg-board-800 text-ink-900 dark:text-white w-full border border-chalk-line dark:border-board-700 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600 dark:focus:ring-gold-500"
                  value={studentMarks}
                  onChange={(e) => setStudentMarks(e.target.value)}
                  placeholder="e.g. 68"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 dark:text-chalk-bg/90 mb-1">{t('marks_outOf')}</label>
                <input
                  type="number"
                  className="bg-chalk-card dark:bg-board-800 text-ink-900 dark:text-white w-full border border-chalk-line dark:border-board-700 rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600 dark:focus:ring-gold-500"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
            {error && <p className="text-xs text-fail-text">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto bg-board-800 text-white text-sm font-medium px-4 py-2 rounded-card hover:bg-board-700 transition disabled:opacity-50"
            >
              {saving ? t('marks_saving') : t('marks_addButton')}
            </button>
          </form>
        </Card>

        <div className="space-y-6 min-w-0">
          {grouped.length === 0 && (
            <Card className="p-8 text-center text-sm text-ink-700/60 dark:text-chalk-bg/60">
              {t('marks_empty')}
            </Card>
          )}

          {grouped.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={exportYear}
                onChange={(e) => setExportYear(e.target.value)}
                className="bg-chalk-card dark:bg-board-800 text-ink-900 dark:text-white border border-chalk-line dark:border-board-700 rounded-card px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-board-600 dark:focus:ring-gold-500"
              >
                <option value="">{t('att_allYears')}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button
                onClick={exportPDF}
                className="font-mono-tag text-xs bg-board-800 text-white rounded-card px-3 py-1.5 hover:bg-board-700 transition"
              >
                ⬇ {t('marks_exportPdf')}
              </button>
              <span className="text-xs text-ink-700/50 dark:text-chalk-bg/50 ml-auto font-medium">
                {selectedInstitute ? `${t('institute_label') || 'Institute'}: ${selectedInstitute}` : t('institute_all') || 'All Institutes'}
              </span>
            </div>
          )}

          {exportGrouped.map(([yearKey, list]) => (
            <div key={yearKey}>
              <div className="flex items-center gap-2 mb-2">
                <YearPill year={yearKey} />
              </div>
              <div className="space-y-4">
                {list.map((s) => {
                  const sMarks = marksByStudent[s.id] || []
                  const avg = averageOf(sMarks)
                  const rate = attendanceRate(attendanceByStudent[s.id] || [])
                  const prob = calcPassProbability(avg, rate)
                  const band = probabilityBand(prob)
                  const grade = gradeFor(avg)
                  return (
                    <Card key={s.id} className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="font-medium text-ink-900 dark:text-white">{s.name}</p>
                          <p className="text-xs text-ink-700/50 dark:text-chalk-bg/50">
                            {t('marks_average')}: {avg === null ? '—' : `${avg.toFixed(1)}%`} · {t('marks_attendance')}:{' '}
                            {rate === null ? '—' : `${rate.toFixed(0)}%`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <GradeBadge grade={grade} tone={gradeTone(grade)} />
                          <ProbabilityBadge probability={prob} bandKey={band.key} tone={band.tone} />
                        </div>
                      </div>
                      {sMarks.length > 0 && (
                        <div className="overflow-x-auto -mx-1">
                          <table className="w-full text-xs mt-2 min-w-[360px]">
                            <thead>
                              <tr className="text-left text-ink-700/50 dark:text-chalk-bg/50 border-t border-chalk-line dark:border-board-700">
                                <th className="py-1.5 px-1 font-medium">{t('marks_subjectCol')}</th>
                                <th className="py-1.5 px-1 font-medium">{t('marks_typeCol')}</th>
                                <th className="py-1.5 px-1 font-medium">{t('marks_marksCol')}</th>
                                <th className="py-1.5 px-1"></th>
                              </tr>
                            </thead>
                            <tbody>
                              {sMarks.map((m) => (
                                <tr key={m.id} className="border-t border-chalk-line dark:border-board-700/60">
                                  <td className="py-1.5 px-1">{m.subject}</td>
                                  <td className="py-1.5 px-1 text-ink-700/60 dark:text-chalk-bg/60">{m.examType}</td>
                                  <td className="py-1.5 px-1">{m.marks.toFixed(1)}%</td>
                                  <td className="py-1.5 px-1 text-right">
                                    <button
                                      onClick={() => deleteMark(m.id)}
                                      className="text-fail-text hover:underline"
                                    >
                                      {t('marks_remove')}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
