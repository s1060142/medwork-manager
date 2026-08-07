const MONTH_CODES = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D',
  5: 'E',
  6: 'H',
  7: 'L',
  8: 'M',
  9: 'P',
  10: 'R',
  11: 'S',
  12: 'T',
}

const ODD_VALUES = {
  0: 1,
  1: 0,
  2: 5,
  3: 7,
  4: 9,
  5: 13,
  6: 15,
  7: 17,
  8: 19,
  9: 21,
  A: 1,
  B: 0,
  C: 5,
  D: 7,
  E: 9,
  F: 13,
  G: 15,
  H: 17,
  I: 19,
  J: 21,
  K: 2,
  L: 4,
  M: 18,
  N: 20,
  O: 11,
  P: 3,
  Q: 6,
  R: 8,
  S: 12,
  T: 14,
  U: 16,
  V: 10,
  W: 22,
  X: 25,
  Y: 24,
  Z: 23,
}

const EVEN_VALUES = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  I: 8,
  J: 9,
  K: 10,
  L: 11,
  M: 12,
  N: 13,
  O: 14,
  P: 15,
  Q: 16,
  R: 17,
  S: 18,
  T: 19,
  U: 20,
  V: 21,
  W: 22,
  X: 23,
  Y: 24,
  Z: 25,
}

const CONTROL_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])

function normalizeText(value) {
  return (value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
}

function splitConsonantsAndVowels(value) {
  const chars = normalizeText(value).split('')
  const consonants = chars.filter((char) => !VOWELS.has(char))
  const vowels = chars.filter((char) => VOWELS.has(char))
  return { consonants, vowels }
}

function encodeSurname(lastName) {
  const { consonants, vowels } = splitConsonantsAndVowels(lastName)
  return [...consonants, ...vowels, 'X', 'X', 'X'].slice(0, 3).join('')
}

function encodeName(firstName) {
  const { consonants, vowels } = splitConsonantsAndVowels(firstName)

  if (consonants.length >= 4) {
    return `${consonants[0]}${consonants[2]}${consonants[3]}`
  }

  return [...consonants, ...vowels, 'X', 'X', 'X'].slice(0, 3).join('')
}

function encodeDateAndGender(birthDate, gender) {
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Data di nascita non valida.')
  }

  const year = String(date.getFullYear()).slice(-2)
  const monthCode = MONTH_CODES[date.getMonth() + 1]
  const day = date.getDate()
  const normalizedGender = String(gender || '').toUpperCase()

  if (!['M', 'F'].includes(normalizedGender)) {
    throw new Error('Sesso non valido. Usa M o F.')
  }

  const dayValue = normalizedGender === 'F' ? day + 40 : day
  return `${year}${monthCode}${String(dayValue).padStart(2, '0')}`
}

function calculateControlChar(partialCode) {
  const upperCode = partialCode.toUpperCase()
  let sum = 0

  for (let index = 0; index < upperCode.length; index += 1) {
    const char = upperCode[index]
    const position = index + 1
    if (position % 2 === 0) {
      sum += EVEN_VALUES[char]
    } else {
      sum += ODD_VALUES[char]
    }
  }

  return CONTROL_CHARS[sum % 26]
}

export function calculateItalianTaxCode({ firstName, lastName, birthDate, gender, birthCityCode }) {
  if (!firstName || !lastName || !birthDate || !gender || !birthCityCode) {
    throw new Error('Compila Nome, Cognome, Data di nascita, Sesso e Codice Comune prima del calcolo.')
  }

  const cityCode = String(birthCityCode).trim().toUpperCase()
  if (!/^[A-Z][0-9]{3}$/.test(cityCode)) {
    throw new Error('Codice Comune non valido. Formato atteso: una lettera e tre numeri (es. F205).')
  }

  const partial = `${encodeSurname(lastName)}${encodeName(firstName)}${encodeDateAndGender(birthDate, gender)}${cityCode}`
  const controlChar = calculateControlChar(partial)
  return `${partial}${controlChar}`
}
