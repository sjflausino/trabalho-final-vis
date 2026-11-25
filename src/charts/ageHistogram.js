import * as d3 from 'd3';
import { showTooltip, moveTooltip, hideTooltip } from './tooltip.js';
import { store } from '../state.js';

let brushBehavior = null;

/**
 * Histograma de Distribuição Etária com Brushing Interativo (d3.brushX)
 * Permite selecionar intervalos etários contínuos para cross-filtering reativo.
 */
export function renderAgeHistogram(containerId, data) {
  const container = d3.select(containerId);
  if (container.empty()) return;

  const node = container.node();
  const totalWidth = node.getBoundingClientRect().width || 500;
  const margin = { top: 20, right: 25, bottom: 45, left: 50 };
  const width = totalWidth - margin.left - margin.right;
  const height = 230 - margin.top - margin.bottom;

  container.selectAll('*').remove();

  if (!data || data.length === 0) {
    container.html('<p class="chart-empty">Nenhum dado etário disponível para o filtro ativo.</p>');
    return;
  }

  const svg = container.append('svg')
    .attr('viewBox', `0 0 ${totalWidth} ${height + margin.top + margin.bottom}`)
    .attr('width', '100%')
    .attr('height', '100%');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // Escalas
  const minBin = d3.min(data, (d) => Number(d.faixa_etaria)) || 18;
  const maxBin = (d3.max(data, (d) => Number(d.faixa_etaria)) || 85) + 5;

  const x = d3.scaleLinear()
    .domain([minBin, maxBin])
    .range([0, width]);

  const maxCount = d3.max(data, (d) => Number(d.total)) || 50;
  const y = d3.scaleLinear()
    .domain([0, maxCount * 1.1])
    .range([height, 0]);

  // Eixo X
  const xAxis = d3.axisBottom(x)
    .ticks(Math.min(10, Math.floor(width / 50)))
    .tickFormat((d) => `${d} anos`);

  g.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)
    .call((g) => g.select('.domain').attr('stroke', 'var(--border-color, #cbd5e1)'))
    .call((g) => g.selectAll('.tick line').attr('stroke', 'var(--border-color, #cbd5e1)'))
    .call((g) => g.selectAll('.tick text').attr('fill', 'var(--text-muted, #64748b)').attr('font-size', '10px'));

  // Eixo Y
  const yAxis = d3.axisLeft(y)
    .ticks(4)
    .tickFormat(d3.format('~s'));

  g.append('g')
    .attr('class', 'axis axis-y')
    .call(yAxis)
    .call((g) => g.select('.domain').remove())
    .call((g) => g.selectAll('.tick text').attr('fill', 'var(--text-muted, #64748b)').attr('font-size', '10px'));

  // Linhas de grade horizontais
  g.append('g')
    .attr('class', 'grid-lines')
    .selectAll('line')
    .data(y.ticks(4))
    .enter()
    .append('line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', (d) => y(d))
    .attr('y2', (d) => y(d))
    .attr('stroke', 'var(--border-subtle, #f1f5f9)')
    .attr('stroke-dasharray', '2,2');

  const binWidth = Math.max(8, (width / data.length) - 4);

  // Renderiza as barras
  const barGroups = g.selectAll('.age-bar-group')
    .data(data, (d) => d.faixa_etaria)
    .enter()
    .append('g')
    .attr('class', 'age-bar-group')
    .attr('transform', (d) => `translate(${x(d.faixa_etaria)}, 0)`);

  // Barra de Homens (base)
  barGroups.append('rect')
    .attr('class', 'bar-homens')
    .attr('x', 0)
    .attr('width', binWidth)
    .attr('y', height)
    .attr('height', 0)
    .attr('fill', '#3b82f6')
    .attr('rx', 2)
    .transition()
    .duration(500)
    .attr('y', (d) => y(d.homens || 0))
    .attr('height', (d) => height - y(d.homens || 0));

  // Barra de Mulheres (empilhada no topo)
  barGroups.append('rect')
    .attr('class', 'bar-mulheres')
    .attr('x', 0)
    .attr('width', binWidth)
    .attr('y', height)
    .attr('height', 0)
    .attr('fill', '#ec4899')
    .attr('rx', 2)
    .transition()
    .duration(500)
    .attr('y', (d) => y(d.total))
    .attr('height', (d) => (y(d.homens || 0) - y(d.total)));

  // Interatividade: Hover com Tooltip
  barGroups
    .on('mouseenter', function (event, d) {
      d3.select(this).selectAll('rect').style('filter', 'brightness(1.25)');
      const percMulheres = d.total > 0 ? ((d.mulheres / d.total) * 100).toFixed(1) : 0;
      const html = `
        <div class="tooltip-title">Faixa: ${d.faixa_etaria} a ${d.faixa_etaria + 4} anos</div>
        <hr class="tooltip-sep"/>
        <div class="tooltip-row">
          <span>Total de Candidatos:</span>
          <strong>${d3.format(',d')(d.total)}</strong>
        </div>
        <div class="tooltip-row">
          <span style="color:var(--female-color, #db2777); font-weight:600;">Mulheres (♀):</span>
          <strong>${d.mulheres || 0} (${percMulheres}%)</strong>
        </div>
        <div class="tooltip-row">
          <span style="color:var(--male-color, #2563eb); font-weight:600;">Homens (♂):</span>
          <strong>${d.homens || 0} (${(100 - percMulheres).toFixed(1)}%)</strong>
        </div>
      `;
      showTooltip(event, html);
    })
    .on('mousemove', moveTooltip)
    .on('mouseleave', function () {
      d3.select(this).selectAll('rect').style('filter', 'none');
      hideTooltip();
    });

  // Camada de Brushing (d3.brushX)
  const brushG = g.append('g').attr('class', 'brush-layer');

  brushBehavior = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on('end', function (event) {
      if (!event.sourceEvent) return; // Disparado programaticamente

      if (!event.selection) {
        // Brush foi limpo
        store.set('idadeRange', null);
      } else {
        const [x0, x1] = event.selection;
        const minAge = Math.max(18, Math.round(x.invert(x0)));
        const maxAge = Math.min(100, Math.round(x.invert(x1)));
        store.set('idadeRange', [minAge, maxAge]);
      }
    });

  brushG.call(brushBehavior);

  // Se já houver um filtro de idade ativo, desenha o brush correspondente
  const activeRange = store.getState().idadeRange;
  if (activeRange) {
    const x0 = x(activeRange[0]);
    const x1 = x(activeRange[1]);
    brushG.call(brushBehavior.move, [x0, x1]);
  }

  // Estilização do retângulo de seleção do brush
  brushG.select('.selection')
    .attr('fill', 'rgba(245, 158, 11, 0.25)')
    .attr('stroke', '#f59e0b')
    .attr('stroke-width', 1.5)
    .attr('rx', 4);
}
