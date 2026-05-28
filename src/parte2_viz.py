"""
Visualizações da Parte 2 (PNGs em out/).
Lê out/parte2_report.json e o grafo carregado, e gera 4 figuras:
  out/parte2_hist_graus.png     ← distribuição de in/out-degree (log)
  out/parte2_tempos.png         ← barras de tempo BFS/DFS/Dijkstra/BF
  out/parte2_heatmap.png        ← heatmap de distâncias entre top clubes
  out/parte2_amostra_grafo.png  ← amostra do grafo (top-N por grau)
"""
import json
import os

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

from src.graphs.transfers_io import load_transfers_graph
from src.graphs.algorithms import dijkstra

OUT_DIR = "out"
REPORT = os.path.join(OUT_DIR, "parte2_report.json")


def _load_report():
    with open(REPORT, "r", encoding="utf-8") as f:
        return json.load(f)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Histograma de graus
# ─────────────────────────────────────────────────────────────────────────────

def plot_hist_graus(g):
    out_d = [g.get_out_degree(n) for n in g.get_nodes()]
    in_d = [g.get_in_degree(n) for n in g.get_nodes()]

    fig, axs = plt.subplots(1, 2, figsize=(12, 5))

    axs[0].hist(out_d, bins=50, color="#ff6b6b", edgecolor="black", alpha=0.85)
    axs[0].set_yscale("log")
    axs[0].set_title("Distribuição do grau de SAÍDA (clube vendedor)")
    axs[0].set_xlabel("Out-degree (transferências vendidas)")
    axs[0].set_ylabel("Nº de clubes (log)")
    axs[0].grid(axis="y", linestyle="--", alpha=0.5)

    axs[1].hist(in_d, bins=50, color="#4cd964", edgecolor="black", alpha=0.85)
    axs[1].set_yscale("log")
    axs[1].set_title("Distribuição do grau de ENTRADA (clube comprador)")
    axs[1].set_xlabel("In-degree (transferências compradas)")
    axs[1].set_ylabel("Nº de clubes (log)")
    axs[1].grid(axis="y", linestyle="--", alpha=0.5)

    plt.suptitle("Parte 2 — Distribuição de graus do grafo dirigido", fontsize=14)
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "parte2_hist_graus.png"), bbox_inches="tight", dpi=110)
    plt.close()


# ─────────────────────────────────────────────────────────────────────────────
# 2. Comparação de tempos
# ─────────────────────────────────────────────────────────────────────────────

def plot_tempos(report):
    algos, tempos, colors = [], [], []

    for r in report["bfs_dfs"]["bfs"]:
        algos.append(f"BFS({r['source'][:8]})")
        tempos.append(r["time_ms"])
        colors.append("#3498db")
    for r in report["bfs_dfs"]["dfs"]:
        algos.append(f"DFS({r['source'][:8]})")
        tempos.append(r["time_ms"])
        colors.append("#9b59b6")
    for p in report["dijkstra"]["pairs"]:
        if p.get("skipped"):
            continue
        algos.append(f"Dijk({p['source'][:6]}→{p['target'][:6]})")
        tempos.append(p["time_ms"])
        colors.append("#f39c12")
    for c in report["bellman_ford"]["cases"]:
        nome_curto = c["name"][:24] + ("…" if len(c["name"]) > 24 else "")
        algos.append(f"BF: {nome_curto}")
        tempos.append(c["time_ms"])
        colors.append("#e74c3c")

    fig, ax = plt.subplots(figsize=(13, max(6, 0.32 * len(algos))))
    bars = ax.barh(algos, tempos, color=colors, edgecolor="black", alpha=0.88)
    ax.set_xscale("log")
    ax.set_xlabel("Tempo (ms, escala log)")
    ax.set_title("Parte 2 — Tempo de execução por algoritmo / cenário")
    ax.grid(axis="x", linestyle="--", alpha=0.5)
    for bar, t in zip(bars, tempos):
        ax.text(bar.get_width() * 1.05, bar.get_y() + bar.get_height() / 2,
                f"{t:.2f} ms", va="center", fontsize=9)
    legend = [
        mpatches.Patch(color="#3498db", label="BFS"),
        mpatches.Patch(color="#9b59b6", label="DFS"),
        mpatches.Patch(color="#f39c12", label="Dijkstra"),
        mpatches.Patch(color="#e74c3c", label="Bellman-Ford"),
    ]
    ax.legend(handles=legend, loc="lower right")
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "parte2_tempos.png"), bbox_inches="tight", dpi=110)
    plt.close()


# ─────────────────────────────────────────────────────────────────────────────
# 3. Heatmap de distâncias (Dijkstra) entre top-N clubes
# ─────────────────────────────────────────────────────────────────────────────

