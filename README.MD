# Projeto Grafos 2026.1

Dois grafos independentes:

- **Parte 1** — Malha aérea brasileira (20 aeroportos, grafo **não-direcionado**, peso = km).
- **Parte 2** — Mercado de transferências de futebol (~3.166 clubes, ~15.451 transferências, grafo **dirigido** ponderado em €).

Os algoritmos (`BFS`, `DFS`, `Dijkstra`, `Bellman-Ford`) ficam em [src/graphs/algorithms.py](src/graphs/algorithms.py) e são implementados **sem libs externas** (NetworkX/SciPy/etc.).

---

## Setup

```bash
python -m pip install -r requirements.txt
python -m pip install pytest          # se ainda não tiver
```

---

## Parte 1 — Malha aérea brasileira

Gera tudo de uma vez (métricas, gráficos PNG, arquivos HTML interativos):

```bash
python -m src.solve
```

Saídas em `out/`:
- `global.json`, `regioes.json`, `graus.csv`, `ego_aeroportos.csv`
- `distancias_rotas.csv` (5 rotas Dijkstra)
- `arvore_percurso.html`
- `grafo_interativo.html`
- `plot_01_barras_graus.png` … `plot_04_histograma_distancias.png`

### CLI individual (Parte 1)

```bash
python -m src.cli --dataset ./data/aeroportos_data.csv --alg BFS --source REC --out ./out/
python -m src.cli --dataset ./data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/
```

Resultado vai para `out/cli_<alg>_<source>_<target>.json` e também é impresso no terminal.

---

## Parte 2 — Mercado da bola

### Etapa A — Gerar o JSON do grafo para o front (React)

```bash
python -m src.build_transfers_graph
```

Lê `data/dataset_parte2/transferencias.csv`, filtra `transfer_fee > 0` e escreve `frontend/public/grafo.json` com ~17.458 arestas.

### Etapa B — Rodar o front React (Vite)

```bash
cd frontend
npm install        # primeira vez apenas
npm run dev        # abre em http://localhost:5173
```

Detalhes em [frontend/README.md](frontend/README.md).

### Etapa C — Benchmark dos algoritmos (relatório + visualizações)

```bash
python -m src.parte2          # gera out/parte2_report.json
python -m src.parte2_viz      # gera 4 PNGs em out/parte2_*.png
```

Saídas:
- `out/parte2_report.json` — estatísticas do grafo, tempo/memória por algoritmo, caminhos encontrados, casos com peso negativo e detecção de ciclo negativo.
- `out/parte2_hist_graus.png` — distribuição de in/out-degree.
- `out/parte2_tempos.png` — barras comparativas de tempo (BFS, DFS, Dijkstra, Bellman-Ford).
- `out/parte2_heatmap.png` — heatmap de custos Dijkstra entre top-12 clubes.
- `out/parte2_amostra_grafo.png` — amostra circular do grafo (top-25 por grau).

### CLI individual (Parte 2)

```bash
python -m src.cli --dataset ./data/dataset_parte2/ --alg DIJKSTRA --source Barcelona --target PSG --out ./out/
python -m src.cli --dataset ./data/dataset_parte2/ --alg BELLMAN --source Barcelona --target PSG --out ./out/
python -m src.cli --dataset ./data/dataset_parte2/ --alg BFS --source Liverpool --out ./out/
python -m src.cli --dataset ./data/dataset_parte2/ --alg DFS --source Liverpool --out ./out/
```

> O Dijkstra usa `transfer_fee` (sempre ≥ 0). O Bellman-Ford, quando rodado em variantes derivadas como `peso = fee - market_value`, pode encontrar pesos negativos e até ciclos negativos.

---

## Testes (pytest)

```bash
python -m pytest tests/ -v
```

24 testes cobrindo:
- **BFS** — níveis em grafo pequeno; caminho mínimo em arestas; respeito à direção em grafo dirigido.
- **DFS** — detecção de ciclo; classificação de arestas (tree/back/forward/cross); ordem discovery/finish.
- **Dijkstra** — caminhos corretos; **recusa peso negativo** (lança `NegativeWeightError`); flag `allow_negative` para uso interno.
- **Bellman-Ford** — pesos positivos (compat. Parte 1); pesos negativos sem ciclo; **detecção de ciclo negativo** com flag.

---

## Estrutura do código

```
src/
├── cli.py                       ← CLI unificada (Parte 1 e 2)
├── solve.py                     ← pipeline completo da Parte 1
├── parte2.py                    ← benchmark BFS/DFS/Dijk/BF da Parte 2
├── parte2_viz.py                ← PNGs comparativos da Parte 2
├── build_transfers_graph.py     ← CSV → JSON para o React
├── leagues.py                   ← mapeamento manual clube → liga
└── graphs/
    ├── graph.py                 ← Graph genérico (directed=True|False)
    ├── algorithms.py            ← BFS / DFS / Dijkstra / Bellman-Ford
    ├── io.py                    ← loader da Parte 1 (aeroportos)
    └── transfers_io.py          ← loader da Parte 2 (transferências)

tests/
├── test_bfs.py            (5)
├── test_dfs.py            (7)
├── test_dijkstra.py       (6)
└── test_bellman_ford.py   (6)

frontend/                        ← React + react-force-graph-2d (Parte 2)

out/                             ← saídas geradas
```
