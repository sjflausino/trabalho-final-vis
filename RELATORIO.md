# Relatório de Projeto: Sistema de Visual Analytics das Candidaturas Eleitorais Brasileiras (Série Histórica 2014 a 2026)

**Disciplina:** Visualização de Dados / Visual Analytics  
**Disciplina:** Visualização de Dados (IC-UFF)  
**Docente:** Prof. Marcos Lage  
**Tecnologias Centrais:** D3.js (v7) e DuckDB-Wasm (Execução 100% Client-Side)  
**Tema:** Perfil Demográfico, Diversidade, Paridade Partidária, Série Temporal e Representatividade Política no Brasil  
**Fonte dos Dados:** Tribunal Superior Eleitoral (TSE) — Divulgação de Candidaturas e Contas Eleitorais (2014 a 2026)  

---

## 1. Introdução

### 1.1 Propósito do Sistema
O objetivo central deste sistema de Visual Analytics é proporcionar um ambiente exploratório interativo, rigoroso e de alta responsividade para investigar o perfil sociodemográfico, partidário, geográfico e longitudinal de **1.627.019 candidaturas** registradas perante o Tribunal Superior Eleitoral (TSE) ao longo de sete ciclos eleitorais consecutivos (2014, 2016, 2018, 2020, 2022, 2024 e 2026), englobando Eleições Gerais e Municipais.

Mais do que apenas exibir números agregados, o sistema permite que o analista examine como dimensões de gênero, raça/cor autodeclarada, faixa etária e nível de instrução formal se cruzam com as disputas por cargos majoritários e proporcionais em diferentes partidos e unidades federativas, identificando padrões de representatividade, discrepâncias regionais, cumprimento efetivo de cotas legais e trajetórias históricas de inclusão política.

### 1.2 Público Pretendido
### 1.2 Fundamentação Teórica e Amplificação da Cognição
Conforme discutido nas aulas iniciais da disciplina, o conceito de visualização de dados fundamenta-se nas definições clássicas da literatura:
* **Card, Mackinlay & Shneiderman (1999):** *"Computer-generated and interactive, visual representations of data to amplify cognition."* (Representações visuais, computacionais e interativas de dados com o propósito de amplificar a cognição humana).
* **Tamara Munzner (2014):** *"Computer-based visualization systems provide visual representations of datasets intended to help people carry out some task more effectively."* (Sistemas de visualização baseados em computador fornecem representações visuais de conjuntos de dados destinadas a auxiliar pessoas a realizarem tarefas com maior eficácia).

A visualização se justifica primariamente como um mecanismo externo de **amplificação da cognição** e **expansão da memória de trabalho**. Conforme evidenciado pelo célebre *Quarteto de Anscombe (1973)* e pelo experimento moderno *Same Stats, Different Graphs (Matejka & Fitzmaurice, 2017)*, resumos numéricos agregados (médias, variâncias e coeficientes lineares) podem ser idênticos entre conjuntos de dados com comportamentos e distribuições espaciais inteiramente distintos. O olho humano é capaz de identificar instantaneamente correlações, assimetrias, agrupamentos e *outliers* que modelos estatísticos cegos mascaram.

Além disso, a visualização suportada por computador é indispensável quando enfrentamos **problemas de análise mal-postos (ill-specified problems)** — cenários exploratórios nos quais o usuário não conhece previamente todas as perguntas ou onde não existe um algoritmo totalmente automatizado capaz de tomar a decisão ou emitir o veredito sem julgamento humano.

### 1.3 Público Pretendido
O sistema foi concebido para atender a:
1. **Pesquisadores e Cientistas Políticos**: interessados em dinâmicas partidárias, sub-representação de grupos historicamente marginalizados (mulheres, negros e indígenas), padrões de recrutamento e impacto de reformas eleitorais.
2. **Jornalistas de Dados e Veículos de Comunicação**: que necessitam de uma ferramenta rápida de cross-filtering e verificação empírica para construir pautas e reportagens investigativas fundamentadas.
2. **Jornalistas de Dados e Veículos de Comunicação**: que necessitam de uma ferramenta rápida de *cross-filtering* e verificação empírica para construir pautas e reportagens investigativas fundamentadas.
3. **Organizações da Sociedade Civil e Observatórios Eleitorais**: que fiscalizam o cumprimento de ações afirmativas e a distribuição de recursos e espaço nas legendas partidárias.
4. **Cidadãos e Eleitores**: que buscam compreender a composição das opções eleitorais em seus estados e municípios em perspectiva histórica comparada.

### 1.3 Motivação
A representatividade política no Brasil é caracterizada por assimetrias históricas. Embora mulheres representem mais de 52% do eleitorado e a população preta e parda represente a maioria absoluta da demografia brasileira (segundo o Censo do IBGE), as instâncias de poder historicamente espelham uma hegemonia masculina e branca.
### 1.4 Motivação e Contexto Eleitoral
A representatividade política no Brasil é caracterizada por profundas assimetrias históricas. Embora mulheres representem mais de 52% do eleitorado e a população preta e parda represente a maioria absoluta da demografia brasileira (segundo o Censo do IBGE), as instâncias eletivas historicamente espelham uma hegemonia masculina e branca.

A introdução de mecanismos regulatórios (como a cota mínima obrigatória de 30% de candidaturas por gênero, nos termos da Lei nº 9.504/1997, a destinação proporcional do Fundo Especial de Financiamento de Campanha — FEFC a partir de 2018/2020 e as cotas de financiamento para candidaturas negras validadas pelo STF) transformou o processo de registro de candidaturas. No entanto, persistem questionamentos analíticos cruciais: as cotas são cumpridas homogeneamente entre legendas de esquerda, centro e direita? As candidaturas femininas e negras estão concentradas em cargos com menor viabilidade eleitoral (suplências e cargos proporcionais secundários) ou alcançam disputas majoritárias (governos estaduais, Senado e prefeituras)? Houve avanço real entre 2014 e 2026 ou apenas cumprimento formal das exigências? Apenas um sistema de Visual Analytics que integre consultas multidimensionais instantâneas, coordenadas e com perspectiva longitudinal permite responder a tais indagações de forma fluida.

### 1.4 Perguntas Norteadoras de Análise
### 1.5 Perguntas Norteadoras de Análise
O projeto foi estruturado para viabilizar a investigação das seguintes perguntas norteadoras:
* **P1 (Gênero e Paridade Legal):** *Quais partidos atingem efetivamente o patamar mínimo de 30% de candidaturas femininas? Essa proporção se mantém uniforme ao se filtrar por cargos do Poder Executivo (Governador e Prefeito) versus Poder Legislativo (Deputados e Vereadores)?*
* **P2 (Diversidade Étnico-Racial e Disparidades Regionais):** *Como a proporção de candidatos pretos, pardos e indígenas varia geograficamente entre as macrorregiões do país (Norte/Nordeste versus Sul/Sudeste)? Há convergência com os dados demográficos gerais do IBGE?*
* **P3 (Perfil Etário e Renovação Política):** *Qual é a curva de distribuição etária predominante nos diferentes cargos em disputa? Cargos senatoriais e governamentais apresentam concentração etária significativamente superior à das vagas para deputados e vereadores?*
* **P4 (Escolaridade e Capital Institucional):** *Como o grau de instrução formal (ensino superior versus ensinos médio e fundamental) se distribui entre partidos e tipos de cargo disputados?*
* **P5 (Série Histórica e Tendência Longitudinal - 2014 a 2026):** *Como os percentuais de participação feminina e de autodeclaração de pretos, pardos e indígenas evoluíram ao longo dos ciclos eleitorais de 2014 a 2026? A cota mínima de 30% e os incentivos de financiamento público geraram crescimento consistente ou estagnação?*

---

## 2. Dados e Tarefas
## 2. Abstração de Dados, Transformações e Tarefas

