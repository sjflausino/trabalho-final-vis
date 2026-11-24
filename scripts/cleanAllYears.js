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

async function processFile(filePath, outStream) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: 'latin1' }),
    crlfDelay: Infinity
  });

  let lineCount = 0;
  let exportedCount = 0;
  let colIndex = {};

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) {
      const rawCols = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
      rawCols.forEach((col, idx) => {
        colIndex[col] = idx;
      });
      console.log(`[Header] ${path.basename(filePath)} mapeou ${rawCols.length} colunas.`);
      continue;
    }

    const vals = line.split(';').map(c => c.replace(/^"|"$/g, '').trim());
    if (vals.length < 30) continue;

    const ano = vals[colIndex['ANO_ELEICAO']] || '';
    const anoInt = parseInt(ano, 10) || 2026;
    const uf = vals[colIndex['SG_UF']] || '';
    const regiao = UF_REGIOES[uf] || 'Outros';
    const cargo = (vals[colIndex['DS_CARGO']] || '').replace(/"/g, '""');
    const sq = vals[colIndex['SQ_CANDIDATO']] || '';
    const num = vals[colIndex['NR_CANDIDATO']] || '';
    const nome = (vals[colIndex['NM_CANDIDATO']] || '').replace(/"/g, '""');
    const nomeUrna = (vals[colIndex['NM_URNA_CANDIDATO']] || '').replace(/"/g, '""');
    const partido = (vals[colIndex['SG_PARTIDO']] || '').trim().toUpperCase();
    const dtNasc = vals[colIndex['DT_NASCIMENTO']] || '';
    const genero = (vals[colIndex['DS_GENERO']] || '').trim().toUpperCase();
    const instrucao = (vals[colIndex['DS_GRAU_INSTRUCAO']] || '').replace(/"/g, '""');
    const estadoCivil = (vals[colIndex['DS_ESTADO_CIVIL']] || '').replace(/"/g, '""');
    const raca = (vals[colIndex['DS_COR_RACA']] || '').trim().toUpperCase();
    const ocupacao = (vals[colIndex['DS_OCUPACAO']] || '').replace(/"/g, '""');
    const situacao = (vals[colIndex['DS_SITUACAO_CANDIDATURA']] || '').replace(/"/g, '""');

    // Cálculo da idade precisa para o ano do pleito
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

    outStream.write(row.join(',') + '\n');
    exportedCount++;
  }

  console.log(`✓ ${path.basename(filePath)}: ${exportedCount.toLocaleString('pt-BR')} registros exportados.`);
  return exportedCount;
}

async function cleanAll() {
  const dataDir = path.resolve('data');
  const targetFiles = [];

  // Busca todos os diretórios consulta_cand_*
  const entries = fs.readdirSync(dataDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('consulta_cand_')) {
      const brasilFile = path.join(dataDir, entry.name, `${entry.name}_BRASIL.csv`);
      if (fs.existsSync(brasilFile)) {
        targetFiles.push(brasilFile);
      }
    }
  }

  // Ordena cronologicamente por ano
  targetFiles.sort((a, b) => a.localeCompare(b));

  console.log('Encontrados os seguintes arquivos de eleições gerais:', targetFiles);

  const outputFile = path.join(dataDir, 'candidaturas_historico_limpo.csv');
  const publicOutputFile = path.resolve('public', 'data', 'candidaturas_historico_limpo.csv');

  const out = fs.createWriteStream(outputFile, { encoding: 'utf8' });
  out.write(HEADERS_OUT.join(',') + '\n');

  let totalGeneral = 0;
  for (const f of targetFiles) {
    const c = await processFile(f, out);
    totalGeneral += c;
  }

  out.end();

  // Copia para public/data para consumo do Vite
  fs.copyFileSync(outputFile, publicOutputFile);

  console.log(`\n🎉 Processamento concluído com sucesso!`);
  console.log(`Total geral de candidaturas indexadas: ${totalGeneral.toLocaleString('pt-BR')}`);
  console.log(`Arquivo salvo em: ${outputFile} e ${publicOutputFile}`);
}

cleanAll().catch(console.error);
