"""
Script auxiliar para gerar o grafo_interativo.html melhorado.
Reutiliza o grafo e algoritmos do projeto; apenas gera o HTML customizado
com os filtros adicionais solicitados.
"""
import sys, os, json
sys.path.insert(0, '/home/claude/projeto-grafos/projeto-grafos-2026.1-main')

from src.graphs.io import load_graph
from src.graphs.algorithms import dijkstra

grafo = load_graph()

# ── Coleta dados ─────────────────────────────────────────────────────────────
nos_data = []
for iata, dados in grafo.nodes.items():
    grau = grafo.get_degree(iata)
    nos_data.append({'iata': iata, 'cidade': dados['cidade'],
                     'regiao': dados['regiao'], 'grau': grau})

arestas_data = []
vistas = set()
for orig in grafo.get_nodes():
    for dest, dados in grafo.adj[orig].items():
        par = frozenset([orig, dest])
        if par not in vistas:
            vistas.add(par)
            arestas_data.append({'from': orig, 'to': dest,
                                 'peso': round(float(dados['peso']), 2),
                                 'tipo': dados['tipo']})

pares_rotas = [('REC','POA'),('MAO','GRU'),('REC','SSA'),
               ('GRU','BSB'),('FOR','MAO'),('BSB','POA'),('BEL','GRU')]
caminhos = {}
for o, d in pares_rotas:
    custo, cam = dijkstra(grafo, o, d)
    caminhos[f'{o}-{d}'] = {'custo': custo, 'caminho': cam, 'label': f'{o} → {d}  ({custo} km)'}

nos_js      = json.dumps(nos_data,    ensure_ascii=False)
arestas_js  = json.dumps(arestas_data, ensure_ascii=False)
caminhos_js = json.dumps(caminhos,    ensure_ascii=False)

