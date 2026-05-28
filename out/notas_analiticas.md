# Notas Analíticas — Visualizações do Projeto

Este documento acompanha as visualizações geradas em `out/`. Cada nota segue
o esquema pedido no PDF: **o que mostra → insight → por que esse tipo de
gráfico**. As visualizações estão classificadas como **exploratórias**
(entender o comportamento dos dados) ou **explanatórias** (comunicar uma
mensagem clara para quem não conhece o projeto).

---

## Parte 1 — Malha aérea brasileira

Grafo não-direcionado, **|V| = 20**, **|E| = 77**, densidade **0,4053**.
Construído com a regra: cada aeroporto regional se liga ao(s) hub(s) da sua
região; todos os hubs se ligam entre si (intra e inter-região). Peso
da aresta = distância geodésica em km (Haversine).

### 1. `plot_01_barras_graus.png` — Ranking dos 10 mais conectados *(EXPLANATÓRIA)*

- **O que mostra:** barras horizontais ordenadas por grau. Cores por região
  (Gestalt: Similaridade — mesma cor = mesma região).
  REC, SSA e FOR estão empatados no topo com grau 13.
- **Insight:** o **Nordeste concentra os hubs mais conectados** da malha.
  Os 3 hubs nordestinos (REC, SSA, FOR) herdam conexões com todos os
  regionais da região + todos os hubs do país = 13 vizinhos cada.
  GRU/GIG/CNF (Sudeste) ficam logo atrás com grau 12.
  GYN destaca-se como vulnerável: grau 1, único aeroporto com apenas
  uma conexão — risco de isolamento se essa rota for cancelada.
- **Por que barra horizontal ordenada:** comparar magnitudes de variável
  categórica. Horizontal facilita ler rótulos. Cores por região aplicam
  Gestalt (Similaridade) diretamente na visualização.

### 2. `plot_02_barras_regioes.png` — Distribuição regional *(EXPLANATÓRIA)*

> ⚠️ **Este gráfico substituiu o antigo gráfico de pizza.**
> Razão: o olho humano é ruim em comparar ângulos de fatias similares.
> Com 5 regiões de proporções parecidas (10–30%), as diferenças eram
> quase invisíveis sem os rótulos percentuais. Barras horizontais são
> mais precisas para essa comparação (princípio de comparabilidade de AVD).

- **O que mostra:** dois painéis lado a lado — (a) número de aeroportos
  por região; (b) densidade intra-regional do subgrafo.
- **Insight:** Centro-Oeste e Sul têm densidade 1,0 (subgrafos completos),
  pois têm poucos hubs muito conectados entre si. O Nordeste, apesar de
  ter mais aeroportos (6), tem densidade 0,8 — há aeroportos regionais
  com conexões parciais.
- **Por que dois painéis:** volume e densidade são métricas distintas que,
  juntas, contam a história completa do subgrafo regional.

### 3. `plot_03_dispersao_rede.png` — Grau × densidade ego-network *(EXPLORATÓRIA)*

- **O que mostra:** cada ponto é um aeroporto; eixo X = grau, eixo Y =
  densidade da ego-network. Cores por região (Gestalt: Similaridade).
- **Insight:** **anticorrelação visível** — hubs com alto grau têm ego-density
  mais baixa porque seus muitos vizinhos não se conectam entre si.
  Aeroportos regionais com poucos vizinhos formam clusters densos (ego-density = 1,0).
  Anotação no gráfico aponta o cluster dos hubs nordestinos.
- **Por que scatter:** investigar relação entre duas variáveis contínuas
  sem hipótese prévia — caso clássico de gráfico de dispersão.

### 4. `plot_04_histograma_distancias.png` — Distribuição das distâncias *(EXPLORATÓRIA)*

- **O que mostra:** histograma das 77 distâncias das arestas. Bins abaixo
  de 1 000 km em verde (regionais), acima em laranja (nacionais).
