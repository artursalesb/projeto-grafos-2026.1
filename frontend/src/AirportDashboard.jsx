import { useMemo } from "react";
import {
  BarChart, Bar, Cell,
  PieChart, Pie,
  XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ResponsiveContainer,
} from "recharts";
import { NOS, ARESTAS, COR_REG, TIPO_LABEL } from "./airportData.js";
import "./AirportDashboard.css";

const TOOLTIP_STYLE = {
  background: "rgba(7, 17, 30, 0.95)",
  border: "1px solid rgba(75, 163, 211, 0.3)",
  borderRadius: 6,
  color: "#dce8f8",
  fontSize: 12,
};
// Recharts aplica itemStyle/labelStyle com cor preta por padrão, sobrescrevendo
// o `color` do contentStyle — por isso precisam ser definidos à parte.
const TOOLTIP_ITEM_STYLE = { color: "#dce8f8" };
const TOOLTIP_LABEL_STYLE = { color: "#7ec8f8", fontWeight: 600 };

const DIST_BUCKETS = [
  { name: "< 500 km",       min: 0,    max: 500 },
  { name: "500–1000 km",    min: 500,  max: 1000 },
  { name: "1000–2000 km",   min: 1000, max: 2000 },
  { name: "2000–3000 km",   min: 2000, max: 3000 },
  { name: "> 3000 km",      min: 3000, max: Infinity },
];

const TIPO_COLORS = { regional: "#4cd964", nacional: "#3498db", hub_intra: "#f39c12" };

export default function AirportDashboard({ minDegree = 1 }) {
  const { filteredNOS, filteredARSTAS, avgDist, maxGrau, numRegions } = useMemo(() => {
    const filteredNOS = NOS.filter(n => n.grau >= minDegree);
    const visibleIds = new Set(filteredNOS.map(n => n.iata));
    const filteredARSTAS = ARESTAS.filter(a => visibleIds.has(a.from) && visibleIds.has(a.to));
    const totalDist = filteredARSTAS.reduce((s, a) => s + a.peso, 0);
    const avgDist = filteredARSTAS.length ? totalDist / filteredARSTAS.length : 0;
    const maxGrau = filteredNOS.length ? Math.max(...filteredNOS.map(n => n.grau)) : 0;
    const numRegions = new Set(filteredNOS.map(n => n.regiao)).size;
    return { filteredNOS, filteredARSTAS, avgDist, maxGrau, numRegions };
  }, [minDegree]);

  // Chart data
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

  // Dynamic region cards
  const regionCards = useMemo(() =>
    Object.entries(COR_REG)
      .map(([reg, color]) => ({
        name: reg,
        color,
        airports: filteredNOS.filter(n => n.regiao === reg).map(n => n.iata).join(", "),
        count: filteredNOS.filter(n => n.regiao === reg).length,
      }))
      .filter(r => r.count > 0),
    [filteredNOS]);

  return (
    <div className="ad-root">
      <header className="ad-header">
        <h1>Malha Aérea Brasileira — Dashboard</h1>
        <p className="ad-subtitle">
          Análise estrutural da rede de aeroportos · Parte 1 · Teoria dos Grafos 2026.1
          {minDegree > 1 && (
            <span className="ad-filter-badge"> · Filtro: grau ≥ {minDegree}</span>
          )}
        </p>
      </header>

      {/* ── STATS ── */}
      <section className="ad-stats">
        <div className="ad-card">
          <div className="ad-card-icon">✈</div>
          <div className="ad-card-value">{filteredNOS.length}</div>
          <div className="ad-card-label">Aeroportos</div>
          <div className="ad-card-sub">de 20 totais</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-icon">🛤</div>
          <div className="ad-card-value">{filteredARSTAS.length}</div>
          <div className="ad-card-label">Conexões</div>
          <div className="ad-card-sub">de 77 totais</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-icon">🗺</div>
          <div className="ad-card-value">{numRegions}</div>
          <div className="ad-card-label">Regiões</div>
          <div className="ad-card-sub">N · NE · CO · SE · S</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-icon">📏</div>
          <div className="ad-card-value">~{Math.round(avgDist).toLocaleString("pt-BR")} km</div>
          <div className="ad-card-label">Distância média</div>
          <div className="ad-card-sub">por rota visível</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-icon">⭐</div>
          <div className="ad-card-value">{maxGrau}</div>
          <div className="ad-card-label">Grau máximo</div>
          <div className="ad-card-sub">{filteredNOS.filter(n => n.grau === maxGrau).map(n => n.iata).join(" · ")}</div>
        </div>
      </section>

      {/* ── REGIÕES ── */}
      <section className="ad-section">
        <h2>Distribuição por Região</h2>
        <div className="ad-region-grid">
          {regionCards.map(r => (
            <div className="ad-region-card" key={r.name} style={{ borderLeft: `4px solid ${r.color}` }}>
              <div className="ad-region-name" style={{ color: r.color }}>{r.name}</div>
              <div className="ad-region-count">{r.count} aeroporto{r.count !== 1 ? "s" : ""}</div>
              <div className="ad-region-airports">{r.airports || "—"}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── GRÁFICOS DINÂMICOS ── */}
      <section className="ad-section">
        <h2>Análises Gráficas</h2>
        <div className="ad-charts-grid">

          {/* Grau por aeroporto */}
          <div className="ad-chart-card">
            <h3>Grau dos aeroportos visíveis</h3>
            <p className="ad-chart-desc">Número de conexões por aeroporto — identifica os hubs da malha filtrada.</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={degreeData} margin={{ left: -10, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,163,211,0.12)" />
                <XAxis dataKey="name" stroke="#7ec8f8" fontSize={11} tick={{ fill: "#a8c4e0" }} />
                <YAxis stroke="#7ec8f8" fontSize={11} tick={{ fill: "#a8c4e0" }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  formatter={(v) => [`${v} conexões`, "Grau"]}
                />
                <Bar dataKey="grau" radius={[4, 4, 0, 0]}>
                  {degreeData.map((entry, i) => (
                    <Cell key={i} fill={entry.cor} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pizza por região */}
          <div className="ad-chart-card">
            <h3>Aeroportos por região</h3>
            <p className="ad-chart-desc">Proporção de aeroportos visíveis em cada região geográfica do Brasil.</p>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={regionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  outerRadius={90}
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={{ stroke: "rgba(168,196,224,0.5)" }}
                  fontSize={11}
                >
                  {regionData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  formatter={(v) => [`${v} aeroportos`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Histograma de distâncias */}
          <div className="ad-chart-card">
            <h3>Histograma de distâncias</h3>
            <p className="ad-chart-desc">Frequência de rotas visíveis agrupadas por faixa de distância em km.</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={distData} margin={{ left: -10, right: 8, top: 4, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,163,211,0.12)" />
                <XAxis dataKey="name" stroke="#7ec8f8" fontSize={10} tick={{ fill: "#a8c4e0" }} angle={-12} textAnchor="end" height={50} />
                <YAxis stroke="#7ec8f8" fontSize={11} tick={{ fill: "#a8c4e0" }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  formatter={(v) => [`${v} rota${v !== 1 ? "s" : ""}`, "Quantidade"]}
                />
                <Bar dataKey="count" fill="#4ba3d3" fillOpacity={0.85} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tipo de rota */}
          <div className="ad-chart-card">
            <h3>Conexões por tipo de rota</h3>
            <p className="ad-chart-desc">Distribuição das rotas visíveis entre regionais, nacionais e hub intrarregionais.</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tipoData} margin={{ left: -10, right: 8, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(75,163,211,0.12)" />
                <XAxis dataKey="name" stroke="#7ec8f8" fontSize={11} tick={{ fill: "#a8c4e0" }} />
                <YAxis stroke="#7ec8f8" fontSize={11} tick={{ fill: "#a8c4e0" }} />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  itemStyle={TOOLTIP_ITEM_STYLE}
                  labelStyle={TOOLTIP_LABEL_STYLE}
                  formatter={(v) => [`${v} rota${v !== 1 ? "s" : ""}`, "Quantidade"]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tipoData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── INSIGHTS ── */}
      <section className="ad-section ad-section-last">
        <h2>Insights da Rede</h2>
        <AirportInsights filteredNOS={filteredNOS} filteredARSTAS={filteredARSTAS} minDegree={minDegree} />
      </section>
    </div>
  );
}

function AirportInsights({ filteredNOS, filteredARSTAS, minDegree }) {
  const insights = useMemo(() => {
    if (!filteredNOS.length) return [];

    const result = [];
    const n = filteredNOS.length;
    const m = filteredARSTAS.length;
    const maxGrauVal = Math.max(...filteredNOS.map(x => x.grau));
    const hubs = filteredNOS.filter(x => x.grau === maxGrauVal).map(x => x.iata);
    const avgDist = m ? (filteredARSTAS.reduce((s, a) => s + a.peso, 0) / m).toFixed(0) : 0;
    const maxEdge = filteredARSTAS.length ? filteredARSTAS.reduce((mx, a) => a.peso > mx.peso ? a : mx, filteredARSTAS[0]) : null;
    const minEdge = filteredARSTAS.length ? filteredARSTAS.reduce((mn, a) => a.peso < mn.peso ? a : mn, filteredARSTAS[0]) : null;
    const density = n > 1 ? (2 * m / (n * (n - 1))).toFixed(2) : "—";
    const regionCounts = {};
    filteredNOS.forEach(x => { regionCounts[x.regiao] = (regionCounts[x.regiao] ?? 0) + 1; });
    const topRegion = Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0];

    result.push({
      icon: "✈",
      title: "Hubs concentram conectividade",
      text: `${hubs.join(", ")} ${hubs.length > 1 ? "têm" : "tem"} grau ${maxGrauVal}, sendo ${hubs.length > 1 ? "os maiores hubs" : "o maior hub"} da malha filtrada. ${n < 20 ? `Visíveis: ${n}/20 aeroportos com grau ≥ ${minDegree}.` : "Todos os 20 aeroportos estão visíveis."}`,
    });

    if (topRegion) {
      result.push({
        icon: "🗺",
        title: "Distribuição regional",
        text: `A região ${topRegion[0]} lidera com ${topRegion[1]} aeroporto${topRegion[1] > 1 ? "s" : ""} visível${topRegion[1] > 1 ? "s" : ""}. ${Object.entries(regionCounts).map(([r, c]) => `${r}: ${c}`).join(" · ")}.`,
      });
    }

    if (minEdge && maxEdge) {
      result.push({
        icon: "📏",
        title: "Extremos de distância",
        text: `Rota mais curta visível: ${minEdge.from} ↔ ${minEdge.to} (${minEdge.peso.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} km). Mais longa: ${maxEdge.from} ↔ ${maxEdge.to} (${maxEdge.peso.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} km). Média: ~${Number(avgDist).toLocaleString("pt-BR")} km.`,
      });
    }

    result.push({
      icon: "⚖",
      title: "Densidade do grafo filtrado",
      text: `Com ${n} nó${n > 1 ? "s" : ""} e ${m} aresta${m > 1 ? "s" : ""}, a densidade é ~${density} — ${Number(density) >= 0.5 ? "acima da metade do máximo possível, indicando boa conectividade." : Number(density) >= 0.3 ? "moderada, com múltiplos caminhos alternativos." : "esparsa, refletindo a seleção de hubs isolados."}`,
    });

    const tipoCount = { regional: 0, nacional: 0, hub_intra: 0 };
    filteredARSTAS.forEach(a => { tipoCount[a.tipo] = (tipoCount[a.tipo] ?? 0) + 1; });
    const topTipo = Object.entries(tipoCount).sort((a, b) => b[1] - a[1])[0];
    if (topTipo) {
      result.push({
        icon: "🔗",
        title: "Tipo de rota predominante",
        text: `Das ${m} rotas visíveis, ${topTipo[1]} são do tipo ${topTipo[0] === "regional" ? "regional" : topTipo[0] === "nacional" ? "nacional" : "hub intrarregional"} (${Math.round(topTipo[1] / m * 100)}%). Regional: ${tipoCount.regional}, Nacional: ${tipoCount.nacional}, Hub: ${tipoCount.hub_intra}.`,
      });
    }

    result.push({
      icon: "🧭",
      title: "Caminhos mínimos (Dijkstra)",
      text: minDegree <= 11
        ? "REC → POA usa rota direta (2.963 km). MAO → GRU também direto (2.698 km). A rede evita escalas desnecessárias graças à conectividade entre hubs."
        : "Com o filtro atual, alguns caminhos pré-calculados ficam ocultos. Reduza o grau mínimo para ver os caminhos Dijkstra completos.",
    });

    return result;
  }, [filteredNOS, filteredARSTAS, minDegree]);

  if (!insights.length) {
    return <p className="ad-section-desc">Nenhum aeroporto visível com o filtro atual.</p>;
  }

  return (
    <div className="ad-insights-grid">
      {insights.map((ins, i) => (
        <div className="ad-insight-card" key={i}>
          <div className="ad-insight-icon">{ins.icon}</div>
          <div className="ad-insight-body">
            <div className="ad-insight-title">{ins.title}</div>
            <div className="ad-insight-text">{ins.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
