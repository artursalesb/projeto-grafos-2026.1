import csv
import math
from src.graphs.graph import Graph

#PARTE 1 DO PROJETO


# Coordenadas reais aproximadas (Lat, Lon) para calcular os pesos (km)
COORDS = {
    'REC': (-8.1267, -34.9230), 'SSA': (-12.9111, -38.3316), 'FOR': (-3.7761, -38.5322),
    'NAT': (-5.7688, -35.3661), 'JPA': (-7.1483, -34.9502), 'THE': (-5.0594, -42.8244),
    'GRU': (-23.4355, -46.4730), 'CGH': (-23.6261, -46.6564), 'GIG': (-22.8100, -43.2505),
    'CNF': (-19.6244, -43.9719), 'VIX': (-20.2581, -40.2864), 'BSB': (-15.8697, -47.9208),
    'GYN': (-16.6325, -49.2205), 'CWB': (-25.5327, -49.1699), 'FLN': (-27.6701, -48.5525),
    'POA': (-29.9939, -51.1711), 'MAO': (-3.0358, -60.0519), 'BEL': (-1.3847, -48.4762),
    'PVH': (-8.7136, -63.8966), 'RBR': (-9.8683, -67.8980)
}

# A nova definição exigida pela professora
HUBS_POR_REGIAO = {
    'Sudeste': ['GRU', 'GIG', 'CNF'],
    'Centro-Oeste': ['BSB'],
    'Nordeste': ['REC', 'SSA', 'FOR'],
    'Sul': ['POA', 'CWB'],
    'Norte': ['MAO', 'BEL']
}
TODOS_HUBS = {hub for hubs in HUBS_POR_REGIAO.values() for hub in hubs}

def haversine(iata1, iata2):
    """Calcula a distância em KM entre dois aeroportos."""
    lat1, lon1 = COORDS[iata1]
    lat2, lon2 = COORDS[iata2]
    R = 6371.0 # Raio da Terra em KM
    dlat, dlon = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return round(2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)

def gerar_malha_csv(caminho_aeroportos='data/aeroportos_data.csv', caminho_saida='data/adjacencias_aeroportos.csv'):
    aeroportos = []
    with open(caminho_aeroportos, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            aeroportos.append(row)

    arestas = set()
    dados_arestas = []

    def add_aresta(o, d, tipo, just):
        par = frozenset([o, d])
        if par not in arestas and o != d:
            arestas.add(par)
            peso = haversine(o, d)
            dados_arestas.append({'origem': o, 'destino': d, 'tipo_conexao': tipo, 'justificativa': just, 'peso': peso})

    # 1. Conectar aeroportos Regionais aos Hubs da SUA região
    for aero in aeroportos:
        iata, regiao = aero['iata'], aero['regiao']
        if iata not in TODOS_HUBS:
            for hub in HUBS_POR_REGIAO.get(regiao, []):
                add_aresta(iata, hub, 'regional', 'Conexao com hub regional')

    # 2. Conectar Hubs entre si
    lista_hubs = list(TODOS_HUBS)
    for i in range(len(lista_hubs)):
        for j in range(i + 1, len(lista_hubs)):
            hub1, hub2 = lista_hubs[i], lista_hubs[j]
            regiao1 = next(r for r, hs in HUBS_POR_REGIAO.items() if hub1 in hs)
            regiao2 = next(r for r, hs in HUBS_POR_REGIAO.items() if hub2 in hs)
            
            if regiao1 == regiao2:
                add_aresta(hub1, hub2, 'hub_intra', 'Conexao entre hubs da mesma regiao')
            else:
                add_aresta(hub1, hub2, 'nacional', 'Conexao nacional entre hubs')

    # Salvar o novo CSV
    with open(caminho_saida, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['origem', 'destino', 'tipo_conexao', 'justificativa', 'peso'])
        writer.writeheader()
        writer.writerows(dados_arestas)
        
    print(f"✅ Novo arquivo de malha gerado: {caminho_saida}")

def load_graph(caminho_aeroportos='data/aeroportos_data.csv', caminho_adjacencias='data/adjacencias_aeroportos.csv'):
    g = Graph()
    
    # 1. Lendo os nós (aeroportos)
    with open(caminho_aeroportos, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            g.add_node(row['iata'], row['cidade'], row['regiao'])
            
    # 2. Lendo as arestas (conexões)
    with open(caminho_adjacencias, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            origem = row['origem']
            destino = row['destino']
            peso = float(row['peso'])
            tipo = row['tipo_conexao']
            
            g.add_edge(origem, destino, peso, tipo)
            
    return g



#PARTE 2 DO PROJETO

def load_transferencias(filepath, limite_arestas=None):
    """
    Lê o CSV, agrupa todas as transferências entre os mesmos clubes,
    soma o valor total e monta o grafo ordenado pelo volume financeiro.
    """
    from src.graphs.graph import Graph
    import csv
    
    grafo = Graph()
    
    # Dicionário para agrupar as transferências. 
    # A chave será uma tupla: (clube_vendedor, clube_comprador)
    conexoes = {}
    
    with open(filepath, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            try:
                valor = float(row.get('transfer_fee', 0))
            except (ValueError, TypeError):
                valor = 0.0
                
            if valor > 0:
                vendedor = row.get('from_club_name', 'Desconhecido')
                comprador = row.get('to_club_name', 'Desconhecido')
                jogador = row.get('player_name', 'Desconhecido')
                
                par = (vendedor, comprador)
                
                # Se é a primeira vez que esses dois times negociam, cria o registro
                if par not in conexoes:
                    conexoes[par] = {'valor_total': 0.0, 'jogadores': []}
                
                # Soma o dinheiro e guarda o nome do jogador
                conexoes[par]['valor_total'] += valor
                conexoes[par]['jogadores'].append(jogador)
                
    # Transforma o dicionário em uma lista para podermos ordenar
    lista_conexoes = []
    for (vend, comp), dados in conexoes.items():
        qtd_jogadores = len(dados['jogadores'])
        
        # Se foram poucos jogadores, guarda os nomes. Se foram muitos, guarda só a quantidade para não poluir
        if qtd_jogadores <= 2:
            info_jogadores = ", ".join(dados['jogadores'])
        else:
            info_jogadores = f"{qtd_jogadores} jogadores transferidos"
            
        lista_conexoes.append({
            'vendedor': vend,
            'comprador': comp,
            'valor_total': dados['valor_total'],
            'info_conexao': info_jogadores
        })
        
    # Ordena para colocar as rotas mais milionárias no topo
    lista_conexoes.sort(key=lambda x: x['valor_total'], reverse=True)
    
    # Aplica o limite se houver (se limite_arestas for None, ele pega tudo)
    if limite_arestas is not None:
        top_conexoes = lista_conexoes[:limite_arestas]
    else:
        top_conexoes = lista_conexoes
        
# Finalmente, monta o grafo
    for t in top_conexoes:
        grafo.add_node(t['vendedor'], cidade="N/A", regiao="N/A")
        grafo.add_node(t['comprador'], cidade="N/A", regiao="N/A")
        
        # Guardamos tanto em 'info_conexao' quanto em 'tipo_conexao' para garantir compatibilidade total
        grafo.add_edge(
            t['vendedor'], 
            t['comprador'], 
            peso=t['valor_total'], 
            tipo_conexao=t['info_conexao'],
        )
                
    return grafo