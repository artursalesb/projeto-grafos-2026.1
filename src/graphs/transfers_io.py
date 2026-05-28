"""
Loader do dataset de transferências (Parte 2) como grafo DIRIGIDO ponderado.

- Vértice = clube
- Aresta  = transferência (com fee > 0); guarda 'peso' (= transfer_fee),
            'jogador', 'data', 'temporada', 'market_value', 'peso_lucro'.
- 'peso_lucro' = transfer_fee - market_value_in_eur (pode ser negativo).
  É a métrica usada nos casos de Bellman-Ford com pesos negativos.
"""
import csv
import os

from src.graphs.graph import Graph

DEFAULT_CSV = "data/dataset_parte2/transferencias.csv"


def load_transfers_graph(path: str = DEFAULT_CSV, only_positive_fee: bool = True) -> Graph:
    """
    Carrega o CSV e devolve um Graph dirigido.
    Por padrão, filtra apenas transferências com transfer_fee > 0
    (são as ~17.458 transferências relevantes do dataset).

    Quando há múltiplas transferências entre o mesmo par (u, v), mantemos
    a de MAIOR fee (vai ser a 'aresta canônica' para Dijkstra). Os dados das
    demais ficam acumulados em edge_data['extras'] para o tooltip do React e
    podem ser inspecionados, mas para algoritmos de caminho só conta a
    canônica — convenção de "grafo simples ponderado".
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Dataset não encontrado: {path}")

    g = Graph(directed=True)

    with open(path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                fee = float(row.get("transfer_fee") or 0)
            except (ValueError, TypeError):
                fee = 0.0

            if only_positive_fee and fee <= 0:
                continue

            src = row.get("from_club_name") or "Desconhecido"
            tgt = row.get("to_club_name") or "Desconhecido"

            try:
                market = float(row.get("market_value_in_eur") or 0) or None
            except (ValueError, TypeError):
                market = None

            jogador = row.get("player_name") or ""
            temporada = row.get("transfer_season") or ""
            data = row.get("transfer_date") or ""

            peso_lucro = fee - market if market is not None else fee

            # Adiciona/atualiza aresta. Se já existir, mantém a de maior fee.
            existente = g.adj.get(src, {}).get(tgt)
            if existente is None or fee > existente["peso"]:
                g.add_edge(
                    src,
                    tgt,
                    peso=fee,
                    jogador=jogador,
                    temporada=temporada,
                    data=data,
                    market_value=market,
                    peso_lucro=peso_lucro,
                )

    return g


def graph_stats(g: Graph) -> dict:
    """Estatísticas para o report.json: |V|, |E|, densidade, distribuição de graus."""
    out_deg = [g.get_out_degree(n) for n in g.get_nodes()]
    in_deg = [g.get_in_degree(n) for n in g.get_nodes()]
    weights = [w for _, _, w, _ in g.iter_edges()]

    def hist(arr, edges):
        h = [0] * (len(edges) - 1)
        for x in arr:
            for i in range(len(edges) - 1):
                if edges[i] <= x < edges[i + 1]:
                    h[i] += 1
                    break
            else:
                if x >= edges[-1]:
                    h[-1] += 1
        return h

    deg_edges = [0, 1, 2, 5, 10, 25, 50, 100, 250, 1000]
    return {
        "directed": g.directed,
        "weighted": True,
        "num_vertices": g.get_order(),
        "num_edges": g.get_size(),
        "density": round(g.get_density(), 6),
        "out_degree": {
            "min": min(out_deg) if out_deg else 0,
            "max": max(out_deg) if out_deg else 0,
            "mean": round(sum(out_deg) / len(out_deg), 3) if out_deg else 0,
            "hist_edges": deg_edges,
            "hist_counts": hist(out_deg, deg_edges),
        },
        "in_degree": {
            "min": min(in_deg) if in_deg else 0,
            "max": max(in_deg) if in_deg else 0,
            "mean": round(sum(in_deg) / len(in_deg), 3) if in_deg else 0,
            "hist_edges": deg_edges,
            "hist_counts": hist(in_deg, deg_edges),
        },
        "weights": {
            "min": min(weights) if weights else 0,
            "max": max(weights) if weights else 0,
            "mean": round(sum(weights) / len(weights), 2) if weights else 0,
            "total": round(sum(weights), 2) if weights else 0,
        },
    }
