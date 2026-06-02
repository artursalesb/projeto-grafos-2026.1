import { useEffect, useMemo, useRef, useState } from "react";
import FieldBackground from "./FieldBackground.jsx";
import GraphView from "./GraphView.jsx";
import EdgeModal from "./EdgeModal.jsx";
import ClubPanel from "./ClubPanel.jsx";
import PlayerPanel from "./PlayerPanel.jsx";
import Dashboard from "./Dashboard.jsx";
import DashboardSidebar from "./DashboardSidebar.jsx";
import PathBanner from "./PathBanner.jsx";

const FEE_STEPS = [
  { label: "Todas", value: 0 },
  { label: "≥ €100k", value: 100_000 },
  { label: "≥ €500k", value: 500_000 },
  { label: "≥ €1M", value: 1_000_000 },
  { label: "≥ €5M", value: 5_000_000 },
  { label: "≥ €10M", value: 10_000_000 },
  { label: "≥ €25M", value: 25_000_000 },
  { label: "≥ €50M", value: 50_000_000 },
  { label: "≥ €100M", value: 100_000_000 },
];

function formatNum(n) {
  return n == null ? "…" : n.toLocaleString("pt-BR");
}

function sourceId(l) {
  return typeof l.source === "object" ? l.source.id : l.source;
}
function targetId(l) {
  return typeof l.target === "object" ? l.target.id : l.target;
}

