/**
 * Gráficos da Parte 2 (reativos aos filtros):
 *   1. Histograma in/out-degree em escala log
 *   2. Heatmap de transferências entre top 10 clubes (count)
 *   3. Amostra circular dos top 25 clubes
 */
import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts";

function sId(l) {
  return typeof l.source === "object" ? l.source.id : l.source;
}
function tId(l) {
  return typeof l.target === "object" ? l.target.id : l.target;
}

const tooltipStyle = {
  background: "rgba(15, 25, 15, 0.95)",
  border: "1px solid rgba(255,215,0,0.4)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 12,
};

// ─────────────────────────────────────────────────────────────
// 1. Atividade por clube — quantos clubes vendem/compram pouco vs muito
// ─────────────────────────────────────────────────────────────
function ActivityChart({ graph }) {
  const data = useMemo(() => {
    if (!graph) return { out: [], in: [], totalClubs: 0 };
    const outDeg = new Map();
    const inDeg = new Map();
    for (const n of graph.nodes) {
      outDeg.set(n.id, 0);
      inDeg.set(n.id, 0);
    }
    for (const l of graph.links) {
      outDeg.set(sId(l), (outDeg.get(sId(l)) || 0) + 1);
      inDeg.set(tId(l), (inDeg.get(tId(l)) || 0) + 1);
    }
    const buckets = [
      { name: "Nenhuma", lo: 0, hi: 1 },
      { name: "1 a 4", lo: 1, hi: 5 },
      { name: "5 a 9", lo: 5, hi: 10 },
      { name: "10 a 24", lo: 10, hi: 25 },
      { name: "25 ou mais", lo: 25, hi: Infinity },
    ];
    const out = buckets.map((b) => ({ name: b.name, vendas: 0 }));
    const inn = buckets.map((b) => ({ name: b.name, compras: 0 }));
    for (const v of outDeg.values()) {
      const i = buckets.findIndex((b) => v >= b.lo && v < b.hi);
      if (i >= 0) out[i].vendas++;
    }
    for (const v of inDeg.values()) {
      const i = buckets.findIndex((b) => v >= b.lo && v < b.hi);
      if (i >= 0) inn[i].compras++;
    }
    return { out, in: inn, totalClubs: graph.nodes.length };
  }, [graph]);

  return (
    <>
      <p className="p2-explainer">
        Quantos clubes <b>vendem</b> ou <b>compram</b> dentro de cada faixa de quantidade.
        Padrão típico de mercado: a <b>maioria dos clubes</b> realiza poucas operações,
        enquanto <b>poucos clubes "hubs"</b> concentram dezenas de transferências.
      </p>
      <div className="p2-chart-pair">
        <div className="p2-half">
          <div className="p2-sub">
            Por <b>vendas</b> (quantos clubes venderam X jogadores)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.out}
              layout="vertical"
              margin={{ top: 5, right: 30, bottom: 5, left: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#aac" fontSize={11}
                label={{ value: "nº de clubes", position: "insideBottom", offset: -2, fill: "#aac", fontSize: 10 }}
              />
              <YAxis type="category" dataKey="name" stroke="#aac" fontSize={11} width={80} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, _, p) => [`${v} clube(s)`, `vendeu ${p.payload.name} vez(es)`]}
              />
              <Bar dataKey="vendas" radius={[0, 4, 4, 0]} fill="#ff6b6b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="p2-half">
          <div className="p2-sub">
            Por <b>compras</b> (quantos clubes compraram X jogadores)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data.in}
              layout="vertical"
              margin={{ top: 5, right: 30, bottom: 5, left: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" stroke="#aac" fontSize={11}
                label={{ value: "nº de clubes", position: "insideBottom", offset: -2, fill: "#aac", fontSize: 10 }}
              />
              <YAxis type="category" dataKey="name" stroke="#aac" fontSize={11} width={80} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v, _, p) => [`${v} clube(s)`, `comprou ${p.payload.name} vez(es)`]}
              />
              <Bar dataKey="compras" radius={[0, 4, 4, 0]} fill="#4cd964" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. Heatmap de transferências entre top 10 clubes (count)
