import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import "./AirportGraph.css";

const NOS = [{"id":"REC","iata":"REC","cidade":"Recife","regiao":"Nordeste","grau":13,"densidade_ego":0.7033,"cor":"#e74c3c"},{"id":"SSA","iata":"SSA","cidade":"Salvador","regiao":"Nordeste","grau":13,"densidade_ego":0.7033,"cor":"#e74c3c"},{"id":"FOR","iata":"FOR","cidade":"Fortaleza","regiao":"Nordeste","grau":13,"densidade_ego":0.7033,"cor":"#e74c3c"},{"id":"NAT","iata":"NAT","cidade":"Natal","regiao":"Nordeste","grau":3,"densidade_ego":1.0,"cor":"#e74c3c"},{"id":"JPA","iata":"JPA","cidade":"João Pessoa","regiao":"Nordeste","grau":3,"densidade_ego":1.0,"cor":"#e74c3c"},{"id":"GRU","iata":"GRU","cidade":"São Paulo","regiao":"Sudeste","grau":12,"densidade_ego":0.7821,"cor":"#ffffff"},{"id":"CGH","iata":"CGH","cidade":"São Paulo","regiao":"Sudeste","grau":3,"densidade_ego":1.0,"cor":"#ffffff"},{"id":"GIG","iata":"GIG","cidade":"Rio de Janeiro","regiao":"Sudeste","grau":12,"densidade_ego":0.7821,"cor":"#ffffff"},{"id":"CNF","iata":"CNF","cidade":"Belo Horizonte","regiao":"Sudeste","grau":12,"densidade_ego":0.7821,"cor":"#ffffff"},{"id":"VIX","iata":"VIX","cidade":"Vitória","regiao":"Sudeste","grau":3,"densidade_ego":1.0,"cor":"#ffffff"},{"id":"BSB","iata":"BSB","cidade":"Brasília","regiao":"Centro-Oeste","grau":11,"densidade_ego":0.8485,"cor":"#f1c40f"},{"id":"GYN","iata":"GYN","cidade":"Goiânia","regiao":"Centro-Oeste","grau":1,"densidade_ego":1.0,"cor":"#f1c40f"},{"id":"CWB","iata":"CWB","cidade":"Curitiba","regiao":"Sul","grau":11,"densidade_ego":0.8636,"cor":"#9b59b6"},{"id":"FLN","iata":"FLN","cidade":"Florianópolis","regiao":"Sul","grau":2,"densidade_ego":1.0,"cor":"#9b59b6"},{"id":"POA","iata":"POA","cidade":"Porto Alegre","regiao":"Sul","grau":11,"densidade_ego":0.8636,"cor":"#9b59b6"},{"id":"MAO","iata":"MAO","cidade":"Manaus","regiao":"Norte","grau":12,"densidade_ego":0.7564,"cor":"#2ecc71"},{"id":"BEL","iata":"BEL","cidade":"Belém","regiao":"Norte","grau":12,"densidade_ego":0.7564,"cor":"#2ecc71"},{"id":"PVH","iata":"PVH","cidade":"Porto Velho","regiao":"Norte","grau":2,"densidade_ego":1.0,"cor":"#2ecc71"},{"id":"RBR","iata":"RBR","cidade":"Rio Branco","regiao":"Norte","grau":2,"densidade_ego":1.0,"cor":"#2ecc71"},{"id":"THE","iata":"THE","cidade":"Teresina","regiao":"Nordeste","grau":3,"densidade_ego":1.0,"cor":"#e74c3c"}];

