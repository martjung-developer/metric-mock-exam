import type { TosAreaConfig } from '@/lib/types/admin/exams/exam.types'

export interface TosTemplateArea {
  area_title: string
  weight_percent: number
  min_percent: number
}

export interface TosTemplate {
  program_code: string
  temporary: true
  available: boolean
  areas: TosTemplateArea[]
}

const confirmedTemplates: TosTemplate[] = [
  {
    program_code: 'BLIS', temporary: true, available: true,
    areas: [
      { area_title: 'Library Organization and Management', weight_percent: 20, min_percent: 50 },
      { area_title: 'Reference/Bibliography/User Services', weight_percent: 20, min_percent: 50 },
      { area_title: 'Cataloging and Classification', weight_percent: 20, min_percent: 50 },
      { area_title: 'Selection and Acquisition', weight_percent: 15, min_percent: 50 },
      { area_title: 'Indexing and Abstracting', weight_percent: 15, min_percent: 50 },
      { area_title: 'Information Technology', weight_percent: 10, min_percent: 50 },
    ],
  },
  {
    program_code: 'BSEd-ENG', temporary: true, available: true,
    areas: [
      { area_title: 'Methodology and Applied Subjects', weight_percent: 45, min_percent: 0 },
      { area_title: 'Literature', weight_percent: 30, min_percent: 0 },
      { area_title: 'Theoretical Foundations of Language, Culture, Literacies and Literature', weight_percent: 25, min_percent: 0 },
    ],
  },
  {
    program_code: 'BSEd-SCI', temporary: true, available: true,
    areas: [
      { area_title: 'Biology', weight_percent: 40, min_percent: 0 },
      { area_title: 'Chemistry', weight_percent: 23, min_percent: 0 },
      { area_title: 'Physics', weight_percent: 12, min_percent: 0 },
      { area_title: 'Earth Science', weight_percent: 12, min_percent: 0 },
      { area_title: 'Science Instruction', weight_percent: 13, min_percent: 0 },
    ],
  },
  {
    program_code: 'BEEd', temporary: true, available: true,
    areas: [
      { area_title: 'Teaching Profession', weight_percent: 15, min_percent: 0 },
      { area_title: 'Curriculum/Methods/EdTech', weight_percent: 30, min_percent: 0 },
      { area_title: 'Child and Adolescent Learners', weight_percent: 20, min_percent: 0 },
      { area_title: 'Assessment of Learning', weight_percent: 15, min_percent: 0 },
      { area_title: 'Field Study/Research', weight_percent: 20, min_percent: 0 },
    ],
  },
]

const unconfirmedProgramCodes = ['BSEd-FIL', 'BSPSYCH', 'BSEd-MATH', 'BSARCH', 'BSID']

export const TOS_TEMPLATES: TosTemplate[] = [
  ...confirmedTemplates,
  ...unconfirmedProgramCodes.map((program_code): TosTemplate => ({
    program_code,
    temporary: true,
    available: false,
    areas: [],
  })),
]

export function templateAreasForQuestionCount(
  template: TosTemplate,
  questionCount: number,
): TosAreaConfig[] {
  if (!template.available || template.areas.length === 0) {return []}

  const exactCounts = template.areas.map((area) => questionCount * area.weight_percent / 100)
  const counts = exactCounts.map(Math.floor)
  let remaining = questionCount - counts.reduce((sum, count) => sum + count, 0)
  const remainderOrder = exactCounts
    .map((count, index) => ({ index, remainder: count - Math.floor(count) }))
    .sort((a, b) => b.remainder - a.remainder)

  for (let index = 0; index < remaining; index += 1) {
    const target = remainderOrder[index]
    if (target) {counts[target.index] = (counts[target.index] ?? 0) + 1}
  }
  remaining = 0

  return template.areas.map((area, index) => ({
    area_title: area.area_title,
    weight_percent: area.weight_percent,
    expected_items: counts[index] ?? 0,
    min_percent: area.min_percent,
  }))
}
