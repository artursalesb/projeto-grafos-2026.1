# Benchmark de Algoritmos de Grafos

## 1. Metodologia

O benchmark foi executado sobre o **grafo da malha aérea brasileira** modelado no projeto,
composto por **20 nós** (aeroportos) e **77 arestas** (rotas), com pesos representando
a distância geodésica em quilômetros (fórmula de Haversine).

### Parâmetros de execução

| Parâmetro           | Valor         |
|---------------------|---------------|
| Origem              | `REC`    |
| Destino             | `POA`   |
| Repetições          | 100  |
| Medição de tempo    | `time.perf_counter()` |
| Métrica principal   | Tempo médio (média aritmética) |

Cada algoritmo foi chamado **100 vezes** sobre o mesmo grafo e o mesmo par
origem-destino. O tempo reportado é a **média aritmética** dessas execuções,
eliminando ruídos de sistema operacional e cache.

---

## 2. Resultados

| Algoritmo      | Tempo Médio      | Nós Visitados | Arestas Percorridas |
|----------------|-----------------|--------------|---------------------|
| BFS            |       0.2610 ms |           10 |              80 |
| DFS            |       0.1065 ms |            9 |              17 |
| Dijkstra       |       0.4969 ms |           18 |             139 |
| Bellman-Ford   |       0.8367 ms |           20 |             154 |

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
em grafos com muitas arestas. No nosso grafo de 20 nós e 77 arestas, o algoritmo
precisa iterar **até 19 vezes sobre todas as 77 arestas**, totalizando até
1,463 operações de relaxamento.

Razão de desempenho observada: **Bellman-Ford é ≈ 7.9× mais lento** que
DFS, o algoritmo mais rápido neste benchmark.

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
