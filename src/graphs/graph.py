class Graph:
    """
    Lista de adjacência genérica. Suporta:
      - não-direcionado (Parte 1, aeroportos)  → directed=False (default)
      - direcionado    (Parte 2, transferências) → directed=True
    """

    def __init__(self, directed: bool = False):
        self.directed = directed
        # nodes: { id: { ...metadados livres... } }
        self.nodes = {}
        # adj saída: { u: { v: {'peso': p, 'tipo': t, ...} } }
        self.adj = {}
        # adj entrada (usado quando directed=True por algoritmos que precisam)
        self.rev_adj = {}

    def add_node(self, node_id, cidade=None, regiao=None, **attrs):
        """
        Compatível com a chamada da Parte 1 (posicional: iata, cidade, regiao)
        e com chamadas via keyword arbitrário para outros datasets.
        """
        if cidade is not None:
            attrs['cidade'] = cidade
        if regiao is not None:
            attrs['regiao'] = regiao
        if node_id not in self.adj:
            self.nodes[node_id] = dict(attrs)
            self.adj[node_id] = {}
            self.rev_adj[node_id] = {}
        else:
            self.nodes[node_id].update(attrs)

    def add_edge(self, origem, destino, peso, tipo_conexao=None, **attrs):
        """
        Compatível com Parte 1 (posicional: o, d, peso, tipo_conexao) e
        Parte 2 (keywords). Em grafo não-direcionado, adiciona ida e volta.
        """
        if origem not in self.adj:
            self.add_node(origem)
        if destino not in self.adj:
            self.add_node(destino)

        edge_data = {'peso': peso, **attrs}
        if tipo_conexao is not None:
            edge_data['tipo'] = tipo_conexao

        self.adj[origem][destino] = edge_data
        self.rev_adj[destino][origem] = edge_data

        if not self.directed:
            self.adj[destino][origem] = edge_data
            self.rev_adj[origem][destino] = edge_data

    def get_nodes(self):
        return list(self.adj.keys())

    def get_neighbors(self, node):
        return self.adj.get(node, {})

    def get_predecessors(self, node):
        return self.rev_adj.get(node, {})

    def iter_edges(self):
        """
        Itera arestas únicas como tuplas (u, v, peso, dados).
        Em grafo não-direcionado, cada par aparece uma única vez.
        """
        if self.directed:
            for u, vizinhos in self.adj.items():
                for v, dados in vizinhos.items():
                    yield u, v, dados['peso'], dados
        else:
            vistas = set()
            for u, vizinhos in self.adj.items():
                for v, dados in vizinhos.items():
                    par = frozenset([u, v])
                    if par in vistas:
                        continue
                    vistas.add(par)
                    yield u, v, dados['peso'], dados

    def get_order(self):
        return len(self.nodes)

    def get_size(self):
        if self.directed:
            return sum(len(vs) for vs in self.adj.values())
        return sum(len(vs) for vs in self.adj.values()) // 2

    def get_density(self):
        v = self.get_order()
        e = self.get_size()
        if v < 2:
            return 0.0
        if self.directed:
            return e / (v * (v - 1))
        return (2 * e) / (v * (v - 1))

    def get_degree(self, node):
        """Grau total. Em dirigido = in + out."""
        if self.directed:
            return len(self.adj.get(node, {})) + len(self.rev_adj.get(node, {}))
        return len(self.adj.get(node, {}))

    def get_out_degree(self, node):
        return len(self.adj.get(node, {}))

    def get_in_degree(self, node):
        return len(self.rev_adj.get(node, {}))
