import { useEffect, useMemo, useRef, useState } from "react";
import FieldBackground from "./FieldBackground.jsx";
import GraphView from "./GraphView.jsx";
import EdgeModal from "./EdgeModal.jsx";
import ClubPanel from "./ClubPanel.jsx";

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

    if (focusMode && highlightLink) {
      const hs = sourceId(highlightLink);
      const ht = targetId(highlightLink);
      links = links.filter((l) => {
        const s = sourceId(l);
        const t = targetId(l);
        return (s === hs || s === ht) && (t === hs || t === ht);
      });
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

  const hasSelection = !!(selectedClub || highlightLink);
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
          const key = `${l.player}-${l.source}-${l.target}-${l.date}`;
          if (seen.has(key)) continue;
          seen.add(key);
          hits.push({
            kind: "jogador",
            link: l,
            label: l.player,
            sub: `${l.source} → ${l.target} · €${(l.fee / 1_000_000).toFixed(1)}M`,
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
      setSelectedClub(sug.id);
      setFocusMode(true);
      setTimeout(() => {
        setFocusNode(sug.id);
        setTimeout(() => setFocusNode(null), 50);
      }, 250);
    } else {
      const live = sug.link;
      setSelectedClub(null);
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
    setHighlightLink(null);
    setSearch("");
  };

  return (
    <div className="app">
      <FieldBackground />

      {filtered ? (
        <GraphView
          data={filtered}
          onEdgeClick={setSelectedEdge}
          focusNode={focusNode}
          focusLink={focusLink}
          highlightLink={highlightLink}
          focusedClubId={focusedClubId}
          highlightedClubId={selectedClub}
        />
      ) : (
        <div className="loading">⚽ Carregando 17 mil transferências…</div>
      )}

      <button
        className={`sidebar-toggle ${sidebarOpen ? "open" : "closed"}`}
        onClick={() => setSidebarOpen((v) => !v)}
        title={sidebarOpen ? "Recolher painel" : "Abrir painel"}
        aria-label={sidebarOpen ? "Recolher painel" : "Abrir painel"}
      >
        {sidebarOpen ? "‹" : "›"}
      </button>

      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <h1>⚽ Mercado da Bola</h1>
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
              ↺ Limpar seleção
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

        <div className="hint">
          • Busque clube ou jogador → grafo isola só ele e suas relações
          <br />• Desmarque <b>Modo foco</b> para ver o grafo inteiro
          <br />• Clique numa aresta → modal
          <br />• Arraste qualquer bola para mover
        </div>
      </aside>

      <EdgeModal edge={selectedEdge} onClose={() => setSelectedEdge(null)} />
    </div>
  );
}
