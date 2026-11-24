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

async function generateDatasets() {
  const dataDir = path.resolve('data');
  const generalYears = [2014, 2018, 2022, 2026];
  const allYears = [2014, 2016, 2018, 2020, 2022, 2024, 2026];

  // 1. Exporta candidaturas_gerais_historico.csv (Eleições Gerais: 2014, 2018, 2022, 2026)
  const geraisOutFile = path.join(dataDir, 'candidaturas_gerais_historico.csv');
  const geraisPublicOutFile = path.resolve('public', 'data', 'candidaturas_gerais_historico.csv');
  const geraisStream = fs.createWriteStream(geraisOutFile, { encoding: 'utf8' });
  geraisStream.write(HEADERS_OUT.join(',') + '\n');

  // Estrutura para consolidação temporal agregada de todas as eleições (2014-2026)
  const timeSeriesSummary = {};

  for (const year of allYears) {
    const brasilFile = path.join(dataDir, `consulta_cand_${year}`, `consulta_cand_${year}_BRASIL.csv`);
    if (!fs.existsSync(brasilFile)) {
      console.log(`[Aviso] Arquivo não encontrado para o ano ${year}: ${brasilFile}`);
      continue;
    }

    const isGeneral = generalYears.includes(year);
    const rl = readline.createInterface({
      input: fs.createReadStream(brasilFile, { encoding: 'latin1' }),
      crlfDelay: Infinity
    });

    let lineCount = 0;
    let colIndex = {};
    const yearMetrics = {
      ano: year,
      tipo: isGeneral ? 'Gerais' : 'Municipais',
      total: 0,
      mulheres: 0,
      homens: 0,
      negros_indigenas: 0,
      branca: 0,
      outras_racas: 0,
      superior_completo: 0,
      soma_idade: 0,
      count_idade: 0,
      por_regiao: {
        'Norte': { total: 0, mulheres: 0, negros_indigenas: 0 },
        'Nordeste': { total: 0, mulheres: 0, negros_indigenas: 0 },
        'Centro-Oeste': { total: 0, mulheres: 0, negros_indigenas: 0 },
        'Sudeste': { total: 0, mulheres: 0, negros_indigenas: 0 },
        'Sul': { total: 0, mulheres: 0, negros_indigenas: 0 }
      }
    };

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

      let idade = '';
      if (dtNasc && dtNasc.length === 10) {
        const parts = dtNasc.split('/');
        if (parts.length === 3) {
          const anoNasc = parseInt(parts[2], 10);
          if (!isNaN(anoNasc) && anoNasc > 1900 && anoNasc < (anoInt - 10)) {
            const ageVal = anoInt - anoNasc;
            idade = ageVal.toString();
            yearMetrics.soma_idade += ageVal;
            yearMetrics.count_idade++;
          }
        }
      }

      // Métricas temporais
      yearMetrics.total++;
      if (genero === 'FEMININO') yearMetrics.mulheres++;
      if (genero === 'MASCULINO') yearMetrics.homens++;
      if (['PRETA', 'PARDA', 'INDÍGENA'].includes(raca)) yearMetrics.negros_indigenas++;
      if (raca === 'BRANCA') yearMetrics.branca++;
      if (['AMARELA'].includes(raca)) yearMetrics.outras_racas++;
      if (instrucao.toUpperCase().includes('SUPERIOR COMPLETO')) yearMetrics.superior_completo++;

      if (yearMetrics.por_regiao[regiao]) {
        yearMetrics.por_regiao[regiao].total++;
        if (genero === 'FEMININO') yearMetrics.por_regiao[regiao].mulheres++;
        if (['PRETA', 'PARDA', 'INDÍGENA'].includes(raca)) yearMetrics.por_regiao[regiao].negros_indigenas++;
      }

      // Se for eleição geral, escreve no microdado completo do DuckDB-Wasm
      if (isGeneral) {
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
        geraisStream.write(row.join(',') + '\n');
      }
    }

    // Calcula indicadores finais do ano
    yearMetrics.perc_mulheres = yearMetrics.total > 0 ? parseFloat((100 * yearMetrics.mulheres / yearMetrics.total).toFixed(1)) : 0;
    yearMetrics.perc_negros_indigenas = yearMetrics.total > 0 ? parseFloat((100 * yearMetrics.negros_indigenas / yearMetrics.total).toFixed(1)) : 0;
    yearMetrics.perc_superior = yearMetrics.total > 0 ? parseFloat((100 * yearMetrics.superior_completo / yearMetrics.total).toFixed(1)) : 0;
    yearMetrics.idade_media = yearMetrics.count_idade > 0 ? parseFloat((yearMetrics.soma_idade / yearMetrics.count_idade).toFixed(1)) : 0;

    timeSeriesSummary[year] = yearMetrics;
    console.log(`Ano ${year} (${isGeneral ? 'Geral' : 'Municipal'}): ${yearMetrics.total.toLocaleString('pt-BR')} candidaturas, ${yearMetrics.perc_mulheres}% mulheres, ${yearMetrics.perc_negros_indigenas}% pretos/pardos/indígenas, idade média ${yearMetrics.idade_media} anos.`);
  }

  geraisStream.end();
  fs.copyFileSync(geraisOutFile, geraisPublicOutFile);

  // Salva resumo da série temporal
  const jsonOutFile = path.join(dataDir, 'serie_temporal_historico.json');
  const jsonPublicOutFile = path.resolve('public', 'data', 'serie_temporal_historico.json');
  fs.writeFileSync(jsonOutFile, JSON.stringify(timeSeriesSummary, null, 2), 'utf8');
  fs.writeFileSync(jsonPublicOutFile, JSON.stringify(timeSeriesSummary, null, 2), 'utf8');

  console.log('\n✅ Processamento concluído com sucesso!');
  console.log(`1. Microdados de Eleições Gerais (2014, 2018, 2022, 2026): ${geraisPublicOutFile}`);
  console.log(`2. Resumo de Série Temporal (2014 a 2026): ${jsonPublicOutFile}`);
}

generateDatasets().catch(console.error);
