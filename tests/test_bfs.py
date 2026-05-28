"""
Testes do BFS — níveis corretos em grafo pequeno + caminho mínimo em arestas.
"""
import pytest

from src.graphs.graph import Graph
from src.graphs.algorithms import bfs, bfs_levels


@pytest.fixture
def grafo_pequeno():
    """
    Grafo não-direcionado:
        A — B — C
        |       |
        D — E — F
    Distâncias em arestas (A como fonte):
      A:0, B:1, D:1, C:2, E:2, F:3
    """
    g = Graph(directed=False)
    g.add_edge("A", "B", peso=1)
    g.add_edge("B", "C", peso=1)
    g.add_edge("A", "D", peso=1)
    g.add_edge("D", "E", peso=1)
    g.add_edge("E", "F", peso=1)
    g.add_edge("C", "F", peso=1)
    return g


@pytest.fixture
def grafo_dirigido_simples():
    """
    Grafo dirigido:
      A → B → C
      A → D → E
      C → E
    """
    g = Graph(directed=True)
    g.add_edge("A", "B", peso=1)
    g.add_edge("B", "C", peso=1)
    g.add_edge("A", "D", peso=1)
    g.add_edge("D", "E", peso=1)
    g.add_edge("C", "E", peso=1)
    return g


def test_bfs_levels_grafo_pequeno(grafo_pequeno):
    res = bfs_levels(grafo_pequeno, "A")
    expected = {"A": 0, "B": 1, "D": 1, "C": 2, "E": 2, "F": 3}
    assert res["levels"] == expected


def test_bfs_caminho_minimo_em_arestas(grafo_pequeno):
    dist, path, _, _ = bfs(grafo_pequeno, "A", "F")
    assert dist == 3
    assert path[0] == "A" and path[-1] == "F"
    assert len(path) == 4


def test_bfs_destino_inalcancavel():
    g = Graph(directed=False)
    g.add_node("X"); g.add_node("Y")
    dist, path, _, _ = bfs(g, "X", "Y")
    assert dist == float("inf")
    assert path == []


def test_bfs_origem_invalida(grafo_pequeno):
    dist, path, _, _ = bfs(grafo_pequeno, "FANTASMA", "A")
    assert dist == float("inf")
    assert path == []


def test_bfs_levels_dirigido_respeita_direcao(grafo_dirigido_simples):
    """A→D→E é caminho válido; E→A não existe."""
    res = bfs_levels(grafo_dirigido_simples, "A")
    assert res["levels"]["E"] == 2

    res_inv = bfs_levels(grafo_dirigido_simples, "E")
    # E só alcança ele mesmo no grafo dirigido
    assert res_inv["levels"] == {"E": 0}
