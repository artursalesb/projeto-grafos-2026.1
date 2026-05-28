# Notas Analíticas — Visualizações do Projeto

Este documento acompanha as visualizações geradas em `out/`. Cada nota segue
o esquema pedido no PDF: **o que mostra → insight → por que esse tipo de
gráfico**. As 8 visualizações (4 da Parte 1 + 4 da Parte 2) estão
classificadas como **exploratórias** (entender o comportamento dos dados) ou
**explanatórias** (comunicar uma mensagem clara para quem não conhece o
projeto).

---

## Parte 1 — Malha aérea brasileira

Grafo não-direcionado, **|V| = 20**, **|E| = 77**, densidade **0,4053**.
Construído com a regra: cada aeroporto regional se liga ao(s) hub(s) da sua
região; todos os hubs se ligam entre si (intra-região e inter-região). Peso
da aresta = distância em km (Haversine).

### 1. `plot_01_barras_graus.png` — Ranking dos 10 mais conectados *(EXPLANATÓRIA)*

- **O que mostra:** barras horizontais ordenadas com os 10 aeroportos de
  maior grau. REC, SSA e FOR aparecem empatados no topo com grau 13.
- **Insight:** o **Nordeste concentra os hubs mais conectados** da malha
  modelada. Como o grupo definiu 3 hubs no Nordeste (REC, SSA, FOR), cada um
  herda conexões com todos os regionais da região + todos os outros hubs do
  país, somando 13 vizinhos. GRU/GIG/CNF (Sudeste) ficam logo atrás com 12.
- **Por que barra horizontal ordenada:** comparar magnitudes de uma única
  variável categórica é o caso clássico de barras; a versão horizontal
  facilita ler os rótulos longos sem rotação.

### 2. `plot_02_pizza_regioes.png` — Proporção de aeroportos por região *(EXPLANATÓRIA)*

- **O que mostra:** participação relativa das 5 regiões no total de 20 nós.
  Nordeste = 30 %, Norte = 20 %, Sudeste = 25 %, Sul = 15 %, Centro-Oeste = 10 %.
- **Insight:** a malha modelada **não é uniforme regionalmente** — Nordeste
  e Sudeste juntas têm > 50 % dos aeroportos, refletindo a concentração real
  da aviação comercial brasileira nessas regiões.
- **Por que pizza:** quando o conjunto tem ≤ 6 categorias e a pergunta é
  "como o todo se divide", pizza comunica a proporção de forma imediata. Se
  fossem dezenas de regiões, barras seriam melhores.

### 3. `plot_03_dispersao_rede.png` — Grau × densidade ego-network *(EXPLORATÓRIA)*

- **O que mostra:** cada ponto é um aeroporto; eixo X = grau, eixo Y =
  densidade da sua ego-network.
- **Insight:** existe uma **anticorrelação visível** — quem tem grau muito
  alto (hubs) tende a ter ego-density mais baixa, porque seus vizinhos não
  necessariamente se conectam entre si. Já aeroportos regionais com poucos
  vizinhos formam clusters densos.
- **Por que dispersão:** estamos investigando a relação entre duas variáveis
  contínuas sem saber a priori se há padrão — exatamente o caso para
  *scatter plot*.

### 4. `plot_04_histograma_distancias.png` — Distribuição das distâncias dos voos *(EXPLORATÓRIA)*

- **O que mostra:** histograma das 77 distâncias (em km) das arestas do grafo.
- **Insight:** a distribuição é **bimodal** — há uma concentração de
  conexões curtas (regionais aos hubs locais, < 500 km) e outra de conexões
  longas (entre hubs de regiões distantes, > 1 500 km). Quase nada na faixa
  intermediária.
- **Por que histograma:** queremos ver a forma da distribuição de uma
  variável contínua. Histograma é o gráfico padrão para isso.

### Resumo das métricas usadas (para o PDF do grupo)

| | Ordem | Tamanho | Densidade |
|---|---|---|---|
| **Grafo completo** | 20 | 77 | 0,4053 |
| Nordeste | 6 | 12 | 0,80 |
| Sudeste | 5 | 9 | 0,90 |
| Centro-Oeste | 2 | 1 | 1,00 |
| Sul | 3 | 3 | 1,00 |
| Norte | 4 | 5 | 0,83 |

