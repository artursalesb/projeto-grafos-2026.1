"""
benchmark_algoritmos.py
=======================
Módulo de benchmark comparativo dos algoritmos de grafo do projeto.

Algoritmos avaliados:
  - BFS  (Busca em Largura)
  - DFS  (Busca em Profundidade)
  - Dijkstra
  - Bellman-Ford

Métricas coletadas por algoritmo:
  - Tempo médio de execução (time.perf_counter, 100 repetições)
  - Nós visitados
  - Arestas percorridas

Saídas geradas:
  - out/benchmark.csv
  - out/benchmark_barras.png
  - out/benchmark_linhas.png
  - out/benchmark_relatorio.md
  - out/limitacoes_visualizacao.md
"""

import os
import sys
import csv
import time
import math
import textwrap

import matplotlib
matplotlib.use('Agg')           # Backend sem display (funciona em servidor)
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# ── Garante que o projeto raiz está no sys.path ──────────────────────────────
ROOT = os.path.dirname(os.path.abspath(__file__))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.graphs.io import load_graph, gerar_malha_csv
from src.graphs.algorithms import bfs, dfs, dijkstra, bellman_ford

# ── Configurações ─────────────────────────────────────────────────────────────
REPETICOES  = 100          # Número de execuções para calcular a média
ORIGEM      = 'REC'        # Aeroporto de origem dos testes
DESTINO     = 'POA'        # Aeroporto de destino dos testes
OUT_DIR     = 'out'

# Paleta de cores consistente (igual ao slide da disciplina)
CORES = {
    'BFS':          '#7f8ef7',   # Azul-lavanda
    'DFS':          '#7f8ef7',   # Mesma família (sem pesos)
    'Dijkstra':     '#2ecc71',   # Verde
    'Bellman-Ford': '#9b59b6',   # Roxo
}
LISTA_ALGOS = ['BFS', 'DFS', 'Dijkstra', 'Bellman-Ford']


# ── Helpers ───────────────────────────────────────────────────────────────────

def _cronometrar(fn, *args, repeticoes=REPETICOES):
    """Executa fn(*args) N vezes e devolve (tempo_medio_s, ultimo_resultado)."""
    resultado = None
    tempos = []
    for _ in range(repeticoes):
        t0 = time.perf_counter()
        resultado = fn(*args)
        t1 = time.perf_counter()
        tempos.append(t1 - t0)
    return sum(tempos) / len(tempos), resultado


# ── Benchmark principal ───────────────────────────────────────────────────────

