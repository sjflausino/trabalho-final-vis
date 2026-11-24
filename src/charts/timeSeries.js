import * as d3 from 'd3';
import { showTooltip, moveTooltip, hideTooltip } from './tooltip.js';
import { store } from '../state.js';

/**
 * Renderiza o gráfico de Série Temporal (Evolução Histórica das Eleições)
 * Suporta múltiplas métricas, linha de referência (cota de 30%),
 * tooltips analíticos e filtragem por ano ao clicar nos marcadores.
 */
export function renderTimeSeries(containerId, data, metric = 'perc_mulheres', scope = 'gerais') {
  const container = d3.select(containerId);
  if (container.empty()) return;

  const node = container.node();
  const totalWidth = node.getBoundingClientRect().width || 600;
  const margin = { top: 25, right: 35, bottom: 40, left: 55 };
  const width = totalWidth - margin.left - margin.right;
  const height = 240 - margin.top - margin.bottom;

  container.selectAll('*').remove();

  if (!data || data.length === 0) {
    container.html('<p class="chart-empty">Nenhum dado temporal encontrado para o filtro ativo.</p>');
    return;
  }

  // Configuração por métrica
  const metricConfigs = {
    perc_mulheres: {
      label: '% Mulheres Candidatas',
      format: (v) => `${Number(v).toFixed(1)}%`,
      color: '#ec4899',
      gradientId: 'gradient-mulheres',
      showQuota: true,
      quotaVal: 30,
      quotaLabel: 'Cota Mínima Legal (30%)',
      yDomain: [20, Math.max(40, (d3.max(data, d => d.perc_mulheres) || 35) + 3)]
    },
    perc_negros_indigenas: {
      label: '% Pretos, Pardos e Indígenas',
      format: (v) => `${Number(v).toFixed(1)}%`,
      color: '#f59e0b',
      gradientId: 'gradient-diversidade',
      showQuota: false,
      yDomain: [35, Math.max(55, (d3.max(data, d => d.perc_negros_indigenas) || 50) + 4)]
    },
    idade_media: {
      label: 'Idade Média (anos)',
      format: (v) => `${Number(v).toFixed(1)} anos`,
      color: '#10b981',
      gradientId: 'gradient-idade',
      showQuota: false,
      yDomain: (() => {
        const valid = data.map((d) => d.idade_media).filter((v) => v > 0);
        const minVal = valid.length > 0 ? d3.min(valid) : 40;
        const maxVal = valid.length > 0 ? d3.max(valid) : 55;
        return [Math.max(20, minVal - 3), maxVal + 3];
      })()
    },
    total: {
      label: 'Total de Candidaturas',
      format: (v) => d3.format(',d')(Math.round(v)).replace(/,/g, '.'),
      color: '#38bdf8',
      gradientId: 'gradient-total',
      showQuota: false,
      yDomain: [0, (d3.max(data, d => d.total) || 1000) * 1.15]
    }
  };

  const config = metricConfigs[metric] || metricConfigs.perc_mulheres;

  const svg = container.append('svg')
    .attr('viewBox', `0 0 ${totalWidth} ${height + margin.top + margin.bottom}`)
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('class', 'timeseries-svg');

  // Gradiente linear para a área preenchida
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', config.gradientId)
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '0%').attr('y2', '100%');

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', config.color)
    .attr('stop-opacity', 0.35);

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', config.color)
    .attr('stop-opacity', 0.0);

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Escalas
  const years = data.map(d => d.ano);
  const x = d3.scalePoint()
    .domain(years)
    .range([0, width])
    .padding(0.15);

  const y = d3.scaleLinear()
    .domain(config.yDomain)
    .range([height, 0])
    .nice();

  // Grid horizontal
  g.append('g')
    .attr('class', 'grid grid-y')
    .call(
      d3.axisLeft(y)
        .ticks(5)
        .tickSize(-width)
        .tickFormat('')
    )
    .call(g => g.selectAll('.tick line').attr('stroke', '#1e293b').attr('stroke-dasharray', '2,2'))
    .call(g => g.select('.domain').remove());

  // Linha de cota se aplicável
  if (config.showQuota && config.quotaVal >= y.domain()[0] && config.quotaVal <= y.domain()[1]) {
    const quotaY = y(config.quotaVal);
    
    g.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', quotaY)
      .attr('y2', quotaY)
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0.85);

    g.append('text')
      .attr('x', width - 4)
      .attr('y', quotaY - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#f87171')
      .attr('font-size', '0.725rem')
      .attr('font-weight', '600')
      .text(config.quotaLabel);
  }

  // Gerador de área sob a curva
  const areaGenerator = d3.area()
    .x(d => x(d.ano))
    .y0(height)
    .y1(d => y(d[metric] || 0))
    .curve(d3.curveMonotoneX);

  // Renderiza a área preenchida
  g.append('path')
    .datum(data)
    .attr('fill', `url(#${config.gradientId})`)
    .attr('d', areaGenerator);

  // Gerador de linha
  const lineGenerator = d3.line()
    .x(d => x(d.ano))
    .y(d => y(d[metric] || 0))
    .curve(d3.curveMonotoneX);

  // Traça a linha da série temporal
  const path = g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', config.color)
    .attr('stroke-width', 3)
    .attr('stroke-linecap', 'round')
    .attr('d', lineGenerator);

  // Animação de entrada suave da linha
  const totalLength = path.node().getTotalLength ? path.node().getTotalLength() : 500;
  path
    .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
    .attr('stroke-dashoffset', totalLength)
    .transition()
    .duration(800)
    .ease(d3.easeCubicOut)
    .attr('stroke-dashoffset', 0);

  // Eixos
  const xAxis = d3.axisBottom(x)
    .tickFormat(d => {
      const item = data.find(i => i.ano === d);
      return item && item.tipo === 'Municipais' ? `${d} (Mun)` : `${d}`;
    });

  const yAxis = d3.axisLeft(y)
    .ticks(5)
    .tickFormat(d => {
      if (metric === 'total') return d3.format('~s')(d);
      if (metric === 'idade_media') return `${d} anos`;
      return `${d}%`;
    });

  g.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)
    .call(g => g.select('.domain').attr('stroke', '#334155'))
    .call(g => g.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '0.78rem').attr('font-weight', '500'));

  g.append('g')
    .attr('class', 'axis axis-y')
    .call(yAxis)
    .call(g => g.select('.domain').attr('stroke', '#334155'))
    .call(g => g.selectAll('.tick text').attr('fill', '#94a3b8').attr('font-size', '0.78rem'));

  // Estado atual do filtro de ano
  const currentSelectedYear = store.getState().ano ? Number(store.getState().ano) : null;

  // Marcadores de ponto em cada ano
  const points = g.selectAll('.point-group')
    .data(data)
    .enter()
    .append('g')
    .attr('class', 'point-group')
    .attr('transform', d => `translate(${x(d.ano)}, ${y(d[metric] || 0)})`)
    .style('cursor', 'pointer');

  // Halo de seleção se o ano estiver ativo
  points.append('circle')
    .attr('r', d => (currentSelectedYear === d.ano ? 11 : 7))
    .attr('fill', d => (currentSelectedYear === d.ano ? config.color : '#0f172a'))
    .attr('fill-opacity', d => (currentSelectedYear === d.ano ? 0.3 : 1))
    .attr('stroke', config.color)
    .attr('stroke-width', 2.5)
    .attr('class', 'point-circle');

  // Centro do ponto
  points.append('circle')
    .attr('r', d => (currentSelectedYear === d.ano ? 5 : 3.5))
    .attr('fill', d => (currentSelectedYear === d.ano ? '#ffffff' : config.color));

  // Rótulos de valor nos pontos
  points.append('text')
    .attr('y', -11)
    .attr('text-anchor', 'middle')
    .attr('fill', d => currentSelectedYear === d.ano ? '#ffffff' : '#cbd5e1')
    .attr('font-size', '0.75rem')
    .attr('font-weight', d => currentSelectedYear === d.ano ? '700' : '600')
    .text(d => config.format(d[metric]));

  // Interações de hover e clique nos pontos
  points
    .on('mouseenter', function(event, d) {
      d3.select(this).select('.point-circle')
        .transition().duration(150)
        .attr('r', 10);

      // Calcula variação em relação ao pleito anterior
      const idx = data.findIndex(i => i.ano === d.ano);
      let diffHtml = '';
      if (idx > 0) {
        const prev = data[idx - 1];
        const diff = (d[metric] || 0) - (prev[metric] || 0);
        const diffSign = diff > 0 ? '+' : '';
        const diffColor = diff > 0 ? '#4ade80' : diff < 0 ? '#f87171' : '#94a3b8';
        diffHtml = `
          <div class="tooltip-row" style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed rgba(255,255,255,0.15)">
            <span>Variação vs ${prev.ano}:</span>
            <strong style="color: ${diffColor}">${diffSign}${diff.toFixed(1)}${metric === 'total' ? '' : ' p.p.'}</strong>
          </div>
        `;
      }

      const content = `
        <div class="tooltip-header" style="border-left: 3px solid ${config.color}; padding-left: 6px;">
          <strong>Eleições ${d.ano} (${d.tipo || 'Gerais'})</strong>
        </div>
        <div class="tooltip-row">
          <span>${config.label}:</span>
          <strong style="color: ${config.color}">${config.format(d[metric])}</strong>
        </div>
        <div class="tooltip-row">
          <span>Total de Candidatos:</span>
          <strong>${d3.format(',d')(d.total || 0).replace(/,/g, '.')}</strong>
        </div>
        <div class="tooltip-row">
          <span>Mulheres:</span>
          <strong>${d.perc_mulheres?.toFixed(1) || 0}% (${d3.format(',d')(d.mulheres || 0).replace(/,/g, '.')})</strong>
        </div>
        <div class="tooltip-row">
          <span>Pretos/Pardos/Indígenas:</span>
          <strong>${d.perc_negros_indigenas?.toFixed(1) || 0}%</strong>
        </div>
        ${diffHtml}
        <div class="tooltip-hint" style="margin-top: 6px; font-size: 0.72rem; color: #94a3b8;">
          💡 Clique para ${currentSelectedYear === d.ano ? 'remover filtro' : `filtrar todo o painel em ${d.ano}`}
        </div>
      `;
      showTooltip(content, event);
    })
    .on('mousemove', moveTooltip)
    .on('mouseleave', function(event, d) {
      d3.select(this).select('.point-circle')
        .transition().duration(150)
        .attr('r', currentSelectedYear === d.ano ? 11 : 7);
      hideTooltip();
    })
    .on('click', function(event, d) {
      event.stopPropagation();
      hideTooltip();
      // Alterna seleção do ano no estado global
      store.toggle('ano', String(d.ano));
      // Sincroniza seletor de ano no cabeçalho se existir
      const selectAno = document.getElementById('filter-ano');
      if (selectAno) {
        selectAno.value = store.getState().ano || '';
      }
    });
}
