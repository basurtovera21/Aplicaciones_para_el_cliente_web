// Servicio para consulta de fabricantes y modelos vehiculares mediante la API REST de la NHTSA
// Permite autocompletar marcas y modelos oficiales en los formularios del sistema INVEH

// Catálogo de marcas y fabricantes vehiculares comunes (automóviles, camionetas, SUVs y motocicletas)
export const FABRICANTES_COMUNES = [
  'Audi',
  'Bajaj',
  'Benelli',
  'BMW',
  'BYD',
  'Changan',
  'Chery',
  'Chevrolet',
  'Citroën',
  'Daytona',
  'DFSK',
  'Fiat',
  'Ford',
  'Foton',
  'GAC Motor',
  'Geely',
  'Great Wall',
  'Haojue',
  'Haval',
  'Hero',
  'Hino',
  'Honda',
  'Hyundai',
  'IGM',
  'JAC',
  'Jeep',
  'Kawasaki',
  'Kia',
  'KTM',
  'Loncin',
  'Mazda',
  'Mercedes-Benz',
  'Mitsubishi',
  'Motor Uno',
  'Nissan',
  'Peugeot',
  'Renault',
  'Seat',
  'Shineray',
  'Subaru',
  'Suzuki',
  'Toyota',
  'TVS',
  'Vespa',
  'Volkswagen',
  'Volvo',
  'Yamaha'
]

// Caché en memoria para evitar llamadas repetidas a la API con la misma marca
const cacheModelosPorMarca = new Map()

// Consulta los modelos oficiales asociados a un fabricante en la API pública de la NHTSA
export async function obtenerModelosPorFabricante(nombreMarca) {
  // Validación básica del texto ingresado
  const marcaLimpia = (nombreMarca || '').trim()
  if (marcaLimpia.length < 2) {
    return []
  }

  // Verificar si la respuesta ya se encuentra en la caché local
  const claveCache = marcaLimpia.toLowerCase()
  if (cacheModelosPorMarca.has(claveCache)) {
    return cacheModelosPorMarca.get(claveCache)
  }

  try {
    // Endpoint oficial de la NHTSA (National Highway Traffic Safety Administration)
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${encodeURIComponent(marcaLimpia)}?format=json`
    const respuesta = await fetch(url)

    if (!respuesta.ok) {
      return []
    }

    const datos = await respuesta.json()

    // Extraer y normalizar los nombres de los modelos
    if (datos && Array.isArray(datos.Results)) {
      // Filtrar nombres válidos y eliminar duplicados con un Set
      const conjuntoModelos = new Set()
      for (const item of datos.Results) {
        if (item.Model_Name && typeof item.Model_Name === 'string') {
          conjuntoModelos.add(item.Model_Name.trim())
        }
      }

      // Ordenar alfabéticamente los modelos obtenidos
      const listaOrdenada = Array.from(conjuntoModelos).sort((a, b) => a.localeCompare(b))

      // Guardar en caché para futuras consultas
      cacheModelosPorMarca.set(claveCache, listaOrdenada)
      return listaOrdenada
    }

    return []
  } catch (error) {
    // Si no hay conexión o falla la API, se retorna lista vacía de forma segura
    console.warn('No fue posible consultar los modelos de la API externa:', error)
    return []
  }
}
