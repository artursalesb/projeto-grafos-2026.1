import os
import json
import math
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import pandas as pd
import numpy as np
from pyvis.network import Network


def gerar_arvore_percurso(grafo, caminho1, caminho2):
    """
    Gera o subgrafo dos percursos usando as cores oficiais das regiões.
    """
    os.makedirs('out', exist_ok=True)

    net = Network(height='750px', width='100%', directed=True,
                  bgcolor='#222222', font_color='white', cdn_resources='remote')

    cores_regioes = {
        'Norte': '#2ecc71', 'Nordeste': '#e74c3c', 'Centro-Oeste': '#f1c40f',
        'Sudeste': '#3498db', 'Sul': '#9b59b6'
    }

    def adicionar_caminho(caminho, cor_aresta):
        for i in range(len(caminho)):
            no = caminho[i]
            dados_no = grafo.nodes.get(no, {})
            regiao = dados_no.get('regiao', 'Desconhecida')
            cor_no = cores_regioes.get(regiao, '#ffffff')
            net.add_node(no, label=no, color=cor_no, size=25, title=f"Região: {regiao}")
            if i > 0:
                net.add_edge(caminho[i-1], caminho[i], color=cor_aresta, width=4)

    if caminho1:
        adicionar_caminho(caminho1, cor_aresta='#27ae60')
    if caminho2:
        adicionar_caminho(caminho2, cor_aresta='#3498db')

    net.toggle_physics(False)
    net.save_graph('out/arvore_percurso.html')
    print("🎨 Arquivo out/arvore_percurso.html atualizado com as cores das regiões!")


