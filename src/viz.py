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
    Gera um HTML interativo usando os métodos específicos da classe Graph personalizada.
    """
    os.makedirs('out', exist_ok=True)
    print("\n🌐 Gerando visualização interativa do grafo completo...")
    
    # MUDANÇA AQUI: directed=False para remover as setas e deixar só a linha!
    net = Network(height='800px', width='100%', directed=False, bgcolor='#1a1a1a', font_color='white', select_menu=True, cdn_resources='remote')
    
    cores_regioes = {
        'Norte': '#2ecc71', 'Nordeste': '#e74c3c', 'Centro-Oeste': '#f1c40f',
        'Sudeste': '#3498db', 'Sul': '#9b59b6'
    }
    
    # 1. Adicionando os Vértices
    for no in grafo.get_nodes():
        dados_no = grafo.nodes.get(no, {})
        regiao = dados_no.get('regiao', 'Desconhecida')
        cor = cores_regioes.get(regiao, '#ffffff')
        
        vizinhos = grafo.get_neighbors(no)
        grau = len(vizinhos)
        
        hover_text = f"Aeroporto: {no}\nRegião: {regiao}\nConexões: {grau}"
        net.add_node(no, label=no, title=hover_text, color=cor, size=20 + (grau * 2)) 
        
    # 2. Adicionando as Arestas (Apenas uma linha por conexão)
    arestas_desenhadas = set() # Usamos um set para não desenhar a linha duas vezes
    
    for origem in grafo.get_nodes():
        for destino, dados in grafo.adj.get(origem, {}).items():
            # frozenset garante que (A, B) e (B, A) sejam vistos como a mesma coisa
            par = frozenset([origem, destino])
            
            if par not in arestas_desenhadas:
                distancia = dados.get('peso', 0)
                net.add_edge(origem, destino, title=f"{distancia} km", color='#555555', width=1.5)
                arestas_desenhadas.add(par)
            
    net.toggle_physics(True)
    net.force_atlas_2based()
    
    net.save_graph('out/grafo_interativo.html')
    print("✅ Arquivo out/grafo_interativo.html gerado com sucesso!")