const ARESTAS = [{"from":"REC","to":"NAT","peso":266.71,"tipo":"regional"},{"from":"REC","to":"JPA","peso":108.83,"tipo":"regional"},{"from":"REC","to":"THE","peso":936.95,"tipo":"regional"},{"from":"REC","to":"BSB","peso":1654.1,"tipo":"nacional"},{"from":"REC","to":"MAO","peso":2836.85,"tipo":"nacional"},{"from":"REC","to":"GRU","peso":2100.82,"tipo":"nacional"},{"from":"REC","to":"BEL","peso":1677.75,"tipo":"nacional"},{"from":"REC","to":"CNF","peso":1607.74,"tipo":"nacional"},{"from":"REC","to":"FOR","peso":627.12,"tipo":"hub_intra"},{"from":"REC","to":"CWB","peso":2453.9,"tipo":"nacional"},{"from":"REC","to":"POA","peso":2962.75,"tipo":"nacional"},{"from":"REC","to":"GIG","peso":1859.22,"tipo":"nacional"},{"from":"REC","to":"SSA","peso":649.46,"tipo":"hub_intra"},{"from":"SSA","to":"NAT","peso":858.17,"tipo":"regional"},{"from":"SSA","to":"JPA","peso":739.98,"tipo":"regional"},{"from":"SSA","to":"THE","peso":1002.66,"tipo":"regional"},{"from":"SSA","to":"BSB","peso":1083.74,"tipo":"nacional"},{"from":"SSA","to":"MAO","peso":2628.74,"tipo":"nacional"},{"from":"SSA","to":"GRU","peso":1451.36,"tipo":"nacional"},{"from":"SSA","to":"BEL","peso":1700.28,"tipo":"nacional"},{"from":"SSA","to":"CNF","peso":958.74,"tipo":"nacional"},{"from":"SSA","to":"FOR","peso":1016.0,"tipo":"hub_intra"},{"from":"SSA","to":"CWB","peso":1804.74,"tipo":"nacional"},{"from":"SSA","to":"POA","peso":2313.79,"tipo":"nacional"},{"from":"SSA","to":"GIG","peso":1217.24,"tipo":"nacional"},{"from":"FOR","to":"NAT","peso":414.93,"tipo":"regional"},{"from":"FOR","to":"JPA","peso":545.68,"tipo":"regional"},{"from":"FOR","to":"THE","peso":496.78,"tipo":"regional"},{"from":"FOR","to":"BSB","peso":1691.78,"tipo":"nacional"},{"from":"FOR","to":"MAO","peso":2390.01,"tipo":"nacional"},{"from":"FOR","to":"GRU","peso":2346.62,"tipo":"nacional"},{"from":"FOR","to":"BEL","peso":1136.08,"tipo":"nacional"},{"from":"FOR","to":"CNF","peso":1858.44,"tipo":"nacional"},{"from":"FOR","to":"CWB","peso":2672.63,"tipo":"nacional"},{"from":"FOR","to":"POA","peso":3204.09,"tipo":"nacional"},{"from":"FOR","to":"GIG","peso":2176.55,"tipo":"nacional"},{"from":"GRU","to":"CGH","peso":28.26,"tipo":"regional"},{"from":"GRU","to":"VIX","peso":729.6,"tipo":"regional"},{"from":"GRU","to":"BSB","peso":854.8,"tipo":"nacional"},{"from":"GRU","to":"MAO","peso":2697.86,"tipo":"nacional"},{"from":"GRU","to":"BEL","peso":2461.43,"tipo":"nacional"},{"from":"GRU","to":"CNF","peso":496.46,"tipo":"hub_intra"},{"from":"GRU","to":"CWB","peso":358.95,"tipo":"nacional"},{"from":"GRU","to":"POA","peso":865.52,"tipo":"nacional"},{"from":"GRU","to":"GIG","peso":336.79,"tipo":"hub_intra"},{"from":"CGH","to":"GIG","peso":359.67,"tipo":"regional"},{"from":"CGH","to":"CNF","peso":524.36,"tipo":"regional"},{"from":"GIG","to":"VIX","peso":417.72,"tipo":"regional"},{"from":"GIG","to":"BSB","peso":913.92,"tipo":"nacional"},{"from":"GIG","to":"MAO","peso":2847.97,"tipo":"nacional"},{"from":"GIG","to":"BEL","peso":2448.32,"tipo":"nacional"},{"from":"GIG","to":"CNF","peso":362.03,"tipo":"hub_intra"},{"from":"GIG","to":"CWB","peso":672.38,"tipo":"nacional"},{"from":"GIG","to":"POA","peso":1121.96,"tipo":"nacional"},{"from":"CNF","to":"VIX","peso":391.62,"tipo":"regional"},{"from":"CNF","to":"BSB","peso":590.86,"tipo":"nacional"},{"from":"CNF","to":"MAO","peso":2539.9,"tipo":"nacional"},{"from":"CNF","to":"BEL","peso":2086.55,"tipo":"nacional"},{"from":"CNF","to":"CWB","peso":846.18,"tipo":"nacional"},{"from":"CNF","to":"POA","peso":1361.98,"tipo":"nacional"},{"from":"BSB","to":"GYN","peso":162.62,"tipo":"regional"},{"from":"BSB","to":"MAO","peso":1949.05,"tipo":"nacional"},{"from":"BSB","to":"BEL","peso":1611.81,"tipo":"nacional"},{"from":"BSB","to":"CWB","peso":1082.28,"tipo":"nacional"},{"from":"BSB","to":"POA","peso":1605.15,"tipo":"nacional"},{"from":"CWB","to":"FLN","peso":245.47,"tipo":"regional"},{"from":"CWB","to":"MAO","peso":2758.85,"tipo":"nacional"},{"from":"CWB","to":"BEL","peso":2686.16,"tipo":"nacional"},{"from":"CWB","to":"POA","peso":533.68,"tipo":"hub_intra"},{"from":"FLN","to":"POA","peso":363.06,"tipo":"regional"},{"from":"POA","to":"MAO","peso":3140.19,"tipo":"nacional"},{"from":"POA","to":"BEL","peso":3193.92,"tipo":"nacional"},{"from":"MAO","to":"PVH","peso":761.11,"tipo":"regional"},{"from":"MAO","to":"RBR","peso":1152.31,"tipo":"regional"},{"from":"MAO","to":"BEL","peso":1299.19,"tipo":"hub_intra"},{"from":"BEL","to":"PVH","peso":1891.36,"tipo":"regional"},{"from":"BEL","to":"RBR","peso":2345.17,"tipo":"regional"}];