def gerar_graficos_analiticos():
    """
    Gera 5 gráficos analíticos alinhados à rubrica AVD:
      plot_01 — ranking top-10 aeroportos (barras horizontais)
      plot_02 — distribuição de aeroportos por região (barras horizontais, SUBSTITUI pizza)
      plot_03 — grau × densidade ego-network (scatter)
      plot_04 — histograma de distâncias dos voos (histograma contínuo)
      plot_05 — histograma de distribuição de graus com destaque de hubs (Lei da Proximidade)
    """
    os.makedirs('out', exist_ok=True)
    print("\n📊 Gerando gráficos analíticos...")

    CORES_REGIAO = {
        'Norte': '#2ecc71', 'Nordeste': '#e74c3c', 'Centro-Oeste': '#f1c40f',
        'Sudeste': '#3498db', 'Sul': '#9b59b6'
    }

    # ── Gráfico 1: Top-10 aeroportos mais conectados (barras horizontais) ────
    df_graus = pd.read_csv('out/graus.csv')
    top10 = df_graus.head(10).sort_values(by='grau', ascending=True)

    # Lê região de cada aeroporto para colorir pela similaridade de Gestalt
    aeroportos_data = pd.read_csv('data/aeroportos_data.csv')
    regiao_map = dict(zip(aeroportos_data['iata'], aeroportos_data['regiao']))
    cores_barras = [CORES_REGIAO.get(regiao_map.get(a, ''), '#aaaaaa') for a in top10['aeroporto']]

    fig, ax = plt.subplots(figsize=(11, 6))
    bars = ax.barh(top10['aeroporto'], top10['grau'], color=cores_barras, edgecolor='#111111', linewidth=0.8)
    ax.set_title('Top 10 Aeroportos Mais Conectados na Malha Aérea', fontsize=14, fontweight='bold', pad=12)
    ax.set_xlabel('Grau (Número de Conexões)', fontsize=11)
    ax.set_ylabel('Aeroporto (IATA)', fontsize=11)
    ax.grid(axis='x', linestyle='--', alpha=0.5)
    for bar, val in zip(bars, top10['grau']):
        ax.text(val + 0.1, bar.get_y() + bar.get_height() / 2,
                str(val), va='center', fontsize=10, fontweight='bold')
    legend_patches = [mpatches.Patch(color=c, label=r) for r, c in CORES_REGIAO.items()]
    ax.legend(handles=legend_patches, title='Região (Gestalt: Similaridade)',
              title_fontsize=9, fontsize=9, loc='lower right')
    fig.tight_layout()
    plt.savefig('out/plot_01_barras_graus.png', bbox_inches='tight', dpi=110)
    plt.close()

    # ── Gráfico 2: Distribuição por região (barras horizontais — SUBSTITUI PIZZA) ──
    with open('out/regioes.json', 'r', encoding='utf-8') as f:
        regioes = json.load(f)

    nomes = list(regioes.keys())
    ordens = [regioes[r]['ordem'] for r in nomes]
    densidades = [regioes[r]['densidade'] for r in nomes]
    cores_reg = [CORES_REGIAO.get(r, '#aaaaaa') for r in nomes]

    fig, axs = plt.subplots(1, 2, figsize=(13, 5))

    # Painel esquerdo: número de aeroportos
    axs[0].barh(nomes, ordens, color=cores_reg, edgecolor='#111111', linewidth=0.8)
    axs[0].set_title('Aeroportos por Região', fontsize=12, fontweight='bold')
    axs[0].set_xlabel('Número de aeroportos')
    axs[0].grid(axis='x', linestyle='--', alpha=0.5)
    for i, v in enumerate(ordens):
        axs[0].text(v + 0.05, i, str(v), va='center', fontsize=10, fontweight='bold')

    # Painel direito: densidade intra-regional
    axs[1].barh(nomes, densidades, color=cores_reg, edgecolor='#111111', linewidth=0.8, alpha=0.85)
    axs[1].set_title('Densidade Intra-Regional', fontsize=12, fontweight='bold')
    axs[1].set_xlabel('Densidade do subgrafo regional')
    axs[1].set_xlim(0, 1.15)
    axs[1].grid(axis='x', linestyle='--', alpha=0.5)
    for i, v in enumerate(densidades):
        axs[1].text(v + 0.01, i, f'{v:.2f}', va='center', fontsize=10, fontweight='bold')

    fig.suptitle('Distribuição Regional da Malha Aérea Brasileira',
                 fontsize=14, fontweight='bold', y=1.01)
    fig.tight_layout()
    plt.savefig('out/plot_02_barras_regioes.png', bbox_inches='tight', dpi=110)
    plt.close()
    print("  ✅ plot_02 agora é BARRAS HORIZONTAIS (substituiu pizza)")

    # ── Gráfico 3: Scatter — grau × densidade ego-network ────────────────────
    df_ego = pd.read_csv('out/ego_aeroportos.csv')
    cores_scatter = [CORES_REGIAO.get(regiao_map.get(a, ''), '#aaaaaa') for a in df_ego['aeroporto']]

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.scatter(df_ego['grau'], df_ego['densidade_ego'],
               c=cores_scatter, s=110, alpha=0.85, edgecolors='black', linewidths=0.7)
    for _, row in df_ego.iterrows():
        ax.annotate(row['aeroporto'], (row['grau'], row['densidade_ego']),
                    textcoords='offset points', xytext=(6, 4),
                    fontsize=8, color='#111111',
                    bbox=dict(facecolor='white', alpha=0.7, edgecolor='none', pad=0.4))
    ax.set_title('Conectividade vs. Densidade Local (Ego-Network)', fontsize=13, fontweight='bold')
    ax.set_xlabel('Grau (Número de Conexões)', fontsize=11)
    ax.set_ylabel('Densidade da Ego-Network', fontsize=11)
    ax.grid(True, linestyle='--', alpha=0.4)
    ax.annotate('Anticorrelação:\nhubs têm vizinhos\npouco conectados\nentre si',
                xy=(13, 0.703), xytext=(10.5, 0.85),
                fontsize=8, color='#c0392b',
                arrowprops=dict(arrowstyle='->', color='#c0392b'),
                bbox=dict(boxstyle='round', facecolor='#ffeaea', alpha=0.8))
    legend_patches = [mpatches.Patch(color=c, label=r) for r, c in CORES_REGIAO.items()]
    ax.legend(handles=legend_patches, title='Região', fontsize=9, title_fontsize=9)
    fig.tight_layout()
    plt.savefig('out/plot_03_dispersao_rede.png', bbox_inches='tight', dpi=110)
    plt.close()

    # ── Gráfico 4: Histograma de distâncias dos voos ─────────────────────────
    df_adj = pd.read_csv('data/adjacencias_aeroportos.csv')
    fig, ax = plt.subplots(figsize=(10, 5))
    n, bins, patches = ax.hist(df_adj['peso'], bins=10, color='#2ecc71',
                                edgecolor='black', alpha=0.85)
    # Colorir bins pela faixa: curtos = verde, longos = laranja
    for patch, left in zip(patches, bins[:-1]):
        patch.set_facecolor('#27ae60' if left < 1000 else '#e67e22')
    ax.set_title('Distribuição das Distâncias dos Voos na Malha Aérea', fontsize=13, fontweight='bold')
    ax.set_xlabel('Distância (km)', fontsize=11)
    ax.set_ylabel('Frequência', fontsize=11)
    ax.grid(axis='y', linestyle='--', alpha=0.5)
    ax.axvline(1000, color='#c0392b', linestyle='--', linewidth=1.5, label='Divisor: voos regionais vs. nacionais')
    ax.legend(fontsize=9)
    leg_patches = [
        mpatches.Patch(color='#27ae60', label='Voos regionais (< 1 000 km)'),
        mpatches.Patch(color='#e67e22', label='Voos nacionais (≥ 1 000 km)'),
    ]
    ax.legend(handles=leg_patches, fontsize=9)
    fig.tight_layout()
    plt.savefig('out/plot_04_histograma_distancias.png', bbox_inches='tight', dpi=110)
    plt.close()

    # ── Gráfico 5: Histograma de distribuição de graus + destaque de hubs ────
    # Aplica Lei da Proximidade: agrupa aeroportos em faixas de grau para
    # mostrar claramente quais são hubs vs. regionais.
    df_todos = df_graus.copy()
    df_todos['regiao'] = df_todos['aeroporto'].map(regiao_map)

    HUBS = {'GRU', 'GIG', 'CNF', 'BSB', 'GYN', 'REC', 'SSA', 'FOR',
            'POA', 'CWB', 'MAO', 'BEL'}

    df_todos['categoria'] = df_todos['aeroporto'].apply(
        lambda x: 'Hub' if x in HUBS else 'Regional'
    )

    graus_hub = df_todos[df_todos['categoria'] == 'Hub']['grau'].values
    graus_reg = df_todos[df_todos['categoria'] == 'Regional']['grau'].values
    todos_graus = df_todos['grau'].values
    bins_hist = range(int(todos_graus.min()), int(todos_graus.max()) + 2)

    fig, ax = plt.subplots(figsize=(11, 5))
    ax.hist(graus_reg, bins=bins_hist, color='#95a5a6', edgecolor='black',
            alpha=0.85, label='Aeroporto Regional', align='left')
    ax.hist(graus_hub, bins=bins_hist, color='#e74c3c', edgecolor='black',
            alpha=0.9, label='Hub (alto grau)', align='left')

    ax.set_title('Distribuição de Graus — Hubs vs. Regionais\n'
                 '(Lei da Proximidade: mesmos graus agrupados visualmente)',
                 fontsize=12, fontweight='bold')
    ax.set_xlabel('Grau (Número de Conexões)', fontsize=11)
    ax.set_ylabel('Número de Aeroportos', fontsize=11)
    ax.grid(axis='y', linestyle='--', alpha=0.5)
    ax.legend(fontsize=10)

    # Anotação dos clusters
    ax.annotate('Cluster\nRegionais\n(baixo grau)',
                xy=(2, 3), xytext=(3.5, 4.5),
                fontsize=9, color='#555',
                arrowprops=dict(arrowstyle='->', color='#555'))
    ax.annotate('Cluster\nHubs\n(grau 11–13)',
                xy=(11, 2.5), xytext=(8.5, 4.5),
                fontsize=9, color='#c0392b',
                arrowprops=dict(arrowstyle='->', color='#c0392b'))

    fig.tight_layout()
    plt.savefig('out/plot_05_histograma_graus.png', bbox_inches='tight', dpi=110)
    plt.close()
    print("  ✅ plot_05 histograma de graus com destaque de hubs gerado")

    print("✅ 5 gráficos analíticos gerados em out/")


