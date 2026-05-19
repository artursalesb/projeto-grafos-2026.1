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
