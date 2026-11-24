import fs from 'fs';
import readline from 'readline';

async function checkCols() {
  const filePath = 'data/consulta_cand_2026/consulta_cand_2026_BRASIL.csv';
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    return;
  }
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity
  });
  let count = 0;
  for await (const line of rl) {
    if (count === 0) {
      console.log('--- COLUNAS ---');
      const cols = line.split(';').map(c => c.replace(/"/g, ''));
      cols.forEach((col, idx) => console.log(`${idx}: ${col}`));
    } else if (count <= 3) {
      console.log(`\n--- EXEMPLO LINHA ${count} ---`);
      const vals = line.split(';').map(c => c.replace(/"/g, ''));
      console.log('UF:', vals[10], 'Cargo:', vals[14], 'Nome:', vals[17], 'Nome Urna:', vals[18]);
      console.log('Partido:', vals[26], vals[27]);
      console.log('Nasc:', vals[36], 'Gênero:', vals[39], 'Instrução:', vals[41], 'Cor/Raça:', vals[45], 'Ocupação:', vals[47], 'Situação:', vals[49]);
    }
    count++;
    if (count > 5) break;
  }
}

checkCols();