### 2.1 Fonte e Características dos Dados
* **Origem:** Dados Abertos Oficiais do Tribunal Superior Eleitoral (TSE) cobrindo a série temporal completa de **2014 a 2026** (composta pelos repositórios oficiais `consulta_cand_2014` a `consulta_cand_2026`).
* **Granularidade:** Cada tupla representa uma candidatura individual registrada perante a Justiça Eleitoral em determinado ano eleitoral.
* **Volume Analisado:** 
  * **1.627.019 registros completos** consolidados e indexados no banco colunar in-memory DuckDB-Wasm:
  * **1.627.019 registros completos** consolidados e indexados no banco colunar *in-memory* DuckDB-Wasm:
    * 2014 (Geral): 26.263 candidaturas
    * 2016 (Municipal): 498.391 candidaturas
    * 2018 (Geral): 29.287 candidaturas
    * 2020 (Municipal): 558.804 candidaturas
    * 2022 (Geral): 29.322 candidaturas
    * 2024 (Municipal): 463.935 candidaturas
    * 2026 (Geral): 21.017 candidaturas
  * **Malha Cartográfica:** Arquivo `public/data/brazil_states.geojson` com os polígonos vetoriais das 27 Unidades Federativas do Brasil.
  * **Malha Cartográfica:** Arquivo vetorial GeoJSON (`public/data/brazil_states.geojson`) com os limites poligonais das 27 Unidades Federativas do Brasil.

### 2.2 Atributos Utilizados e Tipologia
Para viabilizar consultas otimizadas e máxima expressividade visual, foram selecionados e higienizados 15 atributos essenciais:
### 2.2 Abstração e Tipologia de Dados (Referência: Aula 05)
Em conformidade com a taxonomia de **Abstração de Dados** apresentada em aula:
* **Tipos de Dados Fundamentais:**
  * **Itens:** As 1.627.019 candidaturas individuais.
  * **Atributos:** As propriedades medidas e registradas para cada candidatura.
  * **Posições:** As coordenadas geográficas (latitude/longitude) que formam a malha vetorial dos estados.
  * **Grids:** Estrutura geométrica do GeoJSON utilizada para mapeamento espacial.
* **Tipos de Conjuntos de Dados:**
  * **Tabela Relacional:** Linhas representam itens (candidatos) e colunas representam atributos (variáveis eleitorais).
  * **Geometrias (Spatial Data):** Polígonos das 27 UFs para renderização cartográfica.
  * **Séries Temporais:** Registros ordenados cronologicamente por ano de eleição (2014–2026).

| Atributo | Tipo Semântico | Domínio / Valores de Exemplo | Função no Sistema |
| :--- | :--- | :--- | :--- |
| `ano` | Quantitativo / Temporal | `2014`, `2016`, `2018`, `2020`, `2022`, `2024`, `2026` | Dimensão da série temporal e filtro cronológico |
| `sq_candidato` | Categórico (ID Único) | `10002550796`, `10002552001` | Chave primária para identificação e contagem |
| `nome_urna` | Texto Livre | `"DELEGADO MARCELO"`, `"PROFESSORA ANA"` | Detalhes sob demanda e busca textual |
| `cargo` | Categórico Ordinal/Nominal | `PRESIDENTE`, `GOVERNADOR`, `SENADOR`, `DEPUTADO FEDERAL`, `DEPUTADO ESTADUAL`, `PREFEITO`, `VEREADOR`, etc. | Filtro global e agrupamento |
| `uf` | Categórico Geográfico | `AC`, `AL`, `AM`, `SP`, `RJ`, etc. (27 UFs) | Posição no mapa coroplético e cross-filtering espacial |
| `regiao` | Categórico Geográfico | `Norte`, `Nordeste`, `Centro-Oeste`, `Sudeste`, `Sul` | Filtro regional e comparações agregadas |
| `partido` | Categórico Nominal | `PL`, `PT`, `PSD`, `MDB`, `UNIÃO`, `PSOL`, `NOVO`, etc. (mais de 30 agremiações) | Ranking partidário e análise de cotas |
| `genero` | Categórico Nominal | `FEMININO`, `MASCULINO` | Divisão demográfica e canais de cor de gênero |
| `raca` | Categórico Nominal | `BRANCA`, `PARDA`, `PRETA`, `INDÍGENA`, `AMARELA` | Análise de representatividade racial |
| `instrucao` | Categórico Ordinal | `SUPERIOR COMPLETO`, `ENSINO MÉDIO COMPLETO`, `FUNDAMENTAL`, etc. | Indicador de escolaridade |
| `estado_civil`| Categórico Nominal | `CASADO(A)`, `SOLTEIRO(A)`, `DIVORCIADO(A)`, etc. | Perfil civil complementar |
| `ocupacao` | Categórico Nominal | `ADVOGADO`, `PROFESSOR`, `EMPRESÁRIO`, `MÉDICO`, `VEREADOR`, etc. | Busca e caracterização ocupacional |
| `idade` | Quantitativo Contínuo | Inteiro de 18 a 95 anos | Histograma etário e intervalo de *brushing* |
| `situacao` | Categórico Nominal | `DEFERIDO`, `APTO`, `ELEITO`, `SUPLENTE`, `NÃO ELEITO`, `2º TURNO` | Desfecho eleitoral na tabela de detalhes |
A caracterização semântica dos 15 atributos essenciais higienizados no sistema é detalhada a seguir:

### 2.3 Preparação e Limpeza dos Dados
Os arquivos brutos originais do TSE possuíam codificação `ISO-8859-1` (Latin1), delimitador ponto-e-vírgula (`;`), mais de 50 colunas de metadados burocráticos e datas de nascimento em formato textual `DD/MM/AAAA`.
| Atributo | Tipo de Atributo (Aula 05) | Estrutura do Atributo | Semântica | Função no Sistema |
| :--- | :--- | :--- | :--- | :--- |
| `ano` | Quantitativo / Ordenável | Cíclica / Sequencial | Temporal | Eixo temporal da série histórica e filtro cronológico |
| `sq_candidato` | Categórico (ID Único) | Nominal | Identificador | Chave primária para contagem e integridade |
| `nome_urna` | Categórico / Texto | Nominal | Textual | Identificação visual na tabela sob demanda |
| `cargo` | Categórico | Nominal / Ordinal | Institucional | Filtro global hierárquico e agrupamento |
| `uf` | Categórico Geográfico | Nominal | Espacial | Posição no mapa coroplético e *cross-filtering* regional |
| `regiao` | Categórico Geográfico | Hierárquica | Espacial | Filtro macroespacial (Norte, Nordeste, etc.) |
| `partido` | Categórico | Nominal | Político | Ranking partidário e avaliação de cotas de gênero |
| `genero` | Categórico | Nominal | Demográfico | Proporção binária de gênero e canal de matiz |
| `raca` | Categórico | Nominal | Étnico-Racial | Análise de representatividade racial e diversidade |
| `instrucao` | Ordenável (Ordinal) | Ordinal | Educacional | Indicador de escolaridade (Fundamental a Superior) |
| `estado_civil`| Categórico | Nominal | Civil | Perfil social complementar |
| `ocupacao` | Categórico | Nominal | Profissional | Busca textual e caracterização ocupacional |
| `idade` | Quantitativo Contínuo | Sequencial | Demográfico | Histograma de distribuição etária e *brushing* |
| `situacao` | Categórico | Nominal | Jurídico-Eleitoral| Desfecho do registro (Deferido, Indeferido, etc.) |

Foi desenvolvido um pipeline automatizado de ingestão e consolidação (`scripts/optimizeAllYears.js` e `scripts/buildTemporalDatasets.js`) que:
1. Mapeou dinamicamente os cabeçalhos das tabelas do TSE para cada ano, contornando a alteração de layout introduzida em 2022 (onde foi inserida a coluna `NR_CNPJ_CANDIDATO`).
2. Converteu todo o fluxo para `UTF-8` padronizado.
3. Calculou a **idade real cronológica do candidato no ano da respectiva eleição** ($\text{ano\_eleicao} - \text{ano\_nascimento}$), garantindo coerência histórica estrita (um candidato nascido em 1970 tem idade 44 em 2014, 48 em 2018, 52 em 2022 e 56 em 2026).
4. Derivou a coluna `regiao` a partir da sigla da UF.
5. Higienizou caracteres especiais e aspas internas.
6. Otimizou o tamanho da base eliminando colunas redundantes (como o nome civil longo duplicado), resultando em `public/data/candidaturas_historico_limpo.csv` e no arquivo de sumário temporal `public/data/serie_temporal_historico.json`.
### 2.3 Transformações de Dados (Referência: Aula 06)