- **Insight:** distribuição **bimodal** — concentração de conexões curtas
  (regionais aos hubs locais, < 500 km) e de conexões longas (entre hubs
  de regiões distantes, > 1 500 km). Quase nada na faixa intermediária.
  Isso reflete a arquitetura hub-and-spoke da modelagem.
- **Por que histograma:** forma da distribuição de variável contínua.
  A bimodalidade só fica clara com histograma, não com medidas resumo.

### 5. `plot_05_histograma_graus.png` — Distribuição de graus com destaque de hubs *(EXPLORATÓRIA)*

> ✅ **Gráfico novo — atende ao requisito de histograma com Lei da Proximidade.**

- **O que mostra:** histograma dos graus de todos os 20 aeroportos, com
  barras sobrepostas distinguindo hubs (vermelho) de regionais (cinza).
- **Insight:** há dois clusters bem separados — regionais com grau 1–3 e
  hubs com grau 11–13. Isso evidencia a topologia hub-and-spoke e aplica
  a **Lei da Proximidade de Gestalt**: aeroportos com graus similares
  ficam agrupados visualmente, tornando imediata a percepção de que
  existem exatamente dois "mundos" na rede.
- **Por que histograma com sobreposição:** mostrar a distribuição e ao mesmo
  tempo a separação de grupos — mais informativo que dois histogramas
  separados ou uma tabela de frequências.

---

### Benchmark: `benchmark_barras.png` e `benchmark_linhas.png`

> ✅ **Re-gerados com escala logarítmica no eixo de tempo.**
> Razão: em escala linear, Bellman-Ford domina a escala e as barras
> de BFS/DFS ficam comprimidas a ponto de serem indistinguíveis.
> Com escala log, cada algoritmo é comparável visualmente, mesmo
> com diferença de ~8× entre o mais rápido e o mais lento.

| Algoritmo    | Tempo (ms) | Interpretação                         |
|--------------|-----------|---------------------------------------|
| DFS          | 0,107     | Mais rápido; não garante caminho mínimo |
| BFS          | 0,261     | Garante menor nº de saltos             |
| Dijkstra     | 0,497     | Caminho mínimo ponderado; ideal aqui   |
| Bellman-Ford | 0,837     | ≈ 7,9× mais lento que DFS; não justificado para este grafo |

**Insight AVD:** a escala log permite identificar *imediatamente* a
ineficiência relativa do Bellman-Ford sem que as diferenças entre os
demais algoritmos sejam perdidas.

---

### Resumo das métricas (para o PDF do grupo)

| | Ordem | Tamanho | Densidade |
|---|---|---|---|
| **Grafo completo** | 20 | 77 | 0,4053 |
| Nordeste | 6 | 12 | 0,80 |
| Sudeste | 5 | 9 | 0,90 |
| Centro-Oeste | 2 | 1 | 1,00 |
| Sul | 3 | 3 | 1,00 |
| Norte | 4 | 5 | 0,83 |

**Aeroporto mais vulnerável:** GYN (grau 1 — isolamento se a única
rota for cancelada).
**Hubs mais conectados:** REC, SSA, FOR (grau 13 — empate).
**Rota mais longa:** PVH → MAO → CWB → FLN (3 765 km, 3 escalas).

---

## Parte 2 — Mercado de transferências de futebol

Grafo dirigido ponderado, **|V| = 3 166**, **|E| = 15 451**, densidade
**0,0015** (esparso). Peso = `transfer_fee` em €.

### 6. `parte2_hist_graus.png` — Distribuição de in/out-degree *(EXPLORATÓRIA)*

- **O que mostra:** dois histogramas (eixo Y em escala log) com o número
  de transferências de saída (vendas) e de entrada (compras) por clube.
- **Insight:** distribuição **power-law** (típica de redes do mundo real).
  A maioria dos clubes participa de < 5 transferências, enquanto
  Benfica, Chelsea e Stade Rennais concentram acima de 50.
  O eixo log é necessário para enxergar a cauda longa.
- **Por que histograma + log:** distribuições com grande assimetria só ficam
  legíveis com eixo logarítmico.

