import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { getBallSprite } from "./ballSprite.js";

function sourceId(l) {
  return typeof l.source === "object" ? l.source.id : l.source;
}
function targetId(l) {
  return typeof l.target === "object" ? l.target.id : l.target;
}

function nodeRadius(node, highlightedClubId) {
  const base = Math.max(4, Math.min(14, 3 + Math.log2((node.degree ?? 1) + 1) * 1.3));
  if (highlightedClubId && node.id === highlightedClubId) return base * 1.6;
  return base;
}

function drawBall(node, ctx, highlightedClubId, pathInfo) {
  const sprite = getBallSprite();
  const onPath = pathInfo?.nodes.has(node.id);
  const isEndpoint =
    pathInfo &&
    (node.id === pathInfo.source || node.id === pathInfo.target);
  const dimmed = pathInfo && !onPath;

  // Bola maior quando é endpoint, normal-grande quando é do caminho, normal senão
  let r = nodeRadius(node, highlightedClubId);
  if (isEndpoint) r *= 1.7;
  else if (onPath) r *= 1.25;

  if (dimmed) ctx.globalAlpha = 0.18;
  ctx.drawImage(sprite, node.x - r, node.y - r, 2 * r, 2 * r);
  if (dimmed) ctx.globalAlpha = 1;

  // Aro dourado para club selecionado
  if (highlightedClubId && node.id === highlightedClubId) {
    ctx.strokeStyle = "rgba(255, 215, 0, 0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Aros ciano para nós do caminho (mais grosso nos endpoints)
  if (onPath) {
    ctx.shadowColor = "#00e5ff";
    ctx.shadowBlur = isEndpoint ? 18 : 10;
    ctx.strokeStyle = isEndpoint ? "#00e5ff" : "rgba(0, 229, 255, 0.85)";
    ctx.lineWidth = isEndpoint ? 3 : 2;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Badge com a posição no caminho (1, 2, 3, …)
    const pos = pathInfo.positions.get(node.id);
    if (pos != null) {
      const bx = node.x + r * 0.95;
      const by = node.y - r * 0.95;
      const br = Math.max(5, r * 0.55);
      ctx.fillStyle = isEndpoint ? "#00e5ff" : "rgba(0, 229, 255, 0.95)";
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#001a1f";
      ctx.font = `800 ${br * 1.2}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(pos + 1), bx, by + br * 0.05);
    }
  }
}

function drawNodeLabel(node, ctx, scale, highlightedClubId, pathInfo) {
  const isHighlighted = highlightedClubId && node.id === highlightedClubId;
  const onPath = pathInfo?.nodes.has(node.id);
  const isEndpoint =
    pathInfo &&
    (node.id === pathInfo.source || node.id === pathInfo.target);
  const dimmed = pathInfo && !onPath;

  // Quando há caminho, mostra label de todos os nós do caminho mesmo em zoom baixo
  const forceShow = onPath;
  if (scale < 3 && !isHighlighted && !forceShow) return;

  let r = nodeRadius(node, highlightedClubId);
  if (isEndpoint) r *= 1.7;
  else if (onPath) r *= 1.25;

  const fontSize =
    isEndpoint
      ? Math.max(9, 16 / scale)
      : isHighlighted || onPath
      ? Math.max(7, 13 / scale)
      : Math.max(2.5, 11 / scale);

  if (dimmed) ctx.globalAlpha = 0.3;
  ctx.fillStyle = isEndpoint ? "#00e5ff" : isHighlighted ? "#ffd700" : onPath ? "#bff7ff" : "rgba(255,255,255,0.97)";
  ctx.strokeStyle = "rgba(0,0,0,0.95)";
  ctx.lineWidth = ((isEndpoint || isHighlighted || onPath) ? 4 : 2.8) / scale;
  ctx.font = `${(isEndpoint || isHighlighted) ? 800 : onPath ? 700 : 600} ${fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.strokeText(node.name, node.x, node.y + r + 1);
  ctx.fillText(node.name, node.x, node.y + r + 1);
  if (dimmed) ctx.globalAlpha = 1;
}

function feeColor(fee) {
  if (fee >= 50_000_000) return "rgba(255,215,0,0.95)";
  if (fee >= 10_000_000) return "rgba(255,140,0,0.85)";
  if (fee >= 1_000_000) return "rgba(255,255,255,0.65)";
  return "rgba(255,255,255,0.4)";
}

function feeWidth(fee) {
  if (fee >= 50_000_000) return 2.2;
  if (fee >= 10_000_000) return 1.3;
  if (fee >= 1_000_000) return 0.7;
  return 0.45;
}

export default function GraphView({
  data,
  onEdgeClick,
  focusNode,
  focusLink,
  highlightLink,
  focusedClubId,
  highlightedClubId,
  highlightedPlayer,
  pathHighlight,
}) {
  const fgRef = useRef(null);
  const [hoverLink, setHoverLink] = useState(null);
  const dims = useWindowSize();

  const pathSet = useMemo(() => {
    if (!pathHighlight?.path?.length) return null;
    const nodes = new Set(pathHighlight.path);
    const edges = new Set();
    const positions = new Map();
    pathHighlight.path.forEach((id, i) => positions.set(id, i));
    for (let i = 0; i < pathHighlight.path.length - 1; i++) {
      edges.add(`${pathHighlight.path[i]}->${pathHighlight.path[i + 1]}`);
    }
    return {
      nodes,
      edges,
      positions,
      source: pathHighlight.path[0],
      target: pathHighlight.path[pathHighlight.path.length - 1],
      total: pathHighlight.path.length,
    };
  }, [pathHighlight]);

  useEffect(() => {
    if (!pathHighlight?.path?.length || !fgRef.current) return;
    const fg = fgRef.current;
    const ids = new Set(pathHighlight.path);
    const nodesOnPath = data.nodes.filter((n) => ids.has(n.id));
    if (nodesOnPath.length === 0) return;
    // O force-directed precisa de uns segundos para acomodar.
    // Faz vários ajustes de viewport conforme a simulação estabiliza.
    const total = pathHighlight.path.length;
    const padding = total <= 2 ? 200 : total <= 4 ? 120 : total <= 7 ? 80 : 50;
    const fits = [500, 1200, 2200, 3500]; // 4 zooms progressivos
    const timers = fits.map((delay) =>
      setTimeout(() => {
        try {
          fg.zoomToFit(800, padding, (n) => ids.has(n.id));
        } catch {}
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [pathHighlight, data.nodes]);

  const focusContext = useMemo(() => {
    if (!focusedClubId) return null;
    const incoming = new Set();
    const outgoing = new Set();
    data.links.forEach((l) => {
      const s = sourceId(l);
      const t = targetId(l);
      if (t === focusedClubId) incoming.add(s);
      if (s === focusedClubId) outgoing.add(t);
    });
    return { incoming, outgoing };
  }, [focusedClubId, data]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;

    if (focusedClubId && focusContext) {
      const { incoming, outgoing } = focusContext;
      let leftIdx = 0;
      let rightIdx = 0;
      let bottomIdx = 0;
      const SEP = 360;
      const ROW_GAP = 70;

      const inOnly = data.nodes.filter(
        (n) => n.id !== focusedClubId && incoming.has(n.id) && !outgoing.has(n.id)
      );
      const outOnly = data.nodes.filter(
        (n) => n.id !== focusedClubId && outgoing.has(n.id) && !incoming.has(n.id)
      );
      const both = data.nodes.filter(
        (n) => n.id !== focusedClubId && incoming.has(n.id) && outgoing.has(n.id)
      );

      const inRows = Math.ceil(Math.sqrt(inOnly.length || 1));
      const outRows = Math.ceil(Math.sqrt(outOnly.length || 1));

      data.nodes.forEach((n) => {
        if (n.id === focusedClubId) {
          n.fx = 0;
          n.fy = 0;
          n.x = 0;
          n.y = 0;
          return;
        }
        n.fx = undefined;
        n.fy = undefined;
        const isIn = incoming.has(n.id);
        const isOut = outgoing.has(n.id);
        if (isIn && isOut) {
          const col = bottomIdx % 8;
          const row = Math.floor(bottomIdx / 8);
          n.x = (col - 4) * 80;
          n.y = SEP + row * ROW_GAP + 80;
          bottomIdx++;
        } else if (isIn) {
          const row = leftIdx % inRows;
          const col = Math.floor(leftIdx / inRows);
          n.x = -SEP - col * ROW_GAP - 40;
          n.y = (row - inRows / 2) * ROW_GAP + 20;
          leftIdx++;
        } else if (isOut) {
          const row = rightIdx % outRows;
          const col = Math.floor(rightIdx / outRows);
          n.x = SEP + col * ROW_GAP + 40;
          n.y = (row - outRows / 2) * ROW_GAP + 20;
          rightIdx++;
        }
      });

      const charge = fg.d3Force("charge");
      if (charge) charge.strength(-260).distanceMax(900);
      const link = fg.d3Force("link");
      if (link) link.distance(110).strength(0.06);
      fg.d3ReheatSimulation();

      const node = data.nodes.find((n) => n.id === focusedClubId);
      if (node) {
        setTimeout(() => {
          fg.centerAt(0, 0, 800);
          fg.zoom(1.6, 800);
        }, 200);
      }
    } else {
      data.nodes.forEach((n) => {
        n.fx = undefined;
        n.fy = undefined;
      });
      const charge = fg.d3Force("charge");
      if (charge) charge.strength(-90).distanceMax(600);
      const link = fg.d3Force("link");
      if (link) link.distance(45).strength(0.18);
      fg.d3ReheatSimulation();
    }
  }, [focusedClubId, focusContext, data]);

  const linkPaint = useCallback(
    (link, ctx) => {
      const isHover = hoverLink === link;
      const isHighlight = highlightLink === link;

      const s = sourceId(link);
      const t = targetId(link);
      const isIncoming = highlightedClubId && t === highlightedClubId;
      const isOutgoing = highlightedClubId && s === highlightedClubId;
      const isPlayerEdge = highlightedPlayer && link.player === highlightedPlayer;
      const isPathEdge = pathSet?.edges.has(`${s}->${t}`);
      const pathActive = !!pathSet;
      const dimmed = pathActive && !isPathEdge;

      let stroke;
      let width;
      let glow = null;

      if (isPathEdge) {
        stroke = "#00e5ff";
        glow = "#00e5ff";
        width = 5;
      } else if (isHighlight) {
        stroke = "#4cd964";
        width = 3.4;
      } else if (isHover) {
        stroke = isIncoming ? "#00ff7a" : isOutgoing ? "#ff3b4a" : "#4cd964";
        width = 3;
      } else if (isPlayerEdge) {
        // Padrão uniforme para todas as transferências do jogador selecionado
        stroke = "rgba(255, 215, 0, 0.85)";
        width = 2;
      } else if (isIncoming) {
        stroke = "rgba(76, 217, 100, 0.85)";
        width = Math.max(1.2, feeWidth(link.fee));
      } else if (isOutgoing) {
        stroke = "rgba(255, 107, 107, 0.85)";
        width = Math.max(1.2, feeWidth(link.fee));
      } else {
        stroke = feeColor(link.fee);
        width = feeWidth(link.fee);
      }

      const sx = link.source.x;
      const sy = link.source.y;
      const tx = link.target.x;
      const ty = link.target.y;
      const dx = tx - sx;
      const dy = ty - sy;
      const len = Math.hypot(dx, dy);
      if (len < 0.001) return;
      const ux = dx / len;
      const uy = dy / len;

      const sr = nodeRadius(link.source, highlightedClubId) + 0.5;
      const tr = nodeRadius(link.target, highlightedClubId) + 1;
      const bx = sx + ux * sr;
      const by = sy + uy * sr;
      const ax = tx - ux * tr;
      const ay = ty - uy * tr;

      if (dimmed) ctx.globalAlpha = 0.12;
      if (glow) {
        ctx.shadowColor = glow;
        ctx.shadowBlur = 14;
      }
      ctx.strokeStyle = stroke;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(ax, ay);
      ctx.stroke();

      const arrowLen = Math.max(6, width * 3.2);
      const arrowWide = Math.PI / 7;
      const angle = Math.atan2(dy, dx);
      ctx.fillStyle = stroke;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(
        ax - arrowLen * Math.cos(angle - arrowWide),
        ay - arrowLen * Math.sin(angle - arrowWide)
      );
      ctx.lineTo(
        ax - arrowLen * Math.cos(angle + arrowWide),
        ay - arrowLen * Math.sin(angle + arrowWide)
      );
      ctx.closePath();
      ctx.fill();

      if (glow) {
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
      }
      if (dimmed) ctx.globalAlpha = 1;
      ctx.lineCap = "butt";
    },
    [hoverLink, highlightLink, highlightedClubId, highlightedPlayer, pathSet]
  );

  useEffect(() => {
    if (focusNode && fgRef.current && !focusedClubId) {
      const node = data.nodes.find((n) => n.id === focusNode);
      if (node && node.x != null) {
        fgRef.current.centerAt(node.x, node.y, 800);
        fgRef.current.zoom(4, 800);
      }
    }
  }, [focusNode, data.nodes, focusedClubId]);

  useEffect(() => {
    if (focusLink && fgRef.current) {
      const sx = focusLink.source?.x ?? 0;
      const sy = focusLink.source?.y ?? 0;
      const tx = focusLink.target?.x ?? 0;
      const ty = focusLink.target?.y ?? 0;
      fgRef.current.centerAt((sx + tx) / 2, (sy + ty) / 2, 800);
      fgRef.current.zoom(5, 800);
    }
  }, [focusLink]);

  return (
    <div className="graph-canvas">
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        width={dims.width}
        height={dims.height}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={3}
        nodeCanvasObject={(node, ctx, scale) => {
          drawBall(node, ctx, highlightedClubId, pathSet);
          drawNodeLabel(node, ctx, scale, highlightedClubId, pathSet);
        }}
        nodePointerAreaPaint={(node, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeRadius(node, highlightedClubId) + 3, 0, 2 * Math.PI);
          ctx.fill();
        }}
        linkCanvasObject={linkPaint}
        linkCanvasObjectMode={() => "replace"}
        linkPointerAreaPaint={(link, color, ctx) => {
          ctx.strokeStyle = color;
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(link.source.x, link.source.y);
          ctx.lineTo(link.target.x, link.target.y);
          ctx.stroke();
        }}
        onLinkClick={(link) => onEdgeClick(link)}
        onLinkHover={(link) => {
          setHoverLink(link || null);
          document.body.style.cursor = link ? "pointer" : "default";
        }}
        onNodeHover={(node) => {
          if (!hoverLink) {
            document.body.style.cursor = node ? "grab" : "default";
          }
        }}
        onNodeDragEnd={(node) => {
          node.fx = node.x;
          node.fy = node.y;
        }}
        cooldownTicks={250}
        warmupTicks={60}
        d3VelocityDecay={0.4}
        d3AlphaDecay={0.018}
        enableNodeDrag={true}
      />
    </div>
  );
}

function useWindowSize() {
  const [size, setSize] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));
  useEffect(() => {
    const handler = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return size;
}
