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
    grau = Counter()
    for _, row in df.iterrows():
        grau[row["from_club_name"]] += 1
        grau[row["to_club_name"]] += 1

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
    for _, row in df.iterrows():
        market = row["market_value_in_eur"]
        src = row["from_club_name"]
        tgt = row["to_club_name"]
        links.append({
            "source": src,
            "target": tgt,
            "player": row["player_name"],
            "fee": float(row["transfer_fee"]),
            "market_value": None if pd.isna(market) else float(market),
            "season": row["transfer_season"],
            "date": row["transfer_date"],
            "source_league": league_of(src),
            "target_league": league_of(tgt),
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
