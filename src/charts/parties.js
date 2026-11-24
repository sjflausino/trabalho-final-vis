import * as d3 from 'd3';
import { showTooltip, moveTooltip, hideTooltip } from './tooltip.js';
import { store } from '../state.js';

/**
 * Gráfico de Barras Partidárias com Linha de Referência da Cota de Gênero (30%)
 * Permite avaliar quais agremiações atingem a paridade mínima legal e comparar seus tamanhos.
 */
export function renderParties(containerId, data) {
  const container = d3.select(containerId);
  if (container.empty()) return;

  const node = container.node();
  const totalWidth = node.getBoundingClientRect().width || 480;
  // Margem esquerda ampliada para garantir separação absoluta entre sigla, ponto de status e barra
  const margin = { top: 25, right: 65, bottom: 35, left: 135 };
  const width = totalWidth - margin.left - margin.right;
  const barHeight = 24;
  const height = Math.max(260, data.length * (barHeight + 10));

  container.selectAll('*').remove();

  if (!data || data.length === 0) {
    container.html('<p class="chart-empty">Nenhum partido no filtro ativo.</p>');
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
    .domain(data.map((d) => d.partido))
    .range([0, height])
    .padding(0.25);

  // Eixo X
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

  // Eixo Y (Partidos) com padding de 24px para afastar os textos do ponto indicador
  const yAxis = d3.axisLeft(y).tickSize(0).tickPadding(24);
  const yAxisG = g.append('g')
    .attr('class', 'axis axis-y')
    .call(yAxis)
    .call((g) => g.select('.domain').remove());

  yAxisG.selectAll('.tick text')
    .attr('fill', 'var(--text-main, #0f172a)')
    .attr('font-size', '11px')
    .attr('font-weight', '700')
    .attr('text-anchor', 'end')
    .style('cursor', 'pointer');

  const selectedParty = store.getState().partido;

  // Grupos de barras por partido
  const barGroups = g.selectAll('.party-group')
    .data(data, (d) => d.partido)
    .enter()
    .append('g')
    .attr('class', 'party-group')
    .attr('transform', (d) => `translate(0, ${y(d.partido)})`)
    .style('cursor', 'pointer');

  // Fundo destacável
  barGroups.append('rect')
    .attr('x', -margin.left)
    .attr('y', 0)
    .attr('width', totalWidth)
    .attr('height', y.bandwidth())
    .attr('fill', (d) => (selectedParty === d.partido ? 'rgba(245, 158, 11, 0.2)' : 'transparent'))
    .attr('rx', 4);

  // Barra de Homens
  barGroups.append('rect')
    .attr('class', 'bar-homens')
    .attr('x', 0)
    .attr('y', 0)
    .attr('height', y.bandwidth())
    .attr('rx', 2)
    .attr('fill', 'var(--male-color, #3b82f6)')
    .attr('width', 0)
    .transition()
    .duration(550)
    .attr('width', (d) => x(d.homens || 0));

  // Barra de Mulheres (empilhada)
  barGroups.append('rect')
    .attr('class', 'bar-mulheres')
    .attr('x', (d) => x(d.homens || 0))
    .attr('y', 0)
    .attr('height', y.bandwidth())
    .attr('rx', 2)
    .attr('fill', 'var(--female-color, #ec4899)')
    .attr('width', 0)
    .transition()
    .duration(550)
    .attr('width', (d) => x(d.mulheres || 0));

  // Indicador de Cota (posicionado a cx = -10, sem jamais tocar no texto do partido que termina em -24)
  barGroups.append('circle')
    .attr('cx', -10)
    .attr('cy', y.bandwidth() / 2)
    .attr('r', 4.5)
    .attr('fill', (d) => ((d.perc_mulheres || 0) >= 30 ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)'))
    .attr('stroke', 'var(--bg-surface, #ffffff)')
    .attr('stroke-width', 1.5)
    .attr('title', (d) => ((d.perc_mulheres || 0) >= 30 ? 'Cota ≥ 30% atingida' : 'Abaixo da cota mínima legal (30%)'));

  // Rótulo de texto com total e % feminina no final da barra
  barGroups.append('text')
    .attr('x', (d) => x(d.total) + 6)
    .attr('y', y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .attr('fill', 'var(--text-main, #334155)')
    .attr('font-size', '11px')
    .attr('font-weight', '600')
    .text((d) => `${d3.format(',d')(d.total)} (${(d.perc_mulheres || 0).toFixed(0)}% ♀)`);

  // Borda de seleção
  barGroups.append('rect')
    .attr('class', 'selection-border')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', (d) => x(d.total))
    .attr('height', y.bandwidth())
    .attr('rx', 2)
    .attr('fill', 'none')
    .attr('stroke', '#f59e0b')
    .attr('stroke-width', (d) => (selectedParty === d.partido ? 2 : 0));

  // Interatividade: Hover e Clique
  barGroups
    .on('mouseenter', function (event, d) {
      d3.select(this).select('.selection-border')
        .attr('stroke', '#ffffff')
        .attr('stroke-width', selectedParty === d.partido ? 2.5 : 1.5);

      const atingeCota = (d.perc_mulheres || 0) >= 30;
      const html = `
        <div class="tooltip-title">Partido: ${d.partido}</div>
        <div class="tooltip-meta">Status Cota: <span style="color:${atingeCota ? '#10b981' : '#ef4444'}; font-weight:bold;">${atingeCota ? '✓ Cota cumprida (≥30%)' : '⚠ Abaixo de 30%'}</span></div>
        <hr class="tooltip-sep"/>
        <div class="tooltip-row">
          <span>Total de Candidatos:</span>
          <strong>${d3.format(',d')(d.total)}</strong>
        </div>
        <div class="tooltip-row">
          <span style="color:#ec4899;">Mulheres (♀):</span>
          <strong>${d.mulheres || 0} (${(d.perc_mulheres || 0).toFixed(1)}%)</strong>
        </div>
        <div class="tooltip-row">
          <span style="color:#3b82f6;">Homens (♂):</span>
          <strong>${d.homens || 0} (${(100 - (d.perc_mulheres || 0)).toFixed(1)}%)</strong>
        </div>
        <div class="tooltip-hint">Clique para ${selectedParty === d.partido ? 'remover filtro' : 'filtrar por ' + d.partido}</div>
      `;
      showTooltip(event, html);
    })
    .on('mousemove', moveTooltip)
    .on('mouseleave', function (event, d) {
      d3.select(this).select('.selection-border')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', selectedParty === d.partido ? 2 : 0);
      hideTooltip();
    })
    .on('click', function (event, d) {
      store.toggle('partido', d.partido);
    });
}
