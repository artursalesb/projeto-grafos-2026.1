/**
 * Insights gerados dinamicamente a partir do grafo filtrado.
 * Cada insight inclui o número observado E uma justificativa contextual
 * (curada em insightContext.js) baseada em conhecimento do mercado.
 */
import { useMemo } from "react";
import {
  leagueWhy,
  clubWhy,
  seasonWhy,
  bucketWhy,
  concentrationWhy,
} from "./insightContext.js";

function sId(l) {
  return typeof l.source === "object" ? l.source.id : l.source;
}
function tId(l) {
  return typeof l.target === "object" ? l.target.id : l.target;
}

function fmtEUR(v) {
  if (v == null || isNaN(v)) return "—";
  if (v >= 1e9) return `€${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `€${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `€${(v / 1e3).toFixed(0)}k`;
  return `€${v.toFixed(0)}`;
}

export default function InsightsPanel({ graph, raw }) {
  const insights = useMemo(() => {
    if (!graph || graph.links.length === 0) return [];

    const links = graph.links;
    const totalFee = links.reduce((s, l) => s + (l.fee || 0), 0);

    // 1. Clube que mais negociou
    const degree = new Map();
    for (const l of links) {
      const s = sId(l);
      const t = tId(l);
      degree.set(s, (degree.get(s) || 0) + 1);
      degree.set(t, (degree.get(t) || 0) + 1);
    }
    const sortedDeg = [...degree.entries()].sort((a, b) => b[1] - a[1]);
    const hub = sortedDeg[0] || ["—", 0];
    const meanDeg =
      degree.size > 0 ? sortedDeg.reduce((s, [, d]) => s + d, 0) / degree.size : 0;
    const hubMultiplier = meanDeg > 0 ? hub[1] / meanDeg : 0;

    // 2. Liga dominante
    const leagueVol = new Map();
    for (const l of links) {
      for (const lg of new Set([l.source_league, l.target_league].filter(Boolean))) {
        leagueVol.set(lg, (leagueVol.get(lg) || 0) + (l.fee || 0));
      }
    }
    const ligas = [...leagueVol.entries()]
      .filter(([n]) => n !== "Outras")
      .sort((a, b) => b[1] - a[1]);
    const topLiga = ligas[0] || ["—", 0];
    const topLigaShare = totalFee > 0 ? (topLiga[1] / totalFee) * 100 : 0;
    const segundaLiga = ligas[1] || ["—", 0];

    // 3. Temporada mais ativa
    const seasonCount = new Map();
    const seasonVol = new Map();
    for (const l of links) {
      const s = l.season;
      if (!s || s.length > 7) continue;
      seasonCount.set(s, (seasonCount.get(s) || 0) + 1);
      seasonVol.set(s, (seasonVol.get(s) || 0) + (l.fee || 0));
    }
    const topSeason = [...seasonVol.entries()].sort((a, b) => b[1] - a[1])[0] || ["—", 0];
    const topSeasonCount = seasonCount.get(topSeason[0]) || 0;

    // 4. Faixa mais frequente
    const buckets = [
      { name: "< €100k", lo: 0, hi: 1e5, count: 0 },
      { name: "€100k–€1M", lo: 1e5, hi: 1e6, count: 0 },
      { name: "€1M–€10M", lo: 1e6, hi: 1e7, count: 0 },
      { name: "€10M–€50M", lo: 1e7, hi: 5e7, count: 0 },
      { name: "€50M–€100M", lo: 5e7, hi: 1e8, count: 0 },
      { name: "> €100M", lo: 1e8, hi: Infinity, count: 0 },
    ];
    for (const l of links) {
      const f = l.fee || 0;
      const b = buckets.find((x) => f >= x.lo && f < x.hi);
      if (b) b.count++;
    }
    const topBucket = [...buckets].sort((a, b) => b.count - a.count)[0];
    const topBucketShare =
      links.length > 0 ? (topBucket.count / links.length) * 100 : 0;

    // 5. Saldo (top vendedor vs top comprador)
    const balance = new Map();
    for (const l of links) {
      const s = sId(l);
      const t = tId(l);
      const f = l.fee || 0;
      balance.set(s, (balance.get(s) || 0) + f);
      balance.set(t, (balance.get(t) || 0) - f);
    }
    const balSorted = [...balance.entries()].sort((a, b) => b[1] - a[1]);
    const maiorLucro = balSorted[0] || ["—", 0];
    const maiorPrejuizo = balSorted[balSorted.length - 1] || ["—", 0];

    // 6. Concentração da elite
    const totalVolBuyer = new Map();
    for (const l of links) {
      totalVolBuyer.set(
        tId(l),
        (totalVolBuyer.get(tId(l)) || 0) + (l.fee || 0)
      );
    }
    const sortedBuyers = [...totalVolBuyer.values()].sort((a, b) => b - a);
    const top5pctCount = Math.max(1, Math.ceil(sortedBuyers.length * 0.05));
    const top5pctVol = sortedBuyers
      .slice(0, top5pctCount)
      .reduce((s, v) => s + v, 0);
    const top5pctShare = totalFee > 0 ? (top5pctVol / totalFee) * 100 : 0;

    return [
      {
        icon: "★",
        label: "Hub de transferências",
        text: (
          <>
            <b>{hub[0]}</b> é o clube mais ativo com <b>{hub[1]}</b> transferências
            (<b>{hubMultiplier.toFixed(1)}×</b> a média de {meanDeg.toFixed(1)} por clube).
            <br />
            <span className="why">
              <b>Por quê?</b> {clubWhy(hub[0])}
            </span>
          </>
        ),
      },
      {
        icon: "▣",
        label: "Liga dominante",
        text: (
          <>
            <b>{topLiga[0]}</b> concentra <b>{fmtEUR(topLiga[1])}</b> em transferências —{" "}
            <b>{topLigaShare.toFixed(0)}%</b> do volume total
            {segundaLiga[0] !== "—" && (
              <>
                , à frente de <b>{segundaLiga[0]}</b> (<b>{fmtEUR(segundaLiga[1])}</b>)
              </>
            )}
            .
            <br />
            <span className="why">
              <b>Por quê?</b> {leagueWhy(topLiga[0])}
            </span>
          </>
        ),
      },
      {
        icon: "◷",
        label: "Temporada mais aquecida",
        text: (
          <>
            <b>{topSeason[0]}</b> foi a temporada com maior volume:{" "}
            <b>{fmtEUR(topSeason[1])}</b> em <b>{topSeasonCount}</b> transferências.
            <br />
            <span className="why">
              <b>Por quê?</b> {seasonWhy(topSeason[0])}
            </span>
          </>
        ),
      },
      {
        icon: "≡",
        label: "Onde está a maioria",
        text: (
          <>
            <b>{topBucketShare.toFixed(0)}%</b> das transferências estão na faixa{" "}
            <b>{topBucket.name}</b> ({topBucket.count.toLocaleString("pt-BR")}{" "}
            operações).
            <br />
            <span className="why">
              <b>Por quê?</b> {bucketWhy(topBucket.name)}
            </span>
          </>
        ),
      },
      {
        icon: "↑↓",
        label: "Quem lucra, quem gasta",
        text: (
          <>
            Maior saldo positivo: <b>{maiorLucro[0]}</b> ({fmtEUR(maiorLucro[1])}) —
            recebeu muito mais do que pagou.
            <br />
            <span className="why">
              <b>Por quê?</b> {clubWhy(maiorLucro[0])}
            </span>
            <br />
            Maior saldo negativo: <b>{maiorPrejuizo[0]}</b> (
            {fmtEUR(Math.abs(maiorPrejuizo[1]))} no vermelho) — gastou muito mais do que
            arrecadou.
            <br />
            <span className="why">
              <b>Por quê?</b> {clubWhy(maiorPrejuizo[0])}
            </span>
          </>
        ),
      },
      {
        icon: "%",
        label: "Concentração da elite",
        text: (
          <>
            Os <b>5%</b> clubes que mais compram respondem por{" "}
            <b>{top5pctShare.toFixed(0)}%</b> do volume.
            <br />
            <span className="why">
              <b>Por quê?</b> {concentrationWhy(top5pctShare)}
            </span>
          </>
        ),
      },
    ];
  }, [graph]);

  if (insights.length === 0) {
    return (
      <div className="insights-empty">
        Sem dados suficientes nos filtros atuais para gerar insights.
      </div>
    );
  }

  return (
    <section className="insights-grid">
      {insights.map((it, i) => (
        <div className="insight-card" key={i}>
          <div className="insight-head">
            <span className="insight-icon">{it.icon}</span>
            <span className="insight-label">{it.label}</span>
          </div>
          <div className="insight-text">{it.text}</div>
        </div>
      ))}
    </section>
  );
}