def gerar_benchmark_log():
    """
    Gera gráficos de benchmark com escala logarítmica no eixo X,
    conforme recomendado nas limitações do próprio projeto.
    Substitui benchmark_barras.png e benchmark_linhas.png.
    """
    os.makedirs('out', exist_ok=True)
    df = pd.read_csv('out/benchmark.csv')

    CORES = {
        'BFS': '#3498db',
        'DFS': '#9b59b6',
        'Dijkstra': '#2ecc71',
        'Bellman-Ford': '#e74c3c',
    }

    algos = df['algoritmo'].tolist()
    tempos = df['tempo_medio'].apply(lambda x: x * 1000).tolist()  # ms
    cores = [CORES.get(a, '#aaaaaa') for a in algos]

    # ── Barras horizontais (escala log) ──────────────────────────────────────
    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.barh(algos, tempos, color=cores, edgecolor='black', linewidth=0.8)
    ax.set_xscale('log')
    ax.set_xlabel('Tempo médio (ms) — escala logarítmica', fontsize=11)
    ax.set_title('Benchmark: Tempo de Execução por Algoritmo\n'
                 '(escala log — comparação justa mesmo com grande variação)',
                 fontsize=12, fontweight='bold')
    ax.grid(axis='x', linestyle='--', alpha=0.5)
    for bar, t in zip(bars, tempos):
        ax.text(bar.get_width() * 1.08, bar.get_y() + bar.get_height() / 2,
                f'{t:.3f} ms', va='center', fontsize=10, fontweight='bold')
    legend_patches = [mpatches.Patch(color=c, label=a) for a, c in CORES.items()]
    ax.legend(handles=legend_patches, fontsize=9)
    ax.annotate('Bellman-Ford ≈ 7.9× mais lento que DFS\n'
                '(escala log revela isso sem comprimir as barras menores)',
                xy=(df[df['algoritmo'] == 'Bellman-Ford']['tempo_medio'].values[0] * 1000, 0),
                xytext=(0.15, 0.2), textcoords='axes fraction',
                fontsize=8, color='#c0392b',
                arrowprops=dict(arrowstyle='->', color='#c0392b'))
    fig.tight_layout()
    plt.savefig('out/benchmark_barras.png', bbox_inches='tight', dpi=110)
    plt.close()

    # ── Linha de comparação (escala log) ─────────────────────────────────────
    fig, ax = plt.subplots(figsize=(10, 5))
    x_pos = range(len(algos))
    for i, (algo, tempo, cor) in enumerate(zip(algos, tempos, cores)):
        ax.plot(i, tempo, 'o', color=cor, markersize=12, zorder=5,
                label=algo)
        ax.text(i, tempo * 1.25, f'{tempo:.3f} ms', ha='center', fontsize=9)
    ax.plot(x_pos, tempos, '--', color='#bbb', linewidth=1, zorder=3)
    ax.set_yscale('log')
    ax.set_xticks(list(x_pos))
    ax.set_xticklabels(algos, fontsize=11)
    ax.set_ylabel('Tempo médio (ms) — escala logarítmica', fontsize=11)
    ax.set_title('Benchmark: Comparação por Algoritmo (linha, escala log)',
                 fontsize=12, fontweight='bold')
    ax.grid(axis='y', linestyle='--', alpha=0.5)
    ax.legend(fontsize=9)
    fig.tight_layout()
    plt.savefig('out/benchmark_linhas.png', bbox_inches='tight', dpi=110)
    plt.close()

    print("✅ Benchmark re-gerado com escala logarítmica (benchmark_barras.png + benchmark_linhas.png)")


