"""
Parte 2 — Grafo de transferências de futebol.
Gera out/grafo_top20_futebol.html com:
  - Cores dos nós por LIGA (Gestalt: Similaridade)
  - Espessura das arestas proporcional ao valor da transferência (Conectividade)
  - Sidebar com busca por clube/jogador, métricas do grafo e legenda por liga
  - Destaque animado ao pesquisar
"""

import sys
import os
import csv
import math
from pyvis.network import Network

try:
    from src.leagues import league_of, all_league_names
except ImportError:
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    from src.leagues import league_of, all_league_names


# ── Paleta de cores por liga (Gestalt: Similaridade) ─────────────────────────
LIGA_CORES = {
    "Premier League":           "#e74c3c",   # vermelho
    "La Liga":                  "#f39c12",   # laranja
    "Serie A":                  "#3498db",   # azul
    "Bundesliga":               "#e67e22",   # âmbar
    "Ligue 1":                  "#9b59b6",   # roxo
    "Liga Portugal":            "#27ae60",   # verde
    "Eredivisie":               "#1abc9c",   # turquesa
    "Brasileirão":              "#2ecc71",   # verde claro
    "Liga Argentina":           "#00cec9",   # ciano
    "MLS":                      "#fd79a8",   # rosa
    "Saudi Pro League":         "#fdcb6e",   # dourado
    "Championship (Inglaterra)":"#b2bec3",   # cinza claro
    "Outras":                   "#636e72",   # cinza
}


def _edge_width(valor_total: float) -> float:
    """Escala a espessura da aresta pelo log do valor (Gestalt: Conectividade)."""
    if valor_total <= 0:
        return 1.0
    log_val = math.log10(max(valor_total, 1))
    # log10(1M) ≈ 6, log10(100M) ≈ 8  →  escala entre 1 e 8
    return round(max(1.0, min(8.0, (log_val - 4.5) * 2.5)), 2)


