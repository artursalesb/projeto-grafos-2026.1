# Projeto Grafos 2026.1

> **Requer Python 3.11+** e (para o bônus visual) Node.js 18+.
> Algoritmos (BFS, DFS, Dijkstra, Bellman-Ford) são **implementação própria**
> em [src/graphs/algorithms.py](src/graphs/algorithms.py) — nenhuma biblioteca
> externa (networkx/igraph/graph-tool) está envolvida na lógica de grafos.

Dois grafos independentes:

- **Parte 1** — Malha aérea brasileira (20 aeroportos, grafo **não-direcionado**, peso = km via Haversine).
- **Parte 2** — Mercado de transferências de futebol (~3.166 clubes, ~15.451 transferências, grafo **dirigido** ponderado em €).

---

## Setup

```bash
python -m pip install -r requirements.txt
```

`requirements.txt` instala apenas: `pandas` (I/O), `matplotlib` (gráficos),
`pyvis` (HTML interativo) e `pytest` (testes). Nenhuma lib de algoritmos.

---

## Parte 1 — Malha aérea brasileira

Pipeline completo (métricas, gráficos PNG, HTML interativo):

```bash
python -m src.solve
```

Saídas em `out/`:

| Arquivo | O que é |
|---|---|
| `global.json` | ordem, tamanho, densidade do grafo |
| `regioes.json` | métricas por região (Norte/NE/SE/S/CO) |
| `graus.csv` | grau de cada aeroporto |
| `ego_aeroportos.csv` | ego-network (ordem, tamanho, densidade) por aeroporto |
| `distancias_rotas.csv` | Dijkstra de 5 rotas (inclui **REC→POA** e **MAO→GRU** obrigatórias) |
| `arvore_percurso.html` | subgrafo dos caminhos obrigatórios em verde/azul |
| `grafo_interativo.html` | **HTML interativo** (tooltip, busca por IATA, botões de realce dos caminhos obrigatórios) |
| `plot_01..04_*.png` | 4 visualizações analíticas (barras, pizza, dispersão, histograma) |
| `notas_analiticas.md` | classificação exploratórias/explanatórias + interpretação |

### Benchmark dos algoritmos sobre o grafo de aeroportos

Roda BFS / DFS / Dijkstra / Bellman-Ford **100 vezes cada** no mesmo par
REC→POA, mede tempo médio + nós visitados + arestas percorridas e produz
relatório técnico com discussão crítica:

```bash
python benchmark_algorithms.py
```

Saídas adicionais em `out/`:

| Arquivo | O que é |
|---|---|
| `benchmark.csv` | tabela com tempo médio, nós visitados, arestas percorridas |
| `benchmark_barras.png` | comparação de tempo médio (barras) |
| `benchmark_linhas.png` | 3 métricas em eixos paralelos (tempo, nós, arestas) |
| `benchmark_relatorio.md` | metodologia, interpretação, tabela de complexidade, conclusões |
| `limitacoes_visualizacao.md` | discussão crítica AVD (escalabilidade, força-direcionada, densidade, alternativas) |

### CLI individual (Parte 1)

```bash
python -m src.cli --dataset ./data/aeroportos_data.csv --alg BFS      --source REC --out ./out/
python -m src.cli --dataset ./data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/
python -m src.cli --dataset ./data/aeroportos_data.csv --alg BELLMAN  --source MAO --target GRU --out ./out/
```

---

## Parte 2 — Mercado da bola (dataset maior)

Dataset não-aéreo (cumpre a restrição do PDF), |V|=3.166, |E|=15.451 (< 200k).

### Backend — benchmark dos 4 algoritmos

```bash
python -m src.build_transfers_graph   # CSV → frontend/public/grafo.json
python -m src.parte2                  # ~1,5 min (Bellman-Ford é O(V·E))
python -m src.parte2_viz              # 4 PNGs comparativos
```

Saídas em `out/`:

