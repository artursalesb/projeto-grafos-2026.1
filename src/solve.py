import os
import json
import csv
from src.graphs.io import load_graph , gerar_malha_csv
from src.graphs.algorithms import dijkstra
from src.viz import gerar_arvore_percurso, gerar_graficos_analiticos, gerar_grafo_completo

def exportar_metricas(grafo):
    os.makedirs('out', exist_ok=True)
    todos_nos = grafo.get_nodes()
    
    # 1. Global 
    metricas_globais = {"ordem": grafo.get_order(), "tamanho": grafo.get_size(), "densidade": round(grafo.get_density(), 4)}
    with open('out/global.json', 'w', encoding='utf-8') as f: json.dump(metricas_globais, f, indent=4)
        
    # 2. Graus
    lista_graus = sorted([[no, grafo.get_degree(no)] for no in todos_nos], key=lambda x: x[1], reverse=True)
    with open('out/graus.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['aeroporto', 'grau'])
        writer.writerows(lista_graus)

    # 3. Regiões
    regioes, metricas_regioes = {}, {}
    for no in todos_nos:
        regiao = grafo.nodes[no]['regiao']
        regioes.setdefault(regiao, []).append(no)
        
    for nome, aeros in regioes.items():
        v, e = len(aeros), 0
        for i in range(v):
            for j in range(i + 1, v):
                if aeros[j] in grafo.adj.get(aeros[i], {}): e += 1
        densidade = (2 * e) / (v * (v - 1)) if v >= 2 else 0.0
        metricas_regioes[nome] = {"ordem": v, "tamanho": e, "densidade": round(densidade, 4)}
        
    with open('out/regioes.json', 'w', encoding='utf-8') as f: json.dump(metricas_regioes, f, indent=4, ensure_ascii=False)

    # 4. Ego-Networks
    ego_dados = []
    for no in todos_nos:
        grau = grafo.get_degree(no)
        nos_ego = [no] + list(grafo.adj.get(no, {}).keys())
        v_ego, e_ego = len(nos_ego), 0
        for i in range(v_ego):
            for j in range(i + 1, v_ego):
                if nos_ego[j] in grafo.adj.get(nos_ego[i], {}): e_ego += 1
        densidade_ego = (2 * e_ego) / (v_ego * (v_ego - 1)) if v_ego >= 2 else 0.0
        ego_dados.append([no, grau, v_ego, e_ego, round(densidade_ego, 4)])
        
    with open('out/ego_aeroportos.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['aeroporto', 'grau', 'ordem_ego', 'tamanho_ego', 'densidade_ego'])
        writer.writerows(ego_dados)
        
    print("✅ Métricas da Parte 1 exportadas.")

def calcular_rotas_dijkstra(grafo):
    rotas = []
    if not os.path.exists('data/rotas.csv'):
        print("❌ Erro: Arquivo data/rotas.csv não encontrado.")
        return

    with open('data/rotas.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            rotas.append((row['origem'], row['destino']))
            
    resultados = []
    
    # Declarando as variáveis antes de iniciar a busca
    caminho_rec_poa = []
    caminho_mao_gru = []
    
    print("\n🗺️  Calculando rotas com Dijkstra:")
    for origem, destino in rotas:
        custo, caminho = dijkstra(grafo, origem, destino)
        
        # Guardando o trajeto apenas das rotas obrigatórias para a visualização
        if origem == 'REC' and destino == 'POA':
            caminho_rec_poa = caminho
        elif origem == 'MAO' and destino == 'GRU':
            caminho_mao_gru = caminho
            
        caminho_str = " -> ".join(caminho) if caminho else "Sem rota"
        resultados.append([origem, destino, custo, caminho_str])
        print(f"  {origem} para {destino}: {custo} km | Caminho: {caminho_str}")
        
    with open('out/distancias_rotas.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['origem', 'destino', 'custo', 'caminho'])
        writer.writerows(resultados)
        
    print("✅ Arquivo out/distancias_rotas.csv gerado com sucesso!")
    
    gerar_arvore_percurso(grafo, caminho_rec_poa, caminho_mao_gru)

def main():
    print("✈️  Iniciando processamento do Grafo...")
    # Adicionamos esta linha: O código agora constrói as arestas automaticamente!
    gerar_malha_csv()
    grafo = load_graph()
    
    exportar_metricas(grafo)
    calcular_rotas_dijkstra(grafo)
    gerar_graficos_analiticos()
    gerar_grafo_completo(grafo)

if __name__ == '__main__':
    main()