import os
import json
import matplotlib.pyplot as plt
import pandas as pd
from pyvis.network import Network

def gerar_arvore_percurso(grafo, caminho1, caminho2):
    """
    Gera o subgrafo dos percursos usando as cores oficiais das regiões.
    """
    os.makedirs('out', exist_ok=True)
    
    net = Network(height='750px', width='100%', directed=True, bgcolor='#222222', font_color='white', cdn_resources='remote')
    
    # Dicionário de cores oficial (o mesmo do grafo completo)
    cores_regioes = {
        'Norte': '#2ecc71', 'Nordeste': '#e74c3c', 'Centro-Oeste': '#f1c40f',
        'Sudeste': '#3498db', 'Sul': '#9b59b6'
    }

    def adicionar_caminho(caminho, cor_aresta):
        for i in range(len(caminho)):
            no = caminho[i]
            # Busca a região do nó no grafo original
            dados_no = grafo.nodes.get(no, {})
            regiao = dados_no.get('regiao', 'Desconhecida')
            cor_no = cores_regioes.get(regiao, '#ffffff')
            
            net.add_node(no, label=no, color=cor_no, size=25, title=f"Região: {regiao}")
            
            if i > 0:
                # A aresta mantém uma cor de destaque para mostrar o percurso
                net.add_edge(caminho[i-1], caminho[i], color=cor_aresta, width=4)

    if caminho1:
        adicionar_caminho(caminho1, cor_aresta='#27ae60') # Percurso 1 (Verde)
    if caminho2:
        adicionar_caminho(caminho2, cor_aresta='#3498db') # Percurso 2 (Azul)
        
    net.toggle_physics(False)
    net.save_graph('out/arvore_percurso.html')
    print("🎨 Arquivo out/arvore_percurso.html atualizado com as cores das regiões!")


def gerar_graficos_analiticos():
    """
    Lê os arquivos de dados e gera 4 gráficos estatísticos DIVERSOS em PNG.
    """
    os.makedirs('out', exist_ok=True)
    print("\n📊 Gerando novos gráficos analíticos...")
    
    # --- GRÁFICO 1: Barras Horizontais ---
    df_graus = pd.read_csv('out/graus.csv')
    top10_graus = df_graus.head(10).sort_values(by='grau', ascending=True)
    
    plt.figure(figsize=(10, 6))
    plt.barh(top10_graus['aeroporto'], top10_graus['grau'], color='#3498db', edgecolor='black')
    plt.title('Top 10 Aeroportos Mais Conectados na Rede')
    plt.xlabel('Grau (Número de Conexões)')
    plt.grid(axis='x', linestyle='--', alpha=0.7)
    plt.savefig('out/plot_01_barras_graus.png', bbox_inches='tight')
    plt.close()
    
    # --- GRÁFICO 2: Pizza ---
    with open('out/regioes.json', 'r', encoding='utf-8') as f:
        regioes = json.load(f)
    nomes_regioes = list(regioes.keys())
    ordem_regioes = [regioes[r]['ordem'] for r in nomes_regioes]
    
    plt.figure(figsize=(8, 8))
    plt.pie(ordem_regioes, labels=nomes_regioes, autopct='%1.1f%%', startangle=140, colors=['#ff9999','#66b3ff','#99ff99','#ffcc99', '#c2c2f0'], wedgeprops={'edgecolor': 'black'})
    plt.title('Proporção de Aeroportos por Região do Brasil')
    plt.savefig('out/plot_02_pizza_regioes.png', bbox_inches='tight')
    plt.close()

    # --- GRÁFICO 3: Scatter Plot ---
    df_ego = pd.read_csv('out/ego_aeroportos.csv')
    plt.figure(figsize=(10, 6))
    plt.scatter(df_ego['grau'], df_ego['densidade_ego'], color='#e74c3c', s=100, alpha=0.7, edgecolors='black')
    for _, row in df_ego.iterrows():
        plt.annotate(
            row['aeroporto'],
            (row['grau'], row['densidade_ego']),
            textcoords='offset points',
            xytext=(5, 5),
            fontsize=8,
            color='#222222',
            bbox=dict(facecolor='white', alpha=0.75, edgecolor='none', pad=0.5)
        )
    plt.title('Análise de Rede: Conectividade vs. Densidade Local')
    plt.xlabel('Grau')
    plt.ylabel('Densidade da Ego-Network')
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.savefig('out/plot_03_dispersao_rede.png', bbox_inches='tight')
    plt.close()

    # --- GRÁFICO 4: Histograma ---
    df_adj = pd.read_csv('data/adjacencias_aeroportos.csv')
    plt.figure(figsize=(10, 6))
    plt.hist(df_adj['peso'], bins=8, color='#2ecc71', edgecolor='black', alpha=0.8)
    plt.title('Distribuição das Distâncias dos Voos')
    plt.xlabel('Distância em KM')
    plt.ylabel('Frequência')
    plt.savefig('out/plot_04_histograma_distancias.png', bbox_inches='tight')
    plt.close()
    
    print("✅ 4 novos gráficos estatísticos gerados com sucesso!")


def gerar_grafo_completo(grafo):
    """
    Gera out/grafo_interativo.html com:
      - tooltip por aeroporto (grau, região, densidade_ego)
      - caixa de busca por código IATA
      - botões para realçar caminhos obrigatórios (REC->POA, MAO->GRU) via Dijkstra
      - legenda por região
    Usa vis-network via CDN (sem pyvis para ter controle total do HTML/JS).
    """
    from src.graphs.algorithms import dijkstra

    os.makedirs('out', exist_ok=True)
    print("\n🌐 Gerando visualização interativa do grafo completo...")

    cores_regioes = {
        'Norte': '#2ecc71', 'Nordeste': '#e74c3c', 'Centro-Oeste': '#f1c40f',
        'Sudeste': '#3498db', 'Sul': '#9b59b6'
    }

    # ── Pre-calcula densidade_ego de cada aeroporto (para o tooltip) ─────────
    def densidade_ego(v):
        vizinhos = list(grafo.adj.get(v, {}).keys())
        nos_ego = [v] + vizinhos
        n = len(nos_ego)
        if n < 2:
            return 0.0
        e = 0
        for i in range(n):
            for j in range(i + 1, n):
                if nos_ego[j] in grafo.adj.get(nos_ego[i], {}):
                    e += 1
        return round((2 * e) / (n * (n - 1)), 4)

    nos = []
    for v in grafo.get_nodes():
        dados = grafo.nodes.get(v, {})
        regiao = dados.get('regiao', 'Desconhecida')
        cidade = dados.get('cidade', '')
        grau = len(grafo.get_neighbors(v))
        dens = densidade_ego(v)
        nos.append({
            'id': v,
            'iata': v,
            'cidade': cidade,
            'regiao': regiao,
            'grau': grau,
            'densidade_ego': dens,
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

    # ── Caminhos obrigatórios via Dijkstra ───────────────────────────────────
    caminhos = {}
    for label, origem, destino in [
        ('REC-POA', 'REC', 'POA'),
        ('MAO-GRU', 'MAO', 'GRU'),
    ]:
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
    print("✅ Arquivo out/grafo_interativo.html gerado (com busca, tooltip e realce de caminhos).")