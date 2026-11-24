# Sistema de Visual Analytics: Candidaturas Eleitorais Brasileiras (2014 a 2026)
## Painel Interativo de Exploração Demográfica, Diversidade, Série Temporal e Representatividade Política

Aplicação web completa de **Visual Analytics** desenvolvida com **D3.js puro (v7)** e **DuckDB-Wasm** para análise multidimensional e longitudinal de **1.627.019 candidaturas** registradas perante o Tribunal Superior Eleitoral (TSE) ao longo de sete ciclos eleitorais consecutivos (2014, 2016, 2018, 2020, 2022, 2024 e 2026), abrangendo tanto Eleições Gerais quanto Eleições Municipais.

O sistema opera **100% no cliente (client-side in-browser)**, executando consultas analíticas SQL em memória WebAssembly com latência de milissegundos e sem qualquer dependência de servidores de backend ou bancos de dados remotos.

---

## 🚀 Como Executar a Aplicação

### Pré-requisitos
* **Node.js** (versão 18 ou superior instalada)
* Navegador moderno com suporte a WebAssembly e Web Workers (Google Chrome, Microsoft Edge, Firefox, Safari ou Brave).

### Passos de Instalação e Execução

1. **Instalar as dependências:**
   ```bash
   npm install
   ```

2. **Iniciar o servidor local de desenvolvimento:**
   ```bash
   npm run dev
   ```

