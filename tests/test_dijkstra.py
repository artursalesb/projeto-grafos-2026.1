"""
Testes do Dijkstra — caminhos corretos com pesos >= 0 + recusa peso negativo.
"""
import pytest

from src.graphs.graph import Graph
from src.graphs.algorithms import dijkstra, NegativeWeightError


def test_dijkstra_caminho_simples():
    """A→B (10), A→C (3), C→B (4) → menor caminho A→C→B custa 7."""
    g = Graph(directed=True)
    g.add_edge("A", "B", peso=10)
    g.add_edge("A", "C", peso=3)
    g.add_edge("C", "B", peso=4)
    cost, path, _, _ = dijkstra(g, "A", "B")
    assert cost == 7
    assert path == ["A", "C", "B"]


def test_dijkstra_caminho_classico_5_vertices():
    """
    Grafo clássico (CLRS):
      0→1=10, 0→3=5, 1→3=2, 3→1=3, 1→2=1, 3→2=9, 3→4=2, 2→4=4, 4→0=7, 4→2=6
    Menor 0→2 = 0→3→1→2 = 5+3+1 = 9.
    """
    g = Graph(directed=True)
    g.add_edge("0", "1", peso=10)
    g.add_edge("0", "3", peso=5)
    g.add_edge("1", "3", peso=2)
    g.add_edge("3", "1", peso=3)
    g.add_edge("1", "2", peso=1)
    g.add_edge("3", "2", peso=9)
    g.add_edge("3", "4", peso=2)
    g.add_edge("2", "4", peso=4)
    g.add_edge("4", "0", peso=7)
    g.add_edge("4", "2", peso=6)
    cost, path, _, _ = dijkstra(g, "0", "2")
    assert cost == 9
    assert path == ["0", "3", "1", "2"]


def test_dijkstra_nao_direcionado_aeroportos_like():
    """Pesos contínuos, grafo não-direcionado."""
    g = Graph(directed=False)
    g.add_edge("REC", "SSA", peso=675.29)
    g.add_edge("SSA", "POA", peso=2287.46)
    g.add_edge("REC", "POA", peso=2962.75)
    cost, path, _, _ = dijkstra(g, "REC", "POA")
    # caminho direto é mais curto que REC→SSA→POA (675.29+2287.46=2962.75)
    assert cost == 2962.75


def test_dijkstra_destino_inalcancavel():
    g = Graph(directed=True)
    g.add_node("X"); g.add_node("Y")
    cost, path, _, _ = dijkstra(g, "X", "Y")
    assert cost == float("inf")
    assert path == []


def test_dijkstra_recusa_peso_negativo():
    """Requisito explícito: 'recusar dado com peso negativo'."""
    g = Graph(directed=True)
    g.add_edge("A", "B", peso=5)
    g.add_edge("B", "C", peso=-3)
    with pytest.raises(NegativeWeightError):
        dijkstra(g, "A", "C")


def test_dijkstra_allow_negative_flag_bypass():
    """Quando explicitamente permitido, não lança (uso interno)."""
    g = Graph(directed=True)
    g.add_edge("A", "B", peso=5)
    g.add_edge("B", "C", peso=-3)
    cost, _, _, _ = dijkstra(g, "A", "C", allow_negative=True)
    assert cost == 2
