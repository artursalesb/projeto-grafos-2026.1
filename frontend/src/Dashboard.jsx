import { useMemo, useState } from "react";
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend,
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
  if (v >= 1e9) return `€${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `€${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `€${(v / 1e3).toFixed(0)}k`;
  return `€${v.toFixed(0)}`;
}

function fmtNum(n) {
  return n == null ? "…" : n.toLocaleString("pt-BR");
}

const COLORS = {
  in: "#4cd964",
  out: "#ff6b6b",
  fee: "#ffd700",
  primary: "#3cdc6e",
  accent: "#ff9f43",
  series: ["#3cdc6e", "#ff9f43", "#4cd964", "#ff6b6b", "#ffd700", "#3498db", "#9b59b6", "#e74c3c"],
};

export default function Dashboard({
  graph,
  raw,
  onJumpToGraph,
}) {
  const [calcResult, setCalcResult] = useState(null);

  const stats = useMemo(() => {
    if (!graph) return null;
    const links = graph.links;
    const totalFee = links.reduce((s, l) => s + (l.fee || 0), 0);
    const avgFee = links.length ? totalFee / links.length : 0;
    const maxFee = links.reduce((m, l) => (l.fee > m ? l.fee : m), 0);
    return {
      nodes: graph.nodes.length,
      links: links.length,
      totalFee,
      avgFee,
      maxFee,
    };
  }, [graph]);

  const topSellers = useMemo(() => {
    if (!graph) return [];
    const out = new Map();
    for (const l of graph.links) {
      const s = sId(l);
      const cur = out.get(s) || { name: s, count: 0, total: 0 };
      cur.count++;
      cur.total += l.fee || 0;
      out.set(s, cur);
    }
    return [...out.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [graph]);

  const topBuyers = useMemo(() => {
    if (!graph) return [];
    const out = new Map();
    for (const l of graph.links) {
      const t = tId(l);
      const cur = out.get(t) || { name: t, count: 0, total: 0 };
      cur.count++;
      cur.total += l.fee || 0;
      out.set(t, cur);
    }
    return [...out.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [graph]);

  const leagueData = useMemo(() => {
    if (!graph) return [];
    const out = new Map();
    for (const l of graph.links) {
      const ligas = new Set([l.source_league, l.target_league].filter(Boolean));
      for (const liga of ligas) {
        const cur = out.get(liga) || { name: liga, count: 0, total: 0 };
        cur.count++;
        cur.total += l.fee || 0;
        out.set(liga, cur);
      }
    }
    return [...out.values()]
      .filter((d) => d.name !== "Outras")
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [graph]);

  const seasonData = useMemo(() => {
    if (!graph) return [];
    const out = new Map();
    for (const l of graph.links) {
      const k = l.season || "?";
      const cur = out.get(k) || { season: k, count: 0, total: 0 };
      cur.count++;
      cur.total += l.fee || 0;
      out.set(k, cur);
    }
    return [...out.values()]
      .filter((d) => d.season !== "?" && d.season.length <= 7)
      .sort((a, b) => a.season.localeCompare(b.season));
  }, [graph]);

  const feeBuckets = useMemo(() => {
    if (!graph) return [];
    const buckets = [
      { name: "< €100k", min: 0, max: 100_000, count: 0 },
      { name: "€100k–€1M", min: 100_000, max: 1_000_000, count: 0 },
      { name: "€1M–€10M", min: 1_000_000, max: 10_000_000, count: 0 },
      { name: "€10M–€50M", min: 10_000_000, max: 50_000_000, count: 0 },
      { name: "€50M–€100M", min: 50_000_000, max: 100_000_000, count: 0 },
      { name: "> €100M", min: 100_000_000, max: Infinity, count: 0 },
    ];
    for (const l of graph.links) {
      const f = l.fee || 0;
      const b = buckets.find((x) => f >= x.min && f < x.max);
      if (b) b.count++;
    }
    return buckets;
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

  if (!graph) {
    return <div className="dashboard-loading">Carregando dados…</div>;
  }

  return (
    <div className="dashboard">
      {/* ── STATS CARDS ───────────────────────────────────── */}
      <section className="dash-stats">
        <div className="dash-card">
          <div className="dash-card-label">Vértices visíveis</div>
          <div className="dash-card-value">{fmtNum(stats.nodes)}</div>
          <div className="dash-card-sub">de {fmtNum(raw?.stats.nodes)} totais</div>
        </div>
        <div className="dash-card">
          <div className="dash-card-label">Arestas visíveis</div>
          <div className="dash-card-value">{fmtNum(stats.links)}</div>
          <div className="dash-card-sub">de {fmtNum(raw?.stats.links)} totais</div>
        </div>
        <div className="dash-card">
          <div className="dash-card-label">Volume total</div>
          <div className="dash-card-value">{fmtEUR(stats.totalFee)}</div>
          <div className="dash-card-sub">soma de todas as fees</div>
        </div>
        <div className="dash-card">
          <div className="dash-card-label">Fee média</div>
          <div className="dash-card-value">{fmtEUR(stats.avgFee)}</div>
          <div className="dash-card-sub">máx: {fmtEUR(stats.maxFee)}</div>
        </div>
      </section>

      {/* ── CALCULADORA ───────────────────────────────────── */}
      <section className="dash-calculator">
        <h2>Calculadora de Algoritmos</h2>
        <p className="muted">
          Roda BFS / DFS / Dijkstra / Bellman-Ford sobre o grafo
          <b> com os filtros aplicados</b>. Implementação própria em JS.
        </p>
        <AlgorithmCalculator
          graph={graph}
          rawGraph={raw}
          onResult={setCalcResult}
          onJumpToGraph={onJumpToGraph}
        />
      </section>

      {/* ── GRÁFICOS ───────────────────────────────────────── */}
      <section className="dash-grid">
        {/* Top vendedores */}
        <div className="chart-card">
          <h3>Top 10 clubes que mais venderam (€ total)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellers} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#aac" tickFormatter={fmtEUR} />
              <YAxis type="category" dataKey="name" stroke="#aac" width={100} fontSize={11} />
              <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="total" fill={COLORS.out} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top compradores */}
        <div className="chart-card">
          <h3>Top 10 clubes que mais compraram (€ total)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topBuyers} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#aac" tickFormatter={fmtEUR} />
              <YAxis type="category" dataKey="name" stroke="#aac" width={100} fontSize={11} />
              <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="total" fill={COLORS.in} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Volume por liga */}
        <div className="chart-card">
          <h3>Top ligas por volume de transferências</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leagueData} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#aac" tickFormatter={fmtEUR} />
              <YAxis type="category" dataKey="name" stroke="#aac" width={150} fontSize={11} />
              <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={tooltipStyle} />
              <Bar dataKey="total" fill={COLORS.fee} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Volume por temporada */}
        <div className="chart-card">
          <h3>Volume por temporada</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={seasonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="season" stroke="#aac" fontSize={11} />
              <YAxis stroke="#aac" tickFormatter={fmtEUR} />
              <Tooltip formatter={(v) => fmtEUR(v)} contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4 }} name="Soma fees" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Histograma de faixa de fees */}
        <div className="chart-card">
          <h3>Distribuição por faixa de valor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={feeBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#aac" fontSize={10} angle={-15} textAnchor="end" height={60} />
              <YAxis stroke="#aac" />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráficos adicionais (atividade, heatmap, amostra do grafo) — dentro do mesmo grid */}
        <Parte2Charts graph={graph} />

        {/* Top 10 transferências (após a amostra do grafo) */}
        <div className="chart-card">
          <h3>Top 10 transferências por valor</h3>
          <div className="top-list">
            {topTransfers.map((l, i) => (
              <div key={i} className="top-item">
                <span className="top-rank">#{i + 1}</span>
                <div className="top-info">
                  <div className="top-player">{l.player}</div>
                  <div className="top-route">
                    {l.source} → {l.target}
                  </div>
                </div>
                <span className="top-fee">{fmtEUR(l.fee)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INSIGHTS (no fim) ─────────────────────────────── */}
      <section className="dash-insights">
        <h2>Insights baseados nos filtros atuais</h2>
        <p className="muted">
          Análises geradas automaticamente a partir do subgrafo filtrado.
          Mude os filtros (liga, valor mínimo) e veja como cada insight reage.
        </p>
        <InsightsPanel graph={graph} raw={raw} />
      </section>

    </div>
  );
}

const tooltipStyle = {
  background: "rgba(15, 25, 15, 0.95)",
  border: "1px solid rgba(255,215,0,0.4)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 12,
};
