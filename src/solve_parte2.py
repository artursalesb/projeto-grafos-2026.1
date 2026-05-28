import sys
import os
import csv
from pyvis.network import Network

def gerar_top20_vendas_individuais(caminho_csv, arquivo_saida, top_n=20):
    transferencias = []
    
    # 1. Lê o arquivo original
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
                
    # 2. Ordena pelas maiores transferências
    transferencias.sort(key=lambda x: x['valor'], reverse=True)
    top_vendas = transferencias[:top_n]
    
    # 3. Desenha a rede visual
    net = Network(height='100vh', width='100%', bgcolor='#151515', font_color='white', directed=True)
    
    for venda in top_vendas:
        vendedor = venda['vendedor']
        comprador = venda['comprador']
        jogador = venda['jogador']
        valor_mi = venda['valor'] / 1_000_000
        
        net.add_node(vendedor, label=vendedor, color='#4169E1', size=35, font={'size': 20, 'color': 'white'})
        net.add_node(comprador, label=comprador, color='#4169E1', size=35, font={'size': 20, 'color': 'white'})
        
        texto_hover = f"Atleta: {jogador}\nValor: € {valor_mi:.1f} Milhões"
        
        # Adicionando a aresta APENAS com o hover (sem label), e guardando o nome do jogador
        net.add_edge(
            vendedor, 
            comprador, 
            title=texto_hover, 
            arrows='to', 
            color='#FFD700',
            jogador=jogador # Atributo invisível fundamental para a nossa barra de pesquisa funcionar!
        )
        
    net.toggle_physics(True)
    os.makedirs(os.path.dirname(arquivo_saida), exist_ok=True)
    
    # Salva o arquivo original do PyVis
    net.write_html(arquivo_saida)
    
    # =========================================================================
    # 4. INJEÇÃO DA NOSSA SIDEBAR CUSTOMIZADA E LÓGICA DE DESTAQUE
    # =========================================================================
    with open(arquivo_saida, 'r', encoding='utf-8') as f:
        html_content = f.read()

    qtd_nos = len(net.nodes)
    
    sidebar_html = f"""
    <div style="position: absolute; top: 0; left: 0; width: 320px; height: 100vh; background-color: #1e1e24; border-right: 1px solid #333; padding: 25px; box-sizing: border-box; z-index: 1000; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #e0e0e0; box-shadow: 4px 0 15px rgba(0,0,0,0.6);">
        <h2 style="font-size: 20px; margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 15px; color: #fff;">⚽ Mercado da Bola</h2>
        
        <div style="margin-top: 30px;">
            <label style="font-size: 11px; font-weight: bold; color: #888; letter-spacing: 1px; text-transform: uppercase;">🔍 Buscar Clube ou Atleta</label>
            <input type="text" id="searchBox" placeholder="Ex: Neymar, Real Madrid..." style="width: 100%; padding: 12px; margin-top: 8px; margin-bottom: 15px; background-color: #111; border: 1px solid #444; color: white; border-radius: 6px; box-sizing: border-box; font-size: 14px;">
            <button onclick="buscar()" style="width: 100%; padding: 12px; background-color: #4169E1; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; font-size: 14px; transition: background 0.2s;">Pesquisar e Destacar</button>
        </div>
        
        <div style="margin-top: 40px;">
            <label style="font-size: 11px; font-weight: bold; color: #888; letter-spacing: 1px; text-transform: uppercase;">📊 Métricas do Grafo</label>
            <div style="background-color: #111; padding: 20px; border-radius: 6px; margin-top: 8px; font-size: 14px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 12px;"><span>Clubes Visíveis</span> <span style="color: #4169E1; font-weight: bold;">{qtd_nos}</span></div>
                <div style="display: flex; justify-content: space-between;"><span>Top Transferências</span> <span style="color: #FFD700; font-weight: bold;">{top_n}</span></div>
            </div>
        </div>
        
        <div style="margin-top: 40px;">
            <button onclick="resetarVisao()" style="width: 100%; padding: 10px; background-color: transparent; border: 1px solid #555; color: #ccc; border-radius: 6px; cursor: pointer; font-size: 13px;">↺ Limpar Pesquisa</button>
        </div>
    </div>

    <script>
    function buscar() {{
        var input = document.getElementById('searchBox').value.toLowerCase().trim();
        var nodesDataset = network.body.data.nodes;
        var edgesDataset = network.body.data.edges;
        
        if (!input) {{
            resetarVisao();
            return;
        }}
        
        var allNodes = nodesDataset.get();
        var allEdges = edgesDataset.get();
        
        var nodesToHighlight = new Set();
        var edgesToHighlight = new Set();
        var foundSomething = false;
        
        // 1. Procura por Clubes (Nós)
        for (var i = 0; i < allNodes.length; i++) {{
            if (allNodes[i].label.toLowerCase().includes(input)) {{
                nodesToHighlight.add(allNodes[i].id);
                
                // Pega as linhas e clubes conectados a ele
                var connectedEdges = network.getConnectedEdges(allNodes[i].id);
                connectedEdges.forEach(eId => edgesToHighlight.add(eId));
                
                var connectedNodes = network.getConnectedNodes(allNodes[i].id);
                connectedNodes.forEach(nId => nodesToHighlight.add(nId));
                
                foundSomething = true;
            }}
        }}
        
        // 2. Procura por Jogadores (Arestas)
        for (var i = 0; i < allEdges.length; i++) {{
            if (allEdges[i].jogador && allEdges[i].jogador.toLowerCase().includes(input)) {{
                edgesToHighlight.add(allEdges[i].id);
                nodesToHighlight.add(allEdges[i].from);
                nodesToHighlight.add(allEdges[i].to);
                foundSomething = true;
            }}
        }}
        
        if (!foundSomething) {{
            alert('Nenhum clube ou jogador encontrado na visualização atual!');
            return;
        }}
        
        // 3. Aplica a cor padrão nos destaques e CINZA ESCURO no resto
        var updatedNodes = allNodes.map(n => {{
            if (nodesToHighlight.has(n.id)) {{
                return {{id: n.id, color: '#4169E1', font: {{color: 'white'}}}};
            }} else {{
                return {{id: n.id, color: '#2b2b2b', font: {{color: '#444444'}}}};
            }}
        }});
        
        var updatedEdges = allEdges.map(e => {{
            if (edgesToHighlight.has(e.id)) {{
                return {{id: e.id, color: '#FFD700'}};
            }} else {{
                return {{id: e.id, color: '#2b2b2b'}};
            }}
        }});
        
        nodesDataset.update(updatedNodes);
        edgesDataset.update(updatedEdges);
        
        // Foca a câmera nos elementos encontrados
        network.fit({{
            nodes: Array.from(nodesToHighlight),
            animation: {{ duration: 1000, easingFunction: 'easeInOutQuad' }}
        }});
    }}

    function resetarVisao() {{
        var nodesDataset = network.body.data.nodes;
        var edgesDataset = network.body.data.edges;
        
        // Restaura as cores originais
        var updatedNodes = nodesDataset.get().map(n => ({{id: n.id, color: '#4169E1', font: {{color: 'white'}}}}));
        var updatedEdges = edgesDataset.get().map(e => ({{id: e.id, color: '#FFD700'}}));
        
        nodesDataset.update(updatedNodes);
        edgesDataset.update(updatedEdges);
        
        network.fit({{animation: {{duration: 1000}}}});
        document.getElementById('searchBox').value = '';
    }}
    </script>
    """

    html_content = html_content.replace('<body>', '<body style="margin:0; padding:0; overflow:hidden;">\n' + sidebar_html)
    html_content = html_content.replace('id="mynetwork"', 'id="mynetwork" style="margin-left: 320px; width: calc(100% - 320px); height: 100vh;"')

    with open(arquivo_saida, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"🌟 Mapa final gerado com sucesso em: {arquivo_saida}")

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    caminho_csv = os.path.join(base_dir, 'data', 'dataset_parte2', 'transferencias.csv')
    saida_html = os.path.join(base_dir, 'out', 'grafo_top20_futebol.html')
    
    print("🎨 Gerando a visualização top 20 com filtro e destaques visuais...")
    gerar_top20_vendas_individuais(caminho_csv, saida_html, top_n=20)
    print("🚀 Pode testar a busca por jogadores!")