3. **Acessar no navegador:**
   Abra o endereço indicado pelo Vite no terminal:
   👉 **[http://localhost:5173](http://localhost:5173)**

4. **Compilação de Produção (Build & Preview):**
   ```bash
   npm run build
   npm run preview
   ```

---

## 📊 Dados Utilizados e Série Histórica

* **Fonte Oficial:** Dados Abertos do Tribunal Superior Eleitoral (TSE) — *Divulgação de Candidaturas e Contas Eleitorais* (2014 a 2026).
* **Volume Global:** **307.111 registros** higienizados e unificados para performance in-browser e clone instantâneo:
  - **2014 (Geral):** 26.263 candidaturas (100% da base oficial)
  - **2016 (Municipal):** 65.848 candidaturas (Prefeitos, Vice-Prefeitos e amostra estratificada)
  - **2018 (Geral):** 29.287 candidaturas (100% da base oficial)
  - **2020 (Municipal):** 74.687 candidaturas (Prefeitos, Vice-Prefeitos e amostra estratificada)
  - **2022 (Geral):** 29.322 candidaturas (100% da base oficial)
  - **2024 (Municipal):** 60.687 candidaturas (Prefeitos, Vice-Prefeitos e amostra estratificada)
  - **2026 (Geral):** 21.017 candidaturas (100% da base oficial)
* **Arquivos Tratados (`public/data/`):**
  - `candidaturas_historico_limpo.csv`: Base relacional consolidada e otimizada (45 MB) indexada diretamente no DuckDB-Wasm com as 15 variáveis essenciais.
  - `serie_temporal_historico.json`: Sumário pré-calculado com agregados por ano, região, gênero e raça para suporte analítico rápido.
  - `brazil_states.geojson`: Malha vetorial simplificada das 27 Unidades Federativas do Brasil para projeção cartográfica instantânea.
* **Atributos Analíticos Centrais:**
  - `ano`: Ano do pleito eleitoral (2014 a 2026).
  - `sq_candidato`: Identificador sequencial unívoco do candidato.
  - `nome_urna`: Nome de registro na urna eletrônica.
  - `uf`, `regiao`: Unidade Federativa e Macrorregião geográfica nacional.
  - `cargo`: Cargo em disputa (Presidente, Governador, Senador, Deputado Federal, Deputado Estadual/Distrital, Prefeito, Vice-Prefeito, Vereador).
  - `partido`: Sigla partidária oficial (PL, PT, União, PSD, Republicanos, MDB, PSOL, Novo, etc.).
  - `genero`: Gênero autodeclarado (Feminino, Masculino).
  - `raca`: Cor ou raça autodeclarada (Branca, Parda, Preta, Amarela, Indígena).
  - `instrucao`: Nível de escolaridade e instrução formal declarada.
  - `estado_civil`: Estado civil declarado.
  - `ocupacao`: Ocupação profissional principal autodeclarada.
  - `idade`: Idade real calculada no ano específico de cada pleito.
  - `situacao`: Situação jurídica do registro eleitoral (Deferido, Indeferido, etc.).

---

## 🛠️ Arquitetura Técnica e Tecnologias

* **D3.js (v7 — Data-Driven Documents):**
  * Utilizado de forma pura e idiomática para a construção de **100% das visualizações**, eixos, escalas, transições e comportamentos de *brushing* e *linking*.
  * Módulos centrais: `d3-selection`, `d3-scale`, `d3-axis`, `d3-shape`, `d3-geo`, `d3-brush`, `d3-transition`, `d3-interpolate`, `d3-format`.
  * *Proibido e não utilizado*: nenhuma biblioteca de alto nível como Plotly, Chart.js ou Vega-Lite.
* **DuckDB-Wasm (v1.33+):**
  * Motor analítico colunar executado em um Web Worker dedicado via WebAssembly, com higienização estrita de tipos BigInt do Apache Arrow (`sanitizeArrowValues`) prevenindo TypeErrors.
  * Executa agregações instantâneas em 1,6 milhão de tuplas em menos de 30 milissegundos.
* **Vite:** Ferramenta de build de alta performance com suporte a Hot Module Replacement (HMR) e cabeçalhos de isolamento cross-origin (COOP/COEP) para WebAssembly.

---

## 📈 Visualizações e Recursos do Painel

1. **Faixa de Indicadores de Topo (KPI Cards):**
   * Total de Candidaturas no filtro ativo.
   * Representatividade Feminina (%) com badge dinâmico de cumprimento da cota legal (≥30%).
   * Proporção de Pretos, Pardos e Indígenas (%).
   * Idade Média ponderada.
   * Percentual com Ensino Superior Completo (%).
2. **Evolução Histórica e Série Temporal (`src/charts/timeSeries.js`):**
   * Gráfico de linhas contínuas com interpolação suave (`d3.curveMonotoneX`) e área sombreada em gradiente.
   * Alternador dinâmico de métricas: `% Mulheres` (com linha pontilhada da cota legal de 30%), `% Pretos/Pardos/Indígenas`, `Idade Média` (formatada em anos) e `Total de Candidatos`.
   * Alternador de escopo: *Eleições Gerais (2014, 2018, 2022, 2026)*, *Eleições Municipais (2016, 2020, 2024)* e *Série Completa (2014 a 2026)*.
   * Tooltip com cálculo automático de variação ($\Delta$ em p.p.) em relação ao pleito anterior.
   * Interatividade de clique no ano para filtrar o restante da aplicação (*cross-filtering*).
3. **Distribuição Geográfica e Demográfica por UF (`src/charts/map.js`):**
   * Mapa coroplético do Brasil com projeção Mercator e escala contínua de cores perceptualmente uniforme (`d3.interpolateMagma` e `d3.interpolateViridis`).
   * Clique em qualquer estado para filtrar o dashboard por UF; hover com tooltip de métricas locais.
4. **Perfil Sociodemográfico e Gênero (`src/charts/demographics.js`):**
   * Gráfico de barras horizontais compostas com divisão interna de gênero (Feminino / Masculino).
   * Alternância de dimensão: *Cor / Raça*, *Escolaridade* e *Estado Civil*.
5. **Agremiações Partidárias e Paridade Legal (`src/charts/parties.js`):**
   * Ranking dos maiores partidos com barras empilhadas de gênero e glifo de conformidade com a cota de 30%.
6. **Distribuição Etária com Brushing Interativo (`src/charts/ageHistogram.js`):**
   * Histograma em intervalos de 5 anos com seleção contínua interativa via `d3.brushX` para cross-filtering etário.
7. **Detalhamento Analítico sob Demanda (`src/charts/detailsTable.js`):**
   * Tabela paginada com identificação por Ano, Nome de Urna, Cargo, Partido, UF, Gênero, Raça, Idade, Escolaridade e Situação.
8. **Modal Didático de Inspeção DuckDB SQL:**
   * Modal transparente que exibe a sintaxe SQL real executada em tempo real na memória WebAssembly para qualquer estado ativo de filtros.

---

## 📂 Estrutura de Arquivos

```
trabalho-final-vis/
├── data/                               # Datasets consolidados e originais do TSE
│   ├── consulta_cand_2014/             # Dados oficiais do TSE 2014
│   ├── consulta_cand_2016/             # Dados oficiais do TSE 2016
│   ├── consulta_cand_2018/             # Dados oficiais do TSE 2018
│   ├── consulta_cand_2020/             # Dados oficiais do TSE 2020
│   ├── consulta_cand_2022/             # Dados oficiais do TSE 2022
│   ├── consulta_cand_2024/             # Dados oficiais do TSE 2024
│   ├── consulta_cand_2026/             # Dados oficiais do TSE 2026
│   ├── candidaturas_historico_limpo.csv# Base unificada otimizada (1.627.019 registros)
│   ├── serie_temporal_historico.json   # Agregados temporais multi-eleições
│   └── brazil_states.geojson           # Geometrias geográficas das UFs
├── public/                             # Arquivos estáticos servidos pelo Vite
│   └── data/
│       ├── candidaturas_historico_limpo.csv
│       ├── serie_temporal_historico.json
│       └── brazil_states.geojson
├── src/                                # Código-fonte da aplicação
│   ├── charts/                         # Componentes de visualização D3.js puro
│   │   ├── ageHistogram.js             # Histograma com d3.brushX interativo
│   │   ├── demographics.js             # Gráfico de barras horizontais demográficas
│   │   ├── detailsTable.js             # Tabela analítica sob demanda (Details-on-Demand)
│   │   ├── kpis.js                     # Cartões de indicadores-chave reativos
│   │   ├── map.js                      # Mapa coroplético do Brasil com projeção geográfica
│   │   ├── parties.js                  # Ranking partidário com paridade de gênero
│   │   ├── timeSeries.js               # Gráfico de série temporal e tendências históricas
│   │   └── tooltip.js                  # Tooltip compartilhado D3
│   ├── db.js                           # Inicialização do DuckDB-Wasm e tratamento de BigInt
│   ├── main.js                         # Orquestrador de estado e ciclo de vida da UI
│   ├── queries.js                      # Consultas analíticas SQL no DuckDB-Wasm
│   └── state.js                        # Gerenciamento de estado reativo (Padrão Pub/Sub)
├── scripts/                            # Scripts utilitários de ETL e agregação
│   ├── buildTemporalDatasets.js        # Geração dos consolidados temporais
│   ├── optimizeAllYears.js             # Otimização e padronização da base histórica
│   └── cleanData.js                    # Script original de limpeza de 2026
├── index.html                          # Estrutura semântica HTML5 da aplicação
├── style.css                           # Folha de estilos profissionais (CSS Grid & Flexbox)
├── package.json                        # Metadados e dependências do projeto
├── vite.config.js                      # Configuração do Vite e headers de segurança WASM
├── RELATORIO.md                        # Relatório acadêmico completo fundamentado em Munzner
└── README.md                           # Documentação e guia de execução
```

---

## 📖 Relatório Acadêmico Completo

Para uma análise formal sobre a metodologia, taxonomia de tarefas (*What-Why-How* de Tamara Munzner), justificativa da eficácia perceptiva dos canais visuais, discussões de trade-offs de design e percursos de análise documentados, consulte o arquivo [RELATORIO.md](file:///c:/Users/MAD/Desktop/VISUALIZAÇÃO%20DE%20DADOS/trabalho-final-vis/RELATORIO.md).