**Mais conectado:** REC, SSA, FOR (grau 13, empate).
**Maior densidade ego-network:** REC (0,7033), empate com SSA e FOR.

---

## Parte 2 — Mercado de transferências de futebol

Grafo dirigido ponderado, **|V| = 3 166**, **|E| = 15 451**, densidade
**0,0015** (esparso). Peso = `transfer_fee` em €.

### 5. `parte2_hist_graus.png` — Distribuição de in/out-degree *(EXPLORATÓRIA)*

- **O que mostra:** dois histogramas lado a lado (eixo Y em escala log) com
  o número de transferências de saída (vendas) e de entrada (compras) por
  clube.
- **Insight:** distribuição **power-law clara** (típica de redes do mundo
  real) — a maioria dos clubes participa de < 5 transferências, enquanto
  uma minoria (Benfica, Chelsea, Inter, Stade Rennais, etc.) concentra
  acima de 100. O log na vertical é o que permite enxergar a cauda longa.
- **Por que histograma + log:** distribuições com escala muito assimétrica
  só ficam legíveis com eixo logarítmico.

### 6. `parte2_tempos.png` — Tempo por algoritmo/cenário *(EXPLANATÓRIA)*

- **O que mostra:** barras horizontais em escala log com o tempo (ms) de
  cada execução de BFS, DFS, Dijkstra e Bellman-Ford realizada no benchmark.
- **Insight:** **Bellman-Ford no grafo inteiro custa ~90 000 ms (90 s)**
  contra ~25 ms do Dijkstra para o mesmo dataset — confirma na prática a
  complexidade O(V·E) vs O((V+E) log V). BFS/DFS ficam abaixo de 25 ms.
- **Por que barras horizontais + log:** comparação direta entre execuções
  heterogêneas; escala log torna comparáveis valores que diferem em ordens
  de grandeza.

### 7. `parte2_heatmap.png` — Custo Dijkstra entre top-12 clubes *(EXPLANATÓRIA)*

- **O que mostra:** matriz 12×12 com o custo (em M€) do caminho mais barato
  via Dijkstra entre os 12 clubes de maior grau. Quanto mais escuro,
  maior o custo. `∞` = sem caminho dirigido.
- **Insight:** revela **assimetrias do mercado** — por exemplo,
  Benfica→Chelsea costuma ser barato (Benfica vende, vários hops),
  enquanto Chelsea→Benfica pode aparecer mais caro ou inalcançável,
  porque o grafo é dirigido (compras geralmente vão dos vendedores para
  os "big spenders").
- **Por que heatmap:** matriz quadrada de valores numéricos é o caso
  canônico de heatmap; cor codifica magnitude sem ocupar espaço extra.

### 8. `parte2_amostra_grafo.png` — Amostra circular dos top-25 clubes *(EXPLORATÓRIA)*

- **O que mostra:** 25 clubes de maior grau dispostos em círculo, com as
  arestas dirigidas (cor laranja) que existem **entre eles**.
- **Insight:** evidencia o **subgrafo denso entre big clubs europeus** —
  Benfica, Porto, Chelsea, Inter e Juventus aparecem como nós com muitas
  conexões mútuas, confirmando que o mercado da elite é altamente
  interconectado.
- **Por que layout circular:** com 25 nós e foco em mostrar conexões,
  o layout circular elimina ambiguidade visual de posicionamento
  (force-directed em 25 nós ficaria caótico) e permite leitura limpa.

---

## Como esses gráficos atendem ao requisito do PDF

| Requisito do PDF | Cobertura |
|---|---|
| Parte 1, Seção 8: "no mínimo 4 visualizações analíticas" | `plot_01..04.png` |
| Parte 1, Seção 10: "2 exploratórias + 2 explanatórias" | exploratórias: `plot_03`, `plot_04`; explanatórias: `plot_01`, `plot_02` |
| Parte 2, item 4: "pelo menos uma visualização" | 4 entregues (`parte2_*.png`) |
| Parte 2, item 6: "comparação entre algoritmos" | `parte2_tempos.png` |
| "Título, legenda e eixos em todas" | atendido em todas as figuras |
| "Não usar gráfico sem justificativa" | cada figura tem nota analítica acima |
