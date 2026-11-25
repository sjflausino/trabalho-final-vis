import duckdb from 'duckdb';
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

async function main() {
  const dataDir = path.resolve('data');
  const allYears = [2014, 2016, 2018, 2020, 2022, 2024, 2026];
  const tempCsvPath = path.join(dataDir, '_temp_full_100pct.csv');
  const outParquetPath = path.resolve('public', 'data', 'candidaturas.parquet');

  console.log('1. Consolidando 100% das candidaturas históricas de 2014 a 2026...');
  const out = fs.createWriteStream(tempCsvPath, { encoding: 'utf8' });
  out.write(HEADERS_OUT.join(',') + '\n');

  let totalRecords = 0;

  for (const year of allYears) {
    const brasilFile = path.join(dataDir, `consulta_cand_${year}`, `consulta_cand_${year}_BRASIL.csv`);
    if (!fs.existsSync(brasilFile)) {
      console.log(`[Aviso] Arquivo não encontrado: ${brasilFile}`);
      continue;
    }

    const rl = readline.createInterface({
      input: fs.createReadStream(brasilFile, { encoding: 'latin1' }),
      crlfDelay: Infinity
    });

    let lineCount = 0;
    let colIndex = {};
    let yearCount = 0;

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
      yearCount++;
    }

    console.log(`Ano ${year}: ${yearCount.toLocaleString('pt-BR')} candidaturas extraídas (100%).`);
    totalRecords += yearCount;
  }

  out.end();
  await new Promise(r => setTimeout(r, 1000));
  console.log(`\nTotal consolidado: ${totalRecords.toLocaleString('pt-BR')} registros.`);

  console.log('2. Convertendo para formato Apache Parquet com compressão zstd...');
  const db = new duckdb.Database(':memory:');
  const conn = db.connect();

  const tempCsvClean = tempCsvPath.replace(/\\/g, '/');
  const outParquetClean = outParquetPath.replace(/\\/g, '/');

  await new Promise((resolve, reject) => {
    conn.run(`
      COPY (
        SELECT 
          TRY_CAST(ano AS INTEGER) AS ano,
          sq_candidato,
          nome_urna,
          uf,
          regiao,
          cargo,
          TRY_CAST(numero AS INTEGER) AS numero,
          partido,
          genero,
          raca,
          instrucao,
          estado_civil,
          ocupacao,
          TRY_CAST(idade AS INTEGER) AS idade,
          situacao
        FROM read_csv('${tempCsvClean}', header=true, delim=',', quote='"', escape='"', auto_detect=true)
      ) TO '${outParquetClean}' (FORMAT PARQUET, COMPRESSION ZSTD);
    `, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  // Remove arquivo temporário
  if (fs.existsSync(tempCsvPath)) {
    fs.unlinkSync(tempCsvPath);
  }

  const stat = fs.statSync(outParquetPath);
  console.log(`✅ Sucesso! Parquet gerado com 100% dos dados em: ${outParquetPath}`);
  console.log(`Tamanho final do Parquet: ${(stat.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