def executar_benchmark(grafo):
    """
    Roda os 4 algoritmos e retorna lista de dicts com os resultados.
    """
    os.makedirs(OUT_DIR, exist_ok=True)

    print(f"\n🔬 Iniciando benchmark  ({REPETICOES}x cada)  —  {ORIGEM} → {DESTINO}\n")
    print(f"   Grafo: {grafo.get_order()} nós, {grafo.get_size()} arestas\n")
    print(f"   {'Algoritmo':<14}  {'Tempo médio':>12}  {'Nós visit.':>11}  {'Arestas perc.':>14}")
    print(f"   {'-'*57}")

    resultados = []

    # ───────────────── BFS ─────────────────
    tempo_bfs, saida_bfs = _cronometrar(
        bfs,
        grafo,
        ORIGEM,
        DESTINO
    )

    _, _, nos_bfs, ar_bfs = saida_bfs

    resultados.append({
        'algoritmo': 'BFS',
        'tempo_medio': tempo_bfs,
        'nos_visitados': nos_bfs,
        'arestas_percorridas': ar_bfs
    })

    print(
        f"   {'BFS':<14}  "
        f"{tempo_bfs*1000:>10.4f}ms  "
        f"{nos_bfs:>11}  "
        f"{ar_bfs:>14}"
    )

    # ───────────────── DFS ─────────────────
    tempo_dfs, saida_dfs = _cronometrar(
        dfs,
        grafo,
        ORIGEM,
        DESTINO
    )

    _, _, nos_dfs, ar_dfs = saida_dfs

    resultados.append({
        'algoritmo': 'DFS',
        'tempo_medio': tempo_dfs,
        'nos_visitados': nos_dfs,
        'arestas_percorridas': ar_dfs
    })

    print(
        f"   {'DFS':<14}  "
        f"{tempo_dfs*1000:>10.4f}ms  "
        f"{nos_dfs:>11}  "
        f"{ar_dfs:>14}"
    )

    # ─────────────── Dijkstra ───────────────
    tempo_dijk, saida_dijk = _cronometrar(
        dijkstra,
        grafo,
        ORIGEM,
        DESTINO
    )

    _, _, nos_dijk, ar_dijk = saida_dijk

    resultados.append({
        'algoritmo': 'Dijkstra',
        'tempo_medio': tempo_dijk,
        'nos_visitados': nos_dijk,
        'arestas_percorridas': ar_dijk
    })

    print(
        f"   {'Dijkstra':<14}  "
        f"{tempo_dijk*1000:>10.4f}ms  "
        f"{nos_dijk:>11}  "
        f"{ar_dijk:>14}"
    )

    # ───────────── Bellman-Ford ─────────────
    tempo_bf, saida_bf = _cronometrar(
        bellman_ford,
        grafo,
        ORIGEM,
        DESTINO
    )

    _, _, nos_bf, ar_bf = saida_bf

    resultados.append({
        'algoritmo': 'Bellman-Ford',
        'tempo_medio': tempo_bf,
        'nos_visitados': nos_bf,
        'arestas_percorridas': ar_bf
    })

    print(
        f"   {'Bellman-Ford':<14}  "
        f"{tempo_bf*1000:>10.4f}ms  "
        f"{nos_bf:>11}  "
        f"{ar_bf:>14}"
    )

    print()

    return resultados


# ── Exportar CSV ──────────────────────────────────────────────────────────────

def exportar_csv(resultados):
    caminho = os.path.join(OUT_DIR, 'benchmark.csv')
    with open(caminho, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['algoritmo', 'tempo_medio',
                                               'nos_visitados', 'arestas_percorridas'])
        writer.writeheader()
        writer.writerows(resultados)
    print(f"✅ {caminho} gerado.")


# ── Gráfico de Barras ─────────────────────────────────────────────────────────

def gerar_grafico_barras(resultados):
    """
    Gráfico de barras verticais comparando o tempo médio (ms) de cada algoritmo.
    """
    nomes  = [r['algoritmo'] for r in resultados]
    tempos = [r['tempo_medio'] * 1000 for r in resultados]   # ms
    cores  = [CORES[n] for n in nomes]

    fig, ax = plt.subplots(figsize=(10, 6))
    fig.patch.set_facecolor('#0d1117')
    ax.set_facecolor('#161b22')

    barras = ax.bar(nomes, tempos, color=cores, edgecolor='white', linewidth=0.6, width=0.55)

    # Rótulo de valor no topo de cada barra
    for bar, val in zip(barras, tempos):
        ax.text(bar.get_x() + bar.get_width() / 2,
                bar.get_height() + max(tempos) * 0.01,
                f'{val:.4f} ms', ha='center', va='bottom',
                color='white', fontsize=10, fontweight='bold')

    ax.set_title('Comparação de Tempo Médio de Execução\n(100 execuções — REC → POA)',
                 color='white', fontsize=14, pad=16)
    ax.set_xlabel('Algoritmo', color='#aaaaaa', fontsize=12)
    ax.set_ylabel('Tempo Médio (ms)', color='#aaaaaa', fontsize=12)
    ax.tick_params(colors='white')
    ax.spines[:].set_color('#333333')
    ax.yaxis.grid(True, linestyle='--', alpha=0.3, color='white')
    ax.set_axisbelow(True)

    # Legenda com cores
    patches = [mpatches.Patch(color=CORES[n], label=n) for n in LISTA_ALGOS]
    ax.legend(handles=patches, loc='upper left', framealpha=0.2,
              labelcolor='white', facecolor='#1e1e1e')

    caminho = os.path.join(OUT_DIR, 'benchmark_barras.png')
    plt.tight_layout()
    plt.savefig(caminho, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"✅ {caminho} gerado.")