#### Por que transformar os dados brutos?
Conforme fundamentado na Aula 06, exibir os dados brutos de uma coleção de mais de **1,6 milhão de tuplas** diretamente na interface visual é duplamente inviável:
1. **Limitação física da tela e saturação de pixels:** Um monitor Full HD (1920×1080) possui aproximadamente 2 milhões de pixels; mesmo uma tela 4K Ultra HD possui cerca de 8,3 a 10 milhões de pixels. Plotar centenas de milhares de pontos sobrepostos causa *overplotting* destrutivo (mancha visual opaca), eliminando qualquer capacidade analítica.
2. **Carga cognitiva e tempo de percepção:** O cérebro humano não processa listas maciças de itens individuais sem sumarização prévia.

Por essa razão, o sistema aplica sistematicamente as **6 transformações formais de dados** ensinadas no curso:

1. **Seleção (Projection):**
   * *Conceito:* Escolha dos atributos estritamente necessários para a tarefa analítica.
   * *Aplicação:* Redução dos arquivos originais do TSE (que continham mais de 50 colunas com metadados burocráticos redundantes) para 15 atributos essenciais de alta densidade semântica.
2. **Filtragem (Filtering):**
   * *Conceito:* Seleção dinâmica de itens que satisfazem critérios analíticos específicos.
   * *Aplicação:* Cláusulas SQL `WHERE` reativas construídas no DuckDB-Wasm conforme o usuário interage com os seletores (ano, cargo, região, UF, partido, gênero, termo de busca e limites etários).
3. **Agregação (Aggregation):**
   * *Conceito:* Agrupamento de múltiplos itens individuais em valores resumidos representativos.
   * *Aplicação:* Consultas analíticas SQL executadas no Web Worker com `COUNT(*)`, contagens condicionais via `COUNT(*) FILTER (WHERE ...)`, médias ponderadas via `AVG(idade)` e agrupamentos via `GROUP BY`.
4. **Binning (Discretização):**
   * *Conceito:* Transformação de uma variável quantitativa contínua em variável ordinal por meio de intervalos regulares de categorização.
   * *Aplicação:* No histograma etário (`src/charts/ageHistogram.js`), a idade é discretizada em faixas quinquenais (bins de 5 anos: 18–24, 25–29, 30–34, etc.) via `FLOOR(idade / 5) * 5`, permitindo visualizar a densidade de frequência sem ruído estocástico.
5. **Normalização (Normalization / Ratios):**
   * *Conceito:* Reescalonamento de medidas absolutas para proporções e percentuais relativos ($0\% \text{ a } 100\%$).
   * *Aplicação:* O cálculo de `% Mulheres` e `% Pretos/Pardos` permite comparar estados como São Paulo (dezenas de milhares de candidatos) e Roraima (centenas de candidatos) sob uma métrica uniforme de paridade, neutralizando discrepâncias de magnitude populacional.
6. **Derivação (Derivation):**
   * *Conceito:* Criação de novos atributos derivados a partir dos atributos brutos pré-existentes.
   * *Aplicação:* 
     * Derivação da `idade` real no ano do pleito através da subtração cronológica: $\text{ano\_eleicao} - \text{ano\_nascimento}$.
     * Derivação da `regiao` a partir da sigla da `uf`.
     * Derivação do indicador booleano de conformidade legal de gênero: $\text{cota\_atingida} = (\text{perc\_mulheres} \ge 30\%)$.
     * Derivação das taxas de variação temporal ($\Delta \text{ em p.p.}$) entre ciclos sucessivos na série histórica.

### 2.4 Limitações dos Dados
1. **Autodeclaração:** Os dados de cor/raça, gênero e instrução decorrem de declaração voluntária no ato do registro, sujeitos a eventuais distorções ou correções ao longo dos anos.
2. **Dinamismo Jurídico:** A situação das candidaturas reflete a consolidação dos extratos disponibilizados pelo TSE, podendo haver alterações em instâncias recursais posteriores.
1. **Autodeclaração:** Os atributos de cor/raça, gênero e escolaridade decorrem de declaração voluntária no momento do registro de candidatura, sujeitos a correções administrativas ou atualizações autodeclaratórias entre diferentes pleitos.
2. **Fotografia Estática do Repositório do TSE:** A base consolidada reflete os extratos públicos fornecidos pela Justiça Eleitoral, de modo que alterações decorrentes de recursos judiciais julgados após o fechamento do arquivo oficial não são refletidas em tempo real.

### 2.5 Caracterização das Tarefas (Taxonomia de Tamara Munzner)
A fundamentação do sistema segue o modelo conceitual *What-Why-How* de Tamara Munzner:
### 2.5 Caracterização de Tarefas (Framework What-Why-How de Tamara Munzner)
O sistema foi desenhado para apoiar seis tarefas analíticas centrais:

* **T1 — Descobrir e Visualizar Distribuições Globais (Action: *Analyze -> Consume -> Discover*; Target: *Distribution*):**
  * Resumo imediato (*Overview First*) por meio de KPIs reativos (total, percentuais de mulheres e negros, idade média, nível superior) e do mapa coroplético do Brasil.
  * Prover visão sinóptica imediata (*Overview First*) por meio de KPIs reativos de topo e do mapa coroplético do território nacional.
* **T2 — Identificação de Tendências Longitudinais e Cumprimento Histórico de Cotas (Action: *Analyze -> Discover / Trends*; Target: *Features / Series over Time*):**
  * Investigar a evolução temporal das cotas de gênero (linha de 30%) e de autodeclaração racial ao longo dos 12 anos entre 2014 e 2026 através de gráfico de linhas contínuo.
* **T3 — Comparar Proporções Partidárias com Parâmetros Normativos (Action: *Analyze -> Compare*; Target: *Features / Threshold*):**
  * Comparar a taxa de candidaturas femininas de cada partido em relação ao patamar legal de 30%, avaliando quais legendas superam ou descumprem a cota.
  * Comparar a taxa de candidaturas femininas de cada partido em relação ao patamar legal de 30%, identificando quais legendas superam ou descumprem a cota.
* **T4 — Filtrar Multidimensionalmente por Interação Espacial e Categórica (Action: *Search -> Filter*; Target: *Subsets*):**
  * Selecionar uma UF no mapa, um partido no ranking, um ano eleitoral ou uma categoria demográfica para isolar subconjuntos de interesse e recomputar instantaneamente todas as demais visões.
* **T5 — Seleção de Intervalos Contínuos via Brushing Etário (Action: *Query -> Select / Brush*; Target: *Interval*):**
  * Delimitar faixas de idade no histograma através de `d3.brushX` e observar a recomposição demográfica correspondente.
* **T6 — Inspeção de Detalhes sob Demanda (Action: *Query -> Identify*; Target: *Individual Items*):**
  * Visualizar ano, nome de urna, cargo, partido, UF e resultados individuais dos candidatos que compõem o subconjunto filtrado.
  * Visualizar ano, nome de urna, cargo, partido, UF, situação e dados individuais dos candidatos que compõem o subconjunto filtrado.

---

## 3. Interface e Decisões de Design
## 3. Interface, Codificação Visual e Decisões de Design

### 3.1 Organização Geral da Interface
A interface adota a consagrada diretriz de Ben Shneiderman:  
> *"Overview first, zoom and filter, then details-on-demand."*
A interface adota a consagrada diretriz de interação de Ben Shneiderman:  
> *"Overview first, zoom and filter, then details-on-demand."* (Visão geral primeiro, zoom e filtros, depois detalhes sob demanda).

