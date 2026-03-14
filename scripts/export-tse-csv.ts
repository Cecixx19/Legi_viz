import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const TSE_DATA = join(process.cwd(), 'public/data/tse-deputados-2022.json')
const OUTPUT = join(process.cwd(), 'public/data/tse-deputados-2022.csv')

const tseData = JSON.parse(readFileSync(TSE_DATA, 'utf-8'))

const rows = Object.entries(tseData).map(([nome, dados]: [string, any]) => ({
  nome,
  raca: dados.raca,
  genero: dados.genero
}))

const csv = [
  'nome,raca,genero',
  ...rows.map(r => `"${r.nome}","${r.raca}","${r.genero}"`)
].join('\n')

writeFileSync(OUTPUT, csv)
console.log(`Exported ${rows.length} rows to ${OUTPUT}`)