# ── Gráfico de Linhas ─────────────────────────────────────────────────────────

def gerar_grafico_linhas(resultados):
    """
    Gráfico de linhas mostrando as 3 métricas side-by-side (tempo, nós, arestas).
    Cada métrica tem seu próprio eixo Y para permitir comparação visual.
    """
    nomes       = [r['algoritmo']          for r in resultados]
    tempos      = [r['tempo_medio'] * 1000 for r in resultados]   # ms
    nos         = [r['nos_visitados']       for r in resultados]
    arestas     = [r['arestas_percorridas'] for r in resultados]
    x           = range(len(nomes))

    fig, ax1 = plt.subplots(figsize=(11, 6))
    fig.patch.set_facecolor('#0d1117')
    ax1.set_facecolor('#161b22')

    # Eixo 1 — Tempo (ms)
    cor_tempo = '#f39c12'
    ax1.plot(x, tempos, 'o-', color=cor_tempo, linewidth=2.5, markersize=8, label='Tempo (ms)')
    ax1.set_xlabel('Algoritmo', color='#aaaaaa', fontsize=12)
    ax1.set_ylabel('Tempo Médio (ms)', color=cor_tempo, fontsize=11)
    ax1.tick_params(axis='y', labelcolor=cor_tempo)
    ax1.tick_params(axis='x', colors='white')
    ax1.set_xticks(x)
    ax1.set_xticklabels(nomes, color='white')
    ax1.spines[:].set_color('#333333')
    ax1.yaxis.grid(True, linestyle='--', alpha=0.2, color='white')
    ax1.set_axisbelow(True)

    # Eixo 2 — Nós visitados
    ax2 = ax1.twinx()
    cor_nos = '#2ecc71'
    ax2.plot(x, nos, 's--', color=cor_nos, linewidth=2, markersize=8, label='Nós visitados')
    ax2.set_ylabel('Nós Visitados', color=cor_nos, fontsize=11)
    ax2.tick_params(axis='y', labelcolor=cor_nos)
    ax2.spines[:].set_color('#333333')

    # Eixo 3 — Arestas percorridas (deslocado)
    ax3 = ax1.twinx()
    ax3.spines['right'].set_position(('axes', 1.12))
    ax3.spines[:].set_color('#333333')
    cor_ar = '#e74c3c'
    ax3.plot(x, arestas, '^:', color=cor_ar, linewidth=2, markersize=8, label='Arestas perc.')
    ax3.set_ylabel('Arestas Percorridas', color=cor_ar, fontsize=11)
    ax3.tick_params(axis='y', labelcolor=cor_ar)

    # Legenda unificada
    linhas  = [
        plt.Line2D([0], [0], color=cor_tempo, marker='o', linewidth=2, label='Tempo (ms)'),
        plt.Line2D([0], [0], color=cor_nos,   marker='s', linewidth=2, linestyle='--', label='Nós visitados'),
        plt.Line2D([0], [0], color=cor_ar,    marker='^', linewidth=2, linestyle=':', label='Arestas percorridas'),
    ]
    ax1.legend(handles=linhas, loc='upper left', framealpha=0.2,
               labelcolor='white', facecolor='#1e1e1e')

    ax1.set_title('Análise Comparativa de Performance dos Algoritmos\n(100 execuções — REC → POA)',
                  color='white', fontsize=13, pad=14)

    caminho = os.path.join(OUT_DIR, 'benchmark_linhas.png')
    plt.tight_layout()
    plt.savefig(caminho, dpi=150, bbox_inches='tight', facecolor=fig.get_facecolor())
    plt.close()
    print(f"✅ {caminho} gerado.")


# ── Relatório em Markdown ─────────────────────────────────────────────────────

