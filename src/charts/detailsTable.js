import * as d3 from 'd3';
import { store } from '../state.js';

/**
 * Renderiza a tabela de detalhamento analítico sob demanda (Details-on-Demand)
 * com paginação, busca e contadores em tempo real.
 */
export function renderDetailsTable(containerId, data) {
  const container = d3.select(containerId);
  if (container.empty()) return;

  const rows = data?.rows || [];
  const total = Number(data?.total) || 0;
  const page = data?.page || 0;
  const pageSize = data?.pageSize || 15;
  const totalPages = data?.totalPages || 1;
  const lastQueryTimeMs = data?.lastQueryTimeMs || 0;

  container.selectAll('*').remove();

  // Cabeçalho da tabela com estatísticas e tempo de execução DuckDB
  const headerDiv = container.append('div')
    .attr('class', 'table-header-bar');

  headerDiv.append('div')
    .attr('class', 'table-stats')
    .html(`
      <span>Exibindo <strong>${rows.length}</strong> de <strong>${d3.format(',d')(Math.round(total)).replace(/,/g, '.')}</strong> candidaturas</span>
      <span class="query-benchmark">⚡ Consulta DuckDB: <strong>${lastQueryTimeMs} ms</strong></span>
    `);

  if (!rows || rows.length === 0) {
    container.append('div')
      .attr('class', 'table-empty')
      .html('<p>Nenhum registro corresponde aos filtros selecionados.</p>');
    return;
  }

  // Wrapper com scroll horizontal
  const scrollWrapper = container.append('div')
    .attr('class', 'table-scroll-wrapper');

  const table = scrollWrapper.append('table')
    .attr('class', 'data-table');

  // Cabeçalho das colunas
  const thead = table.append('thead');
  const headers = [
    { label: 'Ano', key: 'ano' },
    { label: 'Nome de Urna', key: 'nome_urna' },
    { label: 'Cargo', key: 'cargo' },
    { label: 'Partido', key: 'partido' },
    { label: 'UF', key: 'uf' },
    { label: 'Gênero', key: 'genero' },
    { label: 'Raça / Cor', key: 'raca' },
    { label: 'Idade', key: 'idade' },
    { label: 'Escolaridade', key: 'instrucao' },
    { label: 'Ocupação Declarada', key: 'ocupacao' },
    { label: 'Situação', key: 'situacao' }
  ];

  thead.append('tr')
    .selectAll('th')
    .data(headers)
    .enter()
    .append('th')
    .text((d) => d.label);

  // Corpo da tabela
  const tbody = table.append('tbody');

  const trs = tbody.selectAll('tr')
    .data(rows, (d) => d.sq_candidato || Math.random())
    .enter()
    .append('tr');

  trs.append('td')
    .attr('class', 'cell-ano')
    .text((d) => d.ano || '-');

  trs.append('td')
    .attr('class', 'cell-name')
    .html((d) => `<strong>${d.nome_urna || '-'}</strong>`);

  trs.append('td')
    .html((d) => `<span class="badge-cargo">${d.cargo || '-'}</span>`);

  trs.append('td')
    .html((d) => `<span class="badge-partido">${d.partido || '-'}</span>`);

  trs.append('td')
    .text((d) => d.uf || '-');

  trs.append('td')
    .html((d) => `
      <span class="badge-genero ${d.genero === 'FEMININO' ? 'gen-fem' : 'gen-masc'}">
        ${d.genero === 'FEMININO' ? '♀ FEM' : '♂ MASC'}
      </span>
    `);

  trs.append('td').text((d) => d.raca || '-');
  trs.append('td').text((d) => (d.idade ? `${d.idade} anos` : '-'));
  trs.append('td').attr('class', 'cell-truncate').text((d) => d.instrucao || '-');
  trs.append('td').attr('class', 'cell-truncate').text((d) => d.ocupacao || '-');
  trs.append('td').html((d) => {
    const isEleito = d.situacao && d.situacao.includes('ELEITO');
    return `<span class="badge-sit ${isEleito ? 'sit-eleito' : ''}">${d.situacao || '-'}</span>`;
  });

  // Barra de paginação
  const paginationDiv = container.append('div')
    .attr('class', 'table-pagination-bar');

  paginationDiv.append('button')
    .attr('class', 'btn-page')
    .attr('disabled', page === 0 ? true : null)
    .text('← Anterior')
    .on('click', () => {
      if (page > 0) store.set('page', page - 1);
    });

  paginationDiv.append('span')
    .attr('class', 'page-indicator')
    .text(`Página ${page + 1} de ${Math.max(1, totalPages)}`);

  paginationDiv.append('button')
    .attr('class', 'btn-page')
    .attr('disabled', page >= totalPages - 1 ? true : null)
    .text('Próxima →')
    .on('click', () => {
      if (page < totalPages - 1) store.set('page', page + 1);
    });
}
