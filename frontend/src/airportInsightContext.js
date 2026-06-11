/**
 * Contexto curado para enriquecer os insights do grafo de aeroportos (Parte 1).
 * Cada insight ganha uma justificativa "por quê?" baseada em conhecimento de
 * domínio (aviação brasileira + a régua de modelagem do grupo).
 *
 * Lembrete da modelagem: cada aeroporto regional liga-se ao(s) hub(s) da sua
 * região; todos os hubs ligam-se entre si. Peso = distância em km (Haversine).
 */

// ── REGIÕES ───────────────────────────────────────────────────
export const REGION_CONTEXT = {
  Nordeste:
    "concentra 3 hubs no nosso modelo (REC, SSA, FOR), o maior número entre as regiões — reflexo da malha real, em que o turismo e a malha de capitais do NE geram alta demanda.",
  Sudeste:
    "tem os aeroportos de maior movimento real do país (GRU, GIG, CNF). No modelo, GRU/GIG/CNF são hubs e puxam quase todo o tráfego nacional.",
  Sul:
    "é servida por POA e CWB como hubs; é uma região compacta, então as conexões internas são curtas e os hubs concentram as rotas para o resto do país.",
  Norte:
    "tem MAO e BEL como hubs, mas as distâncias amazônicas são enormes: as arestas a partir do Norte estão entre as mais longas da malha.",
  "Centro-Oeste":
    "tem BSB como hub central — geograficamente no meio do país, BSB é um ponto de passagem natural entre regiões distantes.",
};

// ── AEROPORTOS (hubs principais) ──────────────────────────────
export const AIRPORT_CONTEXT = {
  REC: "Recife é o principal hub do Nordeste e porta de entrada do turismo internacional na região.",
  SSA: "Salvador conecta o forte fluxo turístico da Bahia ao resto do país.",
  FOR: "Fortaleza virou hub estratégico com voos diretos para a Europa nos últimos anos.",
  GRU: "Guarulhos (São Paulo) é o maior aeroporto da América do Sul em movimento — hub nacional por excelência.",
  GIG: "Galeão (Rio) é hub do Sudeste com forte tráfego doméstico e internacional.",
  CNF: "Confins (Belo Horizonte) conecta o interior de Minas ao eixo Rio–São Paulo.",
  BSB: "Brasília está no centro geográfico do país — escala natural para rotas longas entre regiões.",
  POA: "Porto Alegre é o hub do extremo Sul, ligando a região ao resto do Brasil.",
  CWB: "Curitiba complementa POA como hub do Sul.",
  MAO: "Manaus é o hub da Amazônia Ocidental — distâncias gigantescas o tornam dependente de voos longos.",
  BEL: "Belém é a porta de entrada da Amazônia Oriental.",
};

