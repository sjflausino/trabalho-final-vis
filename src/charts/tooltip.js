import * as d3 from 'd3';

let tooltipEl = null;

export function getOrCreateTooltip() {
  if (!tooltipEl) {
    tooltipEl = d3.select('body')
      .append('div')
      .attr('class', 'va-tooltip')
      .style('opacity', 0)
      .style('pointer-events', 'none')
      .style('position', 'absolute')
      .style('z-index', 1000);
  }
  return tooltipEl;
}

export function showTooltip(event, htmlContent) {
  const tooltip = getOrCreateTooltip();
  tooltip
    .html(htmlContent)
    .style('opacity', 1);

  moveTooltip(event);
}

export function moveTooltip(event) {
  const tooltip = getOrCreateTooltip();
  const node = tooltip.node();
  if (!node) return;

  const tooltipWidth = node.offsetWidth || 180;
  const tooltipHeight = node.offsetHeight || 80;
  const pageWidth = window.innerWidth;
  const pageHeight = window.innerHeight;

  let x = event.pageX + 15;
  let y = event.pageY + 15;

  // Evita ultrapassar as bordas da tela
  if (x + tooltipWidth > pageWidth - 20) {
    x = event.pageX - tooltipWidth - 15;
  }
  if (y + tooltipHeight > pageHeight + window.scrollY - 20) {
    y = event.pageY - tooltipHeight - 15;
  }

  tooltip
    .style('left', `${x}px`)
    .style('top', `${y}px`);
}

export function hideTooltip() {
  const tooltip = getOrCreateTooltip();
  tooltip.style('opacity', 0);
}
