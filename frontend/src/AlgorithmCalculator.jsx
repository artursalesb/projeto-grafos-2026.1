import { useMemo, useState } from "react";
import { runAlgorithm } from "./algorithms.js";

function fmtEUR(v) {
  if (v == null || isNaN(v)) return "—";
  if (v >= 1e6) return `€${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `€${(v / 1e3).toFixed(0)}k`;
  return `€${v.toFixed(0)}`;
}

const ALGOS = [
  { id: "BFS", label: "BFS (largura, sem peso)" },
  { id: "DFS", label: "DFS (profundidade)" },
  { id: "DIJKSTRA", label: "Dijkstra (menor custo)" },
  { id: "BELLMAN", label: "Bellman-Ford (peso negativo)" },
];

export default function AlgorithmCalculator({ graph, rawGraph, onResult, onJumpToGraph }) {
  const [algo, setAlgo] = useState("DIJKSTRA");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [sourceQuery, setSourceQuery] = useState("");
  const [targetQuery, setTargetQuery] = useState("");
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [useFullGraph, setUseFullGraph] = useState(false);

  // Quando "useFullGraph" está marcado, roda sobre rawGraph (todas as arestas).
  // Senão, roda sobre o grafo filtrado (com filtros aplicados).
  // Fallback para objeto vazio para evitar crash em transições de loading.
  const EMPTY = { nodes: [], links: [] };
  const activeGraph =
    (useFullGraph && rawGraph) || graph || EMPTY;
  const allNodeIds = useMemo(() => {
    const src = rawGraph || graph;
    if (!src?.nodes) return [];
    return src.nodes.map((n) => n.id);
  }, [rawGraph, graph]);

  const filterNodes = (q) => {
    if (!q || q.length < 2) return [];
    const lq = q.toLowerCase();
    return allNodeIds
      .filter((id) => id.toLowerCase().includes(lq))
      .slice(0, 6);
  };

  const sourceSuggestions = useMemo(
    () => (source === sourceQuery ? [] : filterNodes(sourceQuery)),
    [sourceQuery, source, allNodeIds]
  );
  const targetSuggestions = useMemo(
    () => (target === targetQuery ? [] : filterNodes(targetQuery)),
    [targetQuery, target, allNodeIds]
  );

  const requiresTarget = algo === "DIJKSTRA" || algo === "BELLMAN";

  const run = () => {
    if (!source) return;
    if (requiresTarget && !target) return;
    setRunning(true);
    setTimeout(() => {
      const res = runAlgorithm(algo, activeGraph, source, target || null);
      setResult(res);
      onResult?.(res);
      setRunning(false);
    }, 30);
  };

  const jumpToGraph = () => {
    if (!result?.ok || !result.path?.length) return;
    onJumpToGraph?.({
      path: result.path,
      source,
      target,
      algorithm: result.algorithm,
      cost: result.cost,
      hops: result.hops ?? result.path.length - 1,
      time_ms: result.time_ms,
      has_negative_cycle: result.has_negative_cycle,
    });
  };

  return (
    <div className="calc">
      <div className="calc-row">
        <div className="calc-field">
          <label>Algoritmo</label>
          <select value={algo} onChange={(e) => setAlgo(e.target.value)}>
            {ALGOS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="calc-field calc-search-wrap">
          <label>Origem</label>
          <input
            type="text"
            value={sourceQuery}
            onChange={(e) => {
              setSourceQuery(e.target.value);
              setSource("");
            }}
            placeholder="Ex.: Barcelona"
          />
          {sourceSuggestions.length > 0 && (
            <ul className="calc-suggest">
              {sourceSuggestions.map((id) => (
                <li
                  key={id}
                  onClick={() => {
                    setSource(id);
                    setSourceQuery(id);
                  }}
                >
                  {id}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="calc-field calc-search-wrap">
          <label>
            Destino {requiresTarget ? "" : "(opcional)"}
          </label>
          <input
            type="text"
            value={targetQuery}
            onChange={(e) => {
              setTargetQuery(e.target.value);
              setTarget("");
            }}
            placeholder="Ex.: PSG"
          />
          {targetSuggestions.length > 0 && (
            <ul className="calc-suggest">
              {targetSuggestions.map((id) => (
                <li
                  key={id}
                  onClick={() => {
                    setTarget(id);
                    setTargetQuery(id);
                  }}
                >
                  {id}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          className="calc-run"
          onClick={run}
          disabled={running || !source || (requiresTarget && !target)}
        >
          {running ? "Calculando…" : "Calcular"}
        </button>
      </div>

      <div className="calc-meta">
        <label className="calc-full-toggle">
          <input
            type="checkbox"
            checked={useFullGraph}
            onChange={(e) => setUseFullGraph(e.target.checked)}
            disabled={!rawGraph}
          />
          <span>Usar grafo completo (ignora filtros)</span>
        </label>
        <span className="calc-scope">
          Calculando sobre <b>{activeGraph.nodes.length.toLocaleString("pt-BR")}</b> clubes
          {" e "}
          <b>{activeGraph.links.length.toLocaleString("pt-BR")}</b> transferências
          {useFullGraph ? " (sem filtros)" : " (com filtros)"}
        </span>
      </div>

      {result && (
        <div className={`calc-result ${result.ok ? "ok" : "err"}`}>
          {!result.ok ? (
            <>
              <div className="res-title">Erro: {result.error}</div>
              {result.error?.toLowerCase().includes("inalcanç") && !useFullGraph && rawGraph && (
                <div className="res-suggest">
                  Dica: o caminho pode existir mas estar fora dos filtros atuais.
                  <button
                    className="res-suggest-btn"
                    onClick={() => {
                      setUseFullGraph(true);
                      setTimeout(run, 50);
                    }}
                  >
                    Tentar no grafo completo
                  </button>
                </div>
              )}
              {result.time_ms != null && (
                <div className="res-meta">tempo: {result.time_ms.toFixed(2)} ms</div>
              )}
            </>
          ) : (
            <>
              <div className="res-title">
                {result.algorithm}: {result.source}
                {result.target ? ` → ${result.target}` : ""}
              </div>

              <div className="res-metrics">
                {result.cost != null && (
                  <span className="res-tag">custo: <b>{fmtEUR(result.cost)}</b></span>
                )}
                {result.hops != null && (
                  <span className="res-tag">saltos: <b>{result.hops}</b></span>
                )}
                {result.has_negative_cycle != null && (
                  <span className={`res-tag ${result.has_negative_cycle ? "warn" : ""}`}>
                    ciclo neg: <b>{result.has_negative_cycle ? "SIM" : "não"}</b>
                  </span>
                )}
                {result.has_cycle != null && (
                  <span className="res-tag">
                    ciclo no caminho: <b>{result.has_cycle ? "sim" : "não"}</b>
                  </span>
                )}
                {result.reachable != null && (
                  <span className="res-tag">
                    alcançáveis: <b>{result.reachable}</b>
                  </span>
                )}
                {result.visited != null && (
                  <span className="res-tag">
                    visitados: <b>{result.visited}</b>
                  </span>
                )}
                {result.nodes_visited != null && (
                  <span className="res-tag">
                    nós visit.: <b>{result.nodes_visited}</b>
                  </span>
                )}
                {result.edges_explored != null && (
                  <span className="res-tag">
                    arestas: <b>{result.edges_explored}</b>
                  </span>
                )}
                {result.edges_relaxed != null && (
                  <span className="res-tag">
                    relaxam.: <b>{result.edges_relaxed}</b>
                  </span>
                )}
                <span className="res-tag time">
                  tempo: <b>{result.time_ms.toFixed(2)} ms</b>
                </span>
              </div>

              {result.path?.length > 0 && (
                <div className="res-path">
                  <div className="res-path-label">Caminho:</div>
                  <div className="res-path-chain">
                    {result.path.map((n, i) => (
                      <span key={i}>
                        <span className="path-node">{n}</span>
                        {i < result.path.length - 1 && <span className="path-arrow"> → </span>}
                      </span>
                    ))}
                  </div>
                  <button className="res-jump" onClick={jumpToGraph}>
                    Ver caminho destacado no grafo
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
