# Projeto Grafos 2026.1

## Parte 1 — Malha aérea brasileira

Para gerar todos os resultados da Parte 1:

```bash
python -m src.solve
```

Saídas em `out/` (métricas JSON/CSV, gráficos PNG, `grafo_interativo.html`).

## Parte 2 — Mercado da bola (React)

Grafo de ~17.000 transferências reais (filtro `transfer_fee > 0`) entre
~3.166 clubes de futebol, renderizado em React + `react-force-graph-2d`
sobre fundo de campo SVG. Cada aresta é clicável e mostra jogador + valor.

### 1. Gerar os dados

```bash
python src/build_transfers_graph.py
```

Lê `data/dataset_parte2/transferencias.csv` e escreve `frontend/public/grafo.json`.

### 2. Subir o app React

```bash
cd frontend
npm install        # primeira vez apenas
npm run dev        # http://localhost:5173
```

Veja [frontend/README.md](frontend/README.md) para detalhes da arquitetura.
