import * as d3 from 'd3';

/**
 * Renderiza os cartões de indicadores analíticos (KPIs)
 * Utiliza interpolação numérica D3 para transições fluidas quando os filtros mudam.
 */
export function renderKPIs(containerId, data) {
  const container = d3.select(containerId);
  if (container.empty()) return;

  const total = Number(data?.total) || 0;
  const percMulheres = Number(data?.perc_mulheres) || 0;
  const percNegros = Number(data?.perc_negros_indigenas) || 0;
  const idadeMedia = Number(data?.idade_media) || 0;
  const percSuperior = Number(data?.perc_superior) || 0;

  const kpis = [
    {
      id: 'kpi-total',
      title: 'Total de Candidaturas',
      value: total,
      format: (v) => d3.format(',d')(Math.round(v)).replace(/,/g, '.'),
      detail: 'Candidaturas registradas no filtro ativo',
      color: '#3b82f6',
      icon: '👥'
    },
    {
      id: 'kpi-mulheres',
      title: 'Representatividade Feminina',
      value: percMulheres,
      format: (v) => `${v.toFixed(1)}%`,
      detail: `${d3.format(',d')(Math.round((total * percMulheres) / 100)).replace(/,/g, '.')} candidatas`,
      color: '#ec4899',
      badge: percMulheres >= 30 ? 'Cota cumprida (≥30%)' : 'Abaixo da cota (<30%)',
      badgeClass: percMulheres >= 30 ? 'badge-success' : 'badge-warning',
      icon: '♀'
    },
    {
      id: 'kpi-diversidade',
      title: 'Pretos, Pardos e Indígenas',
      value: percNegros,
      format: (v) => `${v.toFixed(1)}%`,
      detail: 'Autodeclaração étnico-racial somada',
      color: '#f59e0b',
      icon: '✊'
    },
    {
      id: 'kpi-idade',
      title: 'Idade Média',
      value: idadeMedia,
      format: (v) => `${v.toFixed(1)} anos`,
      detail: 'Média de idade no pleito de 2026',
      color: '#10b981',
      icon: '📅'
    },
    {
      id: 'kpi-superior',
      title: 'Ensino Superior Completo',
      value: percSuperior,
      format: (v) => `${v.toFixed(1)}%`,
      detail: 'Nível de instrução formal declarado',
      color: '#8b5cf6',
      icon: '🎓'
    }
  ];

  // Data binding
  const cards = container.selectAll('.kpi-card')
    .data(kpis, (d) => d.id);

  const cardsEnter = cards.enter()
    .append('div')
    .attr('class', 'kpi-card')
    .attr('id', (d) => d.id);

  cardsEnter.append('div')
    .attr('class', 'kpi-header')
    .html((d) => `
      <span class="kpi-title">${d.title}</span>
      <span class="kpi-icon" style="color: ${d.color};">${d.icon}</span>
    `);

  cardsEnter.append('div')
    .attr('class', 'kpi-value')
    .text('0');

  cardsEnter.append('div')
    .attr('class', 'kpi-footer')
    .html((d) => `
      <span class="kpi-detail">${d.detail}</span>
      ${d.badge ? `<span class="kpi-badge ${d.badgeClass}">${d.badge}</span>` : ''}
    `);

  const cardsMerge = cardsEnter.merge(cards);

  // Transição numérica suave nos valores
  cardsMerge.each(function (d) {
    const card = d3.select(this);
    const valueEl = card.select('.kpi-value');
    const currentValue = parseFloat(valueEl.attr('data-current') || 0);

    card.select('.kpi-detail').text(d.detail);
    if (d.badge) {
      let badgeEl = card.select('.kpi-badge');
      if (badgeEl.empty()) {
        badgeEl = card.select('.kpi-footer').append('span').attr('class', 'kpi-badge');
      }
      badgeEl.attr('class', `kpi-badge ${d.badgeClass}`).text(d.badge);
    } else {
      card.select('.kpi-badge').remove();
    }

    valueEl
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .tween('text', function () {
        const interpolator = d3.interpolateNumber(currentValue, d.value);
        return function (t) {
          const val = interpolator(t);
          valueEl.text(d.format(val));
        };
      })
      .on('end', function () {
        valueEl.attr('data-current', d.value);
        valueEl.text(d.format(d.value));
      });
  });

  cards.exit().remove();
}
