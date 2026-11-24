import { runQuery } from './db.js';

/**
 * Consulta de KPIs gerais agregados
 * Computa: total de candidaturas, % mulheres, % autodeclarados pretos/pardos/indígenas,
 * idade média e % com nível superior completo.
 */
export async function fetchKPIs(whereClause = '1=1') {
  const sql = `
    SELECT
      COUNT(*) AS total,
      ROUND(100.0 * COUNT(*) FILTER (WHERE genero = 'FEMININO') / NULLIF(COUNT(*), 0), 1) AS perc_mulheres,
      ROUND(100.0 * COUNT(*) FILTER (WHERE raca IN ('PRETA', 'PARDA', 'INDÍGENA')) / NULLIF(COUNT(*), 0), 1) AS perc_negros_indigenas,
      ROUND(AVG(idade), 1) AS idade_media,
      ROUND(100.0 * COUNT(*) FILTER (WHERE instrucao = 'SUPERIOR COMPLETO') / NULLIF(COUNT(*), 0), 1) AS perc_superior
    FROM candidaturas
    WHERE ${whereClause};
  `;
  const result = await runQuery(sql);
  const row = result.rows[0] || {};
  return {
    total: Number(row.total) || 0,
    perc_mulheres: Number(row.perc_mulheres) || 0,
    perc_negros_indigenas: Number(row.perc_negros_indigenas) || 0,
    idade_media: Number(row.idade_media) || 0,
    perc_superior: Number(row.perc_superior) || 0
  };
}

/**
 * Consulta agregada por UF para alimentar o mapa coroplético do Brasil
 */
export async function fetchMapData(whereClause = '1=1') {
  const sql = `
    SELECT
      uf,
      regiao,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE genero = 'FEMININO') AS total_mulheres,
      ROUND(100.0 * COUNT(*) FILTER (WHERE genero = 'FEMININO') / NULLIF(COUNT(*), 0), 1) AS perc_mulheres,
      COUNT(*) FILTER (WHERE raca IN ('PRETA', 'PARDA', 'INDÍGENA')) AS total_negros_indigenas,
      ROUND(100.0 * COUNT(*) FILTER (WHERE raca IN ('PRETA', 'PARDA', 'INDÍGENA')) / NULLIF(COUNT(*), 0), 1) AS perc_negros_indigenas,
      ROUND(AVG(idade), 1) AS idade_media
    FROM candidaturas
    WHERE ${whereClause} AND uf != 'BR'
    GROUP BY uf, regiao
    ORDER BY total DESC;
  `;
  const result = await runQuery(sql);
  return result.rows;
}

/**
 * Consulta de distribuição partidária (Top 12 partidos por volume no filtro ativo)
 * e o split de gênero dentro de cada agremiação
 */
export async function fetchPartiesData(whereClause = '1=1') {
  const sql = `
    SELECT
      partido,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE genero = 'FEMININO') AS mulheres,
      COUNT(*) FILTER (WHERE genero = 'MASCULINO') AS homens,
      ROUND(100.0 * COUNT(*) FILTER (WHERE genero = 'FEMININO') / NULLIF(COUNT(*), 0), 1) AS perc_mulheres
    FROM candidaturas
    WHERE ${whereClause}
    GROUP BY partido
    ORDER BY total DESC
    LIMIT 14;
  `;
  const result = await runQuery(sql);
  return result.rows;
}

/**
 * Consulta de perfil demográfico configurável por dimensão
 * Dimensões suportadas: 'raca', 'instrucao', 'estado_civil', 'cargo'
 */
export async function fetchDemographicsData(whereClause = '1=1', dimension = 'raca') {
  const validDims = ['raca', 'instrucao', 'estado_civil', 'cargo'];
  const col = validDims.includes(dimension) ? dimension : 'raca';

  const sql = `
    SELECT
      ${col} AS categoria,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE genero = 'FEMININO') AS mulheres,
      COUNT(*) FILTER (WHERE genero = 'MASCULINO') AS homens,
      ROUND(100.0 * COUNT(*) FILTER (WHERE genero = 'FEMININO') / NULLIF(COUNT(*), 0), 1) AS perc_mulheres
    FROM candidaturas
    WHERE ${whereClause}
    GROUP BY ${col}
    ORDER BY total DESC;
  `;
  const result = await runQuery(sql);
  return result.rows;
}

/**
 * Consulta para o histograma de distribuição etária em bins de 5 anos
 * Permite examinar o perfil geracional e a pirâmide etária das candidaturas
 */
export async function fetchAgeHistogramData(whereClause = '1=1') {
  const sql = `
    SELECT
      CAST(FLOOR(idade / 5.0) * 5 AS INTEGER) AS faixa_etaria,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE genero = 'FEMININO') AS mulheres,
      COUNT(*) FILTER (WHERE genero = 'MASCULINO') AS homens
    FROM candidaturas
    WHERE ${whereClause} AND idade IS NOT NULL
    GROUP BY faixa_etaria
    ORDER BY faixa_etaria ASC;
  `;
  const result = await runQuery(sql);
  return result.rows;
}

/**
 * Consulta paginada para a tabela de detalhes sob demanda (Details-on-Demand)
 */
