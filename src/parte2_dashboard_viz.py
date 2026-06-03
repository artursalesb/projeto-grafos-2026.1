"""
Gera os PNGs equivalentes aos gráficos do Dashboard React (Parte 2)
em `out/`. Cada um cobre uma das visualizações usadas no front:

  out/parte2_top_vendedores.png
  out/parte2_top_compradores.png
  out/parte2_top_ligas.png
  out/parte2_volume_temporada.png
  out/parte2_faixa_valor.png
  out/parte2_top10_transferencias.png
  out/parte2_atividade_mercado.png
  out/parte2_heatmap_transferencias.png

Use sempre o grafo COMPLETO (sem filtros da UI). O React mostra a
versão interativa; estes PNGs servem como entregáveis estáticos.
"""
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from src.leagues import league_of

CSV = "data/dataset_parte2/transferencias.csv"
OUT_DIR = "out"

PALETTE = {
    "red": "#e74c3c",
    "green": "#2ecc71",
    "gold": "#f1c40f",
    "blue": "#3498db",
    "purple": "#9b59b6",
    "orange": "#e67e22",
    "white": "#ecf0f1",
    "dark": "#1a1a1a",
}


def _load():
    df = pd.read_csv(CSV)
    df = df[df["transfer_fee"] > 0].copy()
    df["fee_m"] = df["transfer_fee"] / 1e6
    df["liga_origem"] = df["from_club_name"].apply(league_of)
    df["liga_destino"] = df["to_club_name"].apply(league_of)
    return df


def _save(fig, name):
    path = os.path.join(OUT_DIR, name)
    fig.savefig(path, dpi=140, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"OK -> {path}")


# ─────────────────────────────────────────────────────────────
# 1. Top 10 clubes que mais venderam (€ total)
# ─────────────────────────────────────────────────────────────
def plot_top_vendedores(df):
    s = df.groupby("from_club_name")["transfer_fee"].sum().sort_values(ascending=False).head(10)
    fig, ax = plt.subplots(figsize=(11, 6))
    ax.barh(s.index[::-1], (s.values[::-1] / 1e6), color=PALETTE["red"], edgecolor="black", alpha=0.88)
    for i, v in enumerate(s.values[::-1] / 1e6):
        ax.text(v * 1.01, i, f"€{v:.0f}M", va="center", fontsize=10)
    ax.set_xlabel("Volume vendido (€ Milhões)")
    ax.set_title("Top 10 clubes que mais venderam (volume total em €)")
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    _save(fig, "parte2_top_vendedores.png")


# ─────────────────────────────────────────────────────────────
# 2. Top 10 clubes que mais compraram (€ total)
# ─────────────────────────────────────────────────────────────
def plot_top_compradores(df):
    s = df.groupby("to_club_name")["transfer_fee"].sum().sort_values(ascending=False).head(10)
    fig, ax = plt.subplots(figsize=(11, 6))
    ax.barh(s.index[::-1], (s.values[::-1] / 1e6), color=PALETTE["green"], edgecolor="black", alpha=0.88)
    for i, v in enumerate(s.values[::-1] / 1e6):
        ax.text(v * 1.01, i, f"€{v:.0f}M", va="center", fontsize=10)
    ax.set_xlabel("Volume comprado (€ Milhões)")
    ax.set_title("Top 10 clubes que mais compraram (volume total em €)")
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    _save(fig, "parte2_top_compradores.png")


# ─────────────────────────────────────────────────────────────
# 3. Top ligas por volume
# ─────────────────────────────────────────────────────────────
def plot_top_ligas(df):
    vol_por_liga = {}
    for _, r in df.iterrows():
        for liga in {r["liga_origem"], r["liga_destino"]} - {"Outras"}:
            vol_por_liga[liga] = vol_por_liga.get(liga, 0) + r["transfer_fee"]
    s = pd.Series(vol_por_liga).sort_values(ascending=False).head(10)
    fig, ax = plt.subplots(figsize=(11, 6))
    ax.barh(s.index[::-1], (s.values[::-1] / 1e9), color=PALETTE["gold"], edgecolor="black", alpha=0.9)
    for i, v in enumerate(s.values[::-1] / 1e9):
        ax.text(v * 1.01, i, f"€{v:.2f}B", va="center", fontsize=10)
    ax.set_xlabel("Volume movimentado (€ Bilhões)")
    ax.set_title("Top 10 ligas por volume de transferências")
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    _save(fig, "parte2_top_ligas.png")


