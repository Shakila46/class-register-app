// Final Exam Pass Probability - calculation logic
// -------------------------------------------------
// මෙය statistical/ML model එකක් නොවෙයි (ඒකට historical exam result data
// වසර ගණනාවක් ඕන). ඒ වෙනුවට, teachers සාමාන්‍යයෙන් පාවිච්චි කරන
// "continuous assessment -> pass likelihood" logic එකක් මෙතන use කරලා තියෙනවා.
// පහසුවෙන් තේරුම් ගන්න පුළුවන් විදිහට, transparent විදිහට හදලා තියෙන්නේ.
//
// Two inputs:
//   1. averageMarks   - student ගේ සියලුම subjects/tests වල average % එක
//   2. attendanceRate - student ගේ attendance % එක
//
// Logic:
//   Step 1: Marks එක based on base probability එකක් හදනවා.
//     - averageMarks >= passMark  ->  50% සිට 100% දක්වා (linear scale)
//     - averageMarks <  passMark  ->  0%  සිට 50%  දක්වා (linear scale)
//
//   Step 2: Attendance එක adjustment එකක් විදිහට apply කරනවා.
//     - Attendance අඩු නම් (< 70%), පාඩම් අඩුවෙන් තේරුම් ගැනීම නිසා
//       pass වීමේ ඉඩකඩ අඩුවෙනවා කියලා සලකලා, base probability එකෙන්
//       කොටසක් අඩු කරනවා (penalty, maximum 20%).
//     - Attendance හොඳ නම් (>= 90%), පොඩි bonus එකක් (maximum 5%) එකතු කරනවා.
//
//   Final probability එක 0-100 range එකට clamp කරනවා.
//
// Teacher ට ඕන නම් පහසුවෙන් PASS_MARK එක වෙනස් කරන්න පුළුවන් (default 40).

export const PASS_MARK = 35

export function averageOf(marksArray) {
  if (!marksArray || marksArray.length === 0) return null
  const sum = marksArray.reduce((a, b) => a + Number(b.marks || 0), 0)
  return sum / marksArray.length
}

export function calcPassProbability(averageMarks, attendanceRate, passMark = PASS_MARK) {
  if (averageMarks === null || averageMarks === undefined || Number.isNaN(averageMarks)) {
    return null
  }

  let base
  if (averageMarks >= passMark) {
    base = 50 + ((averageMarks - passMark) / (100 - passMark)) * 50
  } else {
    base = (averageMarks / passMark) * 50
  }

  let adjustment = 0
  if (attendanceRate !== null && attendanceRate !== undefined) {
    if (attendanceRate < 70) {
      // scales penalty: at 0% attendance -> -20, at 70% -> 0
      adjustment = -((70 - attendanceRate) / 70) * 20
    } else if (attendanceRate >= 90) {
      adjustment = 5
    }
  }

  const final = Math.min(100, Math.max(0, base + adjustment))
  return Math.round(final)
}

export function probabilityBand(probability) {
  if (probability === null) return { key: 'band_noData', tone: 'warn' }
  if (probability >= 60) return { key: 'band_pass', tone: 'pass' }
  if (probability >= 40) return { key: 'band_warn', tone: 'warn' }
  return { key: 'band_fail', tone: 'fail' }
}

export function attendanceRate(attendanceRecords) {
  if (!attendanceRecords || attendanceRecords.length === 0) return null
  const present = attendanceRecords.filter((r) => r.present).length
  return (present / attendanceRecords.length) * 100
}

// Letter Grade - based on average marks
// -----------------------------------------
//   75% සහ ඉහළ  -> A
//   65% - 74%    -> B
//   55% - 64%    -> C
//   35% - 54%    -> S
//   35%ට අඩු     -> F
export function gradeFor(averageMarks) {
  if (averageMarks === null || averageMarks === undefined || Number.isNaN(averageMarks)) {
    return null
  }
  if (averageMarks >= 75) return 'A'
  if (averageMarks >= 65) return 'B'
  if (averageMarks >= 55) return 'C'
  if (averageMarks >= 35) return 'S'
  return 'F'
}

export function gradeTone(grade) {
  switch (grade) {
    case 'A':
    case 'B':
      return 'pass'
    case 'C':
    case 'S':
      return 'warn'
    case 'F':
      return 'fail'
    default:
      return 'warn'
  }
}