const CAMINHOS = {"REC-POA":{"origem":"REC","destino":"POA","custo":2962.75,"caminho":["REC","POA"]},"MAO-GRU":{"origem":"MAO","destino":"GRU","custo":2697.86,"caminho":["MAO","GRU"]}};
const COR_REG  = {"Norte":"#2ecc71","Nordeste":"#e74c3c","Centro-Oeste":"#f1c40f","Sudeste":"#ffffff","Sul":"#9b59b6"};

// Bright glow color used when a node is focused — one per region color
const FOCUS_BRIGHT = {
  "#e74c3c": "#ff2222",  // Nordeste — vermelho vivo
  "#2ecc71": "#00ff7a",  // Norte — verde vivo
  "#f1c40f": "#ffe000",  // Centro-Oeste — amarelo vivo
  "#ffffff": "#c8e8ff",  // Sudeste — branco azulado para contrastar no céu
  "#9b59b6": "#cc44ff",  // Sul — roxo vivo
};
const TIPO_LABEL = {"regional":"Regional","nacional":"Nacional","hub_intra":"Hub Intrarregional"};

// Geographic positions approximating real Brazil coordinates
// Mapped from lon/lat to canvas coordinates (Brazil: lon -73→-33, lat 5→-34)
const GEO_FX = {
  MAO: -140, BEL:  90,  PVH: -218, RBR: -296,
  FOR:  290, NAT:  328, JPA:  365, REC:  372, THE:  204, SSA:  294,
  BSB:  108, GYN:   68,
  VIX:  254, CNF:  182, GIG:  196, GRU:  130, CGH:  158,
  CWB:   76, FLN:   90, POA:   36,
};
const GEO_FY = {
  MAO: -206, BEL: -235, PVH: -104, RBR:  -83,
  FOR: -192, NAT: -168, JPA: -135, REC: -100, THE: -169, SSA:  -29,
  BSB:   20, GYN:   45,
  VIX:  104, CNF:   92, GIG:  149, GRU:  160, CGH:  195,
  CWB:  197, FLN:  237, POA:  278,
};

const GRAPH_DATA = {
  nodes: NOS.map(n => ({
    id: n.iata, iata: n.iata, cidade: n.cidade,
    regiao: n.regiao, grau: n.grau, cor: n.cor,
    fx: GEO_FX[n.iata], fy: GEO_FY[n.iata],
    x:  GEO_FX[n.iata], y:  GEO_FY[n.iata],
  })),
  links: ARESTAS.map((a, i) => ({ _id: i, source: a.from, target: a.to, peso: a.peso, tipo: a.tipo })),
};

function nodeSize(grau) { return 14 + grau * 2; }

function lid(l) {
  const s = typeof l.source === "object" ? l.source.id : l.source;
  const t = typeof l.target === "object" ? l.target.id : l.target;
  return `${s}|${t}`;
}

