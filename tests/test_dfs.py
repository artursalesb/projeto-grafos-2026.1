"""
Testes do DFS — detecção de ciclo + classificação de arestas.
"""
import pytest

from src.graphs.graph import Graph
from src.graphs.algorithms import dfs, dfs_classify


def test_dfs_caminho_existe():
    g = Graph(directed=False)
    g.add_edge("A", "B", peso=1)
    g.add_edge("B", "C", peso=1)
    dist, path, _, _ = dfs(g, "A", "C")
    assert dist >= 1
    assert path[0] == "A" and path[-1] == "C"


def test_dfs_destino_inalcancavel():
    g = Graph(directed=False)
    g.add_node("X"); g.add_node("Y")
    dist, _, _, _ = dfs(g, "X", "Y")
    assert dist == float("inf")


def test_dfs_classify_detecta_ciclo_em_dirigido():
    """A→B→C→A é ciclo. Esperamos ao menos uma aresta classificada como 'back'."""
    g = Graph(directed=True)
    g.add_edge("A", "B", peso=1)
    g.add_edge("B", "C", peso=1)
    g.add_edge("C", "A", peso=1)
    res = dfs_classify(g, "A")
    assert res["has_cycle"] is True
    kinds = [k for _, _, k in res["edges"]]
    assert "back" in kinds
    assert kinds.count("tree") == 2  # A→B e B→C


def test_dfs_classify_dag_sem_ciclo():
    """DAG: nenhum back edge."""
    g = Graph(directed=True)
    g.add_edge("A", "B", peso=1)
    g.add_edge("A", "C", peso=1)
    g.add_edge("B", "D", peso=1)
    g.add_edge("C", "D", peso=1)
    res = dfs_classify(g, "A")
    assert res["has_cycle"] is False
    kinds = [k for _, _, k in res["edges"]]
    assert "back" not in kinds
    # deve ter forward ou cross (porque D é alcançado por dois caminhos)
    assert any(k in ("forward", "cross") for k in kinds)


def test_dfs_classify_nao_direcionado_ignora_aresta_pai():
    """Em grafo não-direcionado, voltar pela aresta do pai NÃO conta como ciclo."""
    g = Graph(directed=False)
    g.add_edge("A", "B", peso=1)
    g.add_edge("B", "C", peso=1)  # caminho linear A-B-C, sem ciclo real
    res = dfs_classify(g, "A")
    assert res["has_cycle"] is False


def test_dfs_classify_nao_direcionado_detecta_ciclo_real():
    """Triângulo A-B-C-A em grafo não-direcionado: tem ciclo real."""
    g = Graph(directed=False)
    g.add_edge("A", "B", peso=1)
    g.add_edge("B", "C", peso=1)
    g.add_edge("C", "A", peso=1)
    res = dfs_classify(g, "A")
    assert res["has_cycle"] is True


def test_dfs_classify_discovery_finish_ordem():
    """Em qualquer DFS válido, discovery[u] < finish[u]."""
    g = Graph(directed=True)
    g.add_edge("A", "B", peso=1)
    g.add_edge("B", "C", peso=1)
    g.add_edge("A", "D", peso=1)
    res = dfs_classify(g, "A")
    for node in res["discovery"]:
        assert res["discovery"][node] < res["finish"][node]
