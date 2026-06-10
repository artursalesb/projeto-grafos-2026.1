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

  return (
    <aside className="ags-side">
      <header className="ags-head">
        <h2>Dashboard ao vivo ✈</h2>
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
    </aside>
  );
}
