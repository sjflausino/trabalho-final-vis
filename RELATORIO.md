# Relatório de Projeto: Visual Analytics das Candidaturas Eleitorais no Brasil (2014–2026)

**Disciplina:** Visualização de Dados (IC-UFF) — Prof. Marcos Lage  
**Tecnologias:** D3.js (v7) e DuckDB-Wasm  
**Fonte dos Dados:** Tribunal Superior Eleitoral (TSE) — Candidaturas de 2014 a 2026 (1.627.019 registros)

---

## 1. Introdução

O presente trabalho tem como objetivo aplicar a teoria de Visualização de Dados no projeto e implementação de um sistema interativo de *Visual Analytics* voltado à exploração do perfil demográfico, diversidade racial e paridade de gênero nas eleições brasileiras entre 2014 e 2026. Diante de uma base pública massiva com mais de 1,6 milhão de candidaturas (abrangendo pleitos gerais e municipais), tabelas estáticas ou gráficos isolados são incapazes de revelar simultaneamente tendências históricas, disparidades regionais e o cumprimento efetivo da cota mínima legal de 30% de candidaturas por gênero (Lei nº 9.504/1997). Fundamentado na tríade metodológica *What-Why-How* de Tamara Munzner e no mantra interativo de Ben Shneiderman (*overview first, zoom and filter, then details-on-demand*), o sistema utiliza o **DuckDB-Wasm** para transformação e agregação SQL em memória no cliente e a biblioteca **D3.js** para renderização programática de múltiplas visões coordenadas (*Coordinated Multiple Views*).

---

## 2. Dados, Transformações e Tarefas (What / Why)

### Abstração dos Dados (What)
O conjunto de dados combina uma **tabela multidimensional** (`candidaturas.parquet`, 1.627.019 itens comprimidos em 25,48 MB) com **geometrias espaciais vetoriais** (`brazil_states.geojson`, polígonos das 27 UFs). Os atributos selecionados classificam-se em:
* **Ano do Pleito (`ano`):** Atributo quantitativo sequencial (temporal), cobrindo 7 ciclos eleitorais (2014 a 2026).
* **Idade (`idade`):** Atributo quantitativo contínuo/discreto derivado no pré-processamento ($\text{ano\_eleicao} - \text{ano\_nascimento}$), garantindo a idade real do candidato na data de cada pleito.
* **Escolaridade (`instrucao`):** Atributo categórico ordinal (do ensino fundamental incompleto ao superior completo).
* **Partido, Cargo, Gênero, Raça/Cor, Estado Civil, Ocupação e Situação:** Atributos categóricos nominais.
* **Unidade Federativa (`uf`) e Região (`regiao`):** Atributos categóricos com correspondência geográfica hierárquica.