O layout é estruturado em uma grade modular responsiva dividida em cinco zonas hierárquicas:
1. **Barra Superior de Filtros e Busca Textual:** Controles globais (Ano Eleitoral, Cargo, Região, Partido, Gênero e Busca Livre) com indicador em tempo real do tempo de processamento do DuckDB-Wasm e chips de filtros ativos.
O layout modular é estruturado em uma grade hierárquica coordenada:
1. **Barra Superior de Filtros Globais e Busca Textual:** Controles de Ano, Cargo, Região, Partido, Gênero e Busca Livre, acompanhados de telemetria em tempo real da velocidade do DuckDB-Wasm e chips de filtros ativos.
2. **Faixa de KPIs Agregados:** Cinco cartões posicionados no topo para leitura instantânea dos números de referência do filtro corrente.
3. **Painel de Série Temporal e Evolução Histórica (2014 a 2026):** Gráfico de linhas contínuo com alternância de métricas, linha de cota de 30% e seleção de ano por clique.
4. **Grade Central de Visualizações Coordenadas (CMV - Coordinated Multiple Views):**
   * *Painel Esquerdo:* Mapa coroplético do Brasil com projeção Mercator e seletor de métricas.
   * *Painel Direito Superior:* Gráfico de barras horizontais com alternância de dimensões (Raça, Escolaridade, Estado Civil) e divisão interna de gênero.
   * *Painel Direito Inferior:* Ranking partidário com indicador de conformidade com a cota de gênero.
   * *Painel Inferior Largo:* Histograma contínuo com camada de brushing etário interativo (`d3.brushX`).
   * *Painel Direito Inferior:* Ranking partidário com indicador visual de conformidade com a cota de 30%.
   * *Painel Inferior Largo:* Histograma contínuo com camada de *brushing* etário interativo (`d3.brushX`).
5. **Painel Inferior de Detalhes sob Demanda:** Tabela analítica com paginação e busca por nome e ocupação.

```
+-----------------------------------------------------------------------------------+
|  CANDIDATURAS ELEITORAIS (2014-2026): VISUAL ANALYTICS (D3.JS + DUCKDB-WASM)      |
+-----------------------------------------------------------------------------------+
| [Ano: Todos v] [Cargo: Todos v] [Região: Todas v] [Partido: Todos v] [Gênero: v]  |
| Filtros ativos: [Ano: 2026 x] [UF: SP x]                    [⚡ DuckDB: 18.2 ms]  |
+-----------------------------------------------------------------------------------+
| [👥 Total: 7.376] [♀ Mulheres: 35.1%] [✊ Negros/Ind: 48.3%] [📅 Idade: 48.2]    |
+-----------------------------------------------------------------------------------+
| 📈 EVOLUÇÃO HISTÓRICA E SÉRIE TEMPORAL (2014 a 2026)                              |
| [Eleições Gerais] [Série Completa] | (*) % Mulheres ( ) % Negros ( ) Idade ( ) Total |
|  35% |                        _--* 2026 (35.1%)                                   |
|  30% | - - - - - - - - - - - * 2022 (33.8%) - - - - - [Cota Legal Mínima 30%]     |
|  25% |     * 2014 (31.0%) --* 2018 (31.5%)                                        |
|      +-------------------------------------------------------------------------+  |
|        2014        2016        2018        2020        2022        2024    2026   |
+------------------------------------------+----------------------------------------+
|                                          | PERFIL SOCIODEMOGRÁFICO                |
|  DISTRIBUIÇÃO GEOGRÁFICA (MAPA BRASIL)   | [Cor/Raça] [Escolaridade] [Est. Civil] |
|                                          | ■■■■■■■■■■■■ Branca   (51%)            |
|  (Projeção Mercator interativa)          | ■■■■■■■■ Parda        (39%)            |
|  Cores contínuas por UF                  | ■■■ Preta             (10%)            |
|  Clique para filtrar UF                  +----------------------------------------+
|                                          | AGREMIAÇÕES E COTA DE GÊNERO           |
|  Métrica: (*) % Mulheres ( ) % Negros    | PL   ● ■■■■■■■■■■■■ (34% ♀)            |
|                                          | PT   ● ■■■■■■■■■■   (38% ♀)            |
|                                          | UNIÃO  ■■■■■■■■     (28% ♀)            |
+------------------------------------------+----------------------------------------+
| DISTRIBUIÇÃO ETÁRIA DAS CANDIDATURAS (HISTOGRAMA COM BRUSH X)                     |
|    _/\_   (d3.brushX para selecionar faixas etárias)                              |
| __/    \_________________________________________________________________________ |
| 18      30       40       50       60       70       80       90 anos             |
+-----------------------------------------------------------------------------------+
| DETALHAMENTO SOB DEMANDA (TABELA PAGINADA COM REGISTROS DO DUCKDB)                |
| Ano | Nome Urna | Cargo | Partido | UF | Gênero | Raça | Idade | Grau Escolar     |
+-----------------------------------------------------------------------------------+
```

### 3.2 Justificativa de Marcas e Canais Visuais
Em conformidade com a teoria da percepção visual (Bertin, Cleveland & McGill, Mackinlay e Munzner), as escolhas de codificação priorizaram a máxima eficácia perceptiva:
### 3.2 Justificativa de Marcadores e Canais Visuais (Referência: Aula 07)

1. **Série Temporal e Evolução Histórica (`src/charts/timeSeries.js`):**
   * *Marca:* Linhas contínuas (trajetória de tendência), área sombreada com gradiente e pontos/glifos circulares nos anos.
   * *Canais:* 
     * **Posição alinhada no eixo X (Tempo):** Canal ordinal/temporal de mais alta eficácia interpretativa.
     * **Posição alinhada no eixo Y:** Proporção percentual ou idade média.
     * **Linha tracejada de referência (Threshold):** Linha vermelha estipulando visualmente o patamar obrigatório de 30% da cota feminina.
     * **Halo circular:** Realce do ponto correspondente ao ano ativo selecionado no dashboard.
2. **Mapa Coroplético do Brasil (`src/charts/map.js`):**
   * *Marca:* Polígonos das 27 UFs.
   * *Canais:* 
     * **Posição espacial 2D:** Preserva a topologia geográfica reconhecível do território nacional.
     * **Cor (Luminosidade e Saturação):** Escalas sequenciais perceptualmente uniformes (`d3.interpolateMagma` para mulheres e `d3.interpolateViridis` para negros/indígenas), evitando artefatos de arco-íris e preservando legibilidade para daltônicos.
     * **Contorno / Stroke:** Linha dourada (`#f59e0b`, largura 3px) para indicar estado ativamente filtrado.
3. **Perfil Demográfico e Ranking Partidário (`src/charts/demographics.js` e `parties.js`):**
   * *Marca:* Retângulos (barras horizontais).
   * *Canais:*
     * **Posição alinhada em escala comum (Eixo X):** Canal de mais alta acurácia perceptiva humana para atributos quantitativos (Cleveland & McGill).
     * **Comprimento:** Codifica o volume total de candidatos em cada categoria.
     * **Cor de Matiz Categórica:** Diferenciação binária de gênero (Rosa `#ec4899` para Feminino e Azul `#3b82f6` para Masculino).
     * **Glifo de Status:** Círculo verde (`#10b981`) ou vermelho (`#ef4444`) no eixo partidário para indicar conformidade imediata com o limiar de 30% da cota.
4. **Distribuição Etária (`src/charts/ageHistogram.js`):**
   * *Marca:* Barras verticais contíguas (bins de 5 anos).
   * *Canais:* Posição horizontal para idade e altura vertical para frequência; retângulo semi-transparente de seleção (`d3.brushX`) para filtragem por enquadramento de intervalo.
