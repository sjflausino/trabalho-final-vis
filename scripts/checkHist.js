import fs from 'fs';
import readline from 'readline';

async function checkHist() {
  const filePath = 'data/historico_candidatura_2026/historico_candidatura_2026_AC.csv';
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity
  });
  let count = 0;
  for await (const line of rl) {
    if (count === 0) {
      console.log('--- HISTÓRICO COLUNAS ---');
      const cols = line.split(';').map(c => c.replace(/"/g, ''));
      cols.forEach((col, idx) => console.log(`${idx}: ${col}`));
    } else if (count <= 2) {
      console.log(`\n--- HISTÓRICO EXEMPLO ${count} ---`);
      console.log(line);
    }
    count++;
    if (count > 2) break;
  }
}
checkHist();
