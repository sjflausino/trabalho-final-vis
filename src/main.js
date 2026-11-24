import * as d3 from 'd3';
import { initDuckDB, runQuery } from './db.js';
import { store } from './state.js';
import {
  fetchKPIs,
  fetchMapData,
  fetchPartiesData,
  fetchDemographicsData,
  fetchAgeHistogramData,
  fetchCandidatesList,
  fetchFilterOptions,
  fetchTimeSeriesData,
  fetchFullTimeSeriesSummary
} from './queries.js';
import { renderKPIs } from './charts/kpis.js';
import { renderMap } from './charts/map.js';
import { renderDemographics } from './charts/demographics.js';
import { renderParties } from './charts/parties.js';
import { renderAgeHistogram } from './charts/ageHistogram.js';
import { renderDetailsTable } from './charts/detailsTable.js';
import { renderTimeSeries } from './charts/timeSeries.js';

let isUpdating = false;
let latestSqlExecuted = '';

/**
 * Ponto de entrada do sistema de Visual Analytics
 */
async function bootstrap() {
  const loadingOverlay = document.getElementById('loading-overlay');
  const loadingMsg = document.getElementById('loading-message');

  try {
    // 1. Inicializa o motor DuckDB-Wasm e carrega os dados
    await initDuckDB((msg) => {
      if (loadingMsg) loadingMsg.textContent = msg;
    });

    // 2. Popula os menus dropdown com dados reais
    await populateFilterDropdowns();

    // 3. Registra eventos dos controles da interface
    setupEventListeners();

    // 4. Inscreve a atualização do dashboard no gerenciador de estado
    store.subscribe((state, changedKeys) => {
      updateDashboard(changedKeys);
    });

    // 5. Primeira carga analítica do painel
    await updateDashboard(['initial']);

    // Oculta tela de carregamento com transição suave
    if (loadingOverlay) {
      loadingOverlay.classList.add('loading-fade-out');
      setTimeout(() => loadingOverlay.remove(), 400);
    }
  } catch (err) {
    console.error('Erro na inicialização da aplicação:', err);
    if (loadingMsg) {
      loadingMsg.innerHTML = `<span class="error-msg">Erro ao inicializar DuckDB-Wasm: ${err.message}</span>`;
    }
  }
}

/**
 * Preenche os selects de filtros estáticos com os valores extraídos da base
 */
async function populateFilterDropdowns() {
  const { cargos, partidos, regioes, anos } = await fetchFilterOptions();

  const anoSelect = document.getElementById('filter-ano');
  if (anoSelect && anos) {
    const gerais = [2014, 2018, 2022, 2026];
    anos.forEach((ano) => {
      const opt = document.createElement('option');
      opt.value = ano;
      const tipo = gerais.includes(Number(ano)) ? 'Gerais' : 'Municipais';
      opt.textContent = `Eleições ${tipo} ${ano}`;
      anoSelect.appendChild(opt);
    });
  }

  const cargoSelect = document.getElementById('filter-cargo');
  if (cargoSelect) {
    cargos.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      cargoSelect.appendChild(opt);
    });
  }

  const partidoSelect = document.getElementById('filter-partido');
  if (partidoSelect) {
    partidos.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p;
      partidoSelect.appendChild(opt);
    });
  }

  const regiaoSelect = document.getElementById('filter-regiao');
  if (regiaoSelect) {
    regioes.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r;
      regiaoSelect.appendChild(opt);
    });
  }
}

/**
 * Registra listeners de cliques, seleções e buscas
 */