def plot_heatmap_distancias(g, n: int = 12):
    top = sorted(g.get_nodes(), key=lambda x: g.get_degree(x), reverse=True)[:n]
    mat = [[0.0] * n for _ in range(n)]
    INF_DISPLAY = -1.0
    for i, s in enumerate(top):
        for j, t in enumerate(top):
            if i == j:
                mat[i][j] = 0
                continue
            custo, _, _, _ = dijkstra(g, s, t)
            if custo == float("inf"):
                mat[i][j] = INF_DISPLAY
            else:
                mat[i][j] = custo / 1e6  # em milhões de €

    fig, ax = plt.subplots(figsize=(10, 9))
    finite = [v for row in mat for v in row if v > 0]
    vmax = max(finite) if finite else 1
    img_data = [[(v if v >= 0 else float("nan")) for v in row] for row in mat]
    im = ax.imshow(img_data, cmap="YlOrRd", vmin=0, vmax=vmax, aspect="auto")

    ax.set_xticks(range(n)); ax.set_yticks(range(n))
    ax.set_xticklabels(top, rotation=45, ha="right", fontsize=9)
    ax.set_yticklabels(top, fontsize=9)
    ax.set_xlabel("Destino")
    ax.set_ylabel("Origem")
    ax.set_title(f"Parte 2 — Heatmap de custo Dijkstra entre top-{n} clubes (M€)")

    for i in range(n):
        for j in range(n):
            v = mat[i][j]
            if v == INF_DISPLAY:
                ax.text(j, i, "∞", ha="center", va="center", fontsize=8, color="#888")
            elif v > 0:
                ax.text(j, i, f"{v:.1f}", ha="center", va="center",
                        fontsize=7, color="black" if v < vmax * 0.55 else "white")

    plt.colorbar(im, ax=ax, label="Soma das fees no caminho (M€)")
    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "parte2_heatmap.png"), bbox_inches="tight", dpi=110)
    plt.close()


# ─────────────────────────────────────────────────────────────────────────────
# 4. Amostra do grafo (top-N por grau)
# ─────────────────────────────────────────────────────────────────────────────

def plot_amostra_grafo(g, n: int = 25):
    import math, random
    random.seed(42)

    top = sorted(g.get_nodes(), key=lambda x: g.get_degree(x), reverse=True)[:n]
    top_set = set(top)
    # disposição circular
    pos = {}
    for i, node in enumerate(top):
        ang = 2 * math.pi * i / n
        pos[node] = (math.cos(ang), math.sin(ang))

    fig, ax = plt.subplots(figsize=(11, 11))
    ax.set_xlim(-1.4, 1.4); ax.set_ylim(-1.4, 1.4)
    ax.set_aspect("equal"); ax.axis("off")
    ax.set_title(f"Parte 2 — Amostra do grafo (top-{n} clubes por grau)")

    # arestas
    for u, v, w, _ in g.iter_edges():
        if u in top_set and v in top_set:
            x1, y1 = pos[u]
            x2, y2 = pos[v]
            # escala width pelo peso (log) — clamp
            lw = 0.4 + min(2.5, math.log10(max(w, 1) / 1e5))
            ax.annotate("", xy=(x2 * 0.92, y2 * 0.92),
                        xytext=(x1 * 0.92, y1 * 0.92),
                        arrowprops=dict(arrowstyle="-|>", color="#f39c12",
                                        alpha=0.55, lw=lw))

    # nós
    for node, (x, y) in pos.items():
        ax.plot(x, y, "o", color="white", markersize=22, markeredgecolor="#222")
        ax.text(x * 1.16, y * 1.16, node, ha="center", va="center",
                fontsize=10, fontweight="bold",
                color="#222", bbox=dict(boxstyle="round,pad=0.25",
                                       facecolor="#fff7d6",
                                       edgecolor="#bba"))

    plt.tight_layout()
    plt.savefig(os.path.join(OUT_DIR, "parte2_amostra_grafo.png"),
                bbox_inches="tight", dpi=110)
    plt.close()


# ─────────────────────────────────────────────────────────────────────────────
# Pipeline
# ─────────────────────────────────────────────────────────────────────────────

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Carregando grafo...")
    g = load_transfers_graph()
    report = _load_report()

    print("1/4 histograma de graus...")
    plot_hist_graus(g)
    print("2/4 tempos por algoritmo...")
    plot_tempos(report)
    print("3/4 heatmap de distancias...")
    plot_heatmap_distancias(g, n=12)
    print("4/4 amostra do grafo...")
    plot_amostra_grafo(g, n=25)

    print("OK - 4 PNGs gerados em out/parte2_*.png")


if __name__ == "__main__":
    main()
