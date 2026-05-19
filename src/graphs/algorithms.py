import heapq
from collections import deque


def bfs(grafo, origem, destino):

    if origem not in grafo.get_nodes() or destino not in grafo.get_nodes():
        return float('inf'), [], 0, 0

    visitados = set()
    fila = deque([(origem, [origem])])

    nos_visitados = 0
    arestas_percorridas = 0

    while fila:
        no_atual, caminho = fila.popleft()

        if no_atual in visitados:
            continue

        visitados.add(no_atual)
        nos_visitados += 1

        if no_atual == destino:
            return (
                len(caminho) - 1,
                caminho,
                nos_visitados,
                arestas_percorridas
            )

        for vizinho in grafo.get_neighbors(no_atual):

            # Conta TODAS as arestas analisadas
            arestas_percorridas += 1

            if vizinho not in visitados:
                fila.append((vizinho, caminho + [vizinho]))

    return float('inf'), [], nos_visitados, arestas_percorridas


def dfs(grafo, origem, destino):

    if origem not in grafo.get_nodes() or destino not in grafo.get_nodes():
        return float('inf'), [], 0, 0

    visitados = set()

    nos_visitados = 0
    arestas_percorridas = 0

    def _dfs_recursivo(no, caminho):

        nonlocal nos_visitados
        nonlocal arestas_percorridas

        if no in visitados:
            return None

        visitados.add(no)
        nos_visitados += 1

        if no == destino:
            return caminho

        for vizinho in grafo.get_neighbors(no):

            # Conta todas as arestas exploradas
            arestas_percorridas += 1

            resultado = _dfs_recursivo(
                vizinho,
                caminho + [vizinho]
            )

            if resultado is not None:
                return resultado

        return None

    caminho = _dfs_recursivo(origem, [origem])

    if caminho is None:
        return float('inf'), [], nos_visitados, arestas_percorridas

    return (
        len(caminho) - 1,
        caminho,
        nos_visitados,
        arestas_percorridas
    )


def bellman_ford(grafo, origem, destino):

    if origem not in grafo.get_nodes() or destino not in grafo.get_nodes():
        return float('inf'), [], 0, 0

    nos = grafo.get_nodes()

    distancias = {no: float('inf') for no in nos}
    distancias[origem] = 0

    anterior = {no: None for no in nos}

    arestas_percorridas = 0

    arestas = []
    vistas = set()

    for u in nos:
        for v, dados in grafo.get_neighbors(u).items():

            par = frozenset([u, v])

            if par not in vistas:
                vistas.add(par)
                arestas.append((u, v, float(dados['peso'])))

    for _ in range(len(nos) - 1):

        atualizado = False

        for u, v, peso in arestas:

            # Conta relaxamentos
            arestas_percorridas += 1

            if distancias[u] + peso < distancias[v]:
                distancias[v] = distancias[u] + peso
                anterior[v] = u
                atualizado = True

            if distancias[v] + peso < distancias[u]:
                distancias[u] = distancias[v] + peso
                anterior[u] = v
                atualizado = True

        if not atualizado:
            break

    if distancias[destino] == float('inf'):
        return float('inf'), [], len(nos), arestas_percorridas

    caminho = []

    no = destino

    while no is not None:
        caminho.insert(0, no)
        no = anterior[no]

    return (
        round(distancias[destino], 2),
        caminho,
        len(nos),
        arestas_percorridas
    )


def dijkstra(grafo, origem, destino):

    if origem not in grafo.get_nodes() or destino not in grafo.get_nodes():
        return float('inf'), [], 0, 0

    distancias = {
        no: float('inf')
        for no in grafo.get_nodes()
    }

    distancias[origem] = 0

    caminho_anterior = {
        no: None
        for no in grafo.get_nodes()
    }

    fila = [(0, origem)]

    visitados = set()

    nos_visitados = 0
    arestas_percorridas = 0

    while fila:

        distancia_atual, no_atual = heapq.heappop(fila)

        if no_atual in visitados:
            continue

        visitados.add(no_atual)
        nos_visitados += 1

        if no_atual == destino:
            break

        if distancia_atual > distancias[no_atual]:
            continue

        for vizinho, dados_aresta in grafo.get_neighbors(no_atual).items():

            # Conta todas as arestas analisadas
            arestas_percorridas += 1

            peso_aresta = float(dados_aresta['peso'])

            nova_distancia = distancia_atual + peso_aresta

            if nova_distancia < distancias[vizinho]:

                distancias[vizinho] = nova_distancia

                caminho_anterior[vizinho] = no_atual

                heapq.heappush(
                    fila,
                    (nova_distancia, vizinho)
                )

    if distancias[destino] == float('inf'):
        return float('inf'), [], nos_visitados, arestas_percorridas

    caminho_final = []

    no_passo = destino

    while no_passo is not None:
        caminho_final.insert(0, no_passo)
        no_passo = caminho_anterior[no_passo]

    return (
        round(distancias[destino], 2),
        caminho_final,
        nos_visitados,
        arestas_percorridas
    )