### Transformações de Dados
Plotar diretamente 1,6 milhão de registros geraria *overplotting* severo (excedendo a densidade útil de pixels da tela) e sobrecarga cognitiva. Por isso, aplicaram-se seis transformações via ETL e consultas SQL parametrizadas no DuckDB-Wasm: **seleção** (redução de mais de 50 colunas burocráticas do TSE para 15 atributos analíticos), **filtragem** (cláusulas `WHERE` reativas combinando seletores globais, cliques e *brush*), **agregação** (`COUNT(*)`, `AVG(idade)` e `FILTER`), **discretização/*binning*** (agrupamento etário em faixas de 5 anos via `FLOOR(idade / 5.0) * 5`), **normalização** (conversão de volumes brutos em taxas percentuais de mulheres e pretos/pardos/indígenas, permitindo comparar estados de portes populacionais distintos como SP e RR) e **derivação** (indicador de cumprimento da cota $\ge 30\%$ e variação em pontos percentuais entre eleições).

### Tarefas Analíticas (Why)
* **Descobrir tendências (*Discover Trends*):** Avaliar a trajetória histórica da participação feminina e de candidatos pretos, pardos e indígenas entre 2014 e 2026, separando ou unificando eleições gerais e municipais.
* **Comparar com limiar normativo (*Compare Values / Threshold*):** Confrontar a proporção feminina de cada partido e cargo com o piso legal de 30%.
* **Explorar padrões espaciais e demográficos (*Discover Distribution*):** Identificar concentrações regionais de autodeclaração racial, escolaridade e perfil geracional.
* **Filtrar subconjuntos e consultar itens (*Filter Subsets & Lookup/Identify*):** Isolar recortes combinatórios (ex.: mulheres candidatas ao Executivo em um estado específico) via *cross-filtering* e inspecionar os registros individuais sob demanda.

---

## 3. Decisões de Projeto Visual e Codificação (How)

As escolhas de marcas geométricas, canais visuais, escalas e cores priorizaram os princípios de **expressividade** (representar fielmente as relações dos dados sem criar ordens falsas) e **efetividade** (mapear variáveis prioritárias nos canais de maior precisão perceptual segundo a hierarquia de Cleveland & McGill).

### 3.1 Série Temporal de Evolução Histórica (`timeSeries.js`)
* **Apresentação:** Gráfico de linha contínua com área sombreada suave (`d3.curveMonotoneX`), marcadores circulares clicáveis por ano, alternador de escopo (*Gerais*, *Municipais* e *Série Completa*) e seletor entre `% Mulheres`, `% Pretos/Pardos`, `Idade Média` e `Total`. Inclui uma linha horizontal tracejada vermelha marcando a cota legal de 30%.
* **Justificativa:** O eixo X sequencial aliado à conectividade da linha explora a continuidade de Gestalt para evidenciar inclinações de crescimento ou estagnação ao longo do tempo. A interpolação monotônica evita oscilações matemáticas artificiais (*overshooting*) entre os pontos reais, enquanto o halo expandido sobre o ano selecionado atua por *pop-out* para sinalizar o filtro temporal ativo. Os valores exatos são rotulados sobre os marcadores e detalhados com cálculo de $\Delta$ (em p.p.) no *tooltip*, evitando poluição visual.
* **Trade-offs:** Nas métricas percentuais e de idade média, o domínio do eixo Y é ajustado à faixa de variação dos dados (ex.: 20% a 40%) em vez de partir do zero. Isso maximiza a percepção de mudanças reais de 1 a 2 pontos percentuais entre ciclos, mas exige leitura atenta dos rótulos do eixo vertical para não superestimar a magnitude relativa da inclinação. Adicionalmente, na visão de *Série Completa*, a alternância de volume bruto entre eleições municipais (~500 mil candidatos) e gerais (~25 mil) cria um padrão em zigue-zague para a métrica `Total` — problema resolvido pela oferta dos escopos isolados (*Gerais* vs. *Municipais*).

### 3.2 Mapa Coroplético por Unidade Federativa (`map.js`)
* **Apresentação:** Mapa vetorial das 27 UFs em projeção Mercator (`d3.geoMercator`), codificando `% Mulheres` (*Magma*), `% Pretos/Pardos/Indígenas` (*Viridis*) ou `Total` (*Cividis*), acompanhado de legenda contínua em gradiente, *tooltips* multivariados e seleção de estado por clique (contorno dourado de maior espessura).
* **Justificativa:** Como os canais espaciais 2D estão comprometidos com a geometria geográfica, a magnitude quantitativa é mapeada em **luminância e saturação**. Rejeitou-se deliberadamente a escala arco-íris (*Rainbow*), que introduz bandas artificiais e carece de monotonicidade luminosa, adotando-se escalas sequenciais perceptualmente uniformes e acessíveis a daltônicos (*Viridis* e *Cividis*).
* **Trade-offs:** Todo mapa coroplético sofre distorção entre área territorial e relevância demográfica: estados extensos com menor colégio eleitoral (como AM e MT) dominam a área visual, enquanto unidades densas e geograficamente pequenas (como DF, RJ e SE) dispõem de poucos pixels para leitura e clique, sendo mitigados pelo realce de contorno no *hover* e pelos seletores regionais.

### 3.3 Barras Horizontais Empilhadas: Partidos e Demografia (`parties.js` e `demographics.js`)
* **Apresentação:** Dois painéis de barras horizontais iniciando estritamente na origem zero (`d3.scaleLinear`), ordenados decrescentemente pelo total de candidaturas (`ORDER BY total DESC`). Cada barra divide-se internamente entre Homens (azul `#3b82f6`) e Mulheres (magenta `#ec4899`). No ranking partidário (Top 14), um glifo circular à esquerda indica se a legenda atingiu ($\ge 30\%$, verde) ou descumpriu ($<30\%$, vermelho) a cota feminina, acompanhado do percentual escrito ao final da barra.
* **Justificativa:** Posição em escala comum alinhada e comprimento linear são os canais de mais alta precisão perceptual para comparar quantidades, justificando a rejeição de gráficos de pizza ou *donut* (ineficazes para julgar ângulos entre dezenas de siglas). A orientação horizontal elimina a colisão e a necessidade de rotacionar rótulos longos (como graus de escolaridade), e o início obrigatório no zero preserva a proporcionalidade visual entre categorias. O glifo de status gera *pop-out* pré-atentivo imediato, enquanto o rótulo textual (`34% ♀`) garante **codificação redundante** para usuários daltônicos.
* **Trade-offs:** No empilhamento horizontal, apenas o segmento base (Homens, alinhado ao eixo Y) e o comprimento total do partido usufruem de escala alinhada comum; o segundo segmento (Mulheres) parte de posições deslocadas, reduzindo a precisão de comparação visual direta do volume absoluto feminino entre dois partidos — compensado pelo percentual explícito ao lado da barra e pelo *tooltip*. Além disso, limitar o ranking às 14 maiores legendas evita barra de rolagem excessiva e oclusão, mas omite partidos nanicos na visão global até que o usuário filtre por sigla ou UF.

### 3.4 Histograma de Distribuição Etária com Brushing (`ageHistogram.js`)
* **Apresentação:** Histograma vertical contíguo agrupado em *bins* regulares de 5 anos, empilhado por gênero, equipado com seleção interativa de intervalo contínuo via `d3.brushX`.
* **Justificativa:** A discretização quinquenal suaviza oscilações pontuais de idades específicas e revela claramente a forma da distribuição (assimetria, concentração modal entre 40 e 54 anos e caudas geracionais). O `d3.brushX` permite traduzir diretamente uma questão analítica contínua (ex.: isolar jovens de 18 a 30 anos ou idosos acima de 65) em cláusula SQL sem digitação manual de parâmetros.
* **Trade-offs:** O agrupamento em faixas de 5 anos melhora a leitura macro-demográfica, mas sacrifica a granularidade de idades exatas (como verificar isoladamente candidatos com 18 anos recém-completos no gráfico, visíveis apenas na tabela detalhada).

### 3.5 Coordenação Múltipla (CMV), Cores e Detalhes sob Demanda
* **Apresentação:** Um gerenciador de estado reativo (`store` em padrão *Pub/Sub*) sincroniza os seletores superiores, cliques nos gráficos, *chips* de filtros ativos, cinco cartões de KPIs no topo, a tabela paginada inferior (`detailsTable.js`) e um modal de inspeção das queries SQL, com suporte a Tema Claro e Escuro.
* **Justificativa:** Seguindo as diretrizes cromáticas da disciplina, restringiu-se a paleta categórica a poucas cores com semântica invariante em todo o sistema (azul = masculino, magenta = feminino, âmbar = item selecionado, verde/vermelho = status da cota), sobre superfícies neutras dessaturadas que evitam *chartjunk* e fadiga visual. A tabela paginada cumpre a etapa final de *details-on-demand* sem sobrecarregar o DOM com milhares de linhas simultâneas.
* **Trade-offs:** A arquitetura de múltiplas visões coordenadas maximiza o poder investigativo para cruzar dimensões simultâneas, mas impõe maior densidade informacional e exige telas largas (desktop/notebook) para que todos os painéis sejam comparados lado a lado sem rolagem vertical.

---

## 4. Análise Exploratória e Casos de Uso

1. **Ilusão Agregada da Cota de Gênero (Legislativo vs. Executivo):** Na visão global, o Brasil supera o piso de 30% de candidaturas femininas (atingindo 35,1% em 2026). Contudo, ao filtrar o cargo de **Governador** ou **Prefeito**, a taxa cai para menos de 18% e quase todos os partidos passam a exibir o marcador vermelho de sub-representação. A coordenação visual revela que as legendas cumprem formalmente a lei concentrando mulheres nas listas proporcionais legislativas, mantendo disputas majoritárias sob forte predominância masculina.
2. **Assimetria Regional de Raça/Cor:** Alternando o mapa para `% Pretos/Pardos` (*Viridis*) e clicando na **Bahia**, observa-se mais de 75% de candidaturas negras/indígenas; ao clicar no **Rio Grande do Sul**, o índice recua para cerca de 15% (com mais de 84% de candidatos brancos), evidenciando a aderência regional ao perfil demográfico local e permitindo testar rapidamente se essa proporção se sustenta nos cargos de maior prestígio.
3. **Evolução Histórica (2014–2026) e Funil Geracional:** A série temporal mostra avanço contínuo da participação feminina (de 31,0% em 2014 para 35,1% em 2026) e inflexão expressiva na autodeclaração de pretos, pardos e indígenas a partir de 2020 (superando 50%, em linha com a vinculação proporcional de recursos do FEFC). Já a seleção via `d3.brushX` do intervalo de **18 a 35 anos** mostra que jovens representam menos de 16% das candidaturas e concentram-se quase integralmente em vagas de Vereador e Deputado.

---

## 5. Discussão Final e Limites do Design

O desenvolvimento do painel confirma que a eficácia de um sistema de *Visual Analytics* depende do alinhamento estrito entre a estrutura dos dados (*What*), a intenção analítica (*Why*) e a codificação visual (*How*):
* Para **tendências longitudinais**, o gráfico de linhas contínuo com linha de referência de 30% evitou a fragmentação temporal que ocorreria em barras agrupadas por ano.
* Para **ranqueamento e comparação de magnitude**, barras horizontais alinhadas no zero eliminaram problemas de oclusão textual e a baixa acurácia angular de gráficos de setores.
* Para **exploração geográfica**, o mapa coroplético com escalas perceptualmente uniformes preveniu falsas fronteiras cromáticas e garantiu acessibilidade a daltônicos.

### Os Limites e Trade-offs do Design
As escolhas assumidas reforçam que toda visualização envolve compromissos conscientes:
* **Topologia espacial vs. precisão quantitativa:** O mapa preserva o contexto regional imediato, mas usa canais de cor (menos precisos que posição alinhada) e sofre distorção de área geográfica entre estados grandes e pequenos.
* **Agregação e *binning* vs. detalhe individual:** Discretizar idades em faixas de 5 anos e limitar o ranking aos 14 maiores partidos viabilizou leitura limpa sem *overplotting*, exigindo o uso combinado de filtros e da tabela paginada para inspecionar minorias estatísticas.
* **Escala focada vs. base zero na série temporal:** Ajustar o domínio vertical nas curvas percentuais destacou mudanças históricas sutis (em pontos percentuais), ao passo que nas barras manteve-se obrigatoriamente a origem em zero para não distorcer razões de comprimento.
* **Limitação semântica da base:** Os dados refletem o registro de candidaturas e autodeclarações estáticas do TSE, não capturando isoladamente a viabilidade financeira de campanha nem a conversão efetiva em candidatos eleitos.

O principal aprendizado prático consolidado neste projeto é que o rigor metodológico na transformação e na escolha de marcas e canais precede a complexidade estética. A integração entre o **DuckDB-Wasm** (processando 1,62 milhão de registros em menos de 30 ms diretamente no navegador) e o **D3.js** proporcionou controle granular sobre escalas, transições e *brushing*, convertendo uma base bruta extensa em um instrumento analítico conciso, transparente e fiel às capacidades perceptivas do usuário.