A escolha dos elementos visuais seguiu rigorosamente os **Princípios de Expressividade e Efetividade** (Mackinlay, Cleveland & McGill, Tamara Munzner):
* **Princípio de Expressividade:** A codificação visual expressa todas as relações de dados do conjunto e exclusivamente elas (sem sugerir ordenações em variáveis nominais nem sugerir continuidades falsas).
* **Princípio de Efetividade:** A importância da informação no domínio deve corresponder à relevância e precisão perceptiva do canal utilizado.

### 3.3 Coordenação entre Visualizações (Cross-Filtering e Reatividade)
A tabela a seguir sistematiza as primitivas geométricas (**Marcadores**) e seus atributos gráficos (**Canais**) empregados no sistema:

| Componente | Marcador | Dimensão Geométrica | Canais de Magnitude (Ordenados/Quant.) | Canais de Identidade (Categóricos) | Fenômenos Perceptuais Envolvidos |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Série Temporal** (`timeSeries.js`) | Pontos (glifos), Linhas (trajetória) e Área (gradiente) | 0D, 1D e 2D | • Posição no Eixo X (Ano cronológico)<br>• Posição no Eixo Y (Métrica)<br>• Linha tracejada horizontal (Threshold de 30%) | • Halo circular em torno do ponto do ano selecionado | • Continuidade de Gestalt<br>• Pop-out visual do ano ativo |
| **Mapa Coroplético** (`map.js`) | Polígonos das 27 UFs | 2D | • Cor: Luminância e Saturação (Escala sequencial perceptualmente uniforme) | • Posição espacial 2D (Fronteiras geográficas do Brasil)<br>• Contorno dourado de seleção | • Mapeamento topológico natural<br>• Pop-out da UF selecionada |
| **Perfil Demográfico** (`demographics.js`) | Retângulos (barras horizontais) | 2D | • Comprimento das barras (Contagem de candidatos)<br>• Posição alinhada no Eixo X | • Posição vertical por categoria discreta no Eixo Y<br>• Matiz de cor (Hue) para divisão interna de gênero | • Posição em escala comum (Nível máximo de precisão - Cleveland & McGill) |
| **Ranking Partidário** (`parties.js`) | Retângulos (barras empilhadas) | 2D | • Comprimento das barras (Volume do partido)<br>• Posição no Eixo X | • Rótulos nominais no Eixo Y<br>• Matiz binário para gênero<br>• Glifo circular de status | • Efeito Pop-out pré-atentivo (verde/vermelho indicando conformidade da cota) |
| **Histograma Etário** (`ageHistogram.js`) | Retângulos verticais contíguos | 2D | • Posição horizontal no Eixo X (Idade binned)<br>• Altura das barras no Eixo Y (Frequência) | • Retângulo translúcido de seleção via `d3.brushX` | • Agrupamento por proximidade<br>• Julgamento de altura alinhada |

#### Hierarquia Perceptiva de Cleveland & McGill
A literatura em percepção visual (Cleveland & McGill, 1984) comprova que o cérebro humano decodifica grandezas quantitativas com precisões distintas:
$$\text{Posição em escala comum} > \text{Posição em escala não alinhada} > \text{Comprimento (1D)} > \text{Ângulo/Inclinação} > \text{Área (2D)} > \text{Volume (3D)} > \text{Luminância/Cor}$$

Por esse motivo, todas as variáveis quantitativas cruciais (volume de candidaturas, taxas percentuais, idade e frequência etária) foram prioritariamente mapeadas em **Posição alinhada no eixo cartesiano** e em **Comprimento linear de barras**, deixando canais de saturação/luminância apenas para a visualização espacial no mapa (onde a posição 2D já está obrigatoriamente vinculada às coordenadas geográficas das UFs).

### 3.3 Escolhas de Gráficos Clássicos e Regras de Apresentação (Referência: Aula 10)

O projeto aplicou estritamente as diretrizes da Aula 10 ("Gráficos Clássicos"):
1. **Regra de Ouro: "Sempre comece a escala do zero!" (Slide 20 da Aula 10):**
   * Gráficos de barra representam quantidades físicas cujo comprimento e área são decodificados pelo cérebro proporcionalmente à base zero. Truncar o eixo de uma barra (como nos exemplos clássicos da Fox News demonstrados em aula) distorce a razão visual entre categorias e desrespeita o princípio de expressividade. No sistema, tanto as barras demográficas quanto as barras partidárias utilizam domínios com início obrigatório em zero (`[0, maxVal * 1.1]`).
2. **Orientação Horizontal para Rótulos Categóricos Longos (Slide 15 da Aula 10):**
   * Gráficos de barras verticais com muitos itens sofrem com sobreposição de rótulos de texto no eixo X, obrigando o analista a rotacionar rótulos em 45º ou 90º (o que prejudica severamente a velocidade de leitura). Adotou-se, portanto, a orientação de **barras horizontais** para agremiações partidárias e categorias demográficas (instrução formal e estado civil), permitindo leitura textual natural da esquerda para a direita.
3. **Rejeição Consciente do Gráfico de Pizza / Donut (Slides 25–34 da Aula 10):**
   * Conforme demonstrado em aula ("Não exagere no número de fatias!"), gráficos de pizza sofrem de baixa eficácia perceptiva: o olho humano julga ângulos e áreas com muito menor acurácia do que comprimentos lineares, além de se tornarem ilegíveis quando há mais de 4 ou 5 fatias. Como o cenário político brasileiro possui dezenas de partidos, a substituição da pizza por um **ranking ordenado de barras horizontais empilhadas** permitiu leitura precisa, comparação direta e inspeção imediata.
4. **Histograma e Área Proporcional (Slides 21–24 da Aula 10):**
   * A distribuição etária é apresentada em um histograma onde cada barra corresponde a uma faixa etária uniforme de 5 anos. A área total das barras é matematicamente equivalente à frequência total de candidaturas, evidenciando de imediato o pico modal (45–55 anos) e as assimetrias na cauda jovem (18–30 anos).
5. **Gráfico de Linhas para Séries Temporais (Slides 45–48 da Aula 10):**
   * Para avaliar tendências e trajetórias longitudinais ao longo dos 12 anos analisados (2014 a 2026), utilizou-se gráfico de linhas contínuo com interpolação suave (`d3.curveMonotoneX`), associado a uma linha de referência horizontal (*threshold*) estipulando a cota legal de 30%.
6. **Diretriz Essencial: "Sempre explique seu gráfico!" (Slide 57 da Aula 10):**
   * Gráficos sem contexto ou sem eixos rotulados são ineficazes. Todas as visualizações do sistema incluem: títulos declarativos claros, unidades explicitadas nos eixos (`%`, `anos`, `candidaturas`), legendas com limites de valores e *tooltips* detalhados com valores absolutos, taxas percentuais e deltas de crescimento.

### 3.4 Teoria e Diretrizes de Cores (Referência: Aula 11)

#### Fisiologia Visual e Espaços de Cor
A visão humana baseia-se em células fotorreceptoras da retina: bastonetes (sensíveis à luminosidade em baixa luz) e três tipos de cones (S, M e L, sensíveis a comprimentos de onda curtos, médios e longos, correspondendo ao espectro do azul, verde e vermelho). A teoria dos processos oponentes (Hurvich & Jameson) estabelece que o cérebro processa sinais cromáticos em três canais oponentes: claro-escuro, vermelho-verde e azul-amarelo.

Modelos computacionais comuns como **RGB** e **HSV** apresentam graves defeitos para a visualização científica de dados:
* O espaço **RGB** é orientado ao hardware de monitores e não tem correspondência perceptual intuitiva.
* O espaço **HSV** é mais intuitivo para escolha de cores, mas **não é perceptualmente uniforme** (Slide 31 da Aula 11): variações idênticas nos valores numéricos de matiz geram saltos perceptuais discrepantes na luminosidade percebida pelo olho humano.

Por esse motivo, a comunidade científica e as bibliotecas modernas recomendam espaços perceptualmente uniformes como **CIE LAB** e **CIE HCL**, que garantem que distâncias numéricas nos dados correspondam exatamente a distâncias perceptuais equivalentes no olho humano.

