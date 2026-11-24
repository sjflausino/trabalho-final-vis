/**
 * Gerenciador de Estado Compartilhado e Reativo (Padrão Pub/Sub)
 * Coordena os filtros aplicados entre as visualizações D3 e gera
 * a cláusula SQL WHERE correspondente para execução no DuckDB-Wasm.
 */

const defaultState = {
  ano: null, // null = Todos os anos gerais (ou ano específico como 2026, 2022, 2018, 2014)
  uf: null,
  regiao: null,
  cargo: null,
  partido: null,
  genero: null,
  raca: null,
  instrucao: null,
  idadeRange: null, // [min, max]
  search: '',
  mapMetric: 'perc_mulheres', // 'perc_mulheres' | 'perc_negros_indigenas' | 'total'
  demographicsDim: 'raca', // 'raca' | 'instrucao' | 'estado_civil'
  timeSeriesMetric: 'perc_mulheres', // 'perc_mulheres' | 'perc_negros_indigenas' | 'idade_media' | 'total'
  timeSeriesScope: 'gerais', // 'gerais' (2014, 2018, 2022, 2026) | 'municipais' (2016, 2020, 2024) | 'todas' (2014 a 2026)
  page: 0,
  pageSize: 15
};

class Store {
  constructor() {
    this.state = { ...defaultState };
    this.listeners = new Set();
  }

  getState() {
    return { ...this.state };
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(changedKeys = []) {
    for (const listener of this.listeners) {
      listener(this.getState(), changedKeys);
    }
  }

  set(key, value) {
    if (this.state[key] === value) return;
    this.state[key] = value;
    // Se mudar qualquer filtro (exceto paginação), reseta a página para 0
    if (key !== 'page') {
      this.state.page = 0;
    }
    this.notify([key]);
  }

  setMultiple(partial) {
    const changed = [];
    for (const [k, v] of Object.entries(partial)) {
      if (this.state[k] !== v) {
        this.state[k] = v;
        changed.push(k);
      }
    }
    if (changed.length > 0) {
      if (!changed.includes('page')) this.state.page = 0;
      this.notify(changed);
    }
  }

  toggle(key, value) {
    const current = this.state[key];
    const next = current === value ? null : value;
    this.set(key, next);
  }

  resetAllFilters() {
    this.state = {
      ...defaultState,
      mapMetric: this.state.mapMetric,
      demographicsDim: this.state.demographicsDim,
      timeSeriesMetric: this.state.timeSeriesMetric,
      timeSeriesScope: this.state.timeSeriesScope
    };
    this.notify(['reset']);
  }

  /**
   * Constrói dinamicamente a cláusula SQL WHERE para DuckDB
   * garantindo higienização básica de aspas simples.
   */
  getWhereClause(excludeKey = null) {
    const conditions = [];

    const sanitize = (val) => String(val).replace(/'/g, "''");

    if (this.state.ano && excludeKey !== 'ano') {
      conditions.push(`ano = ${parseInt(this.state.ano, 10)}`);
    }

    if (this.state.uf && excludeKey !== 'uf') {
      conditions.push(`uf = '${sanitize(this.state.uf)}'`);
    }

    if (this.state.regiao && excludeKey !== 'regiao') {
      conditions.push(`regiao = '${sanitize(this.state.regiao)}'`);
    }

    if (this.state.cargo && excludeKey !== 'cargo') {
      conditions.push(`cargo = '${sanitize(this.state.cargo)}'`);
    }

    if (this.state.partido && excludeKey !== 'partido') {
      conditions.push(`partido = '${sanitize(this.state.partido)}'`);
    }

    if (this.state.genero && excludeKey !== 'genero') {
      conditions.push(`genero = '${sanitize(this.state.genero)}'`);
    }

    if (this.state.raca && excludeKey !== 'raca') {
      conditions.push(`raca = '${sanitize(this.state.raca)}'`);
    }

    if (this.state.instrucao && excludeKey !== 'instrucao') {
      conditions.push(`instrucao = '${sanitize(this.state.instrucao)}'`);
    }

    if (this.state.idadeRange && excludeKey !== 'idadeRange') {
      const [minAge, maxAge] = this.state.idadeRange;
      conditions.push(`idade >= ${Math.round(minAge)} AND idade <= ${Math.round(maxAge)}`);
    }

    if (this.state.search && this.state.search.trim().length > 0 && excludeKey !== 'search') {
      const term = sanitize(this.state.search.trim().toUpperCase());
      conditions.push(`(UPPER(nome_urna) LIKE '%${term}%' OR UPPER(nome) LIKE '%${term}%' OR UPPER(ocupacao) LIKE '%${term}%')`);
    }

    if (conditions.length === 0) return '1=1';
    return conditions.join(' AND ');
  }

  /**
   * Retorna os filtros ativos em formato legível para exibição de chips/badges
   */
  getActiveFiltersList() {
    const list = [];
    if (this.state.ano) list.push({ key: 'ano', label: `Ano: ${this.state.ano}` });
    if (this.state.uf) list.push({ key: 'uf', label: `UF: ${this.state.uf}` });
    if (this.state.regiao) list.push({ key: 'regiao', label: `Região: ${this.state.regiao}` });
    if (this.state.cargo) list.push({ key: 'cargo', label: `Cargo: ${this.state.cargo}` });
    if (this.state.partido) list.push({ key: 'partido', label: `Partido: ${this.state.partido}` });
    if (this.state.genero) list.push({ key: 'genero', label: `Gênero: ${this.state.genero}` });
    if (this.state.raca) list.push({ key: 'raca', label: `Raça: ${this.state.raca}` });
    if (this.state.instrucao) list.push({ key: 'instrucao', label: `Escolaridade: ${this.state.instrucao}` });
    if (this.state.idadeRange) {
      list.push({
        key: 'idadeRange',
        label: `Idade: ${Math.round(this.state.idadeRange[0])} a ${Math.round(this.state.idadeRange[1])} anos`
      });
    }
    if (this.state.search) list.push({ key: 'search', label: `Busca: "${this.state.search}"` });
    return list;
  }
}

export const store = new Store();