// Top-down airplane silhouette (nose pointing up, wings left/right)
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

  // Fuselage — pointed nose (top), tapered tail (bottom)
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

  // Main wings — swept back, spanning left/right
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

  // Horizontal tail stabilizers (smaller fins at the bottom)
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

export default function AirportGraph() {
  const fgRef   = useRef(null);
  const dims    = useWindowSize();

  // ── Dijkstra path state ──────────────────────────────────
  const [rotaAtiva,   setRotaAtiva]   = useState(null);
  const [pathNodes,   setPathNodes]   = useState(new Set());
  const [pathEndpts,  setPathEndpts]  = useState(new Set());
  const [pathEdgeIds, setPathEdgeIds] = useState(new Set());
  const [pathInfo,    setPathInfo]    = useState("");

  // ── Focus (click / search) ───────────────────────────────
  const [focusedIata, setFocusedIata] = useState(null);

  // ── Selected edge ────────────────────────────────────────
  const [selEdge, setSelEdge] = useState(null);

  // ── UI ───────────────────────────────────────────────────
  const [busca,       setBusca]       = useState("");
  const [sugestoes,   setSugestoes]   = useState([]);
  const [selMetric,   setSelMetric]   = useState("—");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── Neighbour set for focus mode ─────────────────────────
  const focusSet = useMemo(() => {
    if (!focusedIata) return null;
    const nodes = new Set([focusedIata]);
    const edgeLids = new Set();
    ARESTAS.forEach(a => {
      if (a.from === focusedIata) { nodes.add(a.to);   edgeLids.add(`${a.from}|${a.to}`); }
      if (a.to   === focusedIata) { nodes.add(a.from); edgeLids.add(`${a.from}|${a.to}`); }
    });
    return { nodes, edgeLids };
  }, [focusedIata]);

  // ── Selected-edge node ids ───────────────────────────────
  const selEdgeNodes = useMemo(() => {
    if (!selEdge) return null;
    const s = typeof selEdge.source === "object" ? selEdge.source.id : selEdge.source;
    const t = typeof selEdge.target === "object" ? selEdge.target.id : selEdge.target;
    return new Set([s, t]);
  }, [selEdge]);

  // ── Node state resolver ──────────────────────────────────
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

  // ── Paint callbacks ──────────────────────────────────────
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

    // place label below the plane's tail fins (≈ 0.95 × node size below centre)
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

  // ── Actions ──────────────────────────────────────────────
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
      ARESTAS.forEach(a => {
        if (a.from === iata) neighbors.add(a.to);
        if (a.to   === iata) neighbors.add(a.from);
      });
      fgRef.current.zoomToFit(500, 80, nd => neighbors.has(nd.id));
      // Cap zoom so small isolated nodes don't get absurdly zoomed in
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
    setSugestoes(NOS.filter(n => n.iata.includes(up) || n.cidade.toUpperCase().includes(up)).slice(0, 8));
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

  // ── Render ───────────────────────────────────────────────
  const selEdgeSrc = selEdge ? (typeof selEdge.source === "object" ? selEdge.source.id : selEdge.source) : null;
  const selEdgeTgt = selEdge ? (typeof selEdge.target === "object" ? selEdge.target.id : selEdge.target) : null;
  const selEdgeSrcNode = selEdgeSrc ? NOS.find(n => n.iata === selEdgeSrc) : null;
  const selEdgeTgtNode = selEdgeTgt ? NOS.find(n => n.iata === selEdgeTgt) : null;

  return (
    <div className="ag-root">
      <SkyBackground />

      <div className="ag-canvas">
        <ForceGraph2D
          ref={fgRef}
          graphData={GRAPH_DATA}
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
          nodeLabel={node => `✈ ${node.iata} — ${node.cidade}\nRegião: ${node.regiao}\nGrau: ${node.grau}`}
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
        <div className="ag-sub">20 aeroportos · grafo não-direcionado</div>

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
          {Object.entries(CAMINHOS).map(([k, info]) => (
            <button
              key={k}
              className={`ag-rota-btn ${rotaAtiva === k ? "active" : ""}`}
              onClick={() => toggleRota(k)}
            >
              {info.origem} → {info.destino}  ({info.custo} km)
            </button>
          ))}
          {pathInfo && <div className="ag-path-info">{pathInfo}</div>}
        </div>

        {/* Edge info panel */}
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
          <div className="ag-metric"><span>Aeroportos</span><span>20</span></div>
          <div className="ag-metric"><span>Conexões</span><span>77</span></div>
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