#### O Perigo da Escala Rainbow (Arco-Íris)
Conforme enfatizado na Aula 11 (Slides 32 e 33), a clássica escala *Rainbow* (arco-íris) em espaço sRGB foi categoricamente proscrita neste projeto pelos seguintes motivos científicos:
1. **Segmentação artificial:** O olho humano percebe o espectro do arco-íris como faixas discretas de cores distintas (amarelo, verde, ciano), criando a ilusão de fronteiras ou "degraus" onde nos dados reais existe uma transição suave e contínua.
2. **Ausência de monotonicidade na luminosidade:** O amarelo na escala arco-íris possui luminosidade aparente muito superior ao vermelho ou ao azul, gerando falsos picos visuais de atração e confundindo a leitura de magnitude.
3. **Inacessibilidade para daltônicos:** Indivíduos com deuteranopia ou protanopia não conseguem diferenciar transições entre verde, amarelo e vermelho.

#### Tipos de Escalas de Cores Utilizadas
1. **Escala Sequencial Perceptualmente Uniforme (Mapa Coroplético):**
   * `% Mulheres`: Interpolação **Magma** (`d3.interpolateMagma`), variando monotonicamente do escuro ao claro e saturado com excelente separabilidade visual.
   * `% Pretos, Pardos e Indígenas`: Interpolação **Viridis** (`d3.interpolateViridis`), consagrada cientificamente por sua monotonicidade estrita de brilho e legibilidade perfeita para pessoas com deficiência de visão de cores.
   * `Total de Candidaturas`: Interpolação **Cividis** (`d3.interpolateCividis`), especialmente otimizada para todas as variantes de daltonismo.
2. **Escala Categórica Qualitativa (Gênero e Legendas):**
   * Diferenciação binária entre Feminino (Magenta `#ec4899`) e Masculino (Azul `#3b82f6`), com alto contraste contra o fundo escuro e fácil discriminação visual.

#### Verificação das 6 Diretrizes de Cores do Prof. Marcos Lage (Slide 63 da Aula 11)
1. **Minimizar a ambiguidade:** Cada cor possui um significado unívoco e consistente em todos os painéis da aplicação (azul = masculino; magenta = feminino; dourado = item ativamente selecionado; verde/vermelho = cota cumprida ou descumprida).
2. **Selecionar cores semanticamente diferentes:** O azul e o magenta possuem matizes diametralmente opostos no círculo cromático, prevenindo qualquer ambiguidade de leitura nas barras empilhadas.
3. **Usar apenas algumas cores (até 6 de preferência):** A paleta categórica do sistema foi intencionalmente contida, utilizando apenas 3 cores de destaque funcional (azul, magenta, dourado) e 2 cores de status (verde e vermelho).
4. **Usar cores harmoniosas:** O tema escuro adota a paleta Slate (`#0f172a`, `#1e293b`), reduzindo a fadiga visual e maximizando a razão de contraste dos elementos gráficos sem saturações agressivas.
5. **Respeitar os daltônicos:** O mapa do Brasil utiliza colormaps *colorblind-friendly* (Viridis e Cividis). Adicionalmente, o indicador de cota legal de 30% nos partidos utiliza **codificação redundante**: além da cor (verde/vermelho), o sistema exibe o percentual numérico explícito (`34% ♀`), permitindo leitura inequívoca mesmo sob ausência total de percepção de cor.
6. **Usar espaços de cores perceptualmente consistentes:** Todas as escalas contínuas do D3 derivam dos interpoladores perceptualmente lineares em luminosidade desenvolvidos pela comunidade científica.

### 3.5 Coordenação entre Visualizações (CMV e Brushing & Linking)
A coordenação entre visualizações obedece ao paradigma de **Visualizações Múltiplas Coordenadas (Coordinated Multiple Views - CMV)**:
* **Sincronização Cronológica:** Clicar em um ponto do ano (ex.: 2018) na série temporal atualiza imediatamente o mapa, partidos, pirâmide etária e tabela para aquele pleito.
* **Brushing & Linking Bi-direcional:** Ao selecionar um intervalo de idade no histograma, os KPIs são recalculados, o mapa ajusta as cores das UFs e os gráficos demográficos exibem o perfil da faixa etária.
* **Seleção Categórica Multidimensional:** Clicar em uma UF (ex.: Bahia), no cargo "DEPUTADO FEDERAL" e no partido "PT" gera a intersecção analítica exata instantaneamente.
* **Sincronização Cronológica:** Clicar em um ponto do ano (ex.: 2018) na série temporal atualiza imediatamente o mapa, partidos, pirâmide etária e tabela para aquele pleito específico.
* **Brushing & Linking Bi-direcional:** Ao selecionar um intervalo de idade no histograma via `d3.brushX`, os KPIs de topo são recalculados, o mapa ajusta as cores das UFs e os gráficos demográficos exibem o perfil exclusivo da faixa etária delimitada.
* **Seleção Categórica Multidimensional:** Clicar em uma UF no mapa (ex.: Bahia), no cargo "DEPUTADO FEDERAL" e no partido "PT" gera a intersecção analítica exata instantaneamente.
* **Feedback Imediato de Remoção:** Cada filtro ativo gera um "chip" na barra superior; o usuário pode remover qualquer critério individualmente ou clicar em "Limpar Filtros" para restaurar a visão integral.

---

## 4. Implementação
## 4. Implementação Técnica e Arquitetura Client-Side

### 4.1 Arquitetura da Aplicação (100% Client-Side)
### 4.1 Arquitetura 100% Client-Side no Navegador
A aplicação foi construída integralmente com padrões web modernos (ES Modules, D3.js v7 e DuckDB-Wasm). Não existe camada de backend ou API intermediária: todo o processamento de agregação, ordenação e filtragem ocorre no navegador do usuário.