def gerar_top20_vendas_individuais(caminho_csv, arquivo_saida, top_n=20):
    transferencias = []

    with open(caminho_csv, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                valor = float(row.get('transfer_fee', 0))
            except (ValueError, TypeError):
                valor = 0.0

            if valor > 0:
                transferencias.append({
                    'vendedor': row.get('from_club_name', 'Desconhecido'),
                    'comprador': row.get('to_club_name', 'Desconhecido'),
                    'jogador': row.get('player_name', 'Desconhecido'),
                    'valor': valor
                })

    transferencias.sort(key=lambda x: x['valor'], reverse=True)
    top_vendas = transferencias[:top_n]

    # ── Calcula cor e espessura por nó/aresta ────────────────────────────────
    # Agrupa por par para somar valores (pode haver múltiplas transferências)
    pares = {}
    for t in top_vendas:
        k = (t['vendedor'], t['comprador'])
        pares.setdefault(k, {'valor': 0.0, 'jogadores': []})
        pares[k]['valor'] += t['valor']
        pares[k]['jogadores'].append((t['jogador'], t['valor']))

    clubes_vistos = set()
    for v, c in pares:
        clubes_vistos.add(v)
        clubes_vistos.add(c)

    # Metadados por clube (liga + cor)
    clube_meta = {}
    for clube in clubes_vistos:
        liga = league_of(clube)
        clube_meta[clube] = {
            'liga': liga,
            'cor': LIGA_CORES.get(liga, LIGA_CORES['Outras']),
        }

    # ── Monta o grafo PyVis ──────────────────────────────────────────────────
    net = Network(height='100vh', width='100%', bgcolor='#151515',
                  font_color='white', directed=True)

    for clube, meta in clube_meta.items():
        net.add_node(
            clube,
            label=clube,
            color=meta['cor'],
            size=30,
            title=f"Liga: {meta['liga']}",
            font={'size': 14, 'color': 'white'},
        )

    for (vendedor, comprador), dados in pares.items():
        valor_mi = dados['valor'] / 1_000_000
        top_jogadores = sorted(dados['jogadores'], key=lambda x: x[1], reverse=True)[:3]
        jogadores_str = '\n'.join(
            f"  {j} — €{v/1e6:.1f}M" for j, v in top_jogadores
        )
        texto_hover = f"Valor total: €{valor_mi:.1f}M\nPrincipais:\n{jogadores_str}"
        width = _edge_width(dados['valor'])

        net.add_edge(
            vendedor,
            comprador,
            title=texto_hover,
            arrows='to',
            color={'color': '#FFD700', 'opacity': 0.75},
            width=width,
            # Atributos para busca por jogador (usados no JS)
            jogadores_json=str([j for j, _ in dados['jogadores']]),
        )

    net.toggle_physics(True)
    os.makedirs(os.path.dirname(arquivo_saida), exist_ok=True)
    net.write_html(arquivo_saida)

    # ── Injeta sidebar customizada com legenda por liga ──────────────────────
    with open(arquivo_saida, 'r', encoding='utf-8') as f:
        html_content = f.read()

    qtd_nos = len(net.nodes)
    qtd_arestas = len(net.edges)
    valor_total_top = sum(d['valor'] for d in pares.values()) / 1e6

    # Gera itens de legenda apenas para ligas que aparecem no grafo
    ligas_presentes = sorted({m['liga'] for m in clube_meta.values()})
    legenda_html = ''.join(
        f'<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:12px;">'
        f'<div style="width:12px;height:12px;border-radius:50%;background:{LIGA_CORES.get(l, "#636e72")};flex-shrink:0"></div>'
        f'<span>{l}</span></div>'
        for l in ligas_presentes
    )

    sidebar_html = f"""
    <div style="position:absolute;top:0;left:0;width:300px;height:100vh;background:#1e1e24;
         border-right:1px solid #333;padding:20px;box-sizing:border-box;z-index:1000;
         font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#e0e0e0;
         box-shadow:4px 0 15px rgba(0,0,0,.6);overflow-y:auto;">

      <h2 style="font-size:18px;margin-top:0;border-bottom:1px solid #444;padding-bottom:12px;color:#fff;">
        ⚽ Mercado da Bola
      </h2>

      <!-- Legenda por liga (Gestalt: Similaridade) -->
      <div style="margin-top:16px;">
        <label style="font-size:10px;font-weight:bold;color:#888;letter-spacing:1px;text-transform:uppercase;">
          🏆 Ligas (cores por similaridade)
        </label>
        <div style="margin-top:8px;background:#111;padding:10px;border-radius:6px;">
          {legenda_html}
        </div>
      </div>

      <!-- Busca -->
      <div style="margin-top:16px;">
        <label style="font-size:10px;font-weight:bold;color:#888;letter-spacing:1px;text-transform:uppercase;">
          🔍 Buscar Clube ou Jogador
        </label>
        <input type="text" id="searchBox"
          placeholder="Ex: Neymar, Real Madrid..."
          style="width:100%;padding:10px;margin-top:6px;margin-bottom:10px;
                 background:#111;border:1px solid #444;color:white;
                 border-radius:6px;box-sizing:border-box;font-size:13px;">
        <button onclick="buscar()"
          style="width:100%;padding:10px;background:#4169E1;color:white;border:none;
                 border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;">
          Pesquisar e Destacar
        </button>
      </div>

      <!-- Métricas -->
      <div style="margin-top:16px;">
        <label style="font-size:10px;font-weight:bold;color:#888;letter-spacing:1px;text-transform:uppercase;">
          📊 Métricas do Grafo
        </label>
        <div style="background:#111;padding:14px;border-radius:6px;margin-top:6px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span>Clubes (nós)</span>
            <span style="color:#4169E1;font-weight:bold;">{qtd_nos}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span>Transferências (arestas)</span>
            <span style="color:#FFD700;font-weight:bold;">{qtd_arestas}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <span>Valor total (Top {top_n})</span>
            <span style="color:#2ecc71;font-weight:bold;">€{valor_total_top:.0f}M</span>
          </div>
        </div>
        <p style="font-size:10px;color:#666;margin-top:6px;">
          ↔ Espessura da aresta ∝ valor da transferência (Gestalt: Conectividade)
        </p>
      </div>

      <!-- Reset -->
      <div style="margin-top:12px;">
        <button onclick="resetarVisao()"
          style="width:100%;padding:9px;background:transparent;border:1px solid #555;
                 color:#ccc;border-radius:6px;cursor:pointer;font-size:12px;">
          ↺ Limpar Pesquisa
        </button>
      </div>
    </div>

    <script>
    function buscar() {{
      var input = document.getElementById('searchBox').value.toLowerCase().trim();
      var nodesDataset = network.body.data.nodes;
      var edgesDataset = network.body.data.edges;

      if (!input) {{ resetarVisao(); return; }}

      var allNodes = nodesDataset.get();
      var allEdges = edgesDataset.get();
      var nodesToHighlight = new Set();
      var edgesToHighlight = new Set();

      // Busca por clube (nó)
      allNodes.forEach(function(n) {{
        if (n.label && n.label.toLowerCase().includes(input)) {{
          nodesToHighlight.add(n.id);
          network.getConnectedEdges(n.id).forEach(function(eId) {{ edgesToHighlight.add(eId); }});
          network.getConnectedNodes(n.id).forEach(function(nId) {{ nodesToHighlight.add(nId); }});
        }}
      }});

      // Busca por jogador (via campo jogadores_json na aresta)
      allEdges.forEach(function(e) {{
        var jStr = e.jogadores_json || '';
        if (jStr.toLowerCase().includes(input)) {{
          edgesToHighlight.add(e.id);
          nodesToHighlight.add(e.from);
          nodesToHighlight.add(e.to);
        }}
      }});

      if (nodesToHighlight.size === 0 && edgesToHighlight.size === 0) {{
        alert('Nenhum clube ou jogador encontrado!');
        return;
      }}

      nodesDataset.update(allNodes.map(function(n) {{
        return nodesToHighlight.has(n.id)
          ? {{id: n.id, opacity: 1.0}}
          : {{id: n.id, color: '#2b2b2b', font: {{color: '#444'}}}};
      }}));
      edgesDataset.update(allEdges.map(function(e) {{
        return edgesToHighlight.has(e.id)
          ? {{id: e.id, color: {{color: '#FFD700', opacity: 1.0}}}}
          : {{id: e.id, color: {{color: '#2b2b2b', opacity: 0.1}}}};
      }}));

      network.fit({{
        nodes: Array.from(nodesToHighlight),
        animation: {{duration: 900, easingFunction: 'easeInOutQuad'}}
      }});
    }}

    function resetarVisao() {{
      var nodesDataset = network.body.data.nodes;
      var edgesDataset = network.body.data.edges;
      nodesDataset.update(nodesDataset.get().map(function(n) {{
        return {{id: n.id, color: n._originalColor || undefined, font: {{color: 'white'}}}};
      }}));
      edgesDataset.update(edgesDataset.get().map(function(e) {{
        return {{id: e.id, color: {{color: '#FFD700', opacity: 0.75}}}};
      }}));
      network.fit({{animation: {{duration: 800}}}});
      document.getElementById('searchBox').value = '';
    }}
    </script>
    """

    html_content = html_content.replace(
        '<body>',
        '<body style="margin:0;padding:0;overflow:hidden;">\n' + sidebar_html
    )
    html_content = html_content.replace(
        'id="mynetwork"',
        'id="mynetwork" style="margin-left:300px;width:calc(100% - 300px);height:100vh;"'
    )

    with open(arquivo_saida, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"🌟 Grafo de futebol gerado: {arquivo_saida}")
    print(f"   {qtd_nos} clubes | {qtd_arestas} arestas | €{valor_total_top:.0f}M em transferências")
    print(f"   Cores por liga (Similaridade Gestalt) + espessura por valor (Conectividade)")


if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    caminho_csv = os.path.join(base_dir, 'data', 'dataset_parte2', 'transferencias.csv')
    saida_html = os.path.join(base_dir, 'out', 'grafo_top20_futebol.html')

    print("🎨 Gerando visualização do Mercado da Bola...")
    gerar_top20_vendas_individuais(caminho_csv, saida_html, top_n=20)
