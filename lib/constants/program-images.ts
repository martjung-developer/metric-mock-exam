const PROGRAM_IMAGE_BY_CODE: Record<string, string> = {
  BEED:      '/images/programs/beed.jpg',
  BLIS:      '/images/programs/blis.jpg',
  BSARCH:    '/images/programs/bsarch.jpg',
  'BSED-ENG':  '/images/programs/bsed-eng.jpg',
  'BSED-FIL':  '/images/programs/bsed-fil.jpg',
  'BSED-MATH': '/images/programs/bsed-math.jpg',
  'BSED-SCI':  '/images/programs/bsed-sci.jpg',
  BSID:      '/images/programs/bsid.jpg',
  BSPSYCH:   '/images/programs/bspsych.jpg',
}

function normalizeProgramCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '')
}

export function getProgramImagePath(code: string | null | undefined): string | null {
  if (!code) {return null}
  return PROGRAM_IMAGE_BY_CODE[normalizeProgramCode(code)] ?? null
}
