const MUNICIPALITIES_DATASET_URL = 'https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json'

let municipalitiesCache = null
let municipalitiesPromise = null

function mapMunicipality(record) {
  return {
    name: record.nome,
    provinceCode: record.sigla,
    cadastralCode: record.codiceCatastale,
  }
}

export async function getItalianMunicipalities() {
  if (municipalitiesCache) {
    return municipalitiesCache
  }

  if (municipalitiesPromise) {
    return municipalitiesPromise
  }

  municipalitiesPromise = fetch(MUNICIPALITIES_DATASET_URL)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('Impossibile recuperare i comuni italiani.')
      }

      const data = await response.json()
      const mapped = (Array.isArray(data) ? data : [])
        .map(mapMunicipality)
        .filter((item) => item.name && item.cadastralCode)

      municipalitiesCache = mapped
      return mapped
    })
    .finally(() => {
      municipalitiesPromise = null
    })

  return municipalitiesPromise
}