function setupEventListeners() {
  // Filtros rápidos superiores
  const anoSelect = document.getElementById('filter-ano');
  if (anoSelect) {
    anoSelect.addEventListener('change', (e) => store.set('ano', e.target.value || null));
  }

  const cargoSelect = document.getElementById('filter-cargo');
  if (cargoSelect) {
    cargoSelect.addEventListener('change', (e) => store.set('cargo', e.target.value || null));
  }

  const regiaoSelect = document.getElementById('filter-regiao');
  if (regiaoSelect) {
    regiaoSelect.addEventListener('change', (e) => store.set('regiao', e.target.value || null));
  }

  const partidoSelect = document.getElementById('filter-partido');
  if (partidoSelect) {
    partidoSelect.addEventListener('change', (e) => store.set('partido', e.target.value || null));
  }

  const generoSelect = document.getElementById('filter-genero');
  if (generoSelect) {
    generoSelect.addEventListener('change', (e) => store.set('genero', e.target.value || null));
  }

  // Campo de busca com debounce
  const searchInput = document.getElementById('filter-search');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        store.set('search', e.target.value);
      }, 250);
    });
  }

  // Botão Limpar Filtros
  const btnReset = document.getElementById('btn-reset-filters');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (anoSelect) anoSelect.value = '';
      if (cargoSelect) cargoSelect.value = '';
      if (regiaoSelect) regiaoSelect.value = '';
      if (partidoSelect) partidoSelect.value = '';
      if (generoSelect) generoSelect.value = '';
      if (searchInput) searchInput.value = '';
      store.resetAllFilters();
    });
  }

  // Controles da Série Temporal
  const tsMetricRadios = document.querySelectorAll('input[name="timeseries-metric"]');
  tsMetricRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      store.set('timeSeriesMetric', e.target.value);
    });
  });

  const scopeButtons = document.querySelectorAll('.btn-toggle-scope');
  scopeButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      scopeButtons.forEach((b) => b.classList.remove('active'));
      const targetBtn = e.target.closest('.btn-toggle-scope') || e.target;
      targetBtn.classList.add('active');
      const newScope = targetBtn.getAttribute('data-scope');

      // Se alternar para 'gerais' e o usuário estiver com ano municipal selecionado (2016, 2020, 2024), reseta o ano
      if (newScope === 'gerais' && [2016, 2020, 2024].includes(Number(store.getState().ano))) {
        store.setMultiple({
          ano: null,
          timeSeriesScope: newScope
        });
        const selectAno = document.getElementById('filter-ano');
        if (selectAno) selectAno.value = '';
      } else {
        store.set('timeSeriesScope', newScope);
      }
    });
  });

  // Métrica do Mapa
  const mapMetricRadios = document.querySelectorAll('input[name="map-metric"]');
  mapMetricRadios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      store.set('mapMetric', e.target.value);
    });
  });

  // Dimensão do Gráfico Demográfico
  const demoButtons = document.querySelectorAll('.btn-toggle-demo');
  demoButtons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      demoButtons.forEach((b) => b.classList.remove('active'));
      e.target.classList.add('active');
      store.set('demographicsDim', e.target.getAttribute('data-dim'));
    });
  });

  // Modal para exibir a consulta SQL DuckDB gerada
  const btnShowSql = document.getElementById('btn-show-sql');
  const sqlModal = document.getElementById('sql-modal');
  const btnCloseSql = document.getElementById('btn-close-sql');
  if (btnShowSql && sqlModal) {
    btnShowSql.addEventListener('click', () => {
      const sqlCode = document.getElementById('sql-code-display');
      const whereClause = store.getWhereClause();
      const currentSql = latestSqlExecuted || generateInspectionSql(whereClause);
      if (sqlCode) sqlCode.textContent = currentSql;
      sqlModal.classList.remove('hidden');
    });
  }
  if (btnCloseSql && sqlModal) {
    btnCloseSql.addEventListener('click', () => sqlModal.classList.add('hidden'));
  }
  if (sqlModal) {
    // Fecha clicando no fundo escuro
    sqlModal.addEventListener('click', (e) => {
      if (e.target === sqlModal) sqlModal.classList.add('hidden');
    });
    // Fecha com tecla Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !sqlModal.classList.contains('hidden')) {
        sqlModal.classList.add('hidden');
      }
    });
  }

  // Resize responsivo com debounce
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      updateDashboard(['resize']);
    }, 250);
  });
}

function generateInspectionSql(whereClause, scope = 'gerais') {
  const tsScopeFilter = scope === 'gerais'
    ? 'ano IN (2014, 2018, 2022, 2026)'
    : '1=1 (todos os 7 pleitos)';

  return `-- Cláusula WHERE ativa no estado da aplicação:
WHERE ${whereClause}

-- 1. Cálculo de KPIs Globais:
SELECT
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE genero = 'FEMININO') / NULLIF(COUNT(*), 0), 1) AS perc_mulheres,
  ROUND(100.0 * COUNT(*) FILTER (WHERE raca IN ('PRETA', 'PARDA', 'INDÍGENA')) / NULLIF(COUNT(*), 0), 1) AS perc_negros_indigenas,
  ROUND(AVG(idade), 1) AS idade_media,
  ROUND(100.0 * COUNT(*) FILTER (WHERE instrucao LIKE '%SUPERIOR COMPLETO%') / NULLIF(COUNT(*), 0), 1) AS perc_superior
FROM candidaturas
WHERE ${whereClause};

-- 2. Agregação Geográfica por UF:
SELECT uf, regiao, COUNT(*) AS total, ROUND(100.0 * COUNT(*) FILTER (WHERE genero = 'FEMININO') / NULLIF(COUNT(*), 0), 1) AS perc_mulheres
FROM candidaturas
WHERE ${whereClause} AND uf != 'BR'
GROUP BY uf, regiao
ORDER BY total DESC;

-- 3. Série Temporal Dinâmica no DuckDB-Wasm (Escopo: ${scope === 'gerais' ? 'Eleições Gerais' : 'Série Completa'}):
SELECT
  ano,
  CASE WHEN ano IN (2016, 2020, 2024) THEN 'Municipais' ELSE 'Gerais' END AS tipo,
  COUNT(*) AS total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE genero = 'FEMININO') / NULLIF(COUNT(*), 0), 1) AS perc_mulheres,
  ROUND(100.0 * COUNT(*) FILTER (WHERE raca IN ('PRETA', 'PARDA', 'INDÍGENA')) / NULLIF(COUNT(*), 0), 1) AS perc_negros_indigenas,
  ROUND(AVG(idade), 1) AS idade_media
FROM candidaturas
WHERE ${tsScopeFilter}
GROUP BY ano
ORDER BY ano ASC;`;
}