```
┌─────────────────────────────────────────────────────────────────┐
│                      NAVEGADOR DO USUÁRIO                       │
│                                                                 │
│  ┌───────────────────────┐         ┌─────────────────────────┐  │
│  │     Store Reativo     │ ◄─────► │   Interface e D3.js     │  │
│  │   (Padrão Pub/Sub)    │         │ (Renderização e Eixos)  │  │
│  └──────────┬────────────┘         └────────────▲────────────┘  │
│             │ Cláusula WHERE dinamicamente      │               │
│             │ gerada para filtros ativos        │               │
│             ▼                                   │ Registros     │
│  ┌──────────────────────────────────────────────┴────────────┐  │
│  │                    DuckDB-Wasm Engine                     │  │
│  │             (Web Worker + Apache Arrow WASM)              │  │
│  │                                                           │  │
│  │ Tabela 'candidaturas' (1.627.019 tuplas colunares em VFS) │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Integração com DuckDB-Wasm e Resolução de Tipos BigInt
1. **Instanciação em Web Worker:** O módulo `src/db.js` instancia o motor `AsyncDuckDB` com logger silencioso em um Web Worker dedicado, garantindo que o processamento analítico não concorra com a thread de renderização da interface gráfica (*UI Thread*).
1. **Instanciação em Web Worker:** O módulo `src/db.js` instancia o motor `AsyncDuckDB` em um Web Worker dedicado, garantindo que o processamento analítico pesado não concorra com a thread de renderização da interface gráfica (*UI Thread*).
2. **Carregamento no VFS:** O arquivo `public/data/candidaturas_historico_limpo.csv` é registrado no Virtual File System (VFS) do DuckDB via `db.registerFileText`.
3. **Criação da Tabela Analítica:** A tabela `candidaturas` é criada com tipos rigorosamente definidos (`INTEGER` para ano, número e idade; `VARCHAR` para texto).
4. **Higienização de Tipos BigInt do Apache Arrow (`sanitizeArrowValues`):**
   * Em consultas analíticas com `COUNT(*)`, o DuckDB-Wasm retorna inteiros de 64 bits (`Int64`), serializados pelo Arrow como **`BigInt`** nativo do JavaScript.
   * Em JavaScript puro e no D3.js, operações como `data.total * perc`, `Math.round(total)` e escalas do D3 lançam a exceção:  
   * Em JavaScript puro e no D3.js, operações aritméticas e escalas lançam a exceção:  
     `TypeError: Cannot mix BigInt and other types, use explicit conversions`.
   * Para eliminar falhas silenciosas, implementou-se em `src/db.js` a função utilitária `sanitizeArrowValues`, que percorre os registros retornados pelo Arrow e converte recursivamente qualquer `BigInt` para `Number` padrão do JavaScript.
5. **Consultas Analíticas Paralelizadas:** No ciclo de atualização (`updateDashboard`), as consultas analíticas independentes são disparadas em paralelo via `Promise.all`:
   ```sql
   -- Consulta de Série Temporal (Evolução por Eleição no DuckDB-Wasm):
   -- Exemplo de agregação de Série Temporal por Ano no DuckDB-Wasm:
   SELECT
     ano,
     COUNT(*) AS total,
     COUNT(*) FILTER (WHERE genero = 'FEMININO') AS mulheres,
     ROUND(100.0 * COUNT(*) FILTER (WHERE genero = 'FEMININO') / NULLIF(COUNT(*), 0), 1) AS perc_mulheres,
     COUNT(*) FILTER (WHERE raca IN ('PRETA', 'PARDA', 'INDÍGENA')) AS negros_indigenas,
     ROUND(100.0 * COUNT(*) FILTER (WHERE raca IN ('PRETA', 'PARDA', 'INDÍGENA')) / NULLIF(COUNT(*), 0), 1) AS perc_negros_indigenas,
     ROUND(AVG(idade), 1) AS idade_media
   FROM candidaturas
   WHERE ${whereClauseSemAno}
   GROUP BY ano
   ORDER BY ano ASC;
   ```

### 4.3 D3.js Idiomático e Padrões de Visualização
* **Data Binding:** Todos os módulos de visualização utilizam o padrão moderno de vinculação de dados do D3 (`.data(data, keyFunction)`), garantindo atualizações incrementais e corretas.
* **Escalas e Eixos:** Uso idiomático de `d3.scaleLinear`, `d3.scaleBand`, `d3.scalePoint` e `d3.scaleSequential`.
* **Transições e Efeitos Visuais:** Animações fluidas através de `d3.transition().duration(500)` para transição de comprimentos de barras e interpolação de números nos KPIs.
* **Detalhamento sob Demanda:** Tabela paginada com identificação por Ano, Nome de Urna, Cargo, Partido, UF, Gênero, Raça, Idade, Escolaridade, Ocupação e Situação do Registro Eleitoral.

---

## 5. Exemplos de Uso e Percursos Analíticos

### Percurso 1: Investigando o Cumprimento da Cota de Gênero entre Partidos e Cargos
* **Pergunta:** *Quais agremiações partidárias realmente atingem o mínimo legal de 30% de candidaturas femininas e se esse índice se mantém nos cargos de maior relevância política (Governador e Prefeito)?*
* **Ações do Usuário:**
  1. O usuário observa a visão geral do Brasil: a representatividade feminina global está acima de **33%**, atingindo formalmente a cota legal agregada.
  2. No filtro de **Cargo**, o usuário seleciona **"GOVERNADOR"**.
* **Resultados Observados:**
  * O indicador de Representatividade Feminina cai para menos de **18%**.
  * No gráfico de partidos, quase todas as legendas exibem o ponto vermelho de descumprimento da cota para o Poder Executivo.
  * O mapa do Brasil mostra que a maioria dos estados possui zero ou apenas uma candidatura feminina para o governo estadual.
* **Conclusão:** O sistema demonstra visualmente a concentração tática de cotas: os partidos atingem a média de 30% exigida pela lei concentrando candidaturas femininas em disputas proporcionais de Deputado Estadual e Vereador, enquanto as disputas majoritárias executivas permanecem amplamente hegemonizadas por homens.

---

### Percurso 2: Diversidade Racial e Assimetrias Regionais (Norte/Nordeste vs. Sul/Sudeste)
* **Pergunta:** *Qual é a disparidade étnico-racial entre os candidatos das regiões Norte e Nordeste em comparação aos estados do Sul?*
* **Ações do Usuário:**
  1. No controle de métrica do mapa, o usuário seleciona **"% Pretos/Pardos"**.
  2. O usuário clica no estado da **Bahia (BA)** no mapa.
  3. Em seguida, remove o filtro e clica no estado do **Rio Grande do Sul (RS)**.
* **Resultados Observados:**
  * Na **Bahia**, a proporção de candidatos pretos, pardos e indígenas ultrapassa **70%**, com ampla predominância de candidaturas pardas e pretas no gráfico demográfico.
  * No **Rio Grande do Sul**, a proporção de pretos, pardos e indígenas cai para cerca de **15%**, sendo mais de **84%** das candidaturas compostas por pessoas autodeclaradas brancas.
* **Conclusão:** O sistema evidencia que a diversidade racial nas eleições brasileiras acompanha fortemente a composição demográfica regional, mas com persistente sub-representação nos parlamentos locais.

---

### Percurso 3: Renovação Política e Pirâmide Etária por Tipo de Disputa
* **Pergunta:** *Existe oportunidade de renovação geracional (jovens entre 18 e 35 anos) nas disputas majoritárias ou a política de cúpula permanece concentrada em faixas acima de 50 anos?*
* **Ações do Usuário:**
  1. No histograma de distribuição etária, o usuário arrasta o mouse (*brush*) selecionando a faixa de **18 a 35 anos**.
  2. O usuário observa os cartões de KPIs e a tabela de detalhes sob demanda.
* **Resultados Observados:**
  * Candidatos de 18 a 35 anos representam menos de **15%** do total de registros.
  * Na tabela sob demanda, a quase totalidade desses candidatos concorre a Vereador ou Deputado Estadual; não há registros expressivos de jovens para o Senado ou Governos Estaduais.
* **Conclusão:** O histograma com brushing permite confirmar a existência de um teto de entrada etário nos cargos majoritários e de alta proeminência no Brasil.
* **Conclusão:** O histograma com *brushing* permite confirmar empiricamente a existência de um teto de entrada etário nos cargos majoritários e de alta proeminência no Brasil.

---

### Percurso 4: Análise Longitudinal e Tendências da Série Temporal (2014 a 2026)
* **Pergunta:** *A participação de mulheres e a diversidade racial cresceram de forma sustentada entre 2014 e 2026? Houve impacto perceptível da regulação de cotas partidárias?*
* **Ações do Usuário:**
  1. No gráfico de **Evolução Histórica**, o usuário seleciona a métrica **"% Mulheres"**.
  2. O usuário observa a curva suave com marcadores para os pleitos gerais e municipais:
     * **2014 (Gerais):** 31,0%
     * **2016 (Municipais):** 31,8% (+0,8 p.p.)
     * **2018 (Gerais):** 31,5% (-0,3 p.p.)
     * **2020 (Municipais):** 33,5% (+2,0 p.p.)
     * **2022 (Gerais):** 33,8% (+0,3 p.p.)
     * **2024 (Municipais):** 34,3% (+0,5 p.p.)
     * **2026 (Gerais):** 35,1% (+0,8 p.p.)
  3. Em seguida, altera para a métrica **"% Pretos/Pardos"**:
     * Em 2014, a proporção era de **44,6%**; em 2020 alcançou **50,4%** e em 2024 atingiu o pico de **52,2%**.
  4. O usuário clica no ponto do ano **"2020 (Mun)"**: todo o painel (Mapa, Partidos, Pirâmide Etária e Tabela) se reconfigura instantaneamente para exibir o cenário político de 2020 com seus 558.804 candidatos.
  5. Clica no ponto **"2026"**: o painel salta imediatamente para o cenário de 2026.
* **Conclusão:** A inclusão da série temporal fecha o ciclo do framework de Tamara Munzner para tarefas de tendência (*trends*), comprovando visualmente o impacto progressivo das decisões do TSE e do STF quanto à destinação proporcional de tempo de rádio/TV e recursos do Fundo Partidário/FEFC para mulheres e negros ao longo dos últimos 12 anos.
* **Conclusão:** A inclusão da série temporal atende com excelência ao framework de Tamara Munzner para tarefas de tendência (*trends*), comprovando visualmente o impacto progressivo das decisões do TSE e do STF quanto à destinação proporcional de recursos do Fundo Partidário/FEFC para mulheres e negros ao longo dos últimos 12 anos.

---

## 6. Discussão Final

### 6.1 Avaliação do Sistema Frente às Tarefas Propostas
O sistema cumpriu integralmente os objetivos estipulados para o trabalho final:
* Viabilizou a exploração multidimensional sem rupturas de fluxo analítico, graças ao processamento instantâneo in-browser do DuckDB-Wasm (todas as consultas analíticas conjuntas executam em menos de 30 milissegundos).
* Atendeu às tarefas de descobrir padrões, comparar grupos, analisar tendências temporais, filtrar subconjuntos e identificar casos individuais, seguindo estritamente os princípios de design de Tamara Munzner.
* Manteve coerência gráfica e estética profissional, combinando um tema escuro confortável para análise prolongada, tipografia limpa e contraste em conformidade com as diretrizes de acessibilidade WCAG AA.
O sistema cumpriu integralmente os objetivos estipulados para o projeto final da disciplina de Visualização de Dados:
* Viabilizou a exploração multidimensional sem rupturas de fluxo analítico, graças ao processamento instantâneo *in-browser* do DuckDB-Wasm (todas as consultas analíticas conjuntas executam em menos de 30 milissegundos sobre 1,6 milhão de tuplas).
* Atendeu às tarefas de descobrir padrões, comparar grupos, analisar tendências temporais, filtrar subconjuntos e identificar casos individuais, seguindo estritamente os princípios de design de Tamara Munzner e a hierarquia de canais de Cleveland & McGill.
* Manteve coerência gráfica e estética profissional, combinando um tema escuro confortável para análise prolongada, tipografia limpa e contraste em conformidade com as diretrizes de acessibilidade WCAG AA e as 6 Diretrizes de Cores do Prof. Marcos Lage.

### 6.2 Limitações do Sistema
1. **Dados Estáticos de Snapshot:** A base reflete o extrato consolidado disponibilizado pelo TSE; alterações em tempo real de deferimentos posteriores de candidaturas não são sincronizadas automaticamente sem nova extração.
1. **Dados Estáticos de Snapshot:** A base reflete o extrato consolidado disponibilizado pelo TSE; alterações decorrentes de recursos em instâncias superiores após a publicação não são sincronizadas dinamicamente.
2. **Resolução de Tela em Dispositivos Móveis:** Embora a aplicação utilize CSS Grid e SVG responsivo com `viewBox`, a riqueza de visualizações coordenadas simultâneas oferece a melhor experiência em telas com largura a partir de 1024 pixels (notebooks e monitores desktop).

### 6.3 Possíveis Melhorias Futuras
* **Cruzamento com Prestação de Contas:** Integrar a receita declarada de campanha dos candidatos para analisar o montante financeiro médio destinado a candidaturas femininas versus masculinas.
* **Diagrama de Sankey de Transição de Votos:** Mapear a transição de candidaturas históricas (candidatos que foram vereadores em 2020 e se candidataram a deputado em 2026).
* **Exportação Personalizada:** Permitir que o usuário exporte os dados filtrados em CSV ou baixe o SVG dos gráficos para utilização em artigos ou reportagens.
* **Cruzamento com Prestação de Contas:** Integrar as receitas declaradas de campanha dos candidatos para analisar o montante financeiro médio destinado a candidaturas femininas versus masculinas.
* **Diagrama de Sankey de Transição de Carreiras:** Mapear a transição de candidaturas históricas (candidatos que foram vereadores em 2020 e se candidataram a deputado em 2026).
* **Exportação Personalizada:** Permitir que o usuário exporte os dados filtrados em CSV ou baixe o SVG vetorial dos gráficos para utilização em artigos ou reportagens.

### 6.4 Aprendizados Obtidos
### 6.4 Aprendizados Obtidos e Síntese Teórico-Prática
O desenvolvimento deste projeto consolidou lições fundamentais sobre a prática de Visual Analytics:
1. **O Valor da Eficácia Perceptiva sobre o Excesso Visual:** Gráficos de linhas e de barras limpos e bem alinhados no D3 comunicam comparações categóricas e temporais com muito mais precisão e agilidade interpretativa do que visualizações excessivamente complexas.
2. **A Revolução do DuckDB-Wasm na Web:** A capacidade de executar um banco colunar SQL analítico no cliente elimina a necessidade de construir rotinas manuais de agregação em JavaScript puro, além de viabilizar filtros combinatórios ilimitados com altíssimo desempenho e zero custo de infraestrutura de backend.
3. **A Importância da Coordenação Estrita:** Visualizações isoladas respondem a perguntas pontuais; apenas visualizações coordenadas (*Coordinated Multiple Views*) habilitam a verdadeira exploração investigativa e a descoberta de hipóteses não planejadas.
1. **O Valor da Eficácia Perceptiva sobre o Excesso Visual:** Gráficos de linhas e de barras limpos e bem alinhados no D3 comunicam comparações categóricas e temporais com muito mais precisão e agilidade interpretativa do que visualizações excessivamente rebuscadas ou gráficos de pizza saturados.
2. **A Centralidade da Transformação de Dados:** Como ensinado na Aula 06, a visualização efetiva não existe sem pré-processamento e transformação: a seleção de atributos, agregação em tempo real, discretização etária (*binning*) e normalização percentual foram tão vitais quanto o desenho dos elementos SVG.
3. **A Revolução do DuckDB-Wasm na Web:** A capacidade de executar um banco colunar SQL analítico no cliente elimina a necessidade de construir rotinas manuais de agregação em JavaScript puro, além de viabilizar filtros combinatórios ilimitados com altíssimo desempenho e zero custo de infraestrutura de backend.
4. **A Importância da Coordenação Estrita:** Visualizações isoladas respondem a perguntas pontuais; apenas visualizações coordenadas (*Coordinated Multiple Views*) habilitam a verdadeira exploração investigativa e a descoberta de hipóteses não planejadas.

---

## 7. Referências Bibliográficas

* **Munzner, Tamara.** *Visualization Analysis and Design*. A K Peters/CRC Press, 2014.
* **Card, Stuart K.; Mackinlay, Jock D.; Shneiderman, Ben.** *Readings in Information Visualization: Using Vision to Think*. Morgan Kaufmann, 1999.
* **Cleveland, William S.; McGill, Robert.** *Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods*. Journal of the American Statistical Association, 79(387), 531-554, 1984.
* **Ware, Colin.** *Information Visualization: Perception for Design*. Morgan Kaufmann, 3rd Edition, 2012.
* **Tukey, John W.** *The Future of Data Analysis*. The Annals of Mathematical Statistics, 33(1), 1-67, 1962.
* **Knaflic, Cole Nussbaumer.** *Storytelling with Data: A Data Visualization Guide for Business Professionals*. Wiley, 2015.
* **Matejka, Justin; Fitzmaurice, George.** *Same Stats, Different Graphs: Generating Datasets with Varied Appearance and Identical Summary Statistics through Simulated Annealing*. ACM CHI, 2017.
* **Anscombe, Francis J.** *Graphs in Statistical Analysis*. The American Statistician, 27(1), 17-21, 1973.
* **Satyanarayan, Arvind et al.** *Reactive Vega: A Streaming Dataflow Architecture for Declarative Interactive Visualization*. IEEE TVCG, 2016.
* **Tribunal Superior Eleitoral (TSE).** *Portal de Dados Abertos: Repositório de Dados Eleitorais (Candidaturas 2014 a 2026)*. Brasília, DF, 2026.
