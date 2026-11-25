import * as d3 from 'd3';
import { showTooltip, moveTooltip, hideTooltip } from './tooltip.js';
import { store } from '../state.js';

let geoDataCache = null;

const UF_NAMES = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins'
};

/**
 * Renderiza o mapa coroplético do Brasil com D3.js puro
 * Suporta alternância dinâmica de métricas, realce interativo (hover)
 * e seleção/filtro por Unidade Federativa (clique).
 */
export async function renderMap(containerId, ufsData, metric = 'perc_mulheres') {
  const container = d3.select(containerId);
  if (container.empty()) return;

  // Carrega o GeoJSON dos estados se ainda não estiver em memória
  if (!geoDataCache) {
    try {
      geoDataCache = await d3.json('/data/brazil_states.geojson');
    } catch (err) {
      console.error('Erro ao carregar GeoJSON do Brasil:', err);
      container.html('<p class="chart-error">Não foi possível carregar os limites geográficos do Brasil.</p>');
      return;
    }
  }

  // Cria mapa de busca rápida por sigla de UF
  const dataMap = new Map();
  ufsData.forEach((d) => {
    dataMap.set(d.uf, d);
  });

  const node = container.node();
  const width = node.getBoundingClientRect().width || 520;
  const height = Math.max(480, Math.min(width * 0.95, 620));

  container.selectAll('*').remove();

  // SVG principal
  const svg = container.append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%').attr('height', '100%')
    .attr('class', 'map-svg');

  // Projeção geográfica ajustada automaticamente ao contêiner
  const projection = d3.geoMercator()
    .fitSize([width - 40, height - 60], geoDataCache);

  const pathGenerator = d3.geoPath().projection(projection);

  // Define escala de cor conforme a métrica selecionada
  let colorScale;
  let metricLabel = '';
  let formatVal = (v) => `${v.toFixed(1)}%`;

  if (metric === 'perc_mulheres') {
    metricLabel = '% Mulheres Candidatas';
    colorScale = d3.scaleSequential()
      .domain([25, 45]) // Margens de referência eleitoral
      .interpolator(d3.interpolateMagma);
  } else if (metric === 'perc_negros_indigenas') {
    metricLabel = '% Pretos, Pardos e Indígenas';
    colorScale = d3.scaleSequential()
      .domain([20, 80])
      .interpolator(d3.interpolateViridis);
  } else {
    metricLabel = 'Total de Candidaturas';
    const maxVal = d3.max(ufsData, (d) => Number(d.total)) || 2000;
    colorScale = d3.scaleSequential()
      .domain([0, maxVal])
      .interpolator(d3.interpolateCividis);
    formatVal = (v) => d3.format(',d')(Math.round(Number(v) || 0));
  }

  const selectedUf = store.getState().uf;

  const g = svg.append('g')
    .attr('transform', 'translate(20, 20)');

  // Funções de estilo de contorno sensíveis ao tema atual (Claro ou Escuro)
  const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark';
  const getNormalStroke = () => (isDark() ? 'var(--bg-surface, #111827)' : 'var(--bg-surface, #ffffff)');
  const getHoverStroke = (isSelected) => (isSelected ? 'var(--accent-gold, #f59e0b)' : (isDark() ? '#ffffff' : 'var(--primary, #2563eb)'));
  const getSelectedStroke = () => 'var(--accent-gold, #f59e0b)';

  // Desenha os polígonos dos estados
  const paths = g.selectAll('path.state-feature')
    .data(geoDataCache.features)
    .enter()
    .append('path')
    .attr('class', (f) => {
      const sigla = f.properties.sigla;
      const isSelected = selectedUf === sigla;
      return `state-feature ${isSelected ? 'state-selected' : ''}`;
    })
    .attr('d', pathGenerator)
    .attr('fill', (f) => {
      const ufInfo = dataMap.get(f.properties.sigla);
      if (!ufInfo) return 'var(--bg-surface-elevated, #e2e8f0)'; // Estado sem dados no filtro
      const val = ufInfo[metric];
      return val != null ? colorScale(val) : 'var(--bg-surface-elevated, #e2e8f0)';
    })
    .attr('stroke', (f) => (selectedUf === f.properties.sigla ? getSelectedStroke() : getNormalStroke()))
    .attr('stroke-width', (f) => (selectedUf === f.properties.sigla ? 3 : 1.2))
    .style('cursor', 'pointer')
    .style('transition', 'fill 0.25s ease, stroke 0.2s ease, stroke-width 0.2s ease');

  // Interatividade: Hover e Tooltip
  paths
    .on('mouseenter', function (event, f) {
      const sigla = f.properties.sigla;
      const isSelected = selectedUf === sigla;
      const nome = UF_NAMES[sigla] || f.properties.nome || sigla;
      const ufInfo = dataMap.get(sigla);

      d3.select(this)
        .attr('stroke', getHoverStroke(isSelected))
        .attr('stroke-width', isSelected ? 3.5 : 2.5)
        .raise();

      let tooltipHtml = `
        <div class="tooltip-title">${nome} (${sigla})</div>
        <div class="tooltip-meta">Região ${f.properties.regiao || ''}</div>
        <hr class="tooltip-sep"/>
      `;

      if (ufInfo) {
        tooltipHtml += `
          <div class="tooltip-row">
            <span>Total no filtro:</span>
            <strong>${d3.format(',d')(ufInfo.total)}</strong>
          </div>
          <div class="tooltip-row">
            <span>Mulheres:</span>
            <strong>${ufInfo.perc_mulheres.toFixed(1)}% (${ufInfo.total_mulheres})</strong>
          </div>
          <div class="tooltip-row">
            <span>Pretos/Pardos/Ind.:</span>
            <strong>${ufInfo.perc_negros_indigenas.toFixed(1)}% (${ufInfo.total_negros_indigenas})</strong>
          </div>
          <div class="tooltip-row">
            <span>Idade Média:</span>
            <strong>${ufInfo.idade_media ? ufInfo.idade_media.toFixed(1) + ' anos' : 'N/D'}</strong>
          </div>
          <div class="tooltip-hint">Clique para ${selectedUf === sigla ? 'remover filtro' : 'filtrar por ' + sigla}</div>
        `;
      } else {
        tooltipHtml += `<div class="tooltip-empty">Nenhum candidato no filtro ativo.</div>`;
      }

      showTooltip(event, tooltipHtml);
    })
    .on('mousemove', moveTooltip)
    .on('mouseleave', function (event, f) {
      const sigla = f.properties.sigla;
      const isSelected = selectedUf === sigla;

      d3.select(this)
        .attr('stroke', isSelected ? getSelectedStroke() : getNormalStroke())
        .attr('stroke-width', isSelected ? 3 : 1.2);

      hideTooltip();
    })
    .on('click', function (event, f) {
      const sigla = f.properties.sigla;
      store.toggle('uf', sigla);
    });

  // Legenda de cores gradiente embutida no rodapé do mapa
  drawLegend(svg, width, height, colorScale, metricLabel, formatVal);
}