// ─────────────────────────────────────────────────────────────
function TransfersHeatmap({ graph }) {
  const data = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return null;
    const degree = new Map();
    for (const l of graph.links) {
      degree.set(sId(l), (degree.get(sId(l)) || 0) + 1);
      degree.set(tId(l), (degree.get(tId(l)) || 0) + 1);
    }
    const top = [...degree.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .slice(0, 10);
    if (top.length < 2) return null;

    const idx = new Map(top.map((id, i) => [id, i]));
    const mat = top.map(() => top.map(() => 0));
    for (const l of graph.links) {
      const i = idx.get(sId(l));
      const j = idx.get(tId(l));
      if (i != null && j != null) mat[i][j]++;
    }
    return { clubs: top, mat };
  }, [graph]);

  if (!data) return <div className="p2-loading">Sem dados suficientes.</div>;

  const { clubs, mat } = data;
  const max = mat.flat().reduce((m, v) => (v > m ? v : m), 0);

  const cellColor = (v) => {
    if (v === 0) return "rgba(40, 40, 40, 0.3)";
    const t = max > 0 ? v / max : 0;
    const r = Math.round(80 + 175 * t);
    const g = Math.round(215 * (1 - t * 0.7));
    const b = Math.round(80 * (1 - t));
    return `rgb(${r},${g},${b})`;
  };

  return (
    <>
      <div className="p2-sub">
        Quantidade de transferências entre os 10 clubes mais conectados.
        Linhas = clube vendedor, colunas = clube comprador.
      </div>
      <div className="heatmap-wrap">
        <table className="heatmap">
          <thead>
            <tr>
              <th></th>
              {clubs.map((c) => (
                <th key={c} className="hm-col">
                  <div className="hm-col-label">{c}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clubs.map((src, i) => (
              <tr key={src}>
                <th className="hm-row-label">{src}</th>
                {clubs.map((tgt, j) => {
                  const v = mat[i][j];
                  return (
                    <td
                      key={tgt}
                      className="hm-cell"
                      style={{ background: cellColor(v) }}
                      title={`${src} → ${tgt}: ${v} transferência(s)`}
                    >
                      {v === 0 ? "" : v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. Amostra circular do grafo (top-25 clubes por grau)
// ─────────────────────────────────────────────────────────────
function GraphSample({ graph }) {
  const data = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    const degree = new Map();
    for (const l of graph.links) {
      degree.set(sId(l), (degree.get(sId(l)) || 0) + 1);
      degree.set(tId(l), (degree.get(tId(l)) || 0) + 1);
    }
    const top = [...degree.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([id]) => id);
    const topSet = new Set(top);
    const N = top.length;
    const cx = 200;
    const cy = 200;
    const r = 160;
    const positions = new Map();
    top.forEach((id, i) => {
      const a = (i / Math.max(N, 1)) * 2 * Math.PI - Math.PI / 2;
      positions.set(id, {
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        ang: a,
      });
    });
    const edges = [];
    for (const l of graph.links) {
      const s = sId(l);
      const t = tId(l);
      if (topSet.has(s) && topSet.has(t)) {
        edges.push({ s, t, w: l.fee || 0 });
      }
    }
    return { nodes: top, edges, positions };
  }, [graph]);

  if (!data.nodes.length) return <div className="p2-loading">Sem dados.</div>;

  return (
    <>
      <div className="p2-sub">
        Subgrafo dos 25 clubes mais conectados (layout circular). Cada linha laranja é uma
        transferência entre dois clubes do grupo.
      </div>
      <svg viewBox="0 0 400 400" className="graph-sample-svg">
        {data.edges.map((e, i) => {
          const a = data.positions.get(e.s);
          const b = data.positions.get(e.t);
          if (!a || !b) return null;
          const w = 0.4 + Math.min(2.5, Math.log10(Math.max(e.w, 1e5) / 1e5));
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="rgba(243, 156, 18, 0.55)"
              strokeWidth={w}
            />
          );
        })}
        {data.nodes.map((id) => {
          const p = data.positions.get(id);
          const labelX = p.x + Math.cos(p.ang) * 18;
          const labelY = p.y + Math.sin(p.ang) * 18;
          const anchor =
            Math.cos(p.ang) > 0.3 ? "start" : Math.cos(p.ang) < -0.3 ? "end" : "middle";
          return (
            <g key={id}>
              <circle cx={p.x} cy={p.y} r={5} fill="#fff" stroke="#222" strokeWidth={0.8} />
              <text
                x={labelX}
                y={labelY}
                fontSize={9}
                fill="#fff7d6"
                textAnchor={anchor}
                dominantBaseline="middle"
                stroke="#000"
                strokeWidth={0.4}
                paintOrder="stroke"
              >
                {id}
              </text>
            </g>
          );
        })}
      </svg>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Wrapper
// ─────────────────────────────────────────────────────────────
export default function Parte2Charts({ graph }) {
  return (
    <>
      <div className="chart-card p2-wide">
        <h3>Atividade do mercado: quantos clubes vendem ou compram pouco vs muito</h3>
        <ActivityChart graph={graph} />
      </div>

      <div className="chart-card p2-wide">
        <h3>Heatmap: transferências entre top 10 clubes</h3>
        <TransfersHeatmap graph={graph} />
      </div>

      <div className="chart-card p2-wide">
        <h3>Amostra do grafo: top 25 clubes</h3>
        <GraphSample graph={graph} />
      </div>
    </>
  );
}
