import { useMemo, useState } from "react";
import { runAlgorithm } from "./algorithms.js";

function fmtEUR(v) {
  if (v == null || isNaN(v)) return "—";
  const sign = v < 0 ? "−" : "";
  const a = Math.abs(v);
  if (a >= 1e6) return `${sign}€${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}€${(a / 1e3).toFixed(0)}k`;
  return `${sign}€${a.toFixed(0)}`;
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
  // Bellman-Ford: usar peso = fee - market_value (permite negativos)
  const [useProfit, setUseProfit] = useState(false);

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
      // Para Bellman-Ford com "peso = lucro", usamos fee - market_value
      // (pode ser negativo). Para os demais algoritmos, peso = fee (>= 0).
      const opts =
        algo === "BELLMAN" && useProfit
          ? { weightFn: (l) => (l.fee || 0) - (l.market_value || 0) }
          : {};
      const res = runAlgorithm(algo, activeGraph, source, target || null, opts);
      // Anexa a régua de pesos usada, para o resultado deixar claro
      if (res && res.ok) {
        res.weight_rule =
          algo === "BELLMAN" && useProfit
            ? "fee - market_value (permite negativos)"
            : "fee (>= 0)";
      }
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

        {algo === "BELLMAN" && (
          <label className="calc-full-toggle calc-profit-toggle">
            <input
              type="checkbox"
              checked={useProfit}
              onChange={(e) => setUseProfit(e.target.checked)}
            />
            <span>
              Usar peso = <b>fee − market_value</b> (permite negativos)
            </span>
          </label>
        )}

        <span className="calc-scope">
          Calculando sobre <b>{activeGraph.nodes.length.toLocaleString("pt-BR")}</b> clubes
          {" e "}
          <b>{activeGraph.links.length.toLocaleString("pt-BR")}</b> transferências
          {useFullGraph ? " (sem filtros)" : " (com filtros)"}
          {algo === "BELLMAN" && (
            <>
              {" · peso: "}
              <b>{useProfit ? "fee − market_value" : "fee (≥ 0)"}</b>
            </>
          )}
        </span>

        {algo === "BELLMAN" && useProfit && (
          <div className="calc-profit-hint">
            <div className="cph-line">
              <b>Como ler o peso = fee − market_value:</b>
            </div>
            <div className="cph-line">
              • <b className="neg">Negativo</b> = clube pagou <b>abaixo</b> do valor de
              mercado (bom negócio para o comprador).
            </div>
            <div className="cph-line">
              • <b className="pos">Positivo</b> = pagou <b>acima</b> do valor de mercado
              (negócio caro).
            </div>
            <div className="cph-line">
              <b>Custo do caminho</b> = soma desses saldos. Um caminho de custo
              negativo é uma cadeia de "bons negócios" em sequência; positivo, o
              contrário.
            </div>
            <div className="cph-line">
              <b>Ciclo negativo</b> = é possível sair de um clube, passar por
              vários e voltar com saldo total negativo. Na prática, indica um
              "loop de pechinchas" no mercado. Matematicamente, quando ele existe
              <b> não há caminho mínimo</b> (daria pra reduzir o custo
              infinitamente dando voltas), e o Bellman-Ford <b>detecta e avisa</b> —
              algo que o Dijkstra nem consegue calcular.
            </div>
            <div className="cph-line cph-tip">
              Dica: no <b>grafo completo</b> quase sempre existe ciclo negativo
              (metade das arestas é negativa). Para ver um <b>caminho de custo
              finito</b>, desmarque "grafo completo" e use o filtro de
              <b> valor mínimo</b> alto (a partir de <b>≥ €75M</b> os ciclos somem) —
              isso remove as transferências pequenas e quebra os ciclos.
            </div>
          </div>
        )}
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
                {result.weight_rule && (
                  <span className="res-tag rule">
                    peso: <b>{result.weight_rule}</b>
                  </span>
                )}
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

                  {/* Interpretação do custo quando peso = lucro */}
                  {result.weight_rule?.includes("market_value") &&
                    result.cost != null && (
                      <div className="res-cost-explain">
                        {result.cost < 0 ? (
                          <>
                            <b className="neg">Custo negativo:</b> esta cadeia de
                            transferências, somada, ficou <b>abaixo</b> do valor de
                            mercado — uma sequência de bons negócios para os
                            compradores.
                          </>
                        ) : result.cost > 0 ? (
                          <>
                            <b className="pos">Custo positivo:</b> mesmo escolhendo
                            o caminho mais barato, a soma dos saldos ficou
                            <b> acima</b> do valor de mercado — pagou-se caro ao
                            longo da rota.
                          </>
                        ) : (
                          <>
                            <b>Custo zero:</b> a soma dos saldos se equilibrou
                            (pagamentos abaixo e acima do mercado se cancelaram).
                          </>
                        )}
                      </div>
                    )}

                  <button className="res-jump" onClick={jumpToGraph}>
                    Ver caminho destacado no grafo
                  </button>
                </div>
              )}

              {/* Ciclo negativo: não existe caminho mínimo finito */}
              {result.has_negative_cycle && (
                <div className="res-negcycle">
                  <b>Ciclo negativo detectado.</b> Existe um "loop de pechinchas"
                  no mercado: uma sequência de transferências que sai de um clube,
                  passa por outros e volta com saldo total negativo (todos pagaram
                  abaixo do valor de mercado).
                  <div className="rnc-why">
                    <b>O que isso significa?</b> Não há caminho de custo mínimo:
                    percorrendo o ciclo, o custo cairia indefinidamente. O
                    Bellman-Ford <b>detecta isso e avisa</b> em vez de devolver uma
                    resposta errada — algo que o Dijkstra nem consegue calcular com
                    pesos negativos.
                  </div>
                  <div className="rnc-tip">
                    Para ver um caminho de custo finito, desmarque "grafo completo"
                    e suba o filtro de <b>valor mínimo</b> para <b>≥ €75M</b>: com poucas
                    transferências grandes o grafo deixa de ter ciclos negativos.
                  </div>
                  <button
                    className="res-jump"
                    onClick={() =>
                      onJumpToGraph?.({
                        path: [result.source, result.target],
                        source: result.source,
                        target: result.target,
                        algorithm: result.algorithm,
                        cost: null,
                        hops: 1,
                        time_ms: result.time_ms,
                        has_negative_cycle: true,
                      })
                    }
                  >
                    Ver origem e destino no grafo
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
