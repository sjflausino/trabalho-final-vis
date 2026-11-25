import * as d3 from 'd3';
import { showTooltip, moveTooltip, hideTooltip } from './tooltip.js';
import { store } from '../state.js';

/**
 * Gráfico de Barras Horizontais Demográficas
 * Mostra categorias sociodemográficas com proporção de gênero interna e total,
 * com interação direta de filtragem ao clicar na categoria.
 */
export function renderDemographics(containerId, data, dimension = 'raca') {
  const container = d3.select(containerId);
  if (container.empty()) return;

  const node = container.node();
  const totalWidth = node.getBoundingClientRect().width || 480;
  const margin = { top: 20, right: 35, bottom: 35, left: 160 };
  const width = totalWidth - margin.left - margin.right;
  const barHeight = 28;
  const height = Math.max(220, data.length * (barHeight + 12));

  container.selectAll('*').remove();

  if (!data || data.length === 0) {
    container.html('<p class="chart-empty">Nenhum dado encontrado para o filtro ativo.</p>');
    return;
  }

  const svg = container.append('svg')
    .attr('viewBox', `0 0 ${totalWidth} ${height + margin.top + margin.bottom}`)
    .attr('width', '100%')
    .attr('height', '100%');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Escalas
  const maxTotal = d3.max(data, (d) => Number(d.total)) || 100;
  const x = d3.scaleLinear()
    .domain([0, maxTotal * 1.1])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(data.map((d) => d.categoria))
    .range([0, height])
    .padding(0.28);

  // Eixo X (Quantidade)
  const xAxis = d3.axisBottom(x)
    .ticks(5)
    .tickFormat(d3.format('~s'));

  g.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)
    .call((g) => g.select('.domain').attr('stroke', 'var(--border-color, #cbd5e1)'))
    .call((g) => g.selectAll('.tick line').attr('stroke', 'var(--border-color, #cbd5e1)'))
    .call((g) => g.selectAll('.tick text').attr('fill', 'var(--text-muted, #64748b)').attr('font-size', '11px'));

  // Linhas de grade verticais
  g.append('g')
    .attr('class', 'grid-lines')
    .selectAll('line')
    .data(x.ticks(5))
    .enter()
    .append('line')
    .attr('x1', (d) => x(d))
    .attr('x2', (d) => x(d))
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', 'var(--border-subtle, #f1f5f9)')
    .attr('stroke-dasharray', '2,2');

  // Eixo Y (Categorias)
  const yAxis = d3.axisLeft(y)
    .tickSize(0);

  const yAxisG = g.append('g')
    .attr('class', 'axis axis-y')
    .call(yAxis)
    .call((g) => g.select('.domain').remove());

  yAxisG.selectAll('.tick text')
    .attr('fill', 'var(--text-main, #0f172a)')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .style('cursor', 'pointer');

  const selectedValue = store.getState()[dimension];

  // Grupos de barras
  const barGroups = g.selectAll('.bar-group')
    .data(data, (d) => d.categoria)
    .enter()
    .append('g')
    .attr('class', 'bar-group')
    .attr('transform', (d) => `translate(0, ${y(d.categoria)})`)
    .style('cursor', 'pointer');

  // Fundo sutil da linha (para facilitar o clique)
  barGroups.append('rect')
    .attr('x', -margin.left)
    .attr('y', 0)
    .attr('width', totalWidth)
    .attr('height', y.bandwidth())
    .attr('fill', (d) => (selectedValue === d.categoria ? 'rgba(59, 130, 246, 0.15)' : 'transparent'))
    .attr('rx', 4);

  // Barra de Homens (base)
  barGroups.append('rect')
    .attr('class', 'bar-male')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', y.bandwidth())
    .attr('rx', 3)
    .attr('fill', (d) => (selectedValue === d.categoria ? '#60a5fa' : '#3b82f6'))
    .attr('width', 0)
    .transition()
    .duration(600)
    .attr('width', (d) => x(d.homens || 0));

  // Barra de Mulheres (empilhada à direita)
  barGroups.append('rect')
    .attr('class', 'bar-female')
    .attr('x', (d) => x(d.homens || 0))
    .attr('y', 0)
    .attr('height', y.bandwidth())
    .attr('rx', 3)
    .attr('fill', (d) => (selectedValue === d.categoria ? '#f472b6' : '#ec4899'))
    .attr('width', 0)
    .transition()
    .duration(600)
    .attr('width', (d) => x(d.mulheres || 0));

  // Borda de seleção quando filtrado
  barGroups.append('rect')
    .attr('class', 'bar-selection-border')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', (d) => x(d.total))
    .attr('height', y.bandwidth())
    .attr('rx', 3)
    .attr('fill', 'none')
    .attr('stroke', '#fbbf24')
    .attr('stroke-width', (d) => (selectedValue === d.categoria ? 2 : 0));

  // Rótulo numérico no final da barra
  barGroups.append('text')
    .attr('class', 'bar-label')
    .attr('x', (d) => x(d.total) + 6)
    .attr('y', y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', 'var(--text-muted, #475569)')
    .attr('font-size', '10px')
    .attr('font-weight', '600')
    .text((d) => d3.format(',d')(d.total).replace(/,/g, '.'));

  // Interatividade: Hover, Tooltip e Clique
  barGroups
    .on('mouseenter', function (event, d) {
      d3.select(this).select('.bar-selection-border')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', selectedValue === d.categoria ? 2.5 : 1.5);

      const html = `
        <div class="tooltip-title">${d.categoria}</div>
        <div class="tooltip-meta">Dimensão: ${dimension.toUpperCase()}</div>
        <hr class="tooltip-sep"/>
        <div class="tooltip-row">
          <span>Total:</span>
          <strong>${d3.format(',d')(d.total)}</strong>
        </div>
        <div class="tooltip-row">
          <span style="color:var(--female-color, #db2777); font-weight:600;">♀ Mulheres:</span>
          <strong>${d.mulheres || 0} (${(d.perc_mulheres || 0).toFixed(1)}%)</strong>
        </div>
        <div class="tooltip-row">
          <span style="color:var(--male-color, #2563eb); font-weight:600;">♂ Homens:</span>
          <strong>${d.homens || 0} (${(100 - (d.perc_mulheres || 0)).toFixed(1)}%)</strong>
        </div>
        <div class="tooltip-hint">Clique para ${selectedValue === d.categoria ? 'remover filtro' : 'filtrar por ' + d.categoria}</div>
      `;
      showTooltip(event, html);
    })
    .on('mousemove', moveTooltip)
    .on('mouseleave', function (event, d) {
      d3.select(this).select('.bar-selection-border')
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', selectedValue === d.categoria ? 2 : 0);
      hideTooltip();
    })
    .on('click', function (event, d) {
      store.toggle(dimension, d.categoria);
    });
}