// ── FICHA COMPLETA POR AEROPORTO (vida real + papel) ──────────
// 'codigo' = nome oficial; 'real' = fato verificável do mundo real;
// 'papel' = papel desse aeroporto na nossa modelagem do grafo.
export const AIRPORT_FICHA = {
  REC: {
    nome: "Aeroporto Internacional do Recife / Guararapes – Gilberto Freyre",
    real: "Um dos aeroportos mais movimentados do Nordeste. Recebe voos diretos para Europa (Lisboa) e é base de operações de companhias no NE.",
    papel: "Hub do Nordeste no nosso modelo (grau 13, o maior da malha, empatado com SSA e FOR).",
  },
  SSA: {
    nome: "Aeroporto Internacional de Salvador – Deputado Luís Eduardo Magalhães",
    real: "Principal porta de entrada do turismo na Bahia, com forte sazonalidade ligada ao verão e ao Carnaval.",
    papel: "Hub do Nordeste (grau 13). Concentra conexões dos regionais do NE.",
  },
  FOR: {
    nome: "Aeroporto Internacional de Fortaleza – Pinto Martins",
    real: "Virou hub internacional após acordos com companhias europeias; teve voos diretos para Europa e Cabo Verde.",
    papel: "Hub do Nordeste (grau 13).",
  },
  NAT: {
    nome: "Aeroporto Internacional de Natal – Governador Aluízio Alves (São Gonçalo do Amarante)",
    real: "Um dos aeroportos mais modernos do país, construído para a Copa de 2014, com grande capacidade ociosa.",
    papel: "Aeroporto regional do Nordeste (grau 3). Liga-se apenas aos hubs do NE — por isso sua ego-network é 100% densa.",
  },
  JPA: {
    nome: "Aeroporto Internacional de João Pessoa – Presidente Castro Pinto",
    real: "Atende a capital paraibana e o ponto mais oriental das Américas (Ponta do Seixas).",
    papel: "Regional do Nordeste (grau 3).",
  },
  THE: {
    nome: "Aeroporto de Teresina – Senador Petrônio Portella",
    real: "Principal aeroporto do Piauí, conecta o interior do NE ao litoral.",
    papel: "Regional do Nordeste (grau 3).",
  },
  GRU: {
    nome: "Aeroporto Internacional de São Paulo / Guarulhos – Governador André Franco Montoro",
    real: "É o maior e mais movimentado aeroporto da América do Sul, com mais de 40 milhões de passageiros/ano e o maior hub internacional do Brasil.",
    papel: "Hub do Sudeste (grau 12). Principal ponto de conexão nacional na nossa malha.",
  },
  CGH: {
    nome: "Aeroporto de São Paulo / Congonhas",
    real: "Aeroporto central de São Paulo, focado em voos domésticos rápidos (ponte aérea Rio–SP). Tem restrições de pista por estar dentro da cidade.",
    papel: "Regional do Sudeste (grau 3).",
  },
  GIG: {
    nome: "Aeroporto Internacional do Rio de Janeiro / Galeão – Antônio Carlos Jobim",
    real: "Maior aeroporto do Rio, com tráfego internacional. Perdeu movimento para o Santos Dumont nos voos domésticos nos últimos anos.",
    papel: "Hub do Sudeste (grau 12).",
  },
  CNF: {
    nome: "Aeroporto Internacional de Belo Horizonte / Confins – Tancredo Neves",
    real: "Principal aeroporto de Minas Gerais, fica a ~38 km de BH. É um hub de companhias para o interior do país.",
    papel: "Hub do Sudeste (grau 12).",
  },
  VIX: {
    nome: "Aeroporto de Vitória – Eurico de Aguiar Salles",
    real: "Atende a capital do Espírito Santo; passou por grande reforma e ampliação recentes.",
    papel: "Regional do Sudeste (grau 3).",
  },
  BSB: {
    nome: "Aeroporto Internacional de Brasília – Presidente Juscelino Kubitschek",
    real: "Por estar no centro geográfico do Brasil, é um dos maiores hubs de conexão doméstica do país — muita gente troca de avião aqui sem ser o destino final.",
    papel: "Hub do Centro-Oeste (grau 11). Ponto de passagem natural entre regiões distantes.",
  },
  GYN: {
    nome: "Aeroporto de Goiânia – Santa Genoveva",
    real: "Atende a capital de Goiás; movimento crescente com o agronegócio da região.",
    papel: "Regional do Centro-Oeste (grau 1) — o aeroporto MENOS conectado da malha, ligado só a BSB.",
  },
  CWB: {
    nome: "Aeroporto Internacional de Curitiba – Afonso Pena",
    real: "Principal aeroporto do Paraná, referência em pontualidade e infraestrutura no Sul.",
    papel: "Hub do Sul (grau 11).",
  },
  FLN: {
    nome: "Aeroporto Internacional de Florianópolis – Hercílio Luz",
    real: "Tem um dos terminais mais modernos do país (concessão privada), forte no turismo de Santa Catarina.",
    papel: "Regional do Sul (grau 2).",
  },
  POA: {
    nome: "Aeroporto Internacional de Porto Alegre – Salgado Filho",
    real: "Principal aeroporto do Rio Grande do Sul. Foi gravemente afetado pelas enchentes de 2024, ficando meses fechado.",
    papel: "Hub do Sul (grau 11). Liga o extremo sul ao resto do país.",
  },
  MAO: {
    nome: "Aeroporto Internacional de Manaus – Eduardo Gomes",
    real: "Hub logístico da Zona Franca de Manaus, com forte movimento de cargas. As distâncias amazônicas tornam o transporte aéreo essencial (não há estradas para muitas cidades).",
    papel: "Hub do Norte (grau 12). Suas rotas estão entre as mais longas da malha.",
  },
  BEL: {
    nome: "Aeroporto Internacional de Belém – Val de Cans / Júlio Cezar Ribeiro",
    real: "Porta de entrada da Amazônia Oriental, sediará a COP30 em 2025, com grandes investimentos em ampliação.",
    papel: "Hub do Norte (grau 12).",
  },
  PVH: {
    nome: "Aeroporto Internacional de Porto Velho – Governador Jorge Teixeira",
    real: "Atende Rondônia; importante para a logística da Amazônia Ocidental.",
    papel: "Regional do Norte (grau 2). Conecta-se via MAO.",
  },
  RBR: {
    nome: "Aeroporto Internacional de Rio Branco – Plácido de Castro",
    real: "Aeroporto mais a oeste da nossa malha, atende o Acre, perto da fronteira com Bolívia e Peru.",
    papel: "Regional do Norte (grau 2). Um dos pontos mais isolados da rede.",
  },
};

export function airportFicha(iata) {
  return (
    AIRPORT_FICHA[iata] || {
      nome: iata,
      real: "Aeroporto da malha aérea brasileira modelada no projeto.",
      papel: "Papel definido pela régua de modelagem (regional ligado ao hub, ou hub ligado aos demais hubs).",
    }
  );
}

