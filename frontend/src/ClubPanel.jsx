import { useMemo, useState } from "react";

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

export default function ClubPanel({ club, links, onPickTransfer, onClose }) {
  const [order, setOrder] = useState("fee");
  const [tab, setTab] = useState("all");

  const data = useMemo(() => {
    const all = links.filter(
      (l) => sourceId(l) === club || targetId(l) === club
    );
    const out = all.filter((l) => sourceId(l) === club);
    const inb = all.filter((l) => targetId(l) === club);
    const spent = inb.reduce((s, l) => s + l.fee, 0);
    const earned = out.reduce((s, l) => s + l.fee, 0);
    return { all, out, inb, spent, earned, balance: earned - spent };
  }, [club, links]);

  const visible = useMemo(() => {
    let arr;
    if (tab === "in") arr = data.inb;
    else if (tab === "out") arr = data.out;
    else arr = data.all;
    arr = [...arr];
    if (order === "fee") arr.sort((a, b) => b.fee - a.fee);
    else if (order === "date") arr.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return arr;
  }, [data, tab, order]);

  return (
    <div className="club-panel">
      <div className="club-head">
        <div>
          <div className="club-title">{club}</div>
          <div className="club-sub">{data.all.length} transferências</div>
        </div>
        <button className="club-close" onClick={onClose} title="Fechar">
          ×
        </button>
      </div>

      <div className="club-stats">
        <div className="cs">
          <div className="cs-l">Entradas</div>
          <div className="cs-v">{data.inb.length}</div>
          <div className="cs-sub">{fmt(data.spent)}</div>
        </div>
        <div className="cs">
          <div className="cs-l">Saídas</div>
          <div className="cs-v">{data.out.length}</div>
          <div className="cs-sub">{fmt(data.earned)}</div>
        </div>
        <div className="cs">
          <div className="cs-l">Saldo</div>
          <div className={`cs-v ${data.balance >= 0 ? "pos" : "neg"}`}>
            {data.balance >= 0 ? "+" : ""}
            {fmt(Math.abs(data.balance))}
          </div>
          <div className="cs-sub">{data.balance >= 0 ? "lucro" : "déficit"}</div>
        </div>
      </div>

      <div className="club-tabs">
        <button
          className={tab === "all" ? "active" : ""}
          onClick={() => setTab("all")}
        >
          Todas ({data.all.length})
        </button>
        <button
          className={tab === "in" ? "active" : ""}
          onClick={() => setTab("in")}
        >
          Entradas ({data.inb.length})
        </button>
        <button
          className={tab === "out" ? "active" : ""}
          onClick={() => setTab("out")}
        >
          Saídas ({data.out.length})
        </button>
      </div>

      <div className="club-order">
        <span>Ordenar por:</span>
        <button
          className={order === "fee" ? "active" : ""}
          onClick={() => setOrder("fee")}
        >
          Valor
        </button>
        <button
          className={order === "date" ? "active" : ""}
          onClick={() => setOrder("date")}
        >
          Data
        </button>
      </div>

      <ul className="club-list">
        {visible.length === 0 && <li className="empty">Nenhuma transferência.</li>}
        {visible.map((l, i) => {
          const isOut = sourceId(l) === club;
          const other = isOut ? targetId(l) : sourceId(l);
          return (
            <li key={i} onClick={() => onPickTransfer(l)}>
              <div className="li-top">
                <span className={`dir ${isOut ? "out" : "in"}`}>
                  {isOut ? "↗ saiu" : "↙ chegou"}
                </span>
                <span className="li-fee">{fmt(l.fee)}</span>
              </div>
              <div className="li-player">{l.player}</div>
              <div className="li-sub">
                {isOut ? "→" : "←"} {other} · {l.season}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
