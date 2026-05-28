class Graph:
    def __init__(self):
        # O dicionário 'nodes' vai guardar os dados do aeroporto (cidade e região)
        self.nodes = {}
        # O dicionário 'adj' é a nossa Lista de Adjacência
        # Formato: { 'REC': { 'SSA': {'peso': 675.29, 'tipo': 'regional'}, ... } }
        self.adj = {}

    def add_node(self, iata, cidade, regiao):
        if iata not in self.adj:
            self.nodes[iata] = {'cidade': cidade, 'regiao': regiao}
            self.adj[iata] = {}

    def add_edge(self, origem, destino, peso, tipo_conexao):
        # Como o grafo é não-direcionado, adicionamos a ida e a volta
        if origem in self.adj and destino in self.adj:
            self.adj[origem][destino] = {'peso': peso, 'tipo': tipo_conexao}
            self.adj[destino][origem] = {'peso': peso, 'tipo': tipo_conexao}

    def get_nodes(self):
        return list(self.adj.keys())

    def get_neighbors(self, node):
        return self.adj.get(node, {})
    
    def get_order(self):
        # Ordem |V| = quantidade de nós
        return len(self.nodes)

    def get_size(self):
        # Tamanho |E| = soma de todas as conexões dividida por 2 (grafo não-direcionado)
        total_conexoes = sum(len(vizinhos) for vizinhos in self.adj.values())
        return total_conexoes // 2

    def get_density(self):
        # Fórmula: densidade = 2 * |E| / (|V| * (|V| - 1))
        v = self.get_order()
        e = self.get_size()
        
        if v < 2:
            return 0.0
            
        return (2 * e) / (v * (v - 1))
        
    def get_degree(self, node):
        # Grau = número de conexões de um aeroporto específico
        return len(self.adj.get(node, {}))