/**
 * Desenha a barra gradiente contínua de legenda
 */
function drawLegend(svg, width, height, colorScale, label, formatVal) {
  const legendWidth = Math.min(220, width * 0.5);
  const legendHeight = 10;
  const x = 30;
  const y = height - 42;

  const defs = svg.append('defs');
  const linearGradient = defs.append('linearGradient')
    .attr('id', 'map-legend-gradient')
    .attr('x1', '0%')
    .attr('y1', '0%')
    .attr('x2', '100%')
    .attr('y2', '0%');

  const domain = colorScale.domain();
  const nStops = 10;
  for (let i = 0; i <= nStops; i++) {
    const t = i / nStops;
    const val = domain[0] + t * (domain[1] - domain[0]);
    linearGradient.append('stop')
      .attr('offset', `${t * 100}%`)
      .attr('stop-color', colorScale(val));
  }

  const legendG = svg.append('g')
    .attr('class', 'map-legend')
    .attr('transform', `translate(${x}, ${y})`);

  legendG.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('rx', 4)
    .style('fill', 'url(#map-legend-gradient)')
    .style('stroke', 'var(--border-color, #cbd5e1)')
    .style('stroke-width', 1);

  legendG.append('text')
    .attr('x', 0)
    .attr('y', -6)
    .attr('fill', 'var(--text-muted, #475569)')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .text(label);

  legendG.append('text')
    .attr('x', 0)
    .attr('y', legendHeight + 14)
    .attr('fill', 'var(--text-muted, #475569)')
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .text(formatVal(domain[0]));

  legendG.append('text')
    .attr('x', legendWidth)
    .attr('y', legendHeight + 14)
    .attr('text-anchor', 'end')
    .attr('fill', 'var(--text-muted, #475569)')
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .text(formatVal(domain[1]));
}
