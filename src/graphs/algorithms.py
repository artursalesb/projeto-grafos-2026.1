
import heapq
from collections import deque


# ─────────────────────────────────────────────────────────────────────────────
# BFS / DFS — caminho mais curto em número de arestas
# ─────────────────────────────────────────────────────────────────────────────

def bfs(grafo, origem, destino):
    """
    Caminho mais curto em arestas (ignora pesos). Retorna:
      (distancia_em_arestas, caminho, nos_visitados, arestas_percorridas)
    """
    if origem not in grafo.get_nodes() or destino not in grafo.get_nodes():
        return float('inf'), [], 0, 0

    visitados = set()
    anterior = {origem: None}
    fila = deque([origem])
    nos_visitados = 0
    arestas_percorridas = 0

    while fila:
        u = fila.popleft()
        if u in visitados:
            continue
        visitados.add(u)
        nos_visitados += 1

        if u == destino:
            break

        for v in grafo.get_neighbors(u):
            arestas_percorridas += 1
            if v not in anterior:
                anterior[v] = u
                fila.append(v)

    if destino not in anterior:
        return float('inf'), [], nos_visitados, arestas_percorridas

    caminho = []
    no = destino
    while no is not None:
        caminho.insert(0, no)
        no = anterior[no]
    return len(caminho) - 1, caminho, nos_visitados, arestas_percorridas


def bfs_levels(grafo, origem):
    """
    BFS completo a partir de uma fonte. Retorna:
      {
        'levels': { no: nivel },   # camada (distância em arestas) de cada nó alcançável
        'order':  [n1, n2, ...],   # ordem de visita
        'parent': { no: pai },
        'visited': N, 'edges_explored': E
      }
    """
    if origem not in grafo.get_nodes():
        return {'levels': {}, 'order': [], 'parent': {}, 'visited': 0, 'edges_explored': 0}

    levels = {origem: 0}
    parent = {origem: None}
    order = []
    fila = deque([origem])
    edges_explored = 0

    while fila:
        u = fila.popleft()
        order.append(u)
        for v in grafo.get_neighbors(u):
            edges_explored += 1
            if v not in levels:
                levels[v] = levels[u] + 1
                parent[v] = u
                fila.append(v)

    return {
        'levels': levels,
        'order': order,
        'parent': parent,
        'visited': len(order),
        'edges_explored': edges_explored,
    }


def dfs(grafo, origem, destino):
    """
    Versão iterativa (evita estouro de stack em grafos grandes). Devolve algum
    caminho de origem a destino (não necessariamente o menor).
      (distancia_em_arestas, caminho, nos_visitados, arestas_percorridas)
    """
    if origem not in grafo.get_nodes() or destino not in grafo.get_nodes():
        return float('inf'), [], 0, 0

    visitados = set()
    anterior = {origem: None}
    pilha = [origem]
    nos_visitados = 0
    arestas_percorridas = 0

    while pilha:
        u = pilha.pop()
        if u in visitados:
            continue
        visitados.add(u)
        nos_visitados += 1

        if u == destino:
            caminho = []
            no = destino
            while no is not None:
                caminho.insert(0, no)
                no = anterior[no]
            return len(caminho) - 1, caminho, nos_visitados, arestas_percorridas

        for v in grafo.get_neighbors(u):
            arestas_percorridas += 1
            if v not in visitados and v not in anterior:
                anterior[v] = u
                pilha.append(v)

    return float('inf'), [], nos_visitados, arestas_percorridas