# ─────────────────────────────────────────────────────────────
# 4. Volume por temporada (linha)
# ─────────────────────────────────────────────────────────────
def plot_volume_temporada(df):
    s = df.groupby("transfer_season")["transfer_fee"].sum().sort_index()
    s = s[s.index.str.len() <= 7]
    fig, ax = plt.subplots(figsize=(11, 6))
    ax.plot(s.index, s.values / 1e9, marker="o", color=PALETTE["blue"], linewidth=2.5, markersize=7)
    ax.fill_between(s.index, s.values / 1e9, alpha=0.18, color=PALETTE["blue"])
    ax.set_xlabel("Temporada")
    ax.set_ylabel("Volume (€ Bilhões)")
    ax.set_title("Volume de transferências por temporada")
    ax.tick_params(axis="x", rotation=45)
    ax.grid(linestyle="--", alpha=0.4)
    _save(fig, "parte2_volume_temporada.png")


# ─────────────────────────────────────────────────────────────
# 5. Distribuição por faixa de valor
# ─────────────────────────────────────────────────────────────
def plot_faixa_valor(df):
    buckets = [
        ("< €100k", 0, 1e5),
        ("€100k–€1M", 1e5, 1e6),
        ("€1M–€10M", 1e6, 1e7),
        ("€10M–€50M", 1e7, 5e7),
        ("€50M–€100M", 5e7, 1e8),
        ("> €100M", 1e8, float("inf")),
    ]
    nomes = [b[0] for b in buckets]
    counts = []
    for _, lo, hi in buckets:
        counts.append(((df["transfer_fee"] >= lo) & (df["transfer_fee"] < hi)).sum())
    fig, ax = plt.subplots(figsize=(11, 6))
    bars = ax.bar(nomes, counts, color=PALETTE["orange"], edgecolor="black", alpha=0.88)
    for b, c in zip(bars, counts):
        ax.text(b.get_x() + b.get_width() / 2, c + max(counts) * 0.01,
                f"{c:,}".replace(",", "."), ha="center", fontsize=10)
    ax.set_ylabel("Nº de transferências")
    ax.set_title("Distribuição de transferências por faixa de valor")
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    _save(fig, "parte2_faixa_valor.png")


# ─────────────────────────────────────────────────────────────
# 6. Top 10 transferências por valor
# ─────────────────────────────────────────────────────────────
def plot_top10_transferencias(df):
    t = df.sort_values("transfer_fee", ascending=False).head(10)
    labels = [
        f"{row.player_name}\n{row.from_club_name} → {row.to_club_name}"
        for _, row in t.iterrows()
    ][::-1]
    vals = (t["transfer_fee"].values / 1e6)[::-1]
    fig, ax = plt.subplots(figsize=(12, 8))
    ax.barh(labels, vals, color=PALETTE["purple"], edgecolor="black", alpha=0.85)
    for i, v in enumerate(vals):
        ax.text(v * 1.01, i, f"€{v:.1f}M", va="center", fontsize=10)
    ax.set_xlabel("Valor da transferência (€ Milhões)")
    ax.set_title("Top 10 transferências por valor")
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    _save(fig, "parte2_top10_transferencias.png")