// ── TIPOS DE ROTA ─────────────────────────────────────────────
export const ROUTE_TYPE_CONTEXT = {
  nacional:
    "ligam hubs de regiões diferentes. São muitas porque, no modelo, todo hub se conecta a todos os outros hubs do país — o que cria uma malha 'todos-com-todos' entre as capitais regionais.",
  regional:
    "ligam aeroportos menores ao(s) hub(s) da própria região. Representam o 'last mile' da malha: como cada regional só se liga ao seu hub, são conexões curtas e numerosas.",
  hub_intra:
    "ligam hubs da MESMA região (ex.: GRU–GIG–CNF). São poucas porque só algumas regiões têm mais de um hub.",
};

// ── HELPERS ───────────────────────────────────────────────────
export function regionWhy(name) {
  return (
    REGION_CONTEXT[name] ||
    "tem sua presença na malha definida pela quantidade de hubs e regionais que o grupo modelou para a região."
  );
}

export function airportWhy(iata) {
  return (
    AIRPORT_CONTEXT[iata] ||
    "é um aeroporto cuja conectividade depende da regra de modelagem (regional ligado ao hub, ou hub ligado aos demais hubs)."
  );
}

export function routeTypeWhy(tipo) {
  return (
    ROUTE_TYPE_CONTEXT[tipo] ||
    "é um tipo de conexão definido pela régua de modelagem do grupo."
  );
}

export function densityWhy(d) {
  if (d >= 0.5)
    return "densidade alta para uma malha aérea — acontece porque a regra 'todo hub liga a todo hub' cria muitas arestas entre as capitais.";
  if (d >= 0.3)
    return "densidade moderada — há vários caminhos alternativos entre aeroportos, sem ser um grafo completo.";
  return "densidade baixa (esparsa) — típico quando o filtro isola hubs ou poucos aeroportos, deixando o grafo mais 'magro'.";
}

export function distanceWhy(avgKm) {
  if (avgKm >= 2000)
    return "média alta porque a malha inclui muitas rotas inter-regionais longas (Norte↔Sul, por exemplo), puxadas pelas distâncias continentais do Brasil.";
  if (avgKm >= 1000)
    return "média intermediária — mistura de conexões regionais curtas com rotas nacionais entre hubs distantes.";
  return "média baixa — predominam conexões regionais curtas (aeroporto ligado ao hub mais próximo).";
}

// ── INSIGHT DEPENDENTE DO ESTADO DO FILTRO ────────────────────
// Lê quais aeroportos sobraram e gera uma observação específica
// sobre o porquê daquele recorte. `nos` = [{iata, regiao, grau}].
export function filterStateInsight(nos, minDegree) {
  if (!nos.length) {
    return {
      label: "Filtro vazio",
      text: "Nenhum aeroporto tem grau alto o suficiente para esse filtro. Reduza o grau mínimo.",
    };
  }

  const regioes = new Set(nos.map((n) => n.regiao));
  const graus = nos.map((n) => n.grau);
  const minG = Math.min(...graus);
  const maxG = Math.max(...graus);

  // Caso 1: sobraram só os hubs de UMA região
  if (regioes.size === 1 && nos.length <= 3 && minG >= 11) {
    const reg = [...regioes][0];
    return {
      label: `Só os hubs do ${reg}`,
      text:
        `Com grau ≥ ${minDegree}, sobram apenas ${nos.map((n) => n.iata).join(", ")} — ` +
        `os hubs do ${reg}. Eles têm o maior grau (${maxG}) porque, na nossa modelagem, ` +
        `cada hub se liga a TODOS os outros hubs do país E a todos os regionais da sua região. ` +
        `Os aeroportos regionais (grau baixo) foram filtrados.`,
    };
  }

  // Caso 2: sobraram só os hubs (de várias regiões)
  if (minG >= 11 && nos.length <= 8) {
    return {
      label: "Apenas os hubs nacionais",
      text:
        `Com grau ≥ ${minDegree}, restam só os hubs (${nos.map((n) => n.iata).join(", ")}). ` +
        `Esse é o "esqueleto" da malha: a sub-rede dos hubs forma um grafo quase completo, ` +
        `porque a regra de modelagem conecta todo hub a todo hub. Os regionais sumiram.`,
    };
  }

  // Caso 3: filtro intermediário corta alguns regionais
  if (minDegree > 1 && minDegree < 11) {
    return {
      label: "Cortando os regionais menores",
      text:
        `O filtro grau ≥ ${minDegree} removeu os aeroportos regionais de menor conexão ` +
        `(grau < ${minDegree}). Sobram ${nos.length} aeroportos em ${regioes.size} ` +
        `regiõe${regioes.size > 1 ? "s" : ""}. Quanto mais alto o grau mínimo, mais a malha ` +
        `se reduz ao núcleo de hubs.`,
    };
  }

  // Caso 4: grafo completo (sem filtro)
  return {
    label: "Malha completa",
    text:
      `Todos os ${nos.length} aeroportos estão visíveis (grau ≥ ${minDegree}). ` +
      `Os hubs (grau 11–13) e os regionais (grau 1–3) convivem: note o "degrau" entre ` +
      `eles — não há aeroportos com grau intermediário, porque a modelagem só tem dois ` +
      `papéis (hub ou regional).`,
  };
}