def gerar_grafo_completo(grafo):
    """
    Gera out/grafo_interativo.html com:
      - tooltip por aeroporto (grau, região, densidade_ego)
      - caixa de busca com autocomplete por código IATA
      - botões para realçar caminhos obrigatórios via Dijkstra
      - legenda por região
    """
    from src.graphs.algorithms import dijkstra

    os.makedirs('out', exist_ok=True)
    print("\n🌐 Gerando visualização interativa do grafo completo...")

    cores_regioes = {
        'Norte': '#2ecc71', 'Nordeste': '#e74c3c', 'Centro-Oeste': '#f1c40f',
        'Sudeste': '#3498db', 'Sul': '#9b59b6'
    }

    def densidade_ego(v):
        vizinhos = list(grafo.adj.get(v, {}).keys())
        nos_ego = [v] + vizinhos
        n = len(nos_ego)
        if n < 2:
            return 0.0
        e = sum(
            1 for i in range(n) for j in range(i + 1, n)
            if nos_ego[j] in grafo.adj.get(nos_ego[i], {})
        )
        return round((2 * e) / (n * (n - 1)), 4)

    nos = []
    for v in grafo.get_nodes():
        dados = grafo.nodes.get(v, {})
        regiao = dados.get('regiao', 'Desconhecida')
        cidade = dados.get('cidade', '')
        grau = len(grafo.get_neighbors(v))
        dens = densidade_ego(v)
        nos.append({
            'id': v, 'iata': v, 'cidade': cidade, 'regiao': regiao,
            'grau': grau, 'densidade_ego': dens,
            'cor': cores_regioes.get(regiao, '#ffffff'),
        })

    arestas = []
    vistas = set()
    for u in grafo.get_nodes():
        for w, dados in grafo.adj.get(u, {}).items():
            par = frozenset([u, w])
            if par in vistas:
                continue
            vistas.add(par)
            arestas.append({
                'from': u, 'to': w,
                'peso': round(float(dados.get('peso', 0)), 2),
                'tipo': dados.get('tipo', ''),
            })

    caminhos = {}
    for label, origem, destino in [('REC-POA', 'REC', 'POA'), ('MAO-GRU', 'MAO', 'GRU')]:
        custo, caminho, _, _ = dijkstra(grafo, origem, destino)
        caminhos[label] = {
            'origem': origem, 'destino': destino,
            'custo': custo if custo != float('inf') else None,
            'caminho': caminho,
        }

    nos_js = json.dumps(nos, ensure_ascii=False)
    arestas_js = json.dumps(arestas, ensure_ascii=False)
    caminhos_js = json.dumps(caminhos, ensure_ascii=False)
    cores_js = json.dumps(cores_regioes, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Malha Aérea Brasileira — Grafo Interativo</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.2/dist/vis-network.min.js"></script>
<link  href="https://cdnjs.cloudflare.com/ajax/libs/vis-network/9.1.2/dist/dist/vis-network.min.css" rel="stylesheet">
<style>
*,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
body{{background:#0d1117;color:#e6edf3;font-family:'Segoe UI',Arial,sans-serif;display:flex;height:100vh;overflow:hidden}}
.sidebar{{width:300px;background:#161b22;border-right:1px solid #30363d;padding:16px;overflow-y:auto;flex-shrink:0}}
h1{{font-size:16px;margin-bottom:6px}}
.sub{{font-size:12px;color:#8b949e;margin-bottom:14px}}
.panel{{background:#21262d;border:1px solid #30363d;border-radius:8px;padding:12px;margin-bottom:12px}}
.panel h3{{font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:#8b949e;margin-bottom:10px}}
.legend-item{{display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:6px}}
.dot{{width:12px;height:12px;border-radius:50%;flex-shrink:0}}
input[type=text]{{width:100%;background:#0d1117;border:1px solid #30363d;border-radius:6px;color:#e6edf3;padding:7px 10px;font-size:13px;outline:none}}
input[type=text]:focus{{border-color:#388bfd}}
.auto{{background:#161b22;border:1px solid #30363d;border-radius:6px;margin-top:4px;max-height:160px;overflow-y:auto;display:none}}
.auto div{{padding:6px 10px;font-size:12px;cursor:pointer}}
.auto div:hover{{background:#21262d}}
.rota-btn{{display:block;width:100%;text-align:left;background:#0d1117;border:1px solid #30363d;border-radius:5px;padding:7px 10px;font-size:12px;color:#e6edf3;cursor:pointer;margin-bottom:6px}}
.rota-btn:hover{{border-color:#00d4aa}}
.rota-btn.active{{border-color:#00d4aa;background:#0a2a25;color:#00d4aa;font-weight:600}}
.btn-reset{{display:block;width:100%;padding:7px;background:#21262d;border:1px solid #30363d;border-radius:6px;color:#8b949e;font-size:12px;cursor:pointer}}
.btn-reset:hover{{background:#30363d;color:#e6edf3}}
.metric{{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}}
.metric span:last-child{{color:#388bfd;font-weight:700}}
#path-info{{font-size:11px;color:#00d4aa;margin-top:6px;min-height:14px}}
#network{{flex:1;background:#1a1a1a}}
</style></head>
<body>
<aside class="sidebar">
  <h1>✈️ Malha Aérea BR</h1>
  <div class="sub">20 aeroportos · grafo não-direcionado</div>
  <div class="panel"><h3>🗺️ Legenda — Regiões</h3><div id="legend"></div></div>
  <div class="panel">
    <h3>🔍 Buscar por código IATA</h3>
    <input id="busca" placeholder="Ex.: GRU, REC, POA…" autocomplete="off"/>
    <div class="auto" id="auto"></div>
  </div>
  <div class="panel">
    <h3>🛣️ Caminhos obrigatórios (Dijkstra)</h3>
    <div id="rotas-list"></div>
    <div id="path-info"></div>
  </div>
  <div class="panel">
    <h3>📈 Métricas</h3>
    <div class="metric"><span>Aeroportos</span><span>{len(nos)}</span></div>
    <div class="metric"><span>Conexões</span><span>{len(arestas)}</span></div>
    <div class="metric"><span>Selecionado</span><span id="m-sel">—</span></div>
  </div>
  <button class="btn-reset" onclick="resetarTudo()">↺ Limpar destaques</button>
</aside>
<div id="network"></div>

<script>
const NOS={nos_js};
const ARESTAS={arestas_js};
const CAMINHOS={caminhos_js};
const COR_REG={cores_js};

let network, nodesDS, edgesDS, rotaAtiva=null;
const corOriginal={{}}; NOS.forEach(n=>corOriginal[n.iata]=n.cor);

function tipBuilder(n){{
  return `✈ ${{n.iata}} — ${{n.cidade}}\\nRegião: ${{n.regiao}}\\nGrau: ${{n.grau}}\\nDensidade ego: ${{n.densidade_ego}}`;
}}

function init(){{
  nodesDS=new vis.DataSet(NOS.map(n=>({{
    id:n.iata, label:n.iata, title:tipBuilder(n),
    color:n.cor, size:14+n.grau*2, font:{{color:'#fff',size:13}}
  }})));
  edgesDS=new vis.DataSet(ARESTAS.map((a,i)=>({{
    id:i, from:a.from, to:a.to, title:`${{a.peso}} km · ${{a.tipo}}`,
    color:{{color:'#444c56',highlight:'#00d4aa'}}, width:1.5
  }})));
  network=new vis.Network(document.getElementById('network'),
    {{nodes:nodesDS,edges:edgesDS}},
    {{physics:{{solver:'forceAtlas2Based',forceAtlas2Based:{{gravitationalConstant:-60,springLength:130,springConstant:0.08,damping:0.4}},stabilization:{{iterations:600}}}},
      edges:{{smooth:{{type:'continuous'}}}},
      nodes:{{shape:'dot',borderWidth:2}},
      interaction:{{hover:true,tooltipDelay:100}}}});
  network.on('selectNode',p=>{{
    if(p.nodes.length){{
      const n=NOS.find(x=>x.iata===p.nodes[0]);
      document.getElementById('m-sel').textContent=`${{n.iata}} (${{n.cidade}})`;
    }}
  }});
  network.on('deselectNode',()=>document.getElementById('m-sel').textContent='—');
}}

function buildLegend(){{
  const c=document.getElementById('legend');
  Object.entries(COR_REG).forEach(([r,cor])=>{{
    const d=document.createElement('div');
    d.className='legend-item';
    d.innerHTML=`<div class="dot" style="background:${{cor}}"></div><span>${{r}}</span>`;
    c.appendChild(d);
  }});
}}

function initBusca(){{
  const inp=document.getElementById('busca'),lst=document.getElementById('auto');
  inp.addEventListener('input',()=>{{
    const q=inp.value.trim().toUpperCase();
    lst.innerHTML='';
    if(!q){{lst.style.display='none';return;}}
    const hits=NOS.filter(n=>n.iata.includes(q)||n.cidade.toUpperCase().includes(q)).slice(0,8);
    if(!hits.length){{lst.style.display='none';return;}}
    hits.forEach(n=>{{
      const d=document.createElement('div');
      d.textContent=`${{n.iata}} — ${{n.cidade}} (${{n.regiao}})`;
      d.onclick=()=>{{inp.value=n.iata;lst.style.display='none';selecionar(n.iata);}};
      lst.appendChild(d);
    }});
    lst.style.display='block';
  }});
  document.addEventListener('click',e=>{{if(!inp.contains(e.target))lst.style.display='none';}});
}}

function selecionar(iata){{
  network.selectNodes([iata]);
  network.focus(iata,{{scale:1.5,animation:{{duration:600}}}});
  const n=NOS.find(x=>x.iata===iata);
  if(n) document.getElementById('m-sel').textContent=`${{iata}} (${{n.cidade}})`;
}}

function buildRotas(){{
  const c=document.getElementById('rotas-list');
  Object.entries(CAMINHOS).forEach(([k,info])=>{{
    const b=document.createElement('button');
    b.className='rota-btn';
    b.textContent=`${{info.origem}} → ${{info.destino}}  (${{info.custo}} km)`;
    b.onclick=()=>toggleRota(k,b);
    c.appendChild(b);
  }});
}}

function toggleRota(k,btn){{
  if(rotaAtiva===k){{rotaAtiva=null;btn.classList.remove('active');limpar();document.getElementById('path-info').textContent='';}}
  else{{
    document.querySelectorAll('.rota-btn').forEach(b=>b.classList.remove('active'));
    rotaAtiva=k; btn.classList.add('active');
    destacar(CAMINHOS[k]);
  }}
}}

function destacar(info){{
  limpar();
  const cam=info.caminho, set=new Set(cam);
  cam.forEach((iata,i)=>{{
    const cor=(i===0||i===cam.length-1)?'#f39c12':'#00d4aa';
    nodesDS.update({{id:iata,color:cor,size:30}});
  }});
  edgesDS.forEach(e=>{{
    const ok=set.has(e.from)&&set.has(e.to);
    edgesDS.update({{id:e.id,color:{{color:ok?'#00d4aa':'#2a2f37'}},width:ok?4:1}});
  }});
  network.fit({{nodes:cam,animation:{{duration:700}}}});
  document.getElementById('path-info').textContent=`${{cam.join(' → ')}}  ·  ${{info.custo}} km`;
}}

function limpar(){{
  nodesDS.update(NOS.map(n=>({{id:n.iata,color:corOriginal[n.iata],size:14+n.grau*2}})));
  edgesDS.forEach(e=>edgesDS.update({{id:e.id,color:{{color:'#444c56'}},width:1.5}}));
}}

function resetarTudo(){{
  rotaAtiva=null;
  document.querySelectorAll('.rota-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('busca').value='';
  document.getElementById('auto').style.display='none';
  document.getElementById('path-info').textContent='';
  document.getElementById('m-sel').textContent='—';
  limpar();
  network.fit({{animation:true}});
}}

document.addEventListener('DOMContentLoaded',()=>{{buildLegend();buildRotas();initBusca();init();}});
</script>
</body></html>
"""
    with open('out/grafo_interativo.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("✅ Arquivo out/grafo_interativo.html gerado (busca, tooltip, realce de caminhos).")
