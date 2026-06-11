"""
Lê data/dataset_parte2/transferencias.csv, filtra transferências com
transfer_fee > 0, e gera frontend/public/grafo.json no formato do
react-force-graph: { nodes: [{id, name, league, degree}], links:
[{source, target, player, fee, market_value, season, date,
source_league, target_league}] }.
"""
import json
import os
from collections import Counter

import pandas as pd

from src.leagues import league_of, all_league_names

CSV_IN = "data/dataset_parte2/transferencias.csv"
JSON_OUT = "frontend/public/grafo.json"


def build():
    df = pd.read_csv(CSV_IN)
    df = df[df["transfer_fee"] > 0].copy()
    df["from_club_name"] = df["from_club_name"].astype(str)
    df["to_club_name"] = df["to_club_name"].astype(str)

    clubes = sorted(set(df["from_club_name"]) | set(df["to_club_name"]))

    # ── Deduplica arestas paralelas ──────────────────────────────────────────
    # Múltiplas transferências entre o mesmo par (ex.: Barcelona→PSG: Neymar,
    # Dembélé, Dro) viram UMA aresta "canônica" = a de MAIOR fee. As demais
    # ficam em 'extras' para o modal listar. Isso espelha o backend Python
    # (transfers_io.py): grafo simples ponderado, sem arestas sobrepostas.
    # O grau passa a contar arestas únicas (não transferências).
    canonicas = {}  # (src, tgt) -> dict da aresta canônica
    extras = {}     # (src, tgt) -> [outras transferências]
    for _, row in df.iterrows():
        src = row["from_club_name"]
        tgt = row["to_club_name"]
        market = row["market_value_in_eur"]
        fee = float(row["transfer_fee"])
        info = {
            "player": row["player_name"],
            "fee": fee,
            "market_value": None if pd.isna(market) else float(market),
            "season": row["transfer_season"],
            "date": row["transfer_date"],
        }
        par = (src, tgt)
        atual = canonicas.get(par)
        if atual is None:
            canonicas[par] = info
        elif fee > atual["fee"]:
            # nova canônica; a antiga vira extra
            extras.setdefault(par, []).append(atual)
            canonicas[par] = info
        else:
            extras.setdefault(par, []).append(info)

    grau = Counter()
    for (src, tgt) in canonicas:
        grau[src] += 1
        grau[tgt] += 1

    nodes = [
        {
            "id": clube,
            "name": clube,
            "degree": grau[clube],
            "league": league_of(clube),
        }
        for clube in clubes
    ]

    links = []
    for (src, tgt), info in canonicas.items():
        outras = extras.get((src, tgt), [])
        # ordena extras do mais caro para o mais barato
        outras_ord = sorted(outras, key=lambda x: x["fee"], reverse=True)
        links.append({
            "source": src,
            "target": tgt,
            "player": info["player"],
            "fee": info["fee"],
            "market_value": info["market_value"],
            "season": info["season"],
            "date": info["date"],
            "source_league": league_of(src),
            "target_league": league_of(tgt),
            "transfers_count": 1 + len(outras_ord),
            "extras": outras_ord,
        })

    league_count = Counter(n["league"] for n in nodes)

    os.makedirs(os.path.dirname(JSON_OUT), exist_ok=True)
    payload = {
        "stats": {
            "nodes": len(nodes),
            "links": len(links),
            "max_fee": max(l["fee"] for l in links),
            "min_fee": min(l["fee"] for l in links),
        },
        "leagues": all_league_names(),
        "league_counts": dict(league_count),
        "nodes": nodes,
        "links": links,
    }
    with open(JSON_OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)

    print(f"OK -> {JSON_OUT}")
    print(f"   {len(nodes)} clubes (nos)")
    print(f"   {len(links)} transferencias (arestas)")
    print(f"   fee max: EUR {payload['stats']['max_fee']:,.0f}")
    print()
    print("Clubes por liga:")
    for league_name in all_league_names():
        if league_count[league_name]:
            print(f"   {league_name}: {league_count[league_name]} clubes")


if __name__ == "__main__":
    build()