# ─────────────────────────────────────────────────────────────
# 7. Atividade do mercado (vendas vs compras por faixa)
# ─────────────────────────────────────────────────────────────
def plot_atividade_mercado(df):
    all_clubs = sorted(set(df["from_club_name"]) | set(df["to_club_name"]))
    out_deg = df["from_club_name"].value_counts().reindex(all_clubs, fill_value=0)
    in_deg = df["to_club_name"].value_counts().reindex(all_clubs, fill_value=0)
    buckets = [("Nenhuma", 0, 1), ("1 a 4", 1, 5), ("5 a 9", 5, 10),
               ("10 a 24", 10, 25), ("25 ou mais", 25, float("inf"))]
    out_counts = []
    in_counts = []
    for _, lo, hi in buckets:
        out_counts.append(int(((out_deg >= lo) & (out_deg < hi)).sum()))
        in_counts.append(int(((in_deg >= lo) & (in_deg < hi)).sum()))

    fig, axs = plt.subplots(1, 2, figsize=(13, 5))
    nomes = [b[0] for b in buckets]
    axs[0].barh(nomes[::-1], out_counts[::-1], color=PALETTE["red"], edgecolor="black", alpha=0.85)
    for i, v in enumerate(out_counts[::-1]):
        axs[0].text(v + max(out_counts) * 0.01, i, str(v), va="center", fontsize=9)
    axs[0].set_xlabel("nº de clubes")
    axs[0].set_title("Por vendas (quantos clubes venderam X jogadores)")
    axs[0].grid(axis="x", linestyle="--", alpha=0.4)

    axs[1].barh(nomes[::-1], in_counts[::-1], color=PALETTE["green"], edgecolor="black", alpha=0.85)
    for i, v in enumerate(in_counts[::-1]):
        axs[1].text(v + max(in_counts) * 0.01, i, str(v), va="center", fontsize=9)
    axs[1].set_xlabel("nº de clubes")
    axs[1].set_title("Por compras (quantos clubes compraram X jogadores)")
    axs[1].grid(axis="x", linestyle="--", alpha=0.4)

    fig.suptitle("Atividade do mercado: distribuição de operações por clube", fontsize=13)
    plt.tight_layout()
    _save(fig, "parte2_atividade_mercado.png")


# ─────────────────────────────────────────────────────────────
# 8. Heatmap: transferências entre top 10 clubes (count)
# ─────────────────────────────────────────────────────────────
def plot_heatmap_transferencias(df):
    counts = pd.concat([df["from_club_name"], df["to_club_name"]]).value_counts()
    top10 = counts.head(10).index.tolist()
    mat = np.zeros((10, 10), dtype=int)
    idx = {c: i for i, c in enumerate(top10)}
    for _, row in df.iterrows():
        i = idx.get(row["from_club_name"])
        j = idx.get(row["to_club_name"])
        if i is not None and j is not None:
            mat[i][j] += 1

    fig, ax = plt.subplots(figsize=(10, 8))
    im = ax.imshow(mat, cmap="YlOrRd", aspect="auto")
    ax.set_xticks(range(10))
    ax.set_yticks(range(10))
    ax.set_xticklabels(top10, rotation=45, ha="right", fontsize=10)
    ax.set_yticklabels(top10, fontsize=10)
    ax.set_xlabel("Comprador (destino)")
    ax.set_ylabel("Vendedor (origem)")
    ax.set_title("Heatmap: transferências entre os 10 clubes mais conectados")
    vmax = mat.max() if mat.max() > 0 else 1
    for i in range(10):
        for j in range(10):
            v = mat[i][j]
            if v > 0:
                color = "black" if v < vmax * 0.55 else "white"
                ax.text(j, i, str(v), ha="center", va="center", fontsize=10, color=color)
    fig.colorbar(im, ax=ax, label="nº de transferências")
    plt.tight_layout()
    _save(fig, "parte2_heatmap_transferencias.png")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    print("Carregando dataset...")
    df = _load()
    print(f"   {len(df):,} transferencias com fee > 0".replace(",", "."))
    print()
    plot_top_vendedores(df)
    plot_top_compradores(df)
    plot_top_ligas(df)
    plot_volume_temporada(df)
    plot_faixa_valor(df)
    plot_top10_transferencias(df)
    plot_atividade_mercado(df)
    plot_heatmap_transferencias(df)
    print()
    print("Pronto! 8 PNGs gerados em out/.")


if __name__ == "__main__":
    main()
