import { useState, useMemo } from 'react'
import { PageHeader, Card, YearPill } from '../components/UI.jsx'
import { addStudent, updateStudent, deleteStudent } from '../utils/firestoreApi'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useInstitute } from '../context/InstituteContext.jsx'

export default function Register({ students }) {
  const { t } = useLanguage()
  const { institutes, selectedInstitute, addInstituteAndSelect } = useInstitute()
  const [name, setName] = useState('')
  const [admissionNo, setAdmissionNo] = useState('')
  const [year, setYear] = useState('')
  const [phone, setPhone] = useState('')
  const [school, setSchool] = useState('')
  const [institute, setInstitute] = useState(selectedInstitute || '')
  const [addingInstitute, setAddingInstitute] = useState(false)
  const [newInstituteName, setNewInstituteName] = useState('')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const grouped = useMemo(() => {
    const map = {}
    for (const s of students) {
      const key = s.year || 'Unassigned'
      if (!map[key]) map[key] = []
      map[key].push(s)
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
  }, [students])

  function resetForm() {
    setName('')
    setAdmissionNo('')
    setYear('')
    setPhone('')
    setSchool('')
    setInstitute(selectedInstitute || '')
    setEditingId(null)
    setAddingInstitute(false)
    setNewInstituteName('')
  }

  async function handleAddInstitute(e) {
    e.preventDefault()
    if (!newInstituteName.trim()) return
    await addInstituteAndSelect(newInstituteName)
    setInstitute(newInstituteName.trim())
    setNewInstituteName('')
    setAddingInstitute(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim() || !year.trim()) {
      setError(t('reg_err_required'))
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateStudent(editingId, { name, admissionNo, year, phone, school, institute })
      } else {
        await addStudent({ name, admissionNo, year, phone, school, institute })
      }
      resetForm()
    } catch (err) {
      setError(t('reg_err_save') + err.message + ')')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(s) {
    setEditingId(s.id)
    setName(s.name)
    setAdmissionNo(s.admissionNo || '')
    setYear(s.year)
    setPhone(s.phone || '')
    setSchool(s.school || '')
    setInstitute(s.institute || '')
  }

  async function handleDelete(id) {
    if (confirm(t('reg_confirmDelete'))) {
      await deleteStudent(id)
    }
  }

  return (
    <div>
      <PageHeader title={t('reg_title')} subtitle={t('reg_subtitle')} />

      <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 grid md:grid-cols-[360px_1fr] gap-6 md:gap-8">
        <Card className="p-4 sm:p-6 h-fit">
          <h3 className="font-display text-lg text-board-900 mb-4">
            {editingId ? t('reg_editTitle') : t('reg_newTitle')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-board-700 mb-1">
                {t('reg_institute')}
              </label>
              {!addingInstitute ? (
                <select
                  value={institute}
                  onChange={(e) => {
                    if (e.target.value === '__add__') {
                      setAddingInstitute(true)
                    } else {
                      setInstitute(e.target.value)
                    }
                  }}
                  className="w-full border border-chalk-line rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
                >
                  <option value="">{t('reg_selectInstitute')}</option>
                  {institutes.map((inst) => (
                    <option key={inst.id} value={inst.name}>
                      {inst.name}
                    </option>
                  ))}
                  <option value="__add__">+ {t('institute_addNew')}</option>
                </select>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    autoFocus
                    value={newInstituteName}
                    onChange={(e) => setNewInstituteName(e.target.value)}
                    placeholder={t('institute_namePlaceholder')}
                    className="flex-1 min-w-0 border border-chalk-line rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddInstitute}
                    className="text-sm bg-board-800 text-white font-medium px-3 rounded-card hover:bg-board-700 transition"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingInstitute(false)
                      setNewInstituteName('')
                    }}
                    className="text-sm text-board-700 px-2 rounded-card border border-chalk-line hover:bg-chalk-bg"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-board-700 mb-1">
                {t('reg_fullName')}
              </label>
              <input
                className="w-full border border-chalk-line rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Amaya Perera"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-board-700 mb-1">
                {t('reg_admissionNo')}
              </label>
              <input
                className="w-full border border-chalk-line rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                placeholder="e.g. 2026/045"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-board-700 mb-1">
                {t('reg_yearGrade')}
              </label>
              <input
                className="w-full border border-chalk-line rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. Grade 10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-board-700 mb-1">
                {t('reg_phone')}
              </label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="w-full border border-chalk-line rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 077 123 4567"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-board-700 mb-1">
                {t('reg_school')}
              </label>
              <input
                className="w-full border border-chalk-line rounded-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-board-600"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Homagama Central College"
              />
            </div>
            {error && <p className="text-xs text-fail-text">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-board-800 text-white text-sm font-medium px-4 py-2 rounded-card hover:bg-board-700 transition disabled:opacity-50"
              >
                {saving ? t('reg_saving') : editingId ? t('reg_update') : t('reg_save')}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-sm text-board-700 px-4 py-2 rounded-card border border-chalk-line hover:bg-chalk-bg"
                >
                  {t('reg_cancel')}
                </button>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          {grouped.length === 0 && (
            <Card className="p-8 text-center text-sm text-board-700/60">
              {t('reg_empty')}
            </Card>
          )}
          {grouped.map(([yearKey, list]) => (
            <div key={yearKey}>
              <div className="flex items-center gap-2 mb-2">
                <YearPill year={yearKey} />
                <span className="text-xs text-board-700/50">{list.length} {t('reg_students')}</span>
              </div>
              <Card>
                {/* Mobile: card layout (no horizontal scroll needed) */}
                <div className="sm:hidden divide-y divide-chalk-line">
                  {list.map((s) => (
                    <div key={s.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-board-900 truncate">{s.name}</p>
                          <p className="text-xs text-board-700/50 mt-0.5">
                            {t('reg_admissionCol')}: {s.admissionNo || '—'}
                          </p>
                          {s.institute && (
                            <p className="text-[11px] text-gold-600 mt-0.5">🏛 {s.institute}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 flex gap-3">
                          <button
                            onClick={() => startEdit(s)}
                            className="text-xs text-board-600 hover:underline"
                          >
                            {t('reg_edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="text-xs text-fail-text hover:underline"
                          >
                            {t('reg_delete')}
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-board-700/70">
                        <span>
                          📞{' '}
                          {s.phone ? (
                            <a href={`tel:${s.phone}`} className="text-board-600 hover:underline">
                              {s.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </span>
                        <span>🏫 {s.school || '—'}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop / tablet: table layout */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead>
                      <tr className="text-left text-xs text-board-700/60 border-b border-chalk-line">
                        <th className="px-4 py-2 font-medium">{t('dash_name')}</th>
                        <th className="px-4 py-2 font-medium">{t('reg_institute')}</th>
                        <th className="px-4 py-2 font-medium">{t('reg_admissionCol')}</th>
                        <th className="px-4 py-2 font-medium">{t('reg_phone')}</th>
                        <th className="px-4 py-2 font-medium">{t('reg_school')}</th>
                        <th className="px-4 py-2 font-medium text-right">{t('reg_actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((s) => (
                        <tr key={s.id} className="border-b border-chalk-line last:border-0">
                          <td className="px-4 py-2.5">{s.name}</td>
                          <td className="px-4 py-2.5 text-board-700/70">{s.institute || '—'}</td>
                          <td className="px-4 py-2.5 text-board-700/70">{s.admissionNo || '—'}</td>
                          <td className="px-4 py-2.5 text-board-700/70 whitespace-nowrap">
                            {s.phone ? (
                              <a href={`tel:${s.phone}`} className="hover:underline hover:text-board-600">
                                {s.phone}
                              </a>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-board-700/70">{s.school || '—'}</td>
                          <td className="px-4 py-2.5 text-right space-x-3 whitespace-nowrap">
                            <button
                              onClick={() => startEdit(s)}
                              className="text-xs text-board-600 hover:underline"
                            >
                              {t('reg_edit')}
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="text-xs text-fail-text hover:underline"
                            >
                              {t('reg_delete')}
                            </button>
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