/**
 * Atualiza todos os componentes e gráficos de forma coordenada
 * executando as consultas analíticas sob demanda no DuckDB-Wasm
 */
async function updateDashboard(changedKeys = []) {
  if (isUpdating) return;
  isUpdating = true;

  const tStart = performance.now();
  const state = store.getState();
  const whereClause = store.getWhereClause();
  const tsWhereClause = store.getWhereClause('ano');

  // Atualiza a consulta SQL atual para inspeção imediata no modal
  latestSqlExecuted = generateInspectionSql(whereClause, state.timeSeriesScope);

  // Renderiza badges de filtros ativos
  renderActiveFilterBadges();

  try {
    // Executa as consultas analíticas em paralelo
    const [
      kpisData,
      mapData,
      partiesData,
      demographicsData,
      ageData,
      candidatesData,
      rawTsData
    ] = await Promise.all([
      fetchKPIs(whereClause),
      fetchMapData(whereClause),
      fetchPartiesData(whereClause),
      fetchDemographicsData(whereClause, state.demographicsDim),
      fetchAgeHistogramData(whereClause),
      fetchCandidatesList(whereClause, state.page, state.pageSize),
      fetchTimeSeriesData(tsWhereClause, state.timeSeriesScope)
    ]);

    // Trata os dados da série temporal conforme o escopo selecionado
    const timeSeriesData = Array.isArray(rawTsData) ? rawTsData : [];

    // Renderiza cada componente D3
    renderKPIs('#kpis-container', kpisData);
    renderTimeSeries('#chart-timeseries', timeSeriesData, state.timeSeriesMetric, state.timeSeriesScope);
    await renderMap('#chart-map', mapData, state.mapMetric);
    renderParties('#chart-parties', partiesData);
    renderDemographics('#chart-demographics', demographicsData, state.demographicsDim);
    renderAgeHistogram('#chart-age', ageData);
    renderDetailsTable('#details-table-container', candidatesData);

    const tEnd = performance.now();
    const totalTimeMs = (tEnd - tStart).toFixed(0);

    const benchmarkEl = document.getElementById('pipeline-benchmark');
    if (benchmarkEl) {
      benchmarkEl.textContent = `⚡ Análise completa com DuckDB-Wasm em ${totalTimeMs} ms`;
      benchmarkEl.style.borderColor = '';
      benchmarkEl.style.color = '';
    }
  } catch (err) {
    console.error('Erro na atualização analítica:', err);
    const benchmarkEl = document.getElementById('pipeline-benchmark');
    if (benchmarkEl) {
      benchmarkEl.textContent = `❌ Erro: ${err.message}`;
      benchmarkEl.style.borderColor = '#ef4444';
      benchmarkEl.style.color = '#ef4444';
    }
  } finally {
    isUpdating = false;
  }
}

/**
 * Renderiza os chips de filtros ativos com opção de remoção individual
 */
function renderActiveFilterBadges() {
  const container = d3.select('#active-filters-chips');
  if (container.empty()) return;

  const filters = store.getActiveFiltersList();

  container.selectAll('*').remove();

  if (filters.length === 0) {
    container.append('span')
      .attr('class', 'filter-chip chip-empty')
      .text('Nenhum filtro aplicado (exibindo todo o Brasil)');
    return;
  }

  const chips = container.selectAll('.filter-chip-active')
    .data(filters)
    .enter()
    .append('span')
    .attr('class', 'filter-chip filter-chip-active');

  chips.append('span').text((d) => d.label);

  chips.append('button')
    .attr('class', 'chip-remove-btn')
    .attr('aria-label', (d) => `Remover filtro ${d.label}`)
    .html('&times;')
    .on('click', (event, d) => {
      event.stopPropagation();
      store.set(d.key, null);
      // Sincroniza selects se for o caso
      const el = document.getElementById(`filter-${d.key}`);
      if (el) el.value = '';
    });
}

// Inicia a aplicação após o carregamento da árvore DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
