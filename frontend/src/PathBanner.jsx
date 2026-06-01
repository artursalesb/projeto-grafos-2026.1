/**
 * Banner sobreposto no topo do grafo quando um caminho calculado
 * (via Calculadora de Algoritmos) está sendo destacado.
 */

function fmtEUR(v) {
  if (v == null || isNaN(v)) return "—";
  if (v >= 1e6) return `€${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `€${(v / 1e3).toFixed(0)}k`;
  return `€${v.toFixed(0)}`;
}

const ALGO_LABEL = {
  BFS: "BFS",
  DFS: "DFS",
  Dijkstra: "Dijkstra",
  "Bellman-Ford": "Bellman-Ford",
};

export default function PathBanner({ pathInfo, missingEdges, onClear }) {
  if (!pathInfo) return null;

  const { algorithm, source, target, cost, hops, time_ms, has_negative_cycle, path } = pathInfo;

  return (
    <div className="path-banner">
      <div className="pb-algo">{ALGO_LABEL[algorithm] || algorithm}</div>
      <div className="pb-route">
        <span className="pb-club">{source}</span>
        <span className="pb-arrow">→</span>
        <span className="pb-club">{target}</span>
      </div>
      <div className="pb-metrics">
        {cost != null && <span className="pb-metric"><b>{fmtEUR(cost)}</b> custo</span>}
        {hops != null && <span className="pb-metric"><b>{hops}</b> hop{hops > 1 ? "s" : ""}</span>}
        {path && <span className="pb-metric"><b>{path.length}</b> nós</span>}
        {time_ms != null && <span className="pb-metric"><b>{time_ms.toFixed(2)}ms</b></span>}
        {has_negative_cycle && (
          <span className="pb-metric pb-warn">ciclo negativo</span>
        )}
      </div>
      {missingEdges > 0 && (
        <div className="pb-warning">
          Aviso: {missingEdges} aresta{missingEdges > 1 ? "s" : ""} do caminho fora do filtro
          de valor mínimo. Baixe o filtro para ver tudo.
        </div>
      )}
      <button className="pb-close" onClick={onClear} title="Limpar caminho destacado">
        ×
      </button>
    </div>
  );
}
