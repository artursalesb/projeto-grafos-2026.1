# Mercado da Bola — Grafo de Transferências (React)

Frontend React + Vite + `react-force-graph-2d` que renderiza ~3.166 clubes
(vértices) e ~17.458 transferências com `transfer_fee > 0` (arestas) sobre um
fundo de campo de futebol em SVG.

Cada aresta é clicável e abre um modal com:

- Nome do jogador
- Valor pago na transferência
- Clube origem → destino
- Data e temporada
- Valor de mercado

## Como rodar

### 1. Gerar o JSON de dados (executar na raiz do projeto)

```bash
python src/build_transfers_graph.py
```

Isso lê `data/dataset_parte2/transferencias.csv`, filtra `transfer_fee > 0` e
escreve `frontend/public/grafo.json`.

### 2. Subir o dev server

```bash
cd frontend
npm install   # só na primeira vez
npm run dev
```

O Vite abre em http://localhost:5173.

### 3. Build de produção

```bash
cd frontend
npm run build
npm run preview
```

O bundle final fica em `frontend/dist/`.

## Estrutura

```
frontend/
├── package.json
├── vite.config.js
├── index.html
├── public/
│   └── grafo.json          ← gerado pelo Python
└── src/
    ├── main.jsx
    ├── App.jsx              ← layout + sidebar + busca
    ├── GraphView.jsx        ← ForceGraph2D + desenho de bolas
    ├── FieldBackground.jsx  ← SVG do campo
    ├── EdgeModal.jsx        ← modal ao clicar aresta
    └── styles.css
```

## Notas de performance

- Bolas de futebol são desenhadas com `nodeCanvasObject` (Canvas2D); o pentágono
  preto só aparece em zoom alto (`scale > 2.5`) e o nome do clube só em zoom
  muito alto (`scale > 4`) — evita repaint pesado.
- Espessura e cor das arestas escalam com o valor da transferência: ≥ €50M
  ouro/grosso, ≥ €10M laranja, ≥ €1M branco fino, < €1M cinza.
- `enableNodeDrag={false}` evita travamento em mobile.
- `cooldownTicks={150}` faz a simulação parar rápido depois da estabilização
  inicial.