def gerar_relatorio(resultados, grafo):
    """
    Gera benchmark_relatorio.md com metodologia, interpretação e comparação.
    """
    v = grafo.get_order()
    e = grafo.get_size()

    # Encontra o mais rápido e mais lento
    mais_rapido = min(resultados, key=lambda r: r['tempo_medio'])
    mais_lento  = max(resultados, key=lambda r: r['tempo_medio'])
    razao       = mais_lento['tempo_medio'] / mais_rapido['tempo_medio']

    linhas_tabela = '\n'.join(
        f"| {r['algoritmo']:<14} | {r['tempo_medio']*1000:>12.4f} ms | "
        f"{r['nos_visitados']:>12} | {r['arestas_percorridas']:>15} |"
        for r in resultados
    )

    conteudo = f"""\
# Benchmark de Algoritmos de Grafos

## 1. Metodologia

O benchmark foi executado sobre o **grafo da malha aérea brasileira** modelado no projeto,
composto por **{v} nós** (aeroportos) e **{e} arestas** (rotas), com pesos representando
a distância geodésica em quilômetros (fórmula de Haversine).

### Parâmetros de execução

| Parâmetro           | Valor         |
|---------------------|---------------|
| Origem              | `{ORIGEM}`    |
| Destino             | `{DESTINO}`   |
| Repetições          | {REPETICOES}  |
| Medição de tempo    | `time.perf_counter()` |
| Métrica principal   | Tempo médio (média aritmética) |

Cada algoritmo foi chamado **{REPETICOES} vezes** sobre o mesmo grafo e o mesmo par
origem-destino. O tempo reportado é a **média aritmética** dessas execuções,
eliminando ruídos de sistema operacional e cache.

---

## 2. Resultados

| Algoritmo      | Tempo Médio      | Nós Visitados | Arestas Percorridas |
|----------------|-----------------|--------------|---------------------|
{linhas_tabela}

---

## 3. Interpretação dos Resultados

### BFS e DFS — algoritmos sem peso
BFS e DFS são algoritmos de **travessia** que ignoram os pesos das arestas.
O BFS explora o grafo em camadas (largura), garantindo o caminho com **menor número
de saltos**, enquanto o DFS mergulha em profundidade antes de retroceder.
Ambos operam em **O(V + E)**, resultando nos menores tempos de execução no benchmark.

A diferença entre BFS e DFS é principalmente estrutural:
- **BFS** usa uma fila (FIFO) e tende a visitar mais nós em grafos esparsos,
  mas garante a solução ótima em termos de saltos.
- **DFS** usa uma pilha (recursão) e pode encontrar o destino mais rápido em
  alguns casos, mas não garante o caminho mínimo.

### Dijkstra — caminho mínimo com pesos positivos
Dijkstra opera em **O((V + E) log V)** usando uma fila de prioridade (heap).
É o algoritmo de referência para grafos com pesos positivos, retornando sempre
o caminho de **menor custo total** em quilômetros. Seu desempenho é superior
ao Bellman-Ford em grafos sem arestas de peso negativo.

### Bellman-Ford — por que é mais lento?
O Bellman-Ford opera em **O(V × E)**, o que o torna significativamente mais lento
em grafos com muitas arestas. No nosso grafo de {v} nós e {e} arestas, o algoritmo
precisa iterar **até {v-1} vezes sobre todas as {e} arestas**, totalizando até
{(v-1)*e:,} operações de relaxamento.

Razão de desempenho observada: **Bellman-Ford é ≈ {razao:.1f}× mais lento** que
{mais_rapido['algoritmo']}, o algoritmo mais rápido neste benchmark.

A vantagem do Bellman-Ford está na sua capacidade de lidar com **pesos negativos**
e detectar **ciclos negativos** — funcionalidades desnecessárias para a malha aérea,
onde todas as distâncias são positivas. Isso ilustra o princípio de escolher o
algoritmo adequado à estrutura do problema.

---

## 4. Comparação Resumida

| Algoritmo    | Complexidade   | Garante caminho mínimo? | Suporta peso negativo? | Ideal para               |
|--------------|---------------|------------------------|------------------------|--------------------------|
| BFS          | O(V + E)      | Sim (em saltos)        | Não                    | Grafos sem peso          |
| DFS          | O(V + E)      | Não                    | Não                    | Busca/travessia          |
| Dijkstra     | O((V+E)log V) | Sim (em custo)         | Não                    | Grafos com pesos positivos |
| Bellman-Ford | O(V × E)      | Sim (em custo)         | **Sim**                | Grafos com pesos negativos |

---

## 5. Conclusão

Para a **malha aérea brasileira**, onde todos os pesos (distâncias) são positivos,
o **Dijkstra** é a escolha ideal: combina precisão (caminho mínimo real em km) com
eficiência. O Bellman-Ford é um recurso valioso em outros domínios (redes de fluxo,
finanças), mas representa custo computacional desnecessário aqui.

Os gráficos gerados (`benchmark_barras.png` e `benchmark_linhas.png`) utilizam escalas
padronizadas e cores consistentes entre algoritmos, seguindo os princípios de AVD
para comparabilidade direta.
"""

    caminho = os.path.join(OUT_DIR, 'benchmark_relatorio.md')
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(conteudo)
    print(f"✅ {caminho} gerado.")


