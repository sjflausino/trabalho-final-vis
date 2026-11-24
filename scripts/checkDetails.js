import fs from 'fs';
import readline from 'readline';

async function checkDetails() {
  const filePath = 'data/consulta_cand_2026/consulta_cand_2026_BRASIL.csv';
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity
  });

  let total = 0;
  const partidos = new Map();
  const graus = new Map();
  let minIdade = 999, maxIdade = -999;
  let invalidBirth = 0;

  for await (const line of rl) {
    if (total === 0) { total++; continue; }
    const vals = line.split(';').map(c => c.replace(/"/g, ''));
    if (vals.length < 50) continue;

    const partido = vals[26];
    const grau = vals[41];
    const dtNasc = vals[36];

    partidos.set(partido, (partidos.get(partido) || 0) + 1);
    graus.set(grau, (graus.get(grau) || 0) + 1);

    if (dtNasc && dtNasc.length === 10) {
      const parts = dtNasc.split('/');
      if (parts.length === 3) {
        const ano = parseInt(parts[2], 10);
        if (!isNaN(ano) && ano > 1900 && ano < 2015) {
          const idade = 2026 - ano;
          if (idade < minIdade) minIdade = idade;
          if (idade > maxIdade) maxIdade = idade;
        } else {
          invalidBirth++;
        }
      }
    } else {
      invalidBirth++;
    }

    total++;
  }

  console.log('Partidos:', partidos.size, Object.fromEntries(partidos));
  console.log('Grau Instrução:', Object.fromEntries(graus));
  console.log('Faixa etária calculada:', minIdade, 'a', maxIdade, 'anos. Nascimentos inválidos:', invalidBirth);
}

checkDetails();
