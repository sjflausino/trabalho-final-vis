import fs from 'fs';
import path from 'path';
import readline from 'readline';

const UF_REGIOES = {
  AC: 'Norte', AP: 'Norte', AM: 'Norte', PA: 'Norte', RO: 'Norte', RR: 'Norte', TO: 'Norte',
  AL: 'Nordeste', BA: 'Nordeste', CE: 'Nordeste', MA: 'Nordeste', PB: 'Nordeste', PE: 'Nordeste', PI: 'Nordeste', RN: 'Nordeste', SE: 'Nordeste',
  DF: 'Centro-Oeste', GO: 'Centro-Oeste', MT: 'Centro-Oeste', MS: 'Centro-Oeste',
  ES: 'Sudeste', MG: 'Sudeste', RJ: 'Sudeste', SP: 'Sudeste',
  PR: 'Sul', RS: 'Sul', SC: 'Sul',
  BR: 'Nacional'
};

const HEADERS_OUT = [
  'ano',
  'sq_candidato',
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

async function optimizeAllYears() {
  const dataDir = path.resolve('data');
  const generalYears = [2014, 2018, 2022, 2026];
  const allYears = [2014, 2016, 2018, 2020, 2022, 2024, 2026];

  const outputFile = path.join(dataDir, 'candidaturas_historico_limpo.csv');
  const publicOutputFile = path.resolve('public', 'data', 'candidaturas_historico_limpo.csv');

  const out = fs.createWriteStream(outputFile, { encoding: 'utf8' });
  out.write(HEADERS_OUT.join(',') + '\n');

  let totalExported = 0;

  for (const year of allYears) {
    const brasilFile = path.join(dataDir, `consulta_cand_${year}`, `consulta_cand_${year}_BRASIL.csv`);
    if (!fs.existsSync(brasilFile)) {
      console.log(`[Aviso] Arquivo não encontrado: ${brasilFile}`);
      continue;
    }

    const isGeneral = generalYears.includes(year);
    const rl = readline.createInterface({
      input: fs.createReadStream(brasilFile, { encoding: 'latin1' }),
      crlfDelay: Infinity
    });

    let lineCount = 0;
    let colIndex = {};
    let exportedCount = 0;
    let vereadorIndex = 0;

    for await (const line of rl) {
      lineCount++;
      if (lineCount === 1) {
        const rawCols = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
        rawCols.forEach((col, idx) => { colIndex[col] = idx; });
        continue;
      }

      const vals = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
      if (vals.length < 30) continue;

      const anoInt = year;
      const uf = vals[colIndex['SG_UF']] || '';
      const regiao = UF_REGIOES[uf] || 'Outros';
      const cargo = (vals[colIndex['DS_CARGO']] || '').replace(/"/g, '""').trim();
      const sq = vals[colIndex['SQ_CANDIDATO']] || '';
      const num = vals[colIndex['NR_CANDIDATO']] || '';
      const nomeUrna = (vals[colIndex['NM_URNA_CANDIDATO']] || vals[colIndex['NM_CANDIDATO']] || '').replace(/"/g, '""');
      const partido = (vals[colIndex['SG_PARTIDO']] || '').trim().toUpperCase();
      const dtNasc = vals[colIndex['DT_NASCIMENTO']] || '';
      const genero = (vals[colIndex['DS_GENERO']] || '').trim().toUpperCase();
      const instrucao = (vals[colIndex['DS_GRAU_INSTRUCAO']] || '').replace(/"/g, '""');
      const estadoCivil = (vals[colIndex['DS_ESTADO_CIVIL']] || '').replace(/"/g, '""');
      const raca = (vals[colIndex['DS_COR_RACA']] || '').trim().toUpperCase();
      const ocupacao = (vals[colIndex['DS_OCUPACAO']] || '').replace(/"/g, '""');
      const situacao = (vals[colIndex['DS_SITUACAO_CANDIDATURA']] || '').replace(/"/g, '""');

      // Amostragem inteligente para anos municipais (2016, 2020, 2024):
      // - Mantém 100% dos cargos executivos (PREFEITO e VICE-PREFEITO)
      // - Amostra proporcional representativa de VEREADOR (1 a cada 15)
      // Nas eleições gerais (2014, 2018, 2022, 2026): mantém 100% dos candidatos.
      if (!isGeneral) {
        if (cargo.toUpperCase() === 'VEREADOR') {
          vereadorIndex++;
          if (vereadorIndex % 15 !== 0) {
            continue;
          }
        }
      }

      let idade = '';
      if (dtNasc && dtNasc.length === 10) {
        const parts = dtNasc.split('/');
        if (parts.length === 3) {
          const anoNasc = parseInt(parts[2], 10);
          if (!isNaN(anoNasc) && anoNasc > 1900 && anoNasc < (anoInt - 10)) {
            idade = (anoInt - anoNasc).toString();
          }
        }
      }

      const row = [
        anoInt,
        sq,
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
      exportedCount++;
    }

    console.log(`Ano ${year} (${isGeneral ? 'Gerais - 100%' : 'Municipais - Amostra Estratificada'}): ${exportedCount.toLocaleString('pt-BR')} registros exportados.`);
    totalExported += exportedCount;
  }

  out.end();

  await new Promise(resolve => setTimeout(resolve, 500));
  fs.copyFileSync(outputFile, publicOutputFile);

  const stat = fs.statSync(publicOutputFile);
  console.log(`\n🎉 Processamento concluído com sucesso!`);
  console.log(`Total de candidaturas consolidado: ${totalExported.toLocaleString('pt-BR')}`);
  console.log(`Tamanho final do CSV em public/data/: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
}

optimizeAllYears().catch(console.error);
