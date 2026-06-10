# Bellman-Ford com pesos negativos — régua e casos

> Documento de apoio ao PDF. Explica como o requisito do PDF
> ("Bellman-Ford com ao menos um caso com peso negativo **sem** ciclo
> negativo e um **com** ciclo negativo detectado") foi atendido, mesmo
> o dataset real só tendo `transfer_fee >= 0`.

## 1. O problema

O dataset de transferências tem **apenas pesos não-negativos** (`transfer_fee`
em €, sempre ≥ 0). Com pesos ≥ 0, **Dijkstra** já resolve o caminho mínimo de
forma ótima — não há razão natural para usar Bellman-Ford.

Mas o PDF exige demonstrar Bellman-Ford com **pesos negativos**. Precisávamos,
então, de uma **régua de pesos** que produzisse valores negativos de forma
justificável e consistente.

## 2. A régua de pesos: `peso_lucro`

```
peso_lucro = transfer_fee − market_value_in_eur
```

Interpretação (do ponto de vista do clube **comprador**):

| Sinal | Significado |
|---|---|
| `peso_lucro < 0` | o clube pagou **abaixo** do valor de mercado → "bom negócio" (saldo favorável ao comprador) |
| `peso_lucro > 0` | pagou **acima** do valor de mercado → "negócio caro" |
| `peso_lucro = 0` | pagou exatamente o valor de mercado |

Essa coluna já é calculada no carregamento do grafo
([src/graphs/transfers_io.py](../src/graphs/transfers_io.py)) e fica disponível
em cada aresta como `peso_lucro`.

## 3. Os 4 casos (em `out/parte2_report.json`)

### Caso 1 — REAL com peso negativo, **SEM** ciclo negativo

- **Como garantimos a ausência de ciclo:** construímos um **DAG** (grafo
  acíclico dirigido) mantendo só as arestas que vão de um clube de **maior
  grau** para um de **menor grau** (ordenação total por rank de grau). Como
  toda aresta respeita essa ordem, **é impossível formar um ciclo**.
- **Pesos negativos reais preservados:** o DAG mantém `peso_lucro`, que tem
  3.105 arestas negativas reais do dataset.
- **Resultado:** `Benfica → Porto`, custo **€ −2.760.000**, caminho
  `Benfica → Lyon → Roma → Ajax → Porto`, `has_negative_cycle = False`.
- **Por que importa:** prova que Bellman-Ford calcula distâncias corretas com
  pesos negativos reais, algo que Dijkstra **não** consegue (e por isso recusa).

### Caso 2 — REAL com **ciclo negativo DETECTADO**

- Grafo dirigido **completo** com `peso_lucro` (sem a restrição de ordenação).
- Sem a ordenação, surgem **ciclos de arbitragem** cuja soma de saldos é
  negativa.
- **Resultado:** `has_negative_cycle = True`, custo `None` (não há caminho
  finito — o custo poderia decrescer indefinidamente percorrendo o ciclo).
- **Por que importa:** prova que a detecção de ciclo negativo funciona em
  escala real (~15 mil arestas).

### Caso 3 — SINTÉTICO com ciclo negativo

- Mini-grafo didático com nomes de clubes:
  `Ajax → Roma (1)`, `Roma → Lyon (−3)`, `Lyon → Ajax (1)` → soma do ciclo = **−1**.
- **Resultado:** `has_negative_cycle = True`.
- **Por que importa:** caso pequeno e verificável à mão, também coberto por
  teste de unidade (`test_bellman_caso_sintetico_ciclo_negativo_clubes`).

### Caso 4 — SINTÉTICO com peso negativo **SEM** ciclo

- Mini-grafo: `Santos → Inter (2)`, `Inter → Barcelona (−3)`,
  `Barcelona → PSG (1)`.
- Caminho ótimo `Santos → Inter → Barcelona → PSG` = 2 + (−3) + 1 = **0**,
  passando pela aresta negativa.
- **Resultado:** custo **0**, `has_negative_cycle = False`.
- **Por que importa:** custo exato e verificável, coberto por teste de unidade
  (`test_bellman_caso_sintetico_peso_negativo_sem_ciclo_clubes`).

## 4. Resumo de cobertura do requisito

| Requisito do PDF | Caso que cobre |
|---|---|
| Peso negativo **sem** ciclo negativo (distâncias corretas) | Caso 1 (real) + Caso 4 (sintético) |
| **Com** ciclo negativo (detectado) | Caso 2 (real) + Caso 3 (sintético) |

## 5. Limites do design de pesos (discussão crítica)

- `peso_lucro` é uma métrica **derivada** e interpretativa, não um custo físico
  como distância em km. Sua leitura como "lucro" assume que `market_value`
  reflete fielmente o valor justo do jogador — o que nem sempre é verdade
  (inflação de mercado, urgência de venda, cláusulas).
- O **ciclo negativo** no grafo real **não** representa uma oportunidade de
  arbitragem executável na prática (não dá para "comprar e revender em loop"
  jogadores), mas é um artefato matemático válido para exercitar o algoritmo.
- Para caminhos de **custo financeiro real**, `transfer_fee` (≥ 0) + Dijkstra
  continua sendo a modelagem correta — Bellman-Ford é o algoritmo certo apenas
  quando a régua de pesos admite valores negativos.