# ── Limitações da Visualização ────────────────────────────────────────────────

def gerar_limitacoes():
    """
    Gera limitacoes_visualizacao.md com discussão crítica sobre AVD.
    """
    conteudo = """\
# Limitações da Visualização — Discussão Crítica (AVD)

## 1. Escalabilidade de Grafos Grandes

A abordagem atual de visualização force-directed (vis.js / PyVis) funciona bem
para grafos com dezenas a centenas de nós. Acima de ~500 nós, o algoritmo de
simulação física começa a apresentar:

- **Degradação de desempenho**: o custo de simular forças entre pares de nós
  cresce quadraticamente, tornando a renderização lenta ou inutilizável no browser.
- **Instabilidade de layout**: o sistema pode não convergir para uma posição estável,
  oscilando indefinidamente (o que confunde o usuário).
- **Necessidade de algoritmos alternativos**: para grafos muito grandes, abordagens
  como *Barnes-Hut* (O(n log n)) ou layouts hierárquicos (Sugiyama) são preferíveis.

**Impacto no projeto**: a malha aérea real do Brasil possui mais de 100 aeroportos
comerciais. Adicionar todos sem filtros tornaria o grafo ilegível.

---

## 2. Poluição Visual e Sobreposição de Nós/Arestas

Em grafos densos, múltiplas arestas se sobrepõem, criando um efeito de "hairball"
que impossibilita distinguir conexões individuais. Sintomas observáveis:

- Arestas formam massas escuras no centro do grafo.
- Rótulos de nós se sobrepõem tornando a leitura impossível.
- A profundidade perceptual é perdida — o olho humano não consegue rastrear
  caminhos individuais.

**Mitigações aplicadas no projeto**:
- Transparência (`alpha`) nas arestas menos importantes (Lei da Simplicidade de Gestalt).
- Tamanho de nó proporcional ao grau (hubs maiores = hierarquia visual).
- Fundo escuro para aumentar o contraste (Figura-Fundo de Gestalt).

**Limitação persistente**: mesmo com essas mitigações, adicionar mais de 40 nós
ao grafo interativo compromete a legibilidade das arestas de menor grau.

---

## 3. Limitações dos Layouts Force-Directed

O layout ForceAtlas2 (usado via `net.force_atlas_2based()`) otimiza a posição dos
nós minimizando sobreposições e agrupando vizinhos próximos. Porém:

- **Não usa coordenadas geográficas reais**: aeroportos no Norte e Sul do Brasil
  podem aparecer espacialmente próximos apenas porque compartilham conexões,
  distorcendo a percepção geográfica.
- **Não determinismo**: cada execução pode gerar um layout diferente, dificultando
  comparações visuais entre versões do grafo.
- **Hubs dominam o espaço visual**: nós de alto grau (GRU, BSB) atraem muitas
  arestas e tendem a "puxar" o layout inteiro para si, comprimindo subgrafos regionais.

**Alternativa recomendada**: usar coordenadas lat/lon reais (já disponíveis em `COORDS`
no código de io.py) para posicionar os nós sobre um mapa base — abordagem
explanatória e geograficamente fiel.

---

## 4. Perda de Legibilidade em Grafos Densos

A densidade do grafo atual é relativamente baixa (grafo esparso), mas ao adicionar
conexões cruzadas entre regiões, a densidade aumenta rapidamente. Acima de ~15%
de densidade, os gráficos de rede perdem capacidade explanatória:

- O usuário não consegue distinguir padrões de cluster.
- A lei da Proximidade de Gestalt deixa de funcionar — não há mais grupos visuais claros.
- Caminhos destacados (Dijkstra em ciano) se perdem no ruído visual das demais arestas.

---

## 5. Limitações dos Gráficos Estatísticos Utilizados

### Gráfico de Pizza (plot_02_pizza_regioes.png)
- **Problema**: o olho humano é ruim em comparar ângulos e áreas de fatias similares.
  As regiões Nordeste, Sudeste e Norte têm proporções parecidas — a diferença é difícil
  de perceber sem os rótulos percentuais.
- **Alternativa**: gráfico de barras horizontal seria mais preciso para essa comparação.

### Scatter Plot (plot_03_dispersao_rede.png)
- **Problema**: com apenas 20 pontos (aeroportos), o gráfico de dispersão tem
  baixo poder estatístico. Padrões observados podem ser artefatos da amostra pequena.
- **Limitação de legibilidade**: rótulos de aeroportos se sobrepõem quando os pontos
  estão próximos (ex: GRU e CGH têm grau e densidade similares).

### Gráficos de Benchmark (benchmark_barras.png e benchmark_linhas.png)
- **Problema de escala**: quando Bellman-Ford é muito mais lento, as barras de BFS
  e DFS ficam tão pequenas que suas diferenças se tornam imperceptíveis.
  Uma escala logarítmica seria mais apropriada para comparações com grande variação.
- **Limitação de contexto**: o benchmark mede apenas um par origem-destino (REC → POA).
  Os resultados podem variar significativamente para outros pares, especialmente
  em grafos com estrutura não homogênea.
- **Custo de amostragem**: 100 execuções são suficientes para este grafo pequeno,
  mas podem ser insuficientes para capturar variância em ambientes de produção
  com paralelismo, cache de CPU e variações de carga do SO.

---

## 6. Recomendações para Trabalhos Futuros

1. **Mapa geográfico base**: sobrepor o grafo sobre coordenadas reais do Brasil
   usando `folium` ou `plotly.graph_objects` com Mapbox.
2. **Escala logarítmica**: usar eixo log para comparar algoritmos com ordens de
   magnitude diferentes de tempo de execução.
3. **Clustering visual**: aplicar algoritmos de detecção de comunidades (Louvain,
   Girvan-Newman) para colorir clusters automaticamente.
4. **Benchmark com grafos de tamanhos crescentes**: gerar subgrafos de 5, 10, 15, 20
   nós e plotar Ordem do Grafo × Tempo de Execução para visualizar a complexidade
   assintótica empiricamente.
"""

    caminho = os.path.join(OUT_DIR, 'limitacoes_visualizacao.md')
    with open(caminho, 'w', encoding='utf-8') as f:
        f.write(conteudo)
    print(f"✅ {caminho} gerado.")


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  BENCHMARK DE ALGORITMOS — Projeto Grafos + AVD")
    print("=" * 60)

    # Garante que o CSV de adjacências existe
    if not os.path.exists('data/adjacencias_aeroportos.csv'):
        print("⚙️  Gerando malha de adjacências...")
        gerar_malha_csv()

    # Carrega o grafo do projeto (reutiliza lógica existente)
    print("📂 Carregando grafo...")
    grafo = load_graph()
    print(f"   ✔ {grafo.get_order()} nós, {grafo.get_size()} arestas carregados.")

    # Executa o benchmark
    resultados = executar_benchmark(grafo)

    # Exporta todos os artefatos
    exportar_csv(resultados)
    gerar_grafico_barras(resultados)
    gerar_grafico_linhas(resultados)
    gerar_relatorio(resultados, grafo)
    gerar_limitacoes()

    print("\n🎉 Benchmark concluído! Arquivos gerados em ./out/")
    print("   - benchmark.csv")
    print("   - benchmark_barras.png")
    print("   - benchmark_linhas.png")
    print("   - benchmark_relatorio.md")
    print("   - limitacoes_visualizacao.md")


if __name__ == '__main__':
    main()
