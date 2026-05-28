import { useMemo } from "react";

function fmt(value) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${(value / 1_000).toFixed(0)}k`;
  return `€${value.toFixed(0)}`;
}

function sourceId(l) {
  return typeof l.source === "object" ? l.source.id : l.source;
}
function targetId(l) {
  return typeof l.target === "object" ? l.target.id : l.target;
}

export default function PlayerPanel({ player, links, activeLink, onPickTransfer, onClose }) {
  const transfers = useMemo(() => {
    const all = links.filter((l) => l.player === player);
    return [...all].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  }, [player, links]);

  const totalFee = transfers.reduce((s, l) => s + l.fee, 0);
  const activeKey = activeLink
    ? `${sourceId(activeLink)}-${targetId(activeLink)}-${activeLink.date}`
    : null;

  return (
    <div className="club-panel">
      <div className="club-head">
        <div>
          <div className="club-title">⚽ {player}</div>
          <div className="club-sub">{transfers.length} transferência(s)</div>
        </div>
        <button className="club-close" onClick={onClose} title="Fechar">
          ×
        </button>
      </div>

      <div className="club-stats" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="cs">
          <div className="cs-l">Transferências</div>
          <div className="cs-v">{transfers.length}</div>
        </div>
        <div className="cs">
          <div className="cs-l">Soma das fees</div>
          <div className="cs-v pos">{fmt(totalFee)}</div>
        </div>
      </div>

      <ul className="club-list" style={{ maxHeight: 380 }}>
        {transfers.length === 0 && <li className="empty">Nenhuma transferência.</li>}
        {transfers.map((l, i) => {
          const s = sourceId(l);
          const t = targetId(l);
          const key = `${s}-${t}-${l.date}`;
          const isActive = key === activeKey;
          return (
            <li
              key={i}
              onClick={() => onPickTransfer(l)}
              style={isActive ? {
                background: "rgba(76, 217, 100, 0.18)",
                borderLeft: "3px solid #4cd964",
              } : undefined}
            >
              <div className="li-top">
                <span className="dir in" style={{ background: "rgba(255,215,0,0.18)", color: "#ffd700" }}>
                  {isActive ? "● destacada" : `temporada ${l.season}`}
                </span>
                <span className="li-fee">{fmt(l.fee)}</span>
              </div>
              <div className="li-player">{s} → {t}</div>
              <div className="li-sub">
                {l.date}
                {l.market_value != null && <> · valor de mercado: {fmt(l.market_value)}</>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
