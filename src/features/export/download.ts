import type { TDocumentDefinitions } from 'pdfmake/interfaces'
// Full Heebo TTF files (Hebrew + Latin). WOFF web fonts render incorrectly in pdfmake (ADR-5).
import heebo400 from '@expo-google-fonts/heebo/400Regular/Heebo_400Regular.ttf?url'
import heebo700 from '@expo-google-fonts/heebo/700Bold/Heebo_700Bold.ttf?url'
import { PDF_FONT } from './pdf'

/** Saves text/binary data as a file on the user's device. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadCsv(csv: string, fileName: string) {
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), fileName)
}

const absolute = (url: string) => new URL(url, window.location.href).href

/**
 * Builds and downloads the PDF. pdfmake (and the Heebo font files) are loaded
 * only now, so the rest of the site stays light.
 */
export async function downloadPdf(definition: TDocumentDefinitions, fileName: string) {
  const pdfMake = (await import('pdfmake/build/pdfmake')).default
  pdfMake.setFonts({
    [PDF_FONT]: {
      normal: absolute(heebo400),
      bold: absolute(heebo700),
      italics: absolute(heebo400),
      bolditalics: absolute(heebo700),
    },
  })
  const blob = await pdfMake.createPdf(definition).getBlob()
  downloadBlob(blob, fileName)
}
