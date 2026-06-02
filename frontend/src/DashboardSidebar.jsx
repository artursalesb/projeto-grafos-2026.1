/**
 * Versão compacta do Dashboard para o modo Split (painel à direita).
 * Mesmos cálculos reativos aos filtros, mas em coluna estreita scrollable.
 */
import { useMemo } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts";
import AlgorithmCalculator from "./AlgorithmCalculator.jsx";
import InsightsPanel from "./InsightsPanel.jsx";
import Parte2Charts from "./Parte2Charts.jsx";

function sId(l) {
  return typeof l.source === "object" ? l.source.id : l.source;
}
function tId(l) {
  return typeof l.target === "object" ? l.target.id : l.target;
}

function fmtEUR(v) {
  if (v == null || isNaN(v)) return "—";
  if (v >= 1e9) return `€${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `€${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `€${(v / 1e3).toFixed(0)}k`;
  return `€${v.toFixed(0)}`;
}

const tooltipStyle = {
  background: "rgba(15, 25, 15, 0.95)",
  border: "1px solid rgba(255,215,0,0.4)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 11,
};

export default function DashboardSidebar({ graph, raw, onJumpToGraph }) {
  const stats = useMemo(() => {
    if (!graph) return null;
    const total = graph.links.reduce((s, l) => s + (l.fee || 0), 0);
    return {
      nodes: graph.nodes.length,
      links: graph.links.length,
      totalFee: total,
      avgFee: graph.links.length ? total / graph.links.length : 0,
    };
  }, [graph]);

  const topSellers = useMemo(() => {
    if (!graph) return [];
    const m = new Map();
    for (const l of graph.links) {
      const s = sId(l);
      const c = m.get(s) || { name: s, total: 0 };
      c.total += l.fee || 0;
      m.set(s, c);
    }
    return [...m.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  }, [graph]);

  const topBuyers = useMemo(() => {
    if (!graph) return [];
    const m = new Map();
    for (const l of graph.links) {
      const t = tId(l);
      const c = m.get(t) || { name: t, total: 0 };
      c.total += l.fee || 0;
      m.set(t, c);
    }
    return [...m.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  }, [graph]);

  const leagueData = useMemo(() => {
    if (!graph) return [];
    const m = new Map();
    for (const l of graph.links) {
      const ligas = new Set([l.source_league, l.target_league].filter(Boolean));
      for (const liga of ligas) {
        const c = m.get(liga) || { name: liga, total: 0 };
        c.total += l.fee || 0;
        m.set(liga, c);
      }
    }
    return [...m.values()]
      .filter((d) => d.name !== "Outras")
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [graph]);

  const seasonData = useMemo(() => {
    if (!graph) return [];
    const m = new Map();
    for (const l of graph.links) {
      const k = l.season || "?";
      const c = m.get(k) || { season: k, total: 0 };
      c.total += l.fee || 0;
      m.set(k, c);
    }
    return [...m.values()]
      .filter((d) => d.season !== "?" && d.season.length <= 7)
      .sort((a, b) => a.season.localeCompare(b.season));
  }, [graph]);

  const feeBuckets = useMemo(() => {
    if (!graph) return [];
    const b = [
      { name: "< 100k", min: 0, max: 100_000, count: 0 },
      { name: "100k-1M", min: 100_000, max: 1_000_000, count: 0 },
      { name: "1M-10M", min: 1_000_000, max: 10_000_000, count: 0 },
      { name: "10M-50M", min: 10_000_000, max: 50_000_000, count: 0 },
      { name: "50M-100M", min: 50_000_000, max: 100_000_000, count: 0 },
      { name: ">100M", min: 100_000_000, max: Infinity, count: 0 },
    ];
    for (const l of graph.links) {
      const f = l.fee || 0;
      const x = b.find((y) => f >= y.min && f < y.max);
      if (x) x.count++;
    }
    return b;
  }, [graph]);

  const topTransfers = useMemo(() => {
    if (!graph) return [];
    return [...graph.links]
      .sort((a, b) => b.fee - a.fee)
      .slice(0, 10)
      .map((l) => ({
        ...l,
        source: sId(l),
        target: tId(l),
      }));
  }, [graph]);

  if (!graph) return null;

  return (
    <div className="dash-side">
      <header className="dash-side-head">
        <h2>Dashboard ao vivo</h2>
        <div className="dash-side-sub">reage aos filtros em tempo real</div>
      </header>

      <div className="dash-side-stats">
        <div className="ds-stat">
          <div className="ds-stat-label">Vértices</div>
          <div className="ds-stat-value">{stats.nodes.toLocaleString("pt-BR")}</div>
        </div>
        <div className="ds-stat">
          <div className="ds-stat-label">Arestas</div>
          <div className="ds-stat-value">{stats.links.toLocaleString("pt-BR")}</div>
        </div>
        <div className="ds-stat">
          <div className="ds-stat-label">Volume</div>
          <div className="ds-stat-value">{fmtEUR(stats.totalFee)}</div>
        </div>
        <div className="ds-stat">
          <div className="ds-stat-label">Fee média</div>
          <div className="ds-stat-value">{fmtEUR(stats.avgFee)}</div>
        </div>
      </div>

      <div className="mini-card calc-mini">
        <h4>Calculadora de algoritmos (ao vivo)</h4>
        <div className="calc-mini-hint">
          Roda sobre o grafo com os filtros aplicados.
        </div>
        <AlgorithmCalculator
          graph={graph}
          rawGraph={raw}
          onJumpToGraph={onJumpToGraph}
        />
      </div>

      <MiniChart title="Top 10 clubes que mais venderam" data={topSellers} dataKey="total" color="#ff6b6b" />
      <MiniChart title="Top 10 clubes que mais compraram" data={topBuyers} dataKey="total" color="#4cd964" />
      <MiniChart title="Top ligas por volume" data={leagueData} dataKey="total" color="#ffd700" />

      <div className="mini-card">
        <h4>Volume por temporada</h4>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={seasonData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="season" stroke="#aac" fontSize={9} />
            <YAxis stroke="#aac" fontSize={9} tickFormatter={fmtEUR} />
            <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="total" stroke="#3cdc6e" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mini-card">
        <h4>Faixa de valor (nº transferências)</h4>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={feeBuckets} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#aac" fontSize={9} angle={-20} textAnchor="end" height={50} />
            <YAxis stroke="#aac" fontSize={9} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#ff9f43" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráficos adicionais (atividade, heatmap, amostra do grafo) */}
      <Parte2Charts graph={graph} />

      {/* Top 10 transferências (após a amostra do grafo) */}
      <div className="mini-card">
        <h4>Top 10 transferências</h4>
        <div className="mini-top-list">
          {topTransfers.map((l, i) => (
            <div key={i} className="mini-top-item">
              <span className="mini-rank">#{i + 1}</span>
              <div className="mini-info">
                <div className="mini-player">{l.player}</div>
                <div className="mini-route">{l.source} → {l.target}</div>
              </div>
              <span className="mini-fee">{fmtEUR(l.fee)}</span>
            </div>
          ))}
          {topTransfers.length === 0 && (
            <div className="mini-empty">Sem dados nos filtros atuais.</div>
          )}
        </div>
      </div>

      {/* INSIGHTS (no fim) */}
      <div className="mini-card">
        <h4>Insights (ao vivo)</h4>
        <InsightsPanel graph={graph} raw={raw} />
      </div>
    </div>
  );
}

function MiniChart({ title, data, dataKey, color }) {
  return (
    <div className="mini-card">
      <h4>{title}</h4>
      <ResponsiveContainer width="100%" height={Math.max(120, data.length * 22 + 20)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis type="number" stroke="#aac" fontSize={9} tickFormatter={fmtEUR} />
          <YAxis type="category" dataKey="name" stroke="#aac" width={80} fontSize={9} />
          <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={tooltipStyle} />
          <Bar dataKey={dataKey} fill={color} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
