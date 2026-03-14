import { getAllParliamentariansAsync } from '../lib/parliamentarians'

async function main() {
  const data = await getAllParliamentariansAsync()
  
  const deputados = data.filter((p: any) => p.tipo === 'DEPUTADO_FEDERAL')
  
  console.log('Total deputados:', deputados.length)
  
  // Check race distribution
  const racaCounts: Record<string, number> = {}
  deputados.forEach((d: any) => {
    const r = d.raca || 'unknown'
    racaCounts[r] = (racaCounts[r] || 0) + 1
  })
  
  console.log('\n=== RAÇA ===')
  Object.entries(racaCounts).sort((a: any, b: any) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`  ${k}: ${v} (${(v/deputados.length*100).toFixed(1)}%)`)
  })
  
  // Check Arthur Lira specifically
  const arthur = deputados.find((d: any) => d.nomeUrna.includes('Arthur'))
  console.log('\n=== ARTHUR LIRA ===')
  console.log(arthur)
  
  // Check some samples
  console.log('\n=== AMOSTRA (primeiros 10) ===')
  deputados.slice(0, 10).forEach((d: any) => {
    console.log(`  ${d.nomeUrna} -> raca: ${d.raca}, partido: ${d.partido}`)
  })
}

main().catch(console.error)