export async function fetchCandidatesList(whereClause = '1=1', page = 0, pageSize = 15) {
  const offset = page * pageSize;

  const countSql = `
    SELECT COUNT(*) AS total_filtrado
    FROM candidaturas
    WHERE ${whereClause};
  `;

  const rowsSql = `
    SELECT
      ano,
      sq_candidato,
      nome_urna,
      cargo,
      partido,
      uf,
      genero,
      raca,
      idade,
      instrucao,
      ocupacao,
      situacao
    FROM candidaturas
    WHERE ${whereClause}
    ORDER BY nome_urna ASC
    LIMIT ${pageSize} OFFSET ${offset};
  `;

  const [countRes, rowsRes] = await Promise.all([
    runQuery(countSql),
    runQuery(rowsSql)
  ]);

  const total = Number(countRes.rows[0]?.total_filtrado ?? 0);

  return {
    rows: rowsRes.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    lastQueryTimeMs: rowsRes.executionTimeMs
  };
}

/**
 * Consulta agregada de série temporal para o gráfico de evolução histórica
 * Agrupa os dados por ano eleitoral para avaliar tendências e cumprimento de cotas.
 * Suporta escopo:
 *  - 'gerais': Apenas anos de eleições gerais (2014, 2018, 2022, 2026)
 *  - 'todas': Série completa com eleições gerais e municipais (2014 a 2026)
 */
export async function fetchTimeSeriesData(whereClause = '1=1', scope = 'gerais') {
  const scopeCondition = scope === 'gerais'
    ? 'ano IN (2014, 2018, 2022, 2026)'
    : '1=1';

  const fullWhere = (whereClause && whereClause !== '1=1')
    ? `(${whereClause}) AND ${scopeCondition}`
    : scopeCondition;

  const sql = `
    SELECT
      ano,
      CASE 
        WHEN ano IN (2016, 2020, 2024) THEN 'Municipais'
        ELSE 'Gerais'
      END AS tipo,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE genero = 'FEMININO') AS mulheres,
      COUNT(*) FILTER (WHERE genero = 'MASCULINO') AS homens,
      ROUND(100.0 * COUNT(*) FILTER (WHERE genero = 'FEMININO') / NULLIF(COUNT(*), 0), 1) AS perc_mulheres,
      COUNT(*) FILTER (WHERE raca IN ('PRETA', 'PARDA', 'INDÍGENA')) AS negros_indigenas,
      ROUND(100.0 * COUNT(*) FILTER (WHERE raca IN ('PRETA', 'PARDA', 'INDÍGENA')) / NULLIF(COUNT(*), 0), 1) AS perc_negros_indigenas,
      ROUND(AVG(idade), 1) AS idade_media,
      ROUND(100.0 * COUNT(*) FILTER (WHERE instrucao LIKE '%SUPERIOR COMPLETO%') / NULLIF(COUNT(*), 0), 1) AS perc_superior
    FROM candidaturas
    WHERE ${fullWhere}
    GROUP BY ano
    ORDER BY ano ASC;
  `;
  const result = await runQuery(sql);

  const expectedYears = scope === 'gerais'
    ? [2014, 2018, 2022, 2026]
    : [2014, 2016, 2018, 2020, 2022, 2024, 2026];

  const byYear = new Map();
  result.rows.forEach((r) => {
    byYear.set(Number(r.ano), {
      ano: Number(r.ano),
      tipo: r.tipo || ([2016, 2020, 2024].includes(Number(r.ano)) ? 'Municipais' : 'Gerais'),
      total: Number(r.total) || 0,
      mulheres: Number(r.mulheres) || 0,
      homens: Number(r.homens) || 0,
      perc_mulheres: Number(r.perc_mulheres) || 0,
      negros_indigenas: Number(r.negros_indigenas) || 0,
      perc_negros_indigenas: Number(r.perc_negros_indigenas) || 0,
      idade_media: Number(r.idade_media) || 0,
      perc_superior: Number(r.perc_superior) || 0
    });
  });

  return expectedYears.map((ano) => {
    if (byYear.has(ano)) {
      return byYear.get(ano);
    }
    return {
      ano,
      tipo: [2016, 2020, 2024].includes(ano) ? 'Municipais' : 'Gerais',
      total: 0,
      mulheres: 0,
      homens: 0,
      perc_mulheres: 0,
      negros_indigenas: 0,
      perc_negros_indigenas: 0,
      idade_media: 0,
      perc_superior: 0
    };
  });
}

let fullTemporalCache = null;
/**
 * Carrega a série histórica consolidada de todas as eleições (2014 a 2026)
 */
export async function fetchFullTimeSeriesSummary() {
  if (fullTemporalCache) return fullTemporalCache;
  try {
    const res = await fetch('/data/serie_temporal_historico.json');
    if (res.ok) {
      fullTemporalCache = await res.json();
      return fullTemporalCache;
    }
  } catch (err) {
    console.warn('Não foi possível carregar serie_temporal_historico.json:', err);
  }
  return null;
}

/**
 * Carrega listas estáticas para os seletores de filtros no cabeçalho
 */
export async function fetchFilterOptions() {
  const [cargos, partidos, regioes, anos] = await Promise.all([
    runQuery(`SELECT DISTINCT cargo FROM candidaturas ORDER BY cargo ASC;`),
    runQuery(`SELECT partido, COUNT(*) AS n FROM candidaturas GROUP BY partido ORDER BY n DESC;`),
    runQuery(`SELECT DISTINCT regiao FROM candidaturas WHERE regiao != 'Outros' ORDER BY regiao ASC;`),
    runQuery(`SELECT DISTINCT ano FROM candidaturas ORDER BY ano DESC;`)
  ]);

  return {
    cargos: cargos.rows.map((r) => r.cargo),
    partidos: partidos.rows.map((r) => r.partido),
    regioes: regioes.rows.map((r) => r.regiao),
    anos: anos.rows.map((r) => Number(r.ano))
  };
}
