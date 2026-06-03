import { useEffect, useRef, useState } from "react";
import "./Home.css";

export default function Home({ onNavigate }) {
  const canvasRef = useRef(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let t = 0;

    const particles = Array.from({ length: 28 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      speed: Math.random() * 0.3 + 0.1,
      offset: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.008;
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -10) p.y = canvas.height + 10;
        const alpha = 0.25 + 0.15 * Math.sin(t + p.offset);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="home-root">
      <canvas ref={canvasRef} className="home-canvas" />

      <div className="home-content">
        <header className="home-header">
          <div className="home-badge">Projeto · Teoria dos Grafos · 2026.1</div>
          <h1 className="home-title">
            <span className="home-title-line">Grafos</span>
            <span className="home-title-line accent">Interativos</span>
          </h1>
          <p className="home-subtitle">
            Escolha um dos dois módulos abaixo para explorar as visualizações
          </p>
        </header>

        <div className="home-cards">
          {/* Card Mercado da Bola */}
          <button
            className={`home-card card-bola ${hovered === "bola" ? "is-hovered" : ""}`}
            onMouseEnter={() => setHovered("bola")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onNavigate("bola")}
            aria-label="Ir para Mercado da Bola"
          >
            <div className="card-bg-art bola-art">
              <BolaSVG />
            </div>
            <div className="card-body">
              <div className="card-tag">Parte 1</div>
              <h2 className="card-title">Mercado da Bola</h2>
              <p className="card-desc">
                Grafo das transferências entre clubes. Filtre por campeonato,
                valor mínimo e explore o dashboard de insights.
              </p>
              <div className="card-pills">
                <span className="pill">Grafo dirigido</span>
                <span className="pill">3.166 clubes</span>
                <span className="pill">17.458 transf.</span>
              </div>
              <div className="card-cta">
                Explorar <span className="cta-arrow">→</span>
              </div>
            </div>
          </button>

          {/* Card Aeroportos */}
          <button
            className={`home-card card-aero ${hovered === "aero" ? "is-hovered" : ""}`}
            onMouseEnter={() => setHovered("aero")}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onNavigate("aero")}
            aria-label="Ir para Malha Aérea BR"
          >
            <div className="card-bg-art aero-art">
              <AeroSVG />
            </div>
            <div className="card-body">
              <div className="card-tag">Parte 2</div>
              <h2 className="card-title">Malha Aérea BR</h2>
              <p className="card-desc">
                Rede de aeroportos brasileiros com Dijkstra, métricas por
                região e busca por código IATA.
              </p>
              <div className="card-pills">
                <span className="pill">Grafo não-dirigido</span>
                <span className="pill">20 aeroportos</span>
                <span className="pill">77 conexões</span>
              </div>
              <div className="card-cta">
                Explorar <span className="cta-arrow">→</span>
              </div>
            </div>
          </button>
        </div>

        <footer className="home-footer">
          CESAR · Teoria dos Grafos · Análise e Visualização de Dados · 2026.1
        </footer>
      </div>
    </div>
  );
}

function BolaSVG() {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {[
        [100, 60], [60, 90], [140, 90], [80, 130], [120, 130],
        [100, 155], [50, 55], [150, 55],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="10" fill="white" fillOpacity="0.18" />
      ))}
      {[
        [100,60,60,90],[100,60,140,90],[60,90,80,130],[140,90,120,130],
        [80,130,100,155],[120,130,100,155],[100,60,50,55],[100,60,150,55],
        [60,90,50,55],[140,90,150,55],
      ].map(([x1,y1,x2,y2],i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="white" strokeOpacity="0.22" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function AeroSVG() {
  const airports = [
    [100,80],[60,60],[140,60],[50,110],[150,110],
    [80,140],[120,140],[100,165],[40,80],[160,80],
  ];
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {airports.map(([cx,cy],i) =>
        airports.slice(i+1).map(([x2,y2],j) =>
          Math.hypot(cx-x2,cy-y2) < 80 ? (
            <line key={`${i}-${j}`} x1={cx} y1={cy} x2={x2} y2={y2}
              stroke="white" strokeOpacity="0.18" strokeWidth="1" />
          ) : null
        )
      )}
      {airports.map(([cx,cy],i) => (
        <circle key={i} cx={cx} cy={cy} r="5" fill="white" fillOpacity="0.28" />
      ))}
      <g transform="translate(85,88) rotate(-30)">
        <path d="M15 0 L18 8 L30 8 L27 12 L18 12 L20 20 L24 20 L24 22 L15 22 L6 20 L10 20 L12 12 L3 12 L0 8 L12 8 Z"
          fill="white" fillOpacity="0.35" />
      </g>
    </svg>
  );
}