# ── HTML ──────────────────────────────────────────────────────────────────────
html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Malha Aérea Brasileira — Grafo Interativo</title>
  <script src="../lib/vis-9.1.2/vis-network.min.js"></script>
  <link  href="../lib/vis-9.1.2/vis-network.min.css" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body   {{ background: #0d1117; color: #e6edf3; font-family: 'Segoe UI', Arial, sans-serif; display: flex; flex-direction: column; height: 100vh; }}
    header {{ background: #161b22; border-bottom: 1px solid #30363d; padding: 10px 18px; display: flex; align-items: center; gap: 14px; flex-shrink: 0; }}
    header h1 {{ font-size: 16px; font-weight: 700; letter-spacing: .3px; }}
    header span {{ font-size: 12px; color: #8b949e; }}
    .main  {{ display: flex; flex: 1; overflow: hidden; }}
    /* ── Painel lateral ── */
    .sidebar {{ width: 270px; min-width: 270px; background: #161b22; border-right: 1px solid #30363d;
                overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 14px; }}
    .panel   {{ background: #21262d; border: 1px solid #30363d; border-radius: 8px; padding: 12px; }}
    .panel h3 {{ font-size: 12px; text-transform: uppercase; letter-spacing: .8px; color: #8b949e; margin-bottom: 10px; }}
    /* Legenda de regiões */
    .legend-item {{ display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 6px; cursor: pointer; border-radius: 4px; padding: 3px 5px; transition: background .15s; }}
    .legend-item:hover {{ background: #30363d; }}
    .legend-item.inactive {{ opacity: .35; }}
    .dot {{ width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }}
    /* Busca IATA */
    input[type=text], select {{ width: 100%; background: #0d1117; border: 1px solid #30363d; border-radius: 6px;
                                color: #e6edf3; padding: 6px 10px; font-size: 13px; outline: none; }}
    input[type=text]:focus, select:focus {{ border-color: #388bfd; }}
    .autocomplete-list {{ background: #161b22; border: 1px solid #30363d; border-radius: 6px; margin-top: 4px;
                          max-height: 160px; overflow-y: auto; display: none; }}
    .autocomplete-list div {{ padding: 6px 10px; font-size: 13px; cursor: pointer; }}
    .autocomplete-list div:hover {{ background: #21262d; }}
    /* Slider grau */
    input[type=range] {{ width: 100%; accent-color: #388bfd; }}
    .slider-label {{ display: flex; justify-content: space-between; font-size: 12px; color: #8b949e; margin-top: 4px; }}
    /* Caminhos */
    .rota-btn {{ display: block; width: 100%; text-align: left; background: #0d1117; border: 1px solid #30363d;
                 border-radius: 5px; padding: 6px 10px; font-size: 12px; color: #e6edf3; cursor: pointer;
                 margin-bottom: 5px; transition: border-color .15s; }}
    .rota-btn:hover  {{ border-color: #00d4aa; }}
    .rota-btn.active {{ border-color: #00d4aa; background: #0a2a25; color: #00d4aa; font-weight: 600; }}
    /* Reset */
    .btn-reset {{ display: block; width: 100%; padding: 7px; background: #21262d; border: 1px solid #30363d;
                  border-radius: 6px; color: #8b949e; font-size: 13px; cursor: pointer; text-align: center; }}
    .btn-reset:hover {{ background: #30363d; color: #e6edf3; }}
    /* Métricas */
    .metric {{ display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }}
    .metric span:last-child {{ color: #388bfd; font-weight: 700; }}
    /* Info caminho */
    #path-info {{ font-size: 12px; color: #00d4aa; margin-top: 6px; min-height: 16px; }}
    /* Rede */
    #network-container {{ flex: 1; position: relative; }}
    #network {{ width: 100%; height: 100%; }}
  </style>
</head>
<body>

<header>
  <h1>✈️ Malha Aérea Brasileira</h1>
  <span id="header-info">20 aeroportos · 77 conexões</span>
</header>

<div class="main">
  <!-- ── Painel lateral ─────────────────────────────────── -->
  <aside class="sidebar">

    <!-- Legenda / Filtro por Região -->
    <div class="panel">
      <h3>🗺️ Filtrar por Região</h3>
      <div id="legend"></div>
    </div>

    <!-- Busca por IATA -->
    <div class="panel">
      <h3>🔍 Busca por Código IATA</h3>
      <input type="text" id="iata-search" placeholder="Ex: GRU, REC, BSB…" autocomplete="off">
      <div class="autocomplete-list" id="autocomplete"></div>
    </div>

    <!-- Filtro grau mínimo -->
    <div class="panel">
      <h3>📊 Grau Mínimo de Conexões</h3>
      <input type="range" id="grau-slider" min="1" max="13" value="1" step="1">
      <div class="slider-label"><span>1</span><span id="grau-val">1</span><span>13</span></div>
    </div>

    <!-- Destaque de caminho mínimo -->
    <div class="panel">
      <h3>🛣️ Caminho Mínimo (Dijkstra)</h3>
      <div id="rotas-list"></div>
      <div id="path-info"></div>
    </div>

    <!-- Métricas -->
    <div class="panel">
      <h3>📈 Métricas do Grafo</h3>
      <div class="metric"><span>Nós visíveis</span><span id="m-nos">20</span></div>
      <div class="metric"><span>Conexões visíveis</span><span id="m-arestas">77</span></div>
      <div class="metric"><span>Densidade</span><span id="m-dens">0.4053</span></div>
      <div class="metric"><span>Nó selecionado</span><span id="m-sel">—</span></div>
    </div>

    <button class="btn-reset" onclick="resetAll()">↺ Resetar todos os filtros</button>
  </aside>

  <!-- ── Grafo ──────────────────────────────────────────── -->
  <div id="network-container">
    <div id="network"></div>
  </div>
</div>

<script>
// ── Dados do grafo (gerados pelo Python) ──────────────────────────────────────
const NOS_DATA     = {nos_js};
const ARESTAS_DATA = {arestas_js};
const CAMINHOS     = {caminhos_js};

// ── Paleta de cores por região (consistente com o projeto) ────────────────────
const COR_REGIAO = {{
  'Norte':        '#2ecc71',
  'Nordeste':     '#e74c3c',
  'Centro-Oeste': '#f1c40f',
  'Sudeste':      '#3498db',
  'Sul':          '#9b59b6'
}};

// ── Estado global ─────────────────────────────────────────────────────────────
let network, nodesDS, edgesDS;
let regioesAtivas   = new Set(Object.keys(COR_REGIAO));
let grauMinimo      = 1;
let rotaAtiva       = null;
let nosOriginalColors = {{}};

// ── Inicializa vis.js ─────────────────────────────────────────────────────────
function initNetwork() {{
  const container = document.getElementById('network');

  nodesDS = new vis.DataSet(NOS_DATA.map(n => buildVisNode(n)));
  edgesDS = new vis.DataSet(ARESTAS_DATA.map(a => buildVisEdge(a)));

  NOS_DATA.forEach(n => {{ nosOriginalColors[n.iata] = COR_REGIAO[n.regiao] || '#ffffff'; }});

  const data    = {{ nodes: nodesDS, edges: edgesDS }};
  const options = {{
    physics: {{
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {{ gravitationalConstant: -60, springLength: 130, springConstant: 0.08, damping: 0.4 }},
      stabilization: {{ iterations: 800, fit: true }}
    }},
    edges: {{
      smooth: {{ type: 'continuous' }},
      color: {{ color: '#444c56', highlight: '#00d4aa', hover: '#888' }},
      width: 1.5
    }},
    nodes: {{
      shape: 'dot',
      font: {{ color: 'white', size: 13 }},
      borderWidth: 2
    }},
    interaction: {{ hover: true, tooltipDelay: 100 }}
  }};

  network = new vis.Network(container, data, options);

  network.on('selectNode', params => {{
    if (params.nodes.length) {{
      const id = params.nodes[0];
      const no = NOS_DATA.find(n => n.iata === id);
      document.getElementById('m-sel').textContent = `${{id}} (${{no?.cidade}})`;
    }}
  }});
  network.on('deselectNode', () => {{
    document.getElementById('m-sel').textContent = '—';
  }});
}}

function buildVisNode(n) {{
  const hidden = !regioesAtivas.has(n.regiao) || n.grau < grauMinimo;
  return {{
    id:     n.iata,
    label:  n.iata,
    title:  `✈️ ${{n.iata}} — ${{n.cidade}}\\nRegião: ${{n.regiao}}\\nConexões: ${{n.grau}}`,
    color:  COR_REGIAO[n.regiao] || '#ffffff',
    size:   14 + n.grau * 2,
    hidden: hidden,
    font:   {{ color: 'white' }}
  }};
}}

function buildVisEdge(a) {{
  return {{
    from:  a.from, to: a.to,
    title: `${{a.peso}} km`,
    color: {{ color: '#444c56', highlight: '#00d4aa' }},
    width: 1.5,
    hidden: false
  }};
}}

// ── Legenda / Filtro por Região ───────────────────────────────────────────────
function buildLegend() {{
  const container = document.getElementById('legend');
  Object.entries(COR_REGIAO).forEach(([regiao, cor]) => {{
    const div = document.createElement('div');
    div.className = 'legend-item';
    div.innerHTML = `<div class="dot" style="background:${{cor}}"></div><span>${{regiao}}</span>`;
    div.addEventListener('click', () => toggleRegiao(regiao, div));
    container.appendChild(div);
  }});
}}

function toggleRegiao(regiao, el) {{
  if (regioesAtivas.has(regiao)) {{
    regioesAtivas.delete(regiao);
    el.classList.add('inactive');
  }} else {{
    regioesAtivas.add(regiao);
    el.classList.remove('inactive');
  }}
  aplicarFiltros();
}}

// ── Filtro grau mínimo ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {{
  const slider = document.getElementById('grau-slider');
  slider.addEventListener('input', () => {{
    grauMinimo = parseInt(slider.value);
    document.getElementById('grau-val').textContent = grauMinimo;
    aplicarFiltros();
  }});
}});

// ── Busca por IATA ────────────────────────────────────────────────────────────
function initBusca() {{
  const input = document.getElementById('iata-search');
  const list  = document.getElementById('autocomplete');

  input.addEventListener('input', () => {{
    const q = input.value.trim().toUpperCase();
    list.innerHTML = '';
    if (!q) {{ list.style.display = 'none'; return; }}

    const matches = NOS_DATA.filter(n =>
      n.iata.includes(q) || n.cidade.toUpperCase().includes(q)
    );
    if (!matches.length) {{ list.style.display = 'none'; return; }}

    matches.slice(0, 8).forEach(n => {{
      const div = document.createElement('div');
      div.textContent = `${{n.iata}} — ${{n.cidade}} (${{n.regiao}})`;
      div.addEventListener('click', () => {{
        input.value = n.iata;
        list.style.display = 'none';
        selecionarNo(n.iata);
      }});
      list.appendChild(div);
    }});
    list.style.display = 'block';
  }});

  document.addEventListener('click', e => {{
    if (!input.contains(e.target)) list.style.display = 'none';
  }});
}}

function selecionarNo(iata) {{
  network.selectNodes([iata]);
  network.focus(iata, {{ scale: 1.4, animation: {{ duration: 600, easingFunction: 'easeInOutQuad' }} }});
  const no = NOS_DATA.find(n => n.iata === iata);
  if (no) document.getElementById('m-sel').textContent = `${{iata}} (${{no.cidade}})`;
}}

// ── Destaque de caminho mínimo ────────────────────────────────────────────────
function buildRotas() {{
  const container = document.getElementById('rotas-list');
  Object.entries(CAMINHOS).forEach(([key, info]) => {{
    const btn = document.createElement('button');
    btn.className = 'rota-btn';
    btn.textContent = info.label;
    btn.dataset.key = key;
    btn.addEventListener('click', () => toggleRota(key, btn));
    container.appendChild(btn);
  }});
}}

function toggleRota(key, btn) {{
  if (rotaAtiva === key) {{
    rotaAtiva = null;
    btn.classList.remove('active');
    limparDestaqueCaminho();
    document.getElementById('path-info').textContent = '';
  }} else {{
    document.querySelectorAll('.rota-btn').forEach(b => b.classList.remove('active'));
    rotaAtiva = key;
    btn.classList.add('active');
    destacarCaminho(CAMINHOS[key]);
  }}
}}

function destacarCaminho(info) {{
  // Restaura todas as cores
  const updates = NOS_DATA.map(n => ({{
    id: n.iata,
    color: nosOriginalColors[n.iata],
    opacity: regioesAtivas.has(n.regiao) && n.grau >= grauMinimo ? 1 : 0
  }}));
  nodesDS.update(updates);

  const caminho = info.caminho;
  const nosNoPath = new Set(caminho);
  const nosEmFoco = [];

  // Colore os nós do caminho
  caminho.forEach((iata, i) => {{
    const cor = (i === 0 || i === caminho.length - 1) ? '#f39c12' : '#00d4aa';
    nodesDS.update({{ id: iata, color: cor, size: 38 }});
    nosEmFoco.push(iata);
  }});

  // Colore as arestas do caminho
  edgesDS.forEach(edge => {{
    const noCaminho = nosNoPath.has(edge.from) && nosNoPath.has(edge.to);
    edgesDS.update({{
      id: edge.id,
      color: {{ color: noCaminho ? '#00d4aa' : '#2a2f37' }},
      width: noCaminho ? 4 : 1
    }});
  }});

  // Foca no subgrafo
  network.fit({{ nodes: nosEmFoco, animation: {{ duration: 700, easingFunction: 'easeInOutQuad' }} }});
  document.getElementById('path-info').textContent =
    `${{caminho.join(' → ')}}  ·  ${{info.custo}} km`;
}}

function limparDestaqueCaminho() {{
  const updates = NOS_DATA.map(n => ({{
    id: n.iata,
    color: nosOriginalColors[n.iata],
    size: 14 + n.grau * 2
  }}));
  nodesDS.update(updates);
  edgesDS.forEach(edge => {{
    edgesDS.update({{ id: edge.id, color: {{ color: '#444c56' }}, width: 1.5 }});
  }});
}}

// ── Aplica todos os filtros ativos ────────────────────────────────────────────
function aplicarFiltros() {{
  let nosVisiveis = 0, arestasVisiveis = 0;

  NOS_DATA.forEach(n => {{
    const vis = regioesAtivas.has(n.regiao) && n.grau >= grauMinimo;
    nodesDS.update({{ id: n.iata, hidden: !vis }});
    if (vis) nosVisiveis++;
  }});

  const nosVis = new Set(NOS_DATA.filter(n => !nodesDS.get(n.iata).hidden).map(n => n.iata));
  ARESTAS_DATA.forEach(a => {{
    const vis = nosVis.has(a.from) && nosVis.has(a.to);
    edgesDS.update({{ id: edgesDS.getIds().find(id => {{
      const e = edgesDS.get(id);
      return e.from === a.from && e.to === a.to;
    }}), hidden: !vis }});
    if (vis) arestasVisiveis++;
  }});

  const v = nosVisiveis;
  const e = arestasVisiveis;
  const dens = v >= 2 ? ((2 * e) / (v * (v - 1))).toFixed(4) : '0.0000';

  document.getElementById('m-nos').textContent     = nosVisiveis;
  document.getElementById('m-arestas').textContent = arestasVisiveis;
  document.getElementById('m-dens').textContent    = dens;
}}

// ── Reset ─────────────────────────────────────────────────────────────────────
function resetAll() {{
  regioesAtivas = new Set(Object.keys(COR_REGIAO));
  grauMinimo    = 1;
  rotaAtiva     = null;

  document.getElementById('grau-slider').value = 1;
  document.getElementById('grau-val').textContent = 1;
  document.getElementById('iata-search').value = '';
  document.getElementById('autocomplete').style.display = 'none';
  document.getElementById('path-info').textContent = '';
  document.querySelectorAll('.rota-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.legend-item').forEach(el => el.classList.remove('inactive'));

  limparDestaqueCaminho();
  aplicarFiltros();
  network.fit({{ animation: true }});
}}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {{
  buildLegend();
  buildRotas();
  initBusca();
  initNetwork();
}});
</script>
</body>
</html>
"""

out_path = '/home/claude/projeto-grafos/projeto-grafos-2026.1-main/out/grafo_interativo.html'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f"✅ HTML gerado: {out_path}  ({len(html):,} bytes)")
