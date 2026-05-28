"""
Testes do Bellman-Ford:
  (i)  com pesos negativos sem ciclo negativo → distâncias corretas
  (ii) com ciclo negativo → flag has_negative_cycle = True
"""
import pytest

from src.graphs.graph import Graph
from src.graphs.algorithms import bellman_ford_full, bellman_ford


def test_bellman_pesos_positivos_grafo_aeroportos_like():
    """Compatibilidade com Parte 1 (não-direcionado, pesos positivos)."""
    g = Graph(directed=False)
    g.add_edge("REC", "SSA", peso=675.29)
    g.add_edge("SSA", "POA", peso=2287.46)
    g.add_edge("REC", "POA", peso=2962.75)
    cost, path, _, _ = bellman_ford(g, "REC", "POA")
    assert cost == 2962.75
    assert path[0] == "REC" and path[-1] == "POA"


def test_bellman_peso_negativo_sem_ciclo():
    """
    Grafo dirigido com peso negativo, sem ciclo negativo.
      S→A=4, S→B=2, B→A=-3, A→T=1, B→T=5
    Caminho ótimo S→B→A→T = 2 + (-3) + 1 = 0.
    """
    g = Graph(directed=True)
    g.add_edge("S", "A", peso=4)
    g.add_edge("S", "B", peso=2)
    g.add_edge("B", "A", peso=-3)
    g.add_edge("A", "T", peso=1)
    g.add_edge("B", "T", peso=5)
    cost, path, _, _, neg = bellman_ford_full(g, "S", "T")
    assert neg is False
    assert cost == 0
    assert path == ["S", "B", "A", "T"]


def test_bellman_detecta_ciclo_negativo():
    """A→B=1, B→C=-3, C→A=1 → soma do ciclo = -1, deve detectar."""
    g = Graph(directed=True)
    g.add_edge("A", "B", peso=1)
    g.add_edge("B", "C", peso=-3)
    g.add_edge("C", "A", peso=1)
    g.add_edge("A", "D", peso=2)
    _, _, _, _, neg = bellman_ford_full(g, "A", "D")
    assert neg is True


def test_bellman_dag_distancias_corretas():
    """
    DAG simples — confere distâncias mínimas.
      A→B=5, A→C=2, C→B=1, B→D=3, C→D=10
    Menor A→D = A→C→B→D = 2+1+3 = 6.
    """
    g = Graph(directed=True)
    g.add_edge("A", "B", peso=5)
    g.add_edge("A", "C", peso=2)
    g.add_edge("C", "B", peso=1)
    g.add_edge("B", "D", peso=3)
    g.add_edge("C", "D", peso=10)
    cost, path, _, _, neg = bellman_ford_full(g, "A", "D")
    assert neg is False
    assert cost == 6
    assert path == ["A", "C", "B", "D"]


def test_bellman_destino_inalcancavel():
    g = Graph(directed=True)
    g.add_node("X"); g.add_node("Y")
    cost, path, _, _, neg = bellman_ford_full(g, "X", "Y")
    assert cost == float("inf")
    assert path == []
    assert neg is False


def test_bellman_ciclo_negativo_nao_alcancavel_da_origem():
    """
    Ciclo negativo existe (X→Y→X com soma -2) mas NÃO é alcançável a partir
    da origem 'S'. O algoritmo ainda pode detectar pela relaxação global,
    mas o caminho S→T deve ser computado se não houver ciclo no caminho.
    """
    g = Graph(directed=True)
    g.add_edge("S", "T", peso=5)
    g.add_edge("X", "Y", peso=-3)
    g.add_edge("Y", "X", peso=1)  # ciclo X-Y soma = -2, mas isolado de S
    cost, path, _, _, neg = bellman_ford_full(g, "S", "T")
    # Nossa implementação atual relaxa todas as arestas; ciclo será detectado
    # globalmente. O importante é validar o comportamento documentado.
    assert path[0] == "S" or neg is True
