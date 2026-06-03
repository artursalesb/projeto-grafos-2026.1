import "./AirportDashboard.css";

const REGION_DATA = [
  { name: "Nordeste",     count: 6, airports: "REC, SSA, FOR, NAT, JPA, THE", color: "#e74c3c" },
  { name: "Sudeste",      count: 5, airports: "GRU, CGH, GIG, CNF, VIX",      color: "#ffffff" },
  { name: "Norte",        count: 4, airports: "MAO, BEL, PVH, RBR",            color: "#2ecc71" },
  { name: "Sul",          count: 3, airports: "CWB, FLN, POA",                 color: "#9b59b6" },
  { name: "Centro-Oeste", count: 2, airports: "BSB, GYN",                      color: "#f1c40f" },
];

const CHARTS = [
  {
    src: "/plot_01_barras_graus.png",
    title: "Graus dos aeroportos",
    desc: "Número de conexões (grau) por aeroporto — identifica os hubs principais da malha.",
  },
  {
    src: "/plot_02_pizza_regioes.png",
    title: "Distribuição por região",
    desc: "Proporção de aeroportos em cada região geográfica do Brasil.",
  },
  {
    src: "/plot_03_dispersao_rede.png",
    title: "Dispersão da rede",
    desc: "Topologia do grafo mostrando a estrutura de conectividade entre aeroportos.",
  },
  {
    src: "/plot_04_histograma_distancias.png",
    title: "Histograma de distâncias",
    desc: "Frequência de rotas agrupadas por faixa de distância em quilômetros.",
  },
];

const INSIGHTS = [
  {
    icon: "✈",
    title: "Hubs concentram conectividade",
    text: "GRU, GIG, CNF, REC, SSA e FOR têm grau ≥ 12, funcionando como hubs nacionais. Esses 6 aeroportos são responsáveis pela maioria das conexões de longa distância do país.",
  },
  {
    icon: "🗺",
    title: "Assimetria regional",
    text: "O Nordeste lidera em número de aeroportos (6), refletindo a importância turística e a extensão territorial da região. O Sul, com apenas 3, mantém alta densidade intra-regional.",
  },
  {
    icon: "📏",
    title: "Extremos de distância",
    text: "A rota mais curta é GRU ↔ CGH (28 km — dois aeroportos de São Paulo), enquanto a mais longa é POA ↔ BEL (3.194 km), cruzando praticamente todo o território brasileiro.",
  },
  {
    icon: "🔗",
    title: "Alta densidade ego dos pequenos",
    text: "Aeroportos regionais como NAT, JPA, CGH e GYN têm grau baixo (1–3), mas densidade ego = 1.0, indicando que seus poucos vizinhos estão todos interconectados entre si.",
  },
  {
    icon: "🧭",
    title: "Dijkstra revela caminhos ótimos",
    text: "REC → POA usa rota direta (2.963 km); MAO → GRU também direto (2.698 km). A rede evita escalas desnecessárias graças à conectividade entre hubs nacionais.",
  },
  {
    icon: "⚖",
    title: "Grafo esparso mas bem conectado",
    text: "Com 20 nós e 77 arestas, a densidade do grafo é ~0,40 — acima de um terço do máximo possível, garantindo múltiplos caminhos alternativos entre qualquer par de aeroportos.",
  },
];

export default function AirportDashboard() {
  return (
    <div className="ad-root">
      <header className="ad-header">
        <h1>Malha Aérea Brasileira — Dashboard</h1>
        <p className="ad-subtitle">Análise estrutural da rede de aeroportos · Parte 1 · Teoria dos Grafos 2026.1</p>
      </header>

      {/* ── STATS ── */}
      <section className="ad-stats">
        <div className="ad-card">
          <div className="ad-card-icon">✈</div>
          <div className="ad-card-value">20</div>
          <div className="ad-card-label">Aeroportos</div>
          <div className="ad-card-sub">vértices do grafo</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-icon">🛤</div>
          <div className="ad-card-value">77</div>
          <div className="ad-card-label">Conexões</div>
          <div className="ad-card-sub">arestas não-dirigidas</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-icon">🗺</div>
          <div className="ad-card-value">5</div>
          <div className="ad-card-label">Regiões</div>
          <div className="ad-card-sub">N · NE · CO · SE · S</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-icon">📏</div>
          <div className="ad-card-value">~1.190 km</div>
          <div className="ad-card-label">Distância média</div>
          <div className="ad-card-sub">por rota</div>
        </div>
        <div className="ad-card">
          <div className="ad-card-icon">⭐</div>
          <div className="ad-card-value">13</div>
          <div className="ad-card-label">Grau máximo</div>
          <div className="ad-card-sub">REC · SSA · FOR</div>
        </div>
      </section>

      {/* ── REGIÕES ── */}
      <section className="ad-section">
        <h2>Distribuição por Região</h2>
        <div className="ad-region-grid">
          {REGION_DATA.map(r => (
            <div className="ad-region-card" key={r.name} style={{ borderLeft: `4px solid ${r.color}` }}>
              <div className="ad-region-name" style={{ color: r.color }}>{r.name}</div>
              <div className="ad-region-count">{r.count} aeroportos</div>
              <div className="ad-region-airports">{r.airports}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── GRÁFICOS ── */}
      <section className="ad-section">
        <h2>Análises Gráficas</h2>
        <div className="ad-charts-grid">
          {CHARTS.map(c => (
            <div className="ad-chart-card" key={c.src}>
              <h3>{c.title}</h3>
              <p className="ad-chart-desc">{c.desc}</p>
              <img src={c.src} alt={c.title} className="ad-chart-img" />
            </div>
          ))}
        </div>
      </section>

      {/* ── ÁRVORE DE PERCURSO ── */}
      <section className="ad-section">
        <h2>Árvore de Percurso (Dijkstra)</h2>
        <p className="ad-section-desc">
          Caminhos mínimos calculados entre aeroportos com o algoritmo de Dijkstra.
          Clique nos nós para destacar a vizinhança do aeroporto selecionado.
        </p>
        <div className="ad-iframe-wrap">
          <iframe
            src="/arvore_percurso.html"
            className="ad-iframe"
            title="Árvore de Percurso — Dijkstra"
            loading="lazy"
          />
        </div>
      </section>

      {/* ── INSIGHTS ── */}
      <section className="ad-section ad-section-last">
        <h2>Insights da Rede</h2>
        <div className="ad-insights-grid">
          {INSIGHTS.map((ins, i) => (
            <div className="ad-insight-card" key={i}>
              <div className="ad-insight-icon">{ins.icon}</div>
              <div className="ad-insight-body">
                <div className="ad-insight-title">{ins.title}</div>
                <div className="ad-insight-text">{ins.text}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
