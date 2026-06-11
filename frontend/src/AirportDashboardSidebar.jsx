/**
 * Versão compacta do AirportDashboard para o modo Split (painel à direita).
 * Mesmos cálculos reativos ao filtro de grau, em coluna estreita scrollable.
 */
import { useMemo } from "react";
import {
  BarChart, Bar, Cell,
  PieChart, Pie,
  XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts";
import { NOS, ARESTAS, COR_REG, TIPO_LABEL } from "./airportData.js";
import {
  regionWhy,
  airportWhy,
  routeTypeWhy,
  densityWhy,
  distanceWhy,
  filterStateInsight,
} from "./airportInsightContext.js";
import "./AirportDashboardSidebar.css";

const TOOLTIP_STYLE = {
  background: "rgba(7, 17, 30, 0.95)",
  border: "1px solid rgba(75, 163, 211, 0.3)",
  borderRadius: 6,
  color: "#dce8f8",
  fontSize: 11,
};
const TOOLTIP_ITEM_STYLE = { color: "#dce8f8" };
const TOOLTIP_LABEL_STYLE = { color: "#7ec8f8", fontWeight: 600 };

const DIST_BUCKETS = [
  { name: "< 500 km",     min: 0,    max: 500 },
  { name: "500-1000 km",  min: 500,  max: 1000 },
  { name: "1000-2000 km", min: 1000, max: 2000 },
  { name: "2000-3000 km", min: 2000, max: 3000 },
  { name: "> 3000 km",    min: 3000, max: Infinity },
];

const TIPO_COLORS = { regional: "#4cd964", nacional: "#3498db", hub_intra: "#f39c12" };

export default function AirportDashboardSidebar({ minDegree = 1 }) {
  const { filteredNOS, filteredARSTAS, avgDist, maxGrau } = useMemo(() => {
    const filteredNOS = NOS.filter(n => n.grau >= minDegree);
    const visibleIds = new Set(filteredNOS.map(n => n.iata));
    const filteredARSTAS = ARESTAS.filter(a => visibleIds.has(a.from) && visibleIds.has(a.to));
    const totalDist = filteredARSTAS.reduce((s, a) => s + a.peso, 0);
    const avgDist = filteredARSTAS.length ? totalDist / filteredARSTAS.length : 0;
    const maxGrau = filteredNOS.length ? Math.max(...filteredNOS.map(n => n.grau)) : 0;
    return { filteredNOS, filteredARSTAS, avgDist, maxGrau };
  }, [minDegree]);

  const degreeData = useMemo(() =>
    [...filteredNOS]
      .sort((a, b) => b.grau - a.grau)
      .map(n => ({ name: n.iata, grau: n.grau, cor: COR_REG[n.regiao] })),
    [filteredNOS]);

  const regionData = useMemo(() =>
    Object.entries(COR_REG)
      .map(([reg, color]) => ({
        name: reg,
        value: filteredNOS.filter(n => n.regiao === reg).length,
        color,
      }))
      .filter(d => d.value > 0),
    [filteredNOS]);

  const distData = useMemo(() => {
    const buckets = DIST_BUCKETS.map(b => ({ ...b, count: 0 }));
    filteredARSTAS.forEach(a => {
      const b = buckets.find(x => a.peso >= x.min && a.peso < x.max);
      if (b) b.count++;
    });
    return buckets;
  }, [filteredARSTAS]);

  const tipoData = useMemo(() =>
    Object.entries(TIPO_LABEL).map(([tipo, label]) => ({
      name: label,
      count: filteredARSTAS.filter(a => a.tipo === tipo).length,
      fill: TIPO_COLORS[tipo],
    })),
    [filteredARSTAS]);

  const insights = useMemo(
    () => buildAirportInsights(filteredNOS, filteredARSTAS, minDegree),
    [filteredNOS, filteredARSTAS, minDegree]
  );

  return (
    <aside className="ags-side">
      <header className="ags-head">
        <h2>Dashboard ao vivo</h2>
        <div className="ags-sub">reage ao filtro de conexões em tempo real</div>
      </header>

      <div className="ags-stats">
        <div className="ags-stat">
          <div className="ags-stat-label">Aeroportos</div>
          <div className="ags-stat-value">{filteredNOS.length}/20</div>
        </div>
        <div className="ags-stat">
          <div className="ags-stat-label">Conexões</div>
          <div className="ags-stat-value">{filteredARSTAS.length}/77</div>
        </div>
        <div className="ags-stat">
          <div className="ags-stat-label">Dist. média</div>
          <div className="ags-stat-value">{Math.round(avgDist)} km</div>
        </div>
        <div className="ags-stat">
          <div className="ags-stat-label">Grau máx.</div>
          <div className="ags-stat-value">{maxGrau}</div>
        </div>
      </div>

      <div className="ags-card">
        <h4>Grau dos aeroportos visíveis</h4>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={degreeData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,163,211,0.12)" />
            <XAxis dataKey="name" stroke="#7ec8f8" fontSize={9} tick={{ fill: "#a8c4e0" }} />
            <YAxis stroke="#7ec8f8" fontSize={9} tick={{ fill: "#a8c4e0" }} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={(v) => [`${v}`, "Grau"]}
            />
            <Bar dataKey="grau" radius={[3, 3, 0, 0]}>
              {degreeData.map((entry, i) => <Cell key={i} fill={entry.cor} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ags-card">
        <h4>Aeroportos por região</h4>
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie
              data={regionData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={55}
              label={({ value }) => value}
              fontSize={10}
            >
              {regionData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={(v, n) => [`${v} aeroportos`, n]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="ags-card">
        <h4>Histograma de distâncias</h4>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={distData} margin={{ top: 4, right: 8, bottom: 28, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,163,211,0.12)" />
            <XAxis dataKey="name" stroke="#7ec8f8" fontSize={8} tick={{ fill: "#a8c4e0" }} angle={-30} textAnchor="end" height={48} />
            <YAxis stroke="#7ec8f8" fontSize={9} tick={{ fill: "#a8c4e0" }} allowDecimals={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={(v) => [`${v} rota${v !== 1 ? "s" : ""}`, "Quantidade"]}
            />
            <Bar dataKey="count" fill="#4ba3d3" fillOpacity={0.85} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="ags-card">
        <h4>Conexões por tipo de rota</h4>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={tipoData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,163,211,0.12)" />
            <XAxis dataKey="name" stroke="#7ec8f8" fontSize={9} tick={{ fill: "#a8c4e0" }} />
            <YAxis stroke="#7ec8f8" fontSize={9} tick={{ fill: "#a8c4e0" }} allowDecimals={false} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              itemStyle={TOOLTIP_ITEM_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              formatter={(v) => [`${v} rota${v !== 1 ? "s" : ""}`, "Quantidade"]}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {tipoData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── INSIGHTS ── */}
      <div className="ags-card">
        <h4>Insights da rede (ao vivo)</h4>
        <div className="ags-insights">
          {insights.map((ins, i) => (
            <div className={`ags-insight ${ins.highlight ? "ags-insight-hl" : ""}`} key={i}>
              <div className="ags-insight-label">{ins.label}</div>
              <div className="ags-insight-text">{ins.text}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

const TIPO_NOME = {
  regional: "regional",
  nacional: "nacional",
  hub_intra: "hub intrarregional",
};

function buildAirportInsights(filteredNOS, filteredARSTAS, minDegree) {
  if (!filteredNOS.length) return [];
  const n = filteredNOS.length;
  const m = filteredARSTAS.length;
  const maxGrauVal = Math.max(...filteredNOS.map((x) => x.grau));
  const hubs = filteredNOS.filter((x) => x.grau === maxGrauVal).map((x) => x.iata);
  const meanGrau = n ? filteredNOS.reduce((s, x) => s + x.grau, 0) / n : 0;
  const avgDist = m ? filteredARSTAS.reduce((s, a) => s + a.peso, 0) / m : 0;
  const maxEdge = m
    ? filteredARSTAS.reduce((mx, a) => (a.peso > mx.peso ? a : mx), filteredARSTAS[0])
    : null;
  const minEdge = m
    ? filteredARSTAS.reduce((mn, a) => (a.peso < mn.peso ? a : mn), filteredARSTAS[0])
    : null;
  const density = n > 1 ? (2 * m) / (n * (n - 1)) : 0;

  const regionCounts = {};
  filteredNOS.forEach((x) => {
    regionCounts[x.regiao] = (regionCounts[x.regiao] ?? 0) + 1;
  });
  const sortedRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
  const topRegion = sortedRegions[0];

  const tipoCount = { regional: 0, nacional: 0, hub_intra: 0 };
  filteredARSTAS.forEach((a) => {
    tipoCount[a.tipo] = (tipoCount[a.tipo] ?? 0) + 1;
  });
  const topTipo = Object.entries(tipoCount).sort((a, b) => b[1] - a[1])[0];

  const fmt = (v) => Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 0 });
  const out = [];

  // Insight que reage ao estado do filtro (sempre primeiro, em destaque)
  const fs = filterStateInsight(filteredNOS, minDegree);
  out.push({ label: fs.label, text: fs.text, highlight: true });

  out.push({
    label: "Hub da rede",
    text: (
      <>
        <b>{hubs.join(", ")}</b> com grau <b>{maxGrauVal}</b> (
        {(maxGrauVal / Math.max(meanGrau, 0.001)).toFixed(1)}× a média).
        <br />
        <span className="why"><b>Por quê?</b> {airportWhy(hubs[0])}</span>
      </>
    ),
  });

  if (topRegion) {
    out.push({
      label: "Concentração regional",
      text: (
        <>
          <b>{topRegion[0]}</b> tem mais aeroportos: <b>{topRegion[1]}</b>.
          <br />
          <span className="why"><b>Por quê?</b> {regionWhy(topRegion[0])}</span>
        </>
      ),
    });
  }

  if (minEdge && maxEdge) {
    out.push({
      label: "Extremos de distância",
      text: (
        <>
          Curta: <b>{minEdge.from}↔{minEdge.to}</b> ({fmt(minEdge.peso)} km). Longa:{" "}
          <b>{maxEdge.from}↔{maxEdge.to}</b> ({fmt(maxEdge.peso)} km). Média{" "}
          <b>{fmt(avgDist)} km</b>.
          <br />
          <span className="why"><b>Por quê?</b> {distanceWhy(avgDist)}</span>
        </>
      ),
    });
  }

  out.push({
    label: "Densidade do grafo",
    text: (
      <>
        <b>{n}</b> nós, <b>{m}</b> arestas → densidade <b>{density.toFixed(2)}</b>.
        <br />
        <span className="why"><b>Por quê?</b> {densityWhy(density)}</span>
      </>
    ),
  });

  if (topTipo && m > 0) {
    out.push({
      label: "Tipo de rota predominante",
      text: (
        <>
          <b>{Math.round((topTipo[1] / m) * 100)}%</b> são{" "}
          <b>{TIPO_NOME[topTipo[0]]}</b> ({topTipo[1]} de {m}).
          <br />
          <span className="why"><b>Por quê?</b> {routeTypeWhy(topTipo[0])}</span>
        </>
      ),
    });
  }

  return out;
}
