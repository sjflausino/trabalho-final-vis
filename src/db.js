import * as duckdb from '@duckdb/duckdb-wasm';

let db = null;
let conn = null;

/**
 * Inicializa a instância do DuckDB-Wasm no navegador
 * e carrega o dataset de candidaturas para a tabela analítica in-memory.
 */
export async function initDuckDB(onProgress) {
  if (db && conn) return { db, conn };

  if (onProgress) onProgress('Inicializando motor analítico DuckDB-Wasm...');

  // Obtém os bundles do jsdelivr compatíveis com o navegador atual
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  // Cria worker via Blob URL
  const workerUrl = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
  );

  const worker = new Worker(workerUrl);
  const logger = new duckdb.VoidLogger(); // Silencioso para evitar poluição no console
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(workerUrl);

  conn = await db.connect();

  if (onProgress) onProgress('Carregando base histórica completa (1,6 milhão de candidaturas em Parquet)...');

  // Carrega a base histórica completa com 100% das candidaturas (1.627.019 registros)
  // Utiliza formato Apache Parquet colunar de alta compressão (apenas 25 MB)
  try {
    const response = await fetch('/data/candidaturas.parquet');
    if (!response.ok) {
      throw new Error(`Falha ao carregar candidaturas.parquet: status ${response.status}`);
    }
    const buffer = await response.arrayBuffer();

    // Registra o buffer binário no sistema de arquivos virtual do DuckDB-Wasm
    await db.registerFileBuffer('candidaturas.parquet', new Uint8Array(buffer));

    if (onProgress) onProgress('Indexando 1,6 milhão de registros em memória WebAssembly...');

    // Criação da tabela otimizada lendo diretamente do Parquet colunar
    await conn.query(`
      CREATE TABLE IF NOT EXISTS candidaturas AS
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
      FROM read_parquet('candidaturas.parquet');
    `);
  } catch (parquetErr) {
    console.warn('[DuckDB-Wasm] Parquet não disponível, tentando fallback para CSV...', parquetErr);
    const response = await fetch('/data/candidaturas_historico_limpo.csv');
    if (!response.ok) {
      throw new Error(`Falha ao carregar base de dados: status ${response.status}`);
    }
    const csvText = await response.text();
    await db.registerFileText('candidaturas.csv', csvText);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS candidaturas AS
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
      FROM read_csv(
        'candidaturas.csv',
        header=true,
        delim=',',
        quote='"',
        escape='"',
        null_padding=true,
        ignore_errors=true,
        auto_detect=true
      );
    `);
  }

  // Valida o carregamento dos dados no banco
  const testCount = await conn.query('SELECT COUNT(*) AS total FROM candidaturas;');
  const totalLoaded = Number(testCount.toArray()[0]?.total ?? 0);
  console.log(`[DuckDB-Wasm] Base histórica de candidaturas carregada: ${totalLoaded} registros indexados.`);

  if (onProgress) onProgress(`Base carregada com sucesso (${totalLoaded.toLocaleString('pt-BR')} registros)!`);

  return { db, conn };
}

/**
 * Função utilitária para converter recursivamente BigInt gerado pelo Apache Arrow
 * em Number padrão do JavaScript, prevenindo TypeErrors em cálculos e no D3.
 */
function sanitizeArrowValues(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'bigint') return Number(val);
  if (Array.isArray(val)) return val.map(sanitizeArrowValues);
  if (typeof val === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(val)) {
      clean[k] = sanitizeArrowValues(v);
    }
    return clean;
  }
  return val;
}

/**
 * Executa uma consulta SQL analítica no DuckDB-Wasm e retorna
 * os registros em formato de array JS com tempo de execução aferido.
 */
export async function runQuery(sql) {
  if (!conn) throw new Error('DuckDB ainda não foi inicializado.');
  const start = performance.now();
  const result = await conn.query(sql);
  const end = performance.now();
  const executionTimeMs = parseFloat((end - start).toFixed(1));

  // Converte Apache Arrow RecordBatches em array de objetos JSON planos
  // e higieniza tipos BigInt para evitar falhas silenciosas de operações aritméticas
  const rawRows = result.toArray().map((row) => (typeof row.toJSON === 'function' ? row.toJSON() : row));
  const rows = rawRows.map(sanitizeArrowValues);

  return {
    rows,
    executionTimeMs,
    sql,
    rowCount: rows.length
  };
}

export function getDuckDB() {
  return { db, conn };
}