export default function App() {
  const [raw, setRaw] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState("clube");
  const [suggestions, setSuggestions] = useState([]);
  const [focusNode, setFocusNode] = useState(null);
  const [focusLink, setFocusLink] = useState(null);
  const [highlightLink, setHighlightLink] = useState(null);
  const [feeStepIdx, setFeeStepIdx] = useState(3);
  const [league, setLeague] = useState("Todas");
  const [focusMode, setFocusMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("grafo"); // "grafo" | "split" | "dashboard"
  const [pathHighlight, setPathHighlight] = useState(null); // {path, ts}
  const [pathInfo, setPathInfo] = useState(null); // info completa do algoritmo p/ banner
  const searchTimer = useRef(null);

  useEffect(() => {
    fetch("/grafo.json")
      .then((r) => r.json())
      .then((payload) => setRaw(payload))
      .catch((err) => console.error("Falha ao carregar /grafo.json", err));
  }, []);

  const minFee = FEE_STEPS[feeStepIdx].value;

  const filtered = useMemo(() => {
    if (!raw) return null;

    let links = raw.links.filter((l) => l.fee >= minFee);

    if (league !== "Todas") {
      links = links.filter(
        (l) => l.source_league === league || l.target_league === league
      );
    }

    if (focusMode && selectedClub) {
      links = links.filter(
        (l) => sourceId(l) === selectedClub || targetId(l) === selectedClub
      );
    }

    if (focusMode && selectedPlayer) {
      // Mostra TODAS as transferências desse jogador (e somente delas)
      links = links.filter((l) => l.player === selectedPlayer);
    } else if (focusMode && highlightLink) {
      // Caso isolado: aresta destacada via clube ou clique direto, sem jogador
      links = links.filter((l) => l === highlightLink);
    }

    const used = new Set();
    links.forEach((l) => {
      used.add(sourceId(l));
      used.add(targetId(l));
    });

    if (focusMode && selectedClub) {
      used.add(selectedClub);
    }

    const nodes = raw.nodes.filter((n) => used.has(n.id));
    return { nodes, links };
  }, [raw, minFee, league, focusMode, selectedClub, highlightLink]);

  const hasSelection = !!(selectedClub || highlightLink || selectedPlayer);
  const focusedClubId = focusMode && selectedClub ? selectedClub : null;

  const handleSearchChange = (e) => {
    const v = e.target.value;
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!raw || v.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(() => {
      const q = v.trim().toLowerCase();
      if (searchMode === "clube") {
        const hits = raw.nodes
          .filter((n) => n.name.toLowerCase().includes(q))
          .slice(0, 8)
          .map((n) => ({
            kind: "clube",
            id: n.id,
            label: n.name,
            sub: `${n.league} · grau ${n.degree}`,
          }));
        setSuggestions(hits);
      } else {
        const seen = new Set();
        const hits = [];
        for (const l of raw.links) {
          if (hits.length >= 8) break;
          if (!l.player.toLowerCase().includes(q)) continue;
          const s = sourceId(l);
          const t = targetId(l);
          const key = `${l.player}-${s}-${t}-${l.date}`;
          if (seen.has(key)) continue;
          seen.add(key);
          hits.push({
            kind: "jogador",
            link: l,
            label: l.player,
            sub: `${s} → ${t} · €${(l.fee / 1_000_000).toFixed(1)}M`,
          });
        }
        setSuggestions(hits);
      }
    }, 120);
  };

  const pickSuggestion = (sug) => {
    setSuggestions([]);
    setSearch(sug.label);
    if (sug.kind === "clube") {
      setHighlightLink(null);
      setSelectedPlayer(null);
      setSelectedClub(sug.id);
      setFocusMode(true);
      setTimeout(() => {
        setFocusNode(sug.id);
        setTimeout(() => setFocusNode(null), 50);
      }, 250);
    } else {
      const live = sug.link;
      setSelectedClub(null);
      setSelectedPlayer(sug.link.player);
      setHighlightLink(live);
      setFocusMode(true);
      setTimeout(() => {
        setFocusLink(live);
        setTimeout(() => setFocusLink(null), 50);
      }, 250);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      pickSuggestion(suggestions[0]);
    }
    if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  const handleTransferPick = (link) => {
    setSelectedEdge(link);
  };

  const clearFocus = () => {
    setSelectedClub(null);
    setSelectedPlayer(null);
    setHighlightLink(null);
    setSearch("");
  };

  const pickAnotherTransfer = (link) => {
    setHighlightLink(link);
    setFocusLink(link);
    setTimeout(() => setFocusLink(null), 50);
  };

  const jumpFromDashboard = (info) => {
    setActiveTab("grafo");
    setPathHighlight({ path: info.path, ts: Date.now() });
    setPathInfo(info);
  };

  const clearPath = () => {
    setPathHighlight(null);
    setPathInfo(null);
  };

  // Conta quantas arestas do caminho NÃO estão no grafo filtrado
  const missingEdges = useMemo(() => {
    if (!pathInfo?.path || !filtered) return 0;
    const visible = new Set();
    for (const l of filtered.links) {
      visible.add(`${sourceId(l)}->${targetId(l)}`);
    }
    let missing = 0;
    for (let i = 0; i < pathInfo.path.length - 1; i++) {
      const key = `${pathInfo.path[i]}->${pathInfo.path[i + 1]}`;
      if (!visible.has(key)) missing++;
    }
    return missing;
  }, [pathInfo, filtered]);

  // Subgrafo SÓ com os nós e arestas do caminho calculado (independente dos filtros).
  // Usado para isolar o caminho visualmente quando o user clica "Ver no grafo".
  // Estratégia simples: deixa o force-directed posicionar livremente, igual ao
  // grafo principal. Garante 100% que as arestas conectam corretamente.
  const pathSubgraph = useMemo(() => {
    if (!pathHighlight?.path?.length || !raw) return null;
    const pathIds = new Set(pathHighlight.path);
    const edgeKeys = new Set();
    for (let i = 0; i < pathHighlight.path.length - 1; i++) {
      edgeKeys.add(`${pathHighlight.path[i]}->${pathHighlight.path[i + 1]}`);
    }
    // Nós como objetos de dados puros — sem fx/fy/vx/vy.
    // O force-directed do react-force-graph cuida do posicionamento.
    const nodes = raw.nodes
      .filter((n) => pathIds.has(n.id))
      .map((n) => ({
        id: n.id,
        name: n.name,
        degree: n.degree,
        league: n.league,
      }));
    // Links também como dados puros (source/target como strings) — o motor
    // resolve as referências para os objetos node corretamente.
    const seen = new Set();
    const links = [];
    for (const l of raw.links) {
      const s = sourceId(l);
      const t = targetId(l);
      const k = `${s}->${t}`;
      if (!edgeKeys.has(k) || seen.has(k)) continue;
      seen.add(k);
      links.push({
        source: s,
        target: t,
        player: l.player,
        fee: l.fee,
        market_value: l.market_value,
        season: l.season,
        date: l.date,
        source_league: l.source_league,
        target_league: l.target_league,
        peso_lucro: l.peso_lucro,
      });
    }
    return { nodes, links };
  }, [pathHighlight, raw]);

  // Grafo que de fato vai para a tela: subgrafo do caminho > grafo filtrado.
  const displayData = pathSubgraph || filtered;

  return (
    <div className="app">
      <nav className="top-tabs">
        <button
          className={activeTab === "grafo" ? "active" : ""}
          onClick={() => setActiveTab("grafo")}
        >
          Grafo
        </button>
        <button
          className={activeTab === "split" ? "active" : ""}
          onClick={() => setActiveTab("split")}
        >
          Split (grafo + gráficos)
        </button>
        <button
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
      </nav>

      {activeTab === "dashboard" && (
        <Dashboard graph={filtered} raw={raw} onJumpToGraph={jumpFromDashboard} />
      )}

      {(activeTab === "grafo" || activeTab === "split") && <FieldBackground />}

      {(activeTab === "grafo" || activeTab === "split") && (
        <div className={activeTab === "split" ? "graph-wrap split" : "graph-wrap"}>
          {displayData ? (
            <GraphView
              key={pathHighlight ? `path-${pathHighlight.ts}` : "main"}
              data={displayData}
              onEdgeClick={setSelectedEdge}
              focusNode={focusNode}
              focusLink={focusLink}
              highlightLink={highlightLink}
              focusedClubId={focusedClubId}
              highlightedClubId={selectedClub}
              highlightedPlayer={selectedPlayer}
              pathHighlight={pathHighlight}
            />
          ) : (
            <div className="loading">Carregando 17 mil transferências…</div>
          )}
        </div>
      )}

      {activeTab === "split" && (
        <DashboardSidebar
          graph={filtered}
          raw={raw}
          onJumpToGraph={jumpFromDashboard}
        />
      )}

      {(activeTab === "grafo" || activeTab === "split") && (
        <PathBanner
          pathInfo={pathInfo}
          missingEdges={missingEdges}
          onClear={clearPath}
        />
      )}

      {(activeTab === "grafo" || activeTab === "split") && (
        <button
          className={`sidebar-toggle ${sidebarOpen ? "open" : "closed"}`}
          onClick={() => setSidebarOpen((v) => !v)}
          title={sidebarOpen ? "Recolher painel" : "Abrir painel"}
          aria-label={sidebarOpen ? "Recolher painel" : "Abrir painel"}
        >
          {sidebarOpen ? "‹" : "›"}
        </button>
      )}

      {(activeTab === "grafo" || activeTab === "split") && (
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <h1>Mercado da Bola</h1>
        <div className="subtitle">Grafo das transferências (fee {">"} 0)</div>

        <div className="stats">
          <div className="stat">
            <div className="label">Vértices (clubes)</div>
            <div className="value">{formatNum(filtered?.nodes.length)}</div>
            <div className="stat-sub">de {formatNum(raw?.stats.nodes)}</div>
          </div>
          <div className="stat">
            <div className="label">Arestas (transf.)</div>
            <div className="value">{formatNum(filtered?.links.length)}</div>
            <div className="stat-sub">de {formatNum(raw?.stats.links)}</div>
          </div>
        </div>

        <div className="filter">
          <div className="filter-label">
            <span>Campeonato</span>
            {league !== "Todas" && (
              <span className="filter-value">{league}</span>
            )}
          </div>
          <select
            className="league-select"
            value={league}
            onChange={(e) => setLeague(e.target.value)}
          >
            <option value="Todas">Todas as ligas</option>
            {raw?.leagues
              .filter((name) => raw.league_counts[name])
              .map((name) => (
                <option key={name} value={name}>
                  {name} ({raw.league_counts[name]} clubes)
                </option>
              ))}
          </select>
        </div>

        <div className="search-modes">
          <button
            className={searchMode === "clube" ? "active" : ""}
            onClick={() => {
              setSearchMode("clube");
              setSuggestions([]);
            }}
          >
            Clube
          </button>
          <button
            className={searchMode === "jogador" ? "active" : ""}
            onClick={() => {
              setSearchMode("jogador");
              setSuggestions([]);
            }}
          >
            Jogador
          </button>
        </div>

        <div className="search-wrap">
          <input
            className="search"
            placeholder={
              searchMode === "clube"
                ? "Buscar clube (ex: Liverpool)"
                : "Buscar jogador (ex: Neymar)"
            }
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleKey}
          />
          {suggestions.length > 0 && (
            <ul className="suggestions">
              {suggestions.map((s, i) => (
                <li key={i} onClick={() => pickSuggestion(s)}>
                  <span className="sug-label">{s.label}</span>
                  <span className="sug-sub">{s.sub}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasSelection && (
          <div className="focus-toolbar">
            <label className="focus-toggle">
              <input
                type="checkbox"
                checked={focusMode}
                onChange={(e) => setFocusMode(e.target.checked)}
              />
              <span>
                Modo foco{" "}
                <span className="focus-sub">
                  (isola {selectedClub ? "vizinhos" : "essa transferência"})
                </span>
              </span>
            </label>
            {selectedClub && (
              <div className="focus-legend">
                <span className="legend-dot in"></span> chegou
                <span className="legend-dot out"></span> saiu
              </div>
            )}
            <button className="clear-focus" onClick={clearFocus}>
              Limpar seleção
            </button>
          </div>
        )}

        <div className="filter">
          <div className="filter-label">
            <span>Valor mínimo</span>
            <span className="filter-value">{FEE_STEPS[feeStepIdx].label}</span>
          </div>
          <input
            type="range"
            min={0}
            max={FEE_STEPS.length - 1}
            step={1}
            value={feeStepIdx}
            onChange={(e) => setFeeStepIdx(parseInt(e.target.value))}
          />
        </div>

        {selectedClub && raw && (
          <ClubPanel
            club={selectedClub}
            links={raw.links}
            onPickTransfer={handleTransferPick}
            onClose={() => setSelectedClub(null)}
          />
        )}

        {selectedPlayer && raw && (
          <PlayerPanel
            player={selectedPlayer}
            links={raw.links}
            activeLink={highlightLink}
            onPickTransfer={pickAnotherTransfer}
            onClose={() => {
              setSelectedPlayer(null);
              setHighlightLink(null);
            }}
          />
        )}

        <div className="hint">
          • Busque clube ou jogador → grafo isola só ele e suas relações
          <br />• Desmarque <b>Modo foco</b> para ver o grafo inteiro
          <br />• Clique numa aresta → modal
          <br />• Arraste qualquer bola para mover
        </div>
      </aside>
      )}

      <EdgeModal edge={selectedEdge} onClose={() => setSelectedEdge(null)} />
    </div>
  );
}