| Arquivo | O que é |
|---|---|
| `parte2_report.json` | estatísticas do grafo, BFS/DFS de 3 fontes, Dijkstra de 5 pares, 4 casos de Bellman-Ford (incluindo ciclo negativo detectado), tempo + memória |
| `parte2_hist_graus.png` | distribuição de in/out-degree (log) |
| `parte2_tempos.png` | barras comparando tempo dos 4 algoritmos |
| `parte2_heatmap.png` | heatmap de custos Dijkstra entre top-12 clubes |
| `parte2_amostra_grafo.png` | amostra circular do grafo (top-25 por grau) |

### Frontend React (bônus visual/UX)

Visualização interativa do grafo das 17 mil transferências sobre um campo
de futebol em SVG, com bolas como nós, setas direcionadas com gradiente
vermelho→verde, filtros por liga e valor mínimo, busca por clube/jogador,
modo foco (isola ego-network), modal de aresta clicável e sidebar
recolhível.

```bash
cd frontend
npm install        # primeira vez apenas
npm run dev        # abre em http://localhost:5173
```

Detalhes em [frontend/README.md](frontend/README.md).

### CLI individual (Parte 2)

```bash
python -m src.cli --dataset ./data/dataset_parte2/ --alg DIJKSTRA --source Barcelona --target PSG --out ./out/
python -m src.cli --dataset ./data/dataset_parte2/ --alg BELLMAN  --source Barcelona --target PSG --out ./out/
python -m src.cli --dataset ./data/dataset_parte2/ --alg BFS      --source Liverpool --out ./out/
python -m src.cli --dataset ./data/dataset_parte2/ --alg DFS      --source Liverpool --out ./out/
```

> Dijkstra usa `transfer_fee` (sempre ≥ 0) e **recusa peso negativo** com
> `NegativeWeightError`. Bellman-Ford, quando rodado em variantes derivadas
> como `peso = fee − market_value`, encontra pesos negativos e detecta
> ciclos negativos.

---

## Testes (pytest)

```bash
python -m pytest tests/ -v
```

24 testes:

- **BFS** — níveis em grafo pequeno, caminho mínimo em arestas, direção respeitada em grafo dirigido.
- **DFS** — detecção de ciclo, classificação de arestas (tree/back/forward/cross), ordem discovery/finish.
- **Dijkstra** — caminhos corretos, **recusa peso negativo** (`NegativeWeightError`).
- **Bellman-Ford** — pesos positivos, pesos negativos sem ciclo, **detecção de ciclo negativo** (flag).

---

## Estrutura do projeto

```
projeto-grafos-2026.1/
├── README.md                ← este arquivo
├── requirements.txt
├── data/
│   ├── aeroportos_data.csv          (fornecido)
│   ├── adjacencias_aeroportos.csv   (gerado pela Parte 1)
│   ├── rotas.csv                    (Parte 1, ≥ 5 pares)
│   └── dataset_parte2/
│       └── transferencias.csv       (dataset maior, Parte 2)
├── out/                     ← todas as saídas (.json/.csv/.html/.png/.md)
├── src/
│   ├── cli.py               ← CLI unificada (Parte 1 e 2)
│   ├── solve.py             ← pipeline completo da Parte 1
│   ├── viz.py               ← visualizações da Parte 1 (PNGs + HTML interativo)
│   ├── parte2.py            ← benchmark BFS/DFS/Dijk/BF da Parte 2
│   ├── parte2_viz.py        ← PNGs comparativos da Parte 2
│   ├── build_transfers_graph.py  ← CSV → JSON para o React
│   ├── leagues.py           ← mapeamento manual clube → liga
│   └── graphs/
│       ├── graph.py         ← Graph genérico (directed=True|False)
│       ├── algorithms.py    ← BFS / DFS / Dijkstra / Bellman-Ford
│       ├── io.py            ← loader da Parte 1 (aeroportos)
│       └── transfers_io.py  ← loader da Parte 2 (transferências)
├── tests/
│   ├── test_bfs.py            (5)
│   ├── test_dfs.py            (7)
│   ├── test_dijkstra.py       (6)
│   └── test_bellman_ford.py   (6)
├── benchmark_algorithms.py  ← benchmark 100x dos algoritmos sobre o grafo da Parte 1
└── frontend/                ← React + react-force-graph-2d (Parte 2, bônus UX)
```
