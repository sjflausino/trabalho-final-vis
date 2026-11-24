import fs from 'fs';
import readline from 'readline';

const UF_REGIOES = {
  AC: 'Norte', AP: 'Norte', AM: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
  BR: 'Nacional'
};

async function cleanData() {
  const inputFile = 'data/consulta_cand_2026/consulta_cand_2026_BRASIL.csv';
  const outputFile = 'data/candidaturas_2026_limpo.csv';
  
  const rl = readline.createInterface({
    input: fs.createReadStream(inputFile, { encoding: 'latin1' }),
    crlfDelay: Infinity
  });

  const out = fs.createWriteStream(outputFile, { encoding: 'utf8' });

  // Header
  const headers = [
    'sq_candidato',
    'nome',
    'nome_urna',
    'uf',
    'regiao',
    'cargo',
    'numero',
    'partido',
    'genero',
    'raca',
    'instrucao',
    'estado_civil',
    'ocupacao',
    'idade',
    'situacao'
  ];
  out.write(headers.join(',') + '\n');

  let count = 0;
  let skipped = 0;

  for await (const line of rl) {
    if (count === 0) { count++; continue; }
    const vals = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
    if (vals.length < 50) {
      skipped++;
      continue;
    }

    const uf = vals[10];
    const regiao = UF_REGIOES[uf] || 'Outros';
    const cargo = vals[14];
    const sq = vals[15];
    const num = vals[16];
    const nome = vals[17].replace(/"/g, '""');
    const nomeUrna = vals[18].replace(/"/g, '""');
    const partido = vals[26];
    const dtNasc = vals[36];
    const genero = vals[39];
    const instrucao = vals[41];
    const estadoCivil = vals[43];
    const raca = vals[45];
    const ocupacao = vals[47].replace(/"/g, '""');
    const situacao = vals[49];

    let idade = '';
    if (dtNasc && dtNasc.length === 10) {
      const parts = dtNasc.split('/');
      if (parts.length === 3) {
        const ano = parseInt(parts[2], 10);
        if (!isNaN(ano) && ano > 1900 && ano < 2015) {
          idade = (2026 - ano).toString();
        }
      }
    }

    // Formata linha CSV com escape adequado
    const row = [
      sq,
      `"${nome}"`,
      `"${nomeUrna}"`,
      uf,
      regiao,
      `"${cargo}"`,
      num,
      partido,
      genero,
      raca,
      `"${instrucao}"`,
      `"${estadoCivil}"`,
      `"${ocupacao}"`,
      idade,
      `"${situacao}"`
    ];

    out.write(row.join(',') + '\n');
    count++;
  }

  out.end();
  console.log(`Processamento concluído: ${count - 1} registros exportados para ${outputFile}`);
  console.log(`Linhas ignoradas: ${skipped}`);
}

cleanData();