def dfs_classify(grafo, origem):
    """
    DFS iterativo que produz:
      - discovery / finish times
      - classificação de cada aresta: 'tree', 'back' (= ciclo),
        'forward' ou 'cross' (só em grafo dirigido)
      - has_cycle: True se alguma 'back' edge foi encontrada
    Retorna dict com chaves: 'discovery', 'finish', 'parent', 'edges', 'has_cycle'.

    Em grafo não-direcionado, ignoramos a aresta (v→u) que volta pelo pai
    para evitar marcar toda aresta de árvore como ciclo.
    """
    if origem not in grafo.get_nodes():
        return {'discovery': {}, 'finish': {}, 'parent': {}, 'edges': [], 'has_cycle': False}

    WHITE, GRAY, BLACK = 0, 1, 2
    color = {n: WHITE for n in grafo.get_nodes()}
    discovery, finish, parent = {}, {}, {}
    edges = []
    t = [0]

    pilha = [(origem, iter(grafo.get_neighbors(origem)))]
    color[origem] = GRAY
    discovery[origem] = t[0]; t[0] += 1
    parent[origem] = None
    has_cycle = False

    while pilha:
        u, it = pilha[-1]
        try:
            v = next(it)
            if not grafo.directed and v == parent.get(u):
                continue
            if color[v] == WHITE:
                edges.append((u, v, 'tree'))
                color[v] = GRAY
                discovery[v] = t[0]; t[0] += 1
                parent[v] = u
                pilha.append((v, iter(grafo.get_neighbors(v))))
            elif color[v] == GRAY:
                edges.append((u, v, 'back'))
                has_cycle = True
            else:  # BLACK
                if discovery[u] < discovery[v]:
                    edges.append((u, v, 'forward'))
                else:
                    edges.append((u, v, 'cross'))
        except StopIteration:
            pilha.pop()
            color[u] = BLACK
            finish[u] = t[0]; t[0] += 1

    return {
        'discovery': discovery,
        'finish': finish,
        'parent': parent,
        'edges': edges,
        'has_cycle': has_cycle,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Dijkstra — caminho mínimo com pesos não-negativos
# ─────────────────────────────────────────────────────────────────────────────

class NegativeWeightError(ValueError):
    """Lançada quando Dijkstra detecta uma aresta com peso negativo."""


def dijkstra(grafo, origem, destino, allow_negative=False):
    """
    Devolve (custo, caminho, nos_visitados, arestas_percorridas).
    Por padrão, lança NegativeWeightError se encontrar peso negativo
    (requisito da Parte 2: 'recusar dado com peso negativo').
    """
    if origem not in grafo.get_nodes() or destino not in grafo.get_nodes():
        return float('inf'), [], 0, 0

    distancias = {n: float('inf') for n in grafo.get_nodes()}
    distancias[origem] = 0
    anterior = {n: None for n in grafo.get_nodes()}
    fila = [(0, origem)]
    visitados = set()
    nos_visitados = 0
    arestas_percorridas = 0

    while fila:
        d_atual, u = heapq.heappop(fila)
        if u in visitados:
            continue
        visitados.add(u)
        nos_visitados += 1

        if u == destino:
            break

        if d_atual > distancias[u]:
            continue

        for v, dados in grafo.get_neighbors(u).items():
            arestas_percorridas += 1
            peso = float(dados['peso'])
            if peso < 0 and not allow_negative:
                raise NegativeWeightError(
                    f"Dijkstra recusou aresta com peso negativo: "
                    f"{u} -> {v} (peso={peso}). Use Bellman-Ford."
                )
            nd = d_atual + peso
            if nd < distancias[v]:
                distancias[v] = nd
                anterior[v] = u
                heapq.heappush(fila, (nd, v))

    if distancias[destino] == float('inf'):
        return float('inf'), [], nos_visitados, arestas_percorridas

    caminho = []
    no = destino
    while no is not None:
        caminho.insert(0, no)
        no = anterior[no]
    return round(distancias[destino], 4), caminho, nos_visitados, arestas_percorridas


# ─────────────────────────────────────────────────────────────────────────────
# Bellman-Ford
# ─────────────────────────────────────────────────────────────────────────────

def bellman_ford(grafo, origem, destino):
    """
    Versão simplificada compatível com a Parte 1 (não-direcionado).
    Retorna (custo, caminho, nos_visitados, arestas_percorridas).
    Para uso geral (dirigido + detecção de ciclo), use bellman_ford_full.
    """
    custo, caminho, visit, edges, _neg_cycle = bellman_ford_full(grafo, origem, destino)
    return custo, caminho, visit, edges


def bellman_ford_full(grafo, origem, destino):
    """
    Bellman-Ford correto para grafo dirigido OU não-direcionado.
    Detecta ciclos negativos.

    Retorna (custo, caminho, nos_visitados, arestas_percorridas, has_negative_cycle).
      - has_negative_cycle = True  → o grafo contém ciclo negativo alcançável
        a partir de 'origem'; custo é definido como -inf, caminho [].
      - has_negative_cycle = False → custo/caminho válidos.
    """
    if origem not in grafo.get_nodes() or destino not in grafo.get_nodes():
        return float('inf'), [], 0, 0, False

    nos = grafo.get_nodes()
    n = len(nos)
    distancias = {no: float('inf') for no in nos}
    distancias[origem] = 0
    anterior = {no: None for no in nos}

    arestas = list(grafo.iter_edges())  # [(u, v, peso, dados)]
    # Em não-direcionado, iter_edges devolve cada par uma vez;
    # precisamos relaxar nos dois sentidos.
    if not grafo.directed:
        arestas_relax = [(u, v, p) for u, v, p, _ in arestas] + \
                        [(v, u, p) for u, v, p, _ in arestas]
    else:
        arestas_relax = [(u, v, float(p)) for u, v, p, _ in arestas]

    arestas_percorridas = 0

    # V-1 iterações
    for _ in range(n - 1):
        atualizado = False
        for u, v, peso in arestas_relax:
            arestas_percorridas += 1
            if distancias[u] != float('inf') and distancias[u] + peso < distancias[v]:
                distancias[v] = distancias[u] + peso
                anterior[v] = u
                atualizado = True
        if not atualizado:
            break

    # Iteração extra para detectar ciclo negativo
    has_negative_cycle = False
    for u, v, peso in arestas_relax:
        if distancias[u] != float('inf') and distancias[u] + peso < distancias[v]:
            has_negative_cycle = True
            break

    if has_negative_cycle:
        return float('-inf'), [], n, arestas_percorridas, True

    if distancias[destino] == float('inf'):
        return float('inf'), [], n, arestas_percorridas, False

    caminho = []
    no = destino
    while no is not None:
        caminho.insert(0, no)
        no = anterior[no]

    return round(distancias[destino], 4), caminho, n, arestas_percorridas, False