### 7. `parte2_tempos.png` — Tempo por algoritmo/cenário *(EXPLANATÓRIA)*

- **O que mostra:** barras horizontais em escala log com o tempo (ms) de
  cada execução realizada no benchmark da Parte 2.
- **Insight:** Bellman-Ford no grafo inteiro custa ~90 000 ms (90 s) contra
  ~25 ms do Dijkstra — confirma O(V·E) vs O((V+E) log V) na prática.
- **Por que barras horizontais + log:** comparação entre execuções
  heterogêneas; escala log torna comparáveis valores que diferem em
  ordens de grandeza.

### 8. `parte2_heatmap.png` — Custo Dijkstra entre top-12 clubes *(EXPLANATÓRIA)*

- **O que mostra:** matriz 12×12 com custo (M€) do caminho mais barato
  via Dijkstra entre os 12 clubes de maior grau. `∞` = sem caminho dirigido.
- **Insight:** revela **assimetrias do mercado** — o grafo é dirigido
  (compras vão de vendedores para big spenders), então Benfica→Chelsea
  pode ser barato mas Chelsea→Benfica pode ser inalcançável.
- **Por que heatmap:** matriz quadrada de valores numéricos — caso canônico
  de heatmap.

### 9. `parte2_amostra_grafo.png` — Top-25 clubes (layout circular) *(EXPLORATÓRIA)*

- **O que mostra:** 25 clubes de maior grau dispostos em círculo com
  arestas dirigidas entre eles.
- **Insight:** subgrafo denso entre Benfica, Porto, Chelsea, Inter e
  Juventus confirma que o mercado da elite europeia é altamente
  interconectado.
- **Por que layout circular:** com 25 nós, force-directed ficaria caótico.
  Circular elimina ambiguidade de posicionamento.

### `grafo_top20_futebol.html` — Grafo interativo do Mercado da Bola *(INTERATIVO)*

> ✅ **Atualizado com Gestalt aplicado explicitamente:**

- **Gestalt Similaridade:** cada liga recebe uma cor distinta
  (Premier League = vermelho, La Liga = laranja, Serie A = azul etc.).
  Clubes da mesma liga são percebidos instantaneamente como um grupo.
- **Gestalt Conectividade:** espessura da aresta proporcional ao valor
  total das transferências (escala log). Uma aresta grossa entre dois
  clubes sinaliza imediatamente que aquela relação comercial vale mais.
- **Hierarquia Visual:** tamanho do nó uniforme (30px) para não
  distorcer a percepção de importância com base em grau — o valor está
  na aresta, não no nó.
- **Funcionalidades UX:** busca por clube OU por nome de jogador, destaque
  com desbotamento dos demais, zoom animado, legenda por liga.

---

## Como esses gráficos atendem ao requisito do PDF

| Requisito do PDF | Cobertura |
|---|---|
| "Mínimo 4 visualizações analíticas" (Parte 1) | `plot_01..05.png` (5 visualizações) |
| "2 exploratórias + 2 explanatórias" | Exploratórias: `plot_03`, `plot_04`, `plot_05`; Explanatórias: `plot_01`, `plot_02` |
| "Histograma de graus com Lei da Proximidade" | `plot_05_histograma_graus.png` ✅ |
| "Escala log no benchmark" | `benchmark_barras.png`, `benchmark_linhas.png` ✅ |
| "Gráfico de barras em vez de pizza" | `plot_02_barras_regioes.png` ✅ |
| "Pelo menos 1 visualização na Parte 2" | 4 PNGs + 1 HTML interativo |
| "Comparação entre algoritmos" | `parte2_tempos.png` |
| "Gestalt aplicado explicitamente" | Similaridade (cores/região/liga) + Conectividade (espessura) + Figura-Fundo (fundo escuro) |
| "Título, legenda e eixos em todas" | Atendido em todas as figuras |
| "Não usar gráfico sem justificativa" | Cada figura tem nota analítica neste documento |
