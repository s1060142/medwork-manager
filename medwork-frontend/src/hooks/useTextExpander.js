import { useCallback } from 'react'

export const CLINICAL_MACROS = {
  '.norm': 'Paziente in buone condizioni generali, asintomatico, eupnoico, apiretico. Esame obiettivo nei limiti di norma su tutti gli apparati.',
  '.vdt': 'Idoneo con prescrizione uso lenti correttive per VDT e pause ergoftalmologiche di 15 min ogni 120 min di lavoro continuativo.',
  '.mmc': 'Idoneo con limitazione: movimentazione manuale dei carichi consentita fino a max 15 kg; divieto di sollevamento con torsione del tronco.',
  '.rum': 'Idoneo con obbligo inderogabile di utilizzo otoprotettori DPI con attenuazione SNR adeguata (SNR ≥ 28 dB) durante la permanenza nei reparti a rischio.',
  '.guida': 'Idoneo alla conduzione di carrelli elevatori e macchine semoventi; accertamenti di screening tossicologico ed alcolimetrico con esito negativo.',
  '.notte': 'Idoneo al lavoro in turno notturno (fascia 00:00 - 06:00) senza controindicazioni cliniche.',
  '.chim': 'Idoneo con obbligo di uso DPI respiratori idonei (FFP2/FFP3/filtro combinato A2P3) e guanti di protezione chimica specifica.',
  '.rach': 'Rachialgia da sovraccarico biomeccanico; si raccomanda rispetto delle corrette posture ergonomiche e potenziamento muscolare addomino-lombare.',
  '.udito': 'Normoacusia bilaterale o lieve calo presbiacusico fisiologico non correlato a trauma acustico occupazionale.',
  '.derma': 'Cute e mucose integre, assenza di dermatiti da contatto o lesioni eczematose occupazionali.',
}

/**
 * Replace any triggered clinical macro tokens within text
 */
export function expandClinicalText(text) {
  if (!text) return text
  let result = text
  for (const [code, expansion] of Object.entries(CLINICAL_MACROS)) {
    // Match code preceded by start or whitespace, followed by whitespace or end
    const regex = new RegExp(`(^|\\s)${code.replace('.', '\\.')}(\\s|$)`, 'gi')
    result = result.replace(regex, `$1${expansion}$2`)
  }
  return result
}

/**
 * Custom hook to handle automatic text expansion for shorthand macros.
 */
export function useTextExpander(onTextChange) {
  const handleKeyDown = useCallback(
    (e, currentText, fieldName) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Tab') {
        const target = e.target
        const cursorPosition = target && target.selectionStart !== null && target.selectionStart !== undefined ? target.selectionStart : (target?.value?.length || 0)
        const textVal = target && target.value !== undefined ? target.value : (currentText || '')
        const textBeforeCursor = textVal.slice(0, cursorPosition)
        const words = textBeforeCursor.split(/\s+/)
        const lastWord = words[words.length - 1]

        if (lastWord && CLINICAL_MACROS[lastWord.toLowerCase()]) {
          e.preventDefault()
          const replacement = CLINICAL_MACROS[lastWord.toLowerCase()]
          const startOfWord = cursorPosition - lastWord.length
          const updatedText = textVal.slice(0, startOfWord) + replacement + (e.key === 'Enter' ? '\n' : ' ') + textVal.slice(cursorPosition)
          
          if (typeof onTextChange === 'function') {
            onTextChange(fieldName, updatedText)
          }

          setTimeout(() => {
            const newCursor = startOfWord + replacement.length + 1
            if (target && target.setSelectionRange) {
              target.setSelectionRange(newCursor, newCursor)
            }
          }, 0)
        }
      }
    },
    [onTextChange]
  )

  const handleTextChange = useCallback(
    (fieldName, val) => {
      const expanded = expandClinicalText(val)
      if (typeof onTextChange === 'function') {
        onTextChange(fieldName, expanded)
      }
    },
    [onTextChange]
  )

  return { handleKeyDown, handleTextChange, CLINICAL_MACROS, expandClinicalText }
}
