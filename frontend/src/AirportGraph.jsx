import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import "./AirportGraph.css";
import {
  NOS, ARESTAS, CAMINHOS, COR_REG,
  GEO_FX, GEO_FY, TIPO_LABEL, FOCUS_BRIGHT,
} from "./airportData.js";
import { airportFicha } from "./airportInsightContext.js";

function nodeSize(grau) { return 14 + grau * 2; }

function lid(l) {
  const s = typeof l.source === "object" ? l.source.id : l.source;
  const t = typeof l.target === "object" ? l.target.id : l.target;
  return `${s}|${t}`;
}

function drawAirplane(ctx, x, y, size, color, state) {
  ctx.save();
  ctx.translate(x, y);
  const s = size / 20;
  ctx.scale(s, s);

  let fill = color;
  let alpha = 1;
  ctx.shadowBlur = 0;

  if (state === "focused")        { const fc = FOCUS_BRIGHT[color] ?? color; fill = fc; ctx.shadowColor = fc; ctx.shadowBlur = 22 / s; }
  else if (state === "neighbor")  { ctx.shadowColor = "#87ceeb"; ctx.shadowBlur = 8 / s; }
  else if (state === "pathEnd")   { fill = "#f39c12"; ctx.shadowColor = "#f39c12"; ctx.shadowBlur = 16 / s; }
  else if (state === "pathMid")   { fill = "#00d4aa"; ctx.shadowColor = "#00d4aa"; ctx.shadowBlur = 10 / s; }
  else if (state === "edgeNode")  { ctx.shadowColor = "#f39c12"; ctx.shadowBlur = 12 / s; }
  else if (state === "dimmed")    { alpha = 0.18; }

  ctx.globalAlpha = alpha;
  ctx.fillStyle = fill;
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 0.9;

  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.bezierCurveTo( 4, -12,  4.5, -5,  4,  2);
  ctx.bezierCurveTo( 3.5,  8,  2.5, 12,  2, 17);
  ctx.lineTo(-2, 17);
  ctx.bezierCurveTo(-2.5, 12, -3.5,  8, -4,  2);
  ctx.bezierCurveTo(-4.5, -5,  -4, -12,  0, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-4, -1);
  ctx.lineTo(-22,  8);
  ctx.lineTo(-19, 12);
  ctx.lineTo(-12,  9);
  ctx.lineTo( -4,  6);
  ctx.lineTo(  4,  6);
  ctx.lineTo( 12,  9);
  ctx.lineTo( 19, 12);
  ctx.lineTo( 22,  8);
  ctx.lineTo(  4, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-2, 12);
  ctx.lineTo(-10, 17);
  ctx.lineTo( -9, 20);
  ctx.lineTo( -2, 16);
  ctx.lineTo(  2, 16);
  ctx.lineTo(  9, 20);
  ctx.lineTo( 10, 17);
  ctx.lineTo(  2, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.restore();
}

function useWindowSize() {
  const [size, setSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight }));
  useEffect(() => {
    const h = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return size;
}

export default function AirportGraph({ minDegree = 1, onMinDegreeChange = () => {}, split = false }) {
  const fgRef   = useRef(null);
  const dims    = useWindowSize();

  const [rotaAtiva,   setRotaAtiva]   = useState(null);
  const [pathNodes,   setPathNodes]   = useState(new Set());
  const [pathEndpts,  setPathEndpts]  = useState(new Set());
  const [pathEdgeIds, setPathEdgeIds] = useState(new Set());
  const [pathInfo,    setPathInfo]    = useState("");

  const [focusedIata, setFocusedIata] = useState(null);
  const [selEdge,     setSelEdge]     = useState(null);

  const [busca,       setBusca]       = useState("");
  const [sugestoes,   setSugestoes]   = useState([]);
  const [selMetric,   setSelMetric]   = useState("—");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Filtered data based on minDegree ─────────────────────
  const filteredNOS = useMemo(() =>
    NOS.filter(n => n.grau >= minDegree), [minDegree]);

  const filteredARSTAS = useMemo(() => {
    const visibleIds = new Set(filteredNOS.map(n => n.iata));
    return ARESTAS.filter(a => visibleIds.has(a.from) && visibleIds.has(a.to));
  }, [filteredNOS]);

  const filteredGraphData = useMemo(() => ({
    nodes: filteredNOS.map(n => ({
      id: n.iata, iata: n.iata, cidade: n.cidade,
      regiao: n.regiao, grau: n.grau, cor: n.cor,
      fx: GEO_FX[n.iata], fy: GEO_FY[n.iata],
      x:  GEO_FX[n.iata], y:  GEO_FY[n.iata],
    })),
    links: filteredARSTAS.map((a, i) => ({ _id: i, source: a.from, target: a.to, peso: a.peso, tipo: a.tipo })),
  }), [filteredNOS, filteredARSTAS]);

  // Clear focus/path when the node/endpoint is filtered out
  useEffect(() => {
    const visibleIds = new Set(filteredNOS.map(n => n.iata));
    if (focusedIata && !visibleIds.has(focusedIata)) {
      setFocusedIata(null);
      setSelMetric("—");
    }
    if (rotaAtiva) {
      const cam = CAMINHOS[rotaAtiva]?.caminho ?? [];
      if (!cam.every(id => visibleIds.has(id))) {
        setRotaAtiva(null);
        setPathNodes(new Set());
        setPathEndpts(new Set());
        setPathEdgeIds(new Set());
        setPathInfo("");
      }
    }
  }, [filteredNOS, focusedIata, rotaAtiva]);

  // ── Neighbour set for focus mode ─────────────────────────
  const focusSet = useMemo(() => {
    if (!focusedIata) return null;
    const nodes = new Set([focusedIata]);
    const edgeLids = new Set();
    filteredARSTAS.forEach(a => {
      if (a.from === focusedIata) { nodes.add(a.to);   edgeLids.add(`${a.from}|${a.to}`); }
      if (a.to   === focusedIata) { nodes.add(a.from); edgeLids.add(`${a.from}|${a.to}`); }
    });
    return { nodes, edgeLids };
  }, [focusedIata, filteredARSTAS]);

  const selEdgeNodes = useMemo(() => {
    if (!selEdge) return null;
    const s = typeof selEdge.source === "object" ? selEdge.source.id : selEdge.source;
    const t = typeof selEdge.target === "object" ? selEdge.target.id : selEdge.target;
    return new Set([s, t]);
  }, [selEdge]);

  // Dados do aeroporto focado para o painel de informações.
  const focusedInfo = useMemo(() => {
    if (!focusedIata) return null;
    const node = NOS.find((n) => n.iata === focusedIata);
    if (!node) return null;
    // vizinhos diretos (a partir de TODAS as arestas, não só as filtradas)
    const vizinhos = [];
    for (const a of ARESTAS) {
      if (a.from === focusedIata) vizinhos.push(a.to);
      else if (a.to === focusedIata) vizinhos.push(a.from);
    }
    const isHub = node.grau >= 11;
    return {
      node,
      ficha: airportFicha(focusedIata),
      vizinhos: [...new Set(vizinhos)],
      isHub,
    };
  }, [focusedIata]);

  function nodeState(nodeId) {
    if (pathEndpts.has(nodeId))  return "pathEnd";
    if (pathNodes.has(nodeId))   return "pathMid";
    if (focusedIata === nodeId)  return "focused";
    if (focusSet?.nodes.has(nodeId)) return "neighbor";
    if (selEdgeNodes?.has(nodeId))   return "edgeNode";
    if (focusSet  && !focusSet.nodes.has(nodeId))   return "dimmed";
    if (pathNodes.size > 0 && !pathNodes.has(nodeId)) return "dimmed";
    if (selEdgeNodes && !selEdgeNodes.has(nodeId))    return "dimmed";
    return "normal";
  }

  const nodePaint = useCallback((node, ctx, scale) => {
    const st = nodeState(node.id);
    const s  = nodeSize(node.grau);
    drawAirplane(ctx, node.x, node.y, s, node.cor, st);

    const forceLabel = st !== "normal" && st !== "dimmed";
    if (scale < 2.5 && !forceLabel) return;

    const fontSize = Math.max(5, 12 / scale);
    const labelColor =
      st === "focused"  ? (FOCUS_BRIGHT[node.cor] ?? node.cor) :
      st === "pathEnd"  ? "#f39c12" :
      st === "pathMid"  ? "#00d4aa" :
      st === "edgeNode" ? "#f39c12" :
      "#fff";

    const labelY = node.y + s * 0.95 + 3;

    ctx.save();
    ctx.globalAlpha = st === "dimmed" ? 0.2 : 1;
    ctx.font = `700 ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.strokeStyle = "rgba(0,0,0,0.9)";
    ctx.lineWidth = 3 / scale;
    ctx.strokeText(node.iata, node.x, labelY);
    ctx.fillStyle = labelColor;
    ctx.fillText(node.iata, node.x, labelY);
    ctx.restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathNodes, pathEndpts, focusedIata, focusSet, selEdgeNodes]);

  const linkPaint = useCallback((link, ctx) => {
    const lId   = lid(link);
    const s     = typeof link.source === "object" ? link.source.id : link.source;
    const t     = typeof link.target === "object" ? link.target.id : link.target;
    const onPath   = pathEdgeIds.has(`${s}|${t}`) || pathEdgeIds.has(`${t}|${s}`);
    const isFocus  = focusSet?.edgeLids.has(lId) || focusSet?.edgeLids.has(`${t}|${s}`);
    const isSelEdge = selEdge === link;

    const dimmed =
      (pathNodes.size > 0  && !onPath) ||
      (focusSet            && !isFocus) ||
      (selEdgeNodes        && !isSelEdge);

    const stroke =
      onPath    ? "#00d4aa" :
      isSelEdge ? "#f39c12" :
      isFocus   ? "rgba(135,206,235,0.9)" :
      "rgba(90,120,150,0.55)";

    const width =
      onPath    ? 3.5 :
      isSelEdge ? 3 :
      isFocus   ? 1.8 :
      1.1;

    const sx = link.source.x, sy = link.source.y;
    const tx = link.target.x, ty = link.target.y;
    const dx = tx - sx, dy = ty - sy;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;

    ctx.save();
    if (dimmed) ctx.globalAlpha = 0.09;
    if (onPath || isSelEdge) { ctx.shadowColor = stroke; ctx.shadowBlur = 8; }

    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty); ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathNodes, pathEdgeIds, focusSet, selEdge, selEdgeNodes]);

  function clearAll() {
    setRotaAtiva(null); setPathNodes(new Set()); setPathEndpts(new Set());
    setPathEdgeIds(new Set()); setPathInfo("");
    setFocusedIata(null); setSelEdge(null);
    setBusca(""); setSugestoes([]); setSelMetric("—");
    if (fgRef.current) fgRef.current.zoomToFit(600, 60);
  }

  function focusNode(iata) {
    setRotaAtiva(null); setPathNodes(new Set()); setPathEndpts(new Set());
    setPathEdgeIds(new Set()); setPathInfo(""); setSelEdge(null);
    setFocusedIata(iata);
    const n = NOS.find(x => x.iata === iata);
    if (n) setSelMetric(`${iata} (${n.cidade})`);
    setTimeout(() => {
      if (!fgRef.current) return;
      const neighbors = new Set([iata]);
      filteredARSTAS.forEach(a => {
        if (a.from === iata) neighbors.add(a.to);
        if (a.to   === iata) neighbors.add(a.from);
      });
      fgRef.current.zoomToFit(500, 80, nd => neighbors.has(nd.id));
      setTimeout(() => {
        if (fgRef.current && fgRef.current.zoom() > 3.5) {
          fgRef.current.zoom(3.5, 250);
        }
      }, 600);
    }, 300);
  }

  function destacarRota(k) {
    setFocusedIata(null); setSelEdge(null);
    const info = CAMINHOS[k];
    const cam = info.caminho;
    const nodes = new Set(cam);
    const endpts = new Set([cam[0], cam[cam.length - 1]]);
    const edges = new Set();
    for (let i = 0; i < cam.length - 1; i++) edges.add(`${cam[i]}|${cam[i + 1]}`);
    setPathNodes(nodes); setPathEndpts(endpts); setPathEdgeIds(edges);
    setPathInfo(`${cam.join(" → ")}  ·  ${info.custo} km`);
    setRotaAtiva(k);
    setTimeout(() => {
      if (fgRef.current) fgRef.current.zoomToFit(600, 100, n => nodes.has(n.id));
    }, 350);
  }

  function toggleRota(k) {
    if (rotaAtiva === k) clearAll();
    else destacarRota(k);
  }

  function handleBusca(e) {
    const q = e.target.value;
    setBusca(q);
    if (!q.trim()) { setSugestoes([]); return; }
    const up = q.trim().toUpperCase();
    setSugestoes(filteredNOS.filter(n => n.iata.includes(up) || n.cidade.toUpperCase().includes(up)).slice(0, 8));
  }

  function selecionar(iata) {
    setSugestoes([]);
    setBusca(iata);
    focusNode(iata);
  }

  function handleEdgeClick(link) {
    setFocusedIata(null);
    setRotaAtiva(null); setPathNodes(new Set()); setPathEndpts(new Set());
    setPathEdgeIds(new Set()); setPathInfo("");
    setSelEdge(link);
    const s = typeof link.source === "object" ? link.source.id : link.source;
    const t = typeof link.target === "object" ? link.target.id : link.target;
    setSelMetric(`${s} ↔ ${t}`);
    setTimeout(() => {
      if (fgRef.current)
        fgRef.current.zoomToFit(600, 140, n => n.id === s || n.id === t);
    }, 300);
  }

  const selEdgeSrc = selEdge ? (typeof selEdge.source === "object" ? selEdge.source.id : selEdge.source) : null;
  const selEdgeTgt = selEdge ? (typeof selEdge.target === "object" ? selEdge.target.id : selEdge.target) : null;
  const selEdgeSrcNode = selEdgeSrc ? NOS.find(n => n.iata === selEdgeSrc) : null;
  const selEdgeTgtNode = selEdgeTgt ? NOS.find(n => n.iata === selEdgeTgt) : null;

  // Check which Dijkstra paths are available with current filter
  const visibleIataSet = useMemo(() => new Set(filteredNOS.map(n => n.iata)), [filteredNOS]);
  function rotaDisponivel(k) {
    return CAMINHOS[k].caminho.every(id => visibleIataSet.has(id));
  }

  return (
    <div className={`ag-root ${split ? "split" : ""}`}>
      <SkyBackground />

      <div className="ag-canvas">
        <ForceGraph2D
          ref={fgRef}
          graphData={filteredGraphData}
          width={dims.width}
          height={dims.height}
          backgroundColor="rgba(0,0,0,0)"
          nodeCanvasObject={nodePaint}
          nodeCanvasObjectMode={() => "replace"}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, nodeSize(node.grau) / 2 + 6, 0, 2 * Math.PI);
            ctx.fill();
          }}
          nodeLabel={node => `${node.iata} — ${node.cidade}\nRegião: ${node.regiao}\nGrau: ${node.grau}`}
          linkCanvasObject={linkPaint}
          linkCanvasObjectMode={() => "replace"}
          linkLabel={link => `${link.peso} km · ${TIPO_LABEL[link.tipo] ?? link.tipo}`}
          onNodeClick={node => focusNode(node.id)}
          onLinkClick={handleEdgeClick}
          onNodeDragEnd={node => { node.fx = node.x; node.fy = node.y; }}
          onBackgroundClick={clearAll}
          linkPointerAreaPaint={(link, color, ctx) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.moveTo(link.source.x, link.source.y);
            ctx.lineTo(link.target.x, link.target.y);
            ctx.stroke();
          }}
          cooldownTicks={60}
          warmupTicks={0}
          d3VelocityDecay={0.9}
          d3AlphaDecay={0.3}
        />
      </div>

      <button
        className={`ag-toggle ${sidebarOpen ? "open" : "closed"}`}
        onClick={() => setSidebarOpen(v => !v)}
        title={sidebarOpen ? "Recolher painel" : "Abrir painel"}
      >
        {sidebarOpen ? "‹" : "›"}
      </button>

      <aside className={`ag-sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <h1>✈ Malha Aérea BR</h1>
        <div className="ag-sub">Grafo não-direcionado · {filteredNOS.length} aeroportos · {filteredARSTAS.length} rotas</div>

        <div className="ag-panel">
          <h3>Legenda — Regiões</h3>
          <div className="ag-legend">
            {Object.entries(COR_REG).map(([reg, cor]) => (
              <div key={reg} className="ag-legend-item">
                <span className="ag-dot" style={{ background: cor }} />
                <span>{reg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filtro de grau (slider) ── */}
        <div className="ag-panel">
          <h3>Conexões mínimas por aeroporto</h3>
          <div className="ag-filter-label">
            <span>Grau mínimo</span>
            <span className="ag-filter-value">≥ {minDegree}</span>
          </div>
          <input
            className="ag-range"
            type="range"
            min={1}
            max={13}
            step={1}
            value={minDegree}
            onChange={e => onMinDegreeChange(parseInt(e.target.value))}
          />
          <div className="ag-filter-counts">
            <span>{filteredNOS.length} / 20 aeroportos</span>
            <span>{filteredARSTAS.length} / 77 rotas</span>
          </div>
        </div>

        <div className="ag-panel">
          <h3>Buscar por código IATA</h3>
          <div className="ag-search-wrap">
            <input
              className="ag-input"
              placeholder="Ex.: GRU, REC, POA…"
              value={busca}
              onChange={handleBusca}
              onKeyDown={e => {
                if (e.key === "Escape") setSugestoes([]);
                if (e.key === "Enter" && sugestoes.length > 0) selecionar(sugestoes[0].iata);
              }}
              autoComplete="off"
            />
            {sugestoes.length > 0 && (
              <ul className="ag-auto">
                {sugestoes.map(n => (
                  <li key={n.iata} onClick={() => selecionar(n.iata)}>
                    <strong>{n.iata}</strong> — {n.cidade}
                    <span className="ag-sug-sub"> ({n.regiao})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="ag-panel">
          <h3>Caminhos obrigatórios (Dijkstra)</h3>
          {Object.entries(CAMINHOS).map(([k, info]) => {
            const disponivel = rotaDisponivel(k);
            return (
              <button
                key={k}
                className={`ag-rota-btn ${rotaAtiva === k ? "active" : ""} ${!disponivel ? "disabled" : ""}`}
                onClick={() => disponivel && toggleRota(k)}
                title={!disponivel ? "Aeroporto fora do filtro atual" : undefined}
              >
                {info.origem} → {info.destino}  ({info.custo} km)
                {!disponivel && <span className="ag-rota-hidden"> · oculto pelo filtro</span>}
              </button>
            );
          })}
          {pathInfo && <div className="ag-path-info">{pathInfo}</div>}
        </div>

        {focusedInfo && (
          <div className="ag-panel ag-airport-panel">
            <div className="ag-edge-head">
              <h3>Aeroporto selecionado</h3>
              <button
                className="ag-edge-close"
                onClick={() => { setFocusedIata(null); setSelMetric("—"); }}
              >
                ×
              </button>
            </div>
            <div className="ag-ap-title">
              <span
                className="ag-dot"
                style={{ background: COR_REG[focusedInfo.node.regiao] }}
              />
              <b>{focusedInfo.node.iata}</b> — {focusedInfo.node.cidade}
            </div>
            <div className="ag-ap-nome">{focusedInfo.ficha.nome}</div>

            <div className="ag-ap-badges">
              <span className={`ag-ap-badge ${focusedInfo.isHub ? "hub" : "regional"}`}>
                {focusedInfo.isHub ? "HUB" : "Regional"}
              </span>
              <span className="ag-ap-badge">Grau {focusedInfo.node.grau}</span>
              <span className="ag-ap-badge">{focusedInfo.node.regiao}</span>
              <span className="ag-ap-badge">
                ego {focusedInfo.node.densidade_ego}
              </span>
            </div>

            <div className="ag-ap-block">
              <div className="ag-ap-block-label">Papel na rede</div>
              <div className="ag-ap-block-text">{focusedInfo.ficha.papel}</div>
            </div>

            <div className="ag-ap-block">
              <div className="ag-ap-block-label">Na vida real</div>
              <div className="ag-ap-block-text">{focusedInfo.ficha.real}</div>
            </div>

            <div className="ag-ap-block">
              <div className="ag-ap-block-label">
                Conecta-se a {focusedInfo.vizinhos.length} aeroporto
                {focusedInfo.vizinhos.length !== 1 ? "s" : ""}
              </div>
              <div className="ag-ap-vizinhos">
                {focusedInfo.vizinhos.join(" · ")}
              </div>
            </div>
          </div>
        )}

        {selEdge && (
          <div className="ag-panel ag-edge-panel">
            <div className="ag-edge-head">
              <h3>Rota selecionada</h3>
              <button className="ag-edge-close" onClick={() => { setSelEdge(null); setSelMetric("—"); }}>×</button>
            </div>
            <div className="ag-edge-route">
              <span className="ag-edge-iata">{selEdgeSrc}</span>
              <span className="ag-edge-arrow">↔</span>
              <span className="ag-edge-iata">{selEdgeTgt}</span>
            </div>
            {selEdgeSrcNode && selEdgeTgtNode && (
              <div className="ag-edge-cities">
                {selEdgeSrcNode.cidade} · {selEdgeTgtNode.cidade}
              </div>
            )}
            <div className="ag-edge-rows">
              <div className="ag-edge-row">
                <span>Distância</span>
                <span>{selEdge.peso.toLocaleString("pt-BR")} km</span>
              </div>
              <div className="ag-edge-row">
                <span>Tipo</span>
                <span className={`ag-tipo ag-tipo-${selEdge.tipo}`}>
                  {TIPO_LABEL[selEdge.tipo] ?? selEdge.tipo}
                </span>
              </div>
              {selEdgeSrcNode && (
                <div className="ag-edge-row">
                  <span>Região</span>
                  <span>
                    <span className="ag-dot" style={{ background: COR_REG[selEdgeSrcNode.regiao], display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />
                    {selEdgeSrcNode.regiao}
                    {selEdgeSrcNode.regiao !== selEdgeTgtNode?.regiao && (
                      <> / <span className="ag-dot" style={{ background: COR_REG[selEdgeTgtNode.regiao], display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />{selEdgeTgtNode.regiao}</>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="ag-panel">
          <h3>Métricas</h3>
          <div className="ag-metric"><span>Aeroportos visíveis</span><span>{filteredNOS.length} / 20</span></div>
          <div className="ag-metric"><span>Conexões visíveis</span><span>{filteredARSTAS.length} / 77</span></div>
          <div className="ag-metric"><span>Selecionado</span><span>{selMetric}</span></div>
        </div>

        <button className="ag-reset" onClick={clearAll}>↺ Limpar destaques</button>
      </aside>
    </div>
  );
}

function SkyBackground() {
  return (
    <svg
      className="ag-sky"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#1a6fa8" />
          <stop offset="55%"  stopColor="#4ba3d3" />
          <stop offset="100%" stopColor="#87ceeb" />
        </linearGradient>
        <filter id="cloudBlur">   <feGaussianBlur stdDeviation="8" /> </filter>
        <filter id="cloudSoft">   <feGaussianBlur stdDeviation="4" /> </filter>
      </defs>
      <rect width="1600" height="900" fill="url(#skyGrad)" />
      <g filter="url(#cloudBlur)" opacity="0.45">
        <ellipse cx="200"  cy="140" rx="110" ry="50" fill="white" />
        <ellipse cx="280"  cy="120" rx="80"  ry="45" fill="white" />
        <ellipse cx="150"  cy="155" rx="70"  ry="35" fill="white" />
        <ellipse cx="900"  cy="80"  rx="130" ry="55" fill="white" />
        <ellipse cx="990"  cy="60"  rx="90"  ry="48" fill="white" />
        <ellipse cx="840"  cy="95"  rx="80"  ry="38" fill="white" />
        <ellipse cx="1380" cy="160" rx="120" ry="52" fill="white" />
        <ellipse cx="1460" cy="140" rx="85"  ry="44" fill="white" />
        <ellipse cx="1320" cy="175" rx="75"  ry="36" fill="white" />
        <ellipse cx="550"  cy="300" rx="100" ry="42" fill="white" />
        <ellipse cx="620"  cy="282" rx="72"  ry="38" fill="white" />
        <ellipse cx="1150" cy="260" rx="110" ry="46" fill="white" />
        <ellipse cx="1230" cy="240" rx="78"  ry="40" fill="white" />
      </g>
      <g filter="url(#cloudSoft)" opacity="0.82">
        <ellipse cx="200"  cy="137" rx="108" ry="48" fill="white" />
        <ellipse cx="278"  cy="118" rx="78"  ry="43" fill="white" />
        <ellipse cx="148"  cy="152" rx="68"  ry="33" fill="white" />
        <ellipse cx="900"  cy="77"  rx="128" ry="53" fill="white" />
        <ellipse cx="988"  cy="57"  rx="88"  ry="46" fill="white" />
        <ellipse cx="838"  cy="92"  rx="78"  ry="36" fill="white" />
        <ellipse cx="1380" cy="157" rx="118" ry="50" fill="white" />
        <ellipse cx="1458" cy="137" rx="83"  ry="42" fill="white" />
        <ellipse cx="1318" cy="172" rx="73"  ry="34" fill="white" />
        <ellipse cx="550"  cy="297" rx="98"  ry="40" fill="white" />
        <ellipse cx="618"  cy="279" rx="70"  ry="36" fill="white" />
        <ellipse cx="1150" cy="257" rx="108" ry="44" fill="white" />
        <ellipse cx="1228" cy="237" rx="76"  ry="38" fill="white" />
      </g>
      <g filter="url(#cloudSoft)" opacity="0.55">
        <ellipse cx="720"  cy="190" rx="60"  ry="25" fill="white" />
        <ellipse cx="760"  cy="178" rx="42"  ry="22" fill="white" />
        <ellipse cx="1550" cy="380" rx="55"  ry="22" fill="white" />
        <ellipse cx="60"   cy="350" rx="52"  ry="21" fill="white" />
        <ellipse cx="380"  cy="420" rx="65"  ry="26" fill="white" />
        <ellipse cx="418"  cy="408" rx="44"  ry="22" fill="white" />
      </g>
    </svg>
  );
}
