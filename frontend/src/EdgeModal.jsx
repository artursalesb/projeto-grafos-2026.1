function formatEUR(value) {
  if (value == null) return "—";
  if (value >= 1_000_000) return `€ ${(value / 1_000_000).toFixed(2)} M`;
  if (value >= 1_000) return `€ ${(value / 1_000).toFixed(0)} mil`;
  return `€ ${value.toFixed(0)}`;
}

export default function EdgeModal({ edge, onClose }) {
  if (!edge) return null;

  const source = typeof edge.source === "object" ? edge.source.id : edge.source;
  const target = typeof edge.target === "object" ? edge.target.id : edge.target;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>⚽ {edge.player}</h2>
        <div className="player-sub">
          Transferência · Temporada {edge.season}
        </div>

        <div className="fee">{formatEUR(edge.fee)}</div>

        <div className="row">
          <span className="k">De</span>
          <span className="v">{source}</span>
        </div>
        <div className="row">
          <span className="k">Para</span>
          <span className="v">{target}</span>
        </div>
        <div className="row">
          <span className="k">Data</span>
          <span className="v">{edge.date}</span>
        </div>
        <div className="row">
          <span className="k">Valor de mercado</span>
          <span className="v">{formatEUR(edge.market_value)}</span>
        </div>

        <button className="close" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
