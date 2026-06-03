/**
 * Contexto setorial curado para enriquecer os insights gerados.
 * Permite que cada insight tenha justificativa "porque..." baseada em
 * conhecimento de domínio (mercado do futebol).
 */

// ── LIGAS ─────────────────────────────────────────────────────
export const LEAGUE_CONTEXT = {
  "Premier League":
    "é a liga mais rica do mundo: o contrato de TV doméstico passa de £10 bilhões no ciclo atual, dando a clubes ingleses poder de compra incomparável.",
  "La Liga":
    "abriga Real Madrid e Barcelona, dois dos clubes mais valiosos da história, além de um modelo de receitas centrado em direitos de imagem e marketing global.",
  "Serie A":
    "passou por anos de crise mas voltou a crescer com novos donos americanos e contratos televisivos renegociados; Juventus, Inter e Milan dominam o mercado interno.",
  "Bundesliga":
    "tem regra '50+1' que limita investidores externos, então clubes alemães preferem revender talentos formados (Dortmund é o exemplo clássico) a gastar fortunas.",
  "Ligue 1":
    "é fortemente concentrada em torno do PSG, que tem o maior poder de compra desde a aquisição catariana em 2011 — o resto da liga vive de exportar talentos para a Inglaterra.",
  "Liga Portugal":
    "é tradicionalmente uma 'plataforma' do mercado: Benfica, Porto e Sporting compram barato no Brasil/Argentina e revendem caro para a elite europeia.",
  "Eredivisie":
    "é um celeiro reconhecido: Ajax e PSV formam jovens em academias de altíssimo nível e revendem para a Premier League e Bundesliga.",
  "Brasileirão":
    "é o maior exportador de talentos da América do Sul; clubes vendem jovens cedo para sustentar caixa em meio a receitas internas modestas.",
  "Liga Argentina":
    "concorre com o Brasil como celeiro sul-americano — River e Boca vendem regularmente para Europa e MLS.",
  MLS:
    "vive boom recente com contratações de estrelas em fim de carreira (Messi no Inter Miami) e regras de cap salarial flexibilizadas para 'designated players'.",
  "Saudi Pro League":
    "explodiu após a chegada de Cristiano Ronaldo em 2023 e o investimento estatal do PIF, distorcendo o mercado com salários e fees recordes.",
  "Championship (Inglaterra)":
    "é a segunda divisão inglesa, com clubes que mantêm orçamentos altos sustentados pelo 'parachute payment' da Premier League após rebaixamento.",
  Outras:
    "agrupa centenas de ligas menores, frequentemente envolvidas em transferências de jovens promessas e empréstimos de baixo valor.",
};

// ── CLUBES ────────────────────────────────────────────────────
export const CLUB_CONTEXT = {
  Benfica:
    "é a 'plataforma de revenda' mais famosa do mundo — Di María, Cancelo, Enzo Fernández, João Félix... todos vendidos por € 80M+ depois de poucos anos.",
  Porto:
    "rivaliza com o Benfica no modelo formar-e-vender: Falcao, James Rodríguez, Hulk, todos saíram em transferências recordes.",
  Sporting:
    "também opera como vitrine de talentos jovens, especialmente após a venda de Cristiano Ronaldo para o Manchester United em 2003.",
  Chelsea:
    "sob a nova gestão (Boehly/Clearlake desde 2022) adotou estratégia de contratos longos (6-8 anos) para amortizar valores enormes nos balanços.",
  PSG:
    "investe pesado em estrelas globais desde a aquisição catariana em 2011 — Neymar, Mbappé, Messi passaram por lá.",
  "Man City":
    "é o exemplo do 'projeto petrodólar': aquisição emirática em 2008 transformou o clube no melhor do mundo nos últimos 5 anos.",
  "Real Madrid":
    "lidera o ranking de receitas há anos e tem perfil de comprar superestrelas estabelecidas, mas também investe em jovens (Vinícius, Rodrygo, Endrick).",
  Barcelona:
    "passou por crise financeira severa pós-Bartomeu mas continua sendo uma das maiores marcas globais; vendeu Neymar em 2017 (€222M, recorde absoluto).",
  Liverpool:
    "tem perfil analítico (departamento de data science forte) e tende a comprar jovens com potencial em vez de estrelas estabelecidas.",
  Juventus:
    "dominou a Serie A por 9 anos consecutivos mas saiu da Superliga, perdeu Cristiano Ronaldo e enfrenta período de reestruturação.",
  Inter:
    "campeão italiano recente, mas tem restrições financeiras impostas pelo dono chinês — modelo é mais de empréstimos e parâmetros zero.",
  "AC Milan":
    "renasceu sob a gestão do fundo americano RedBird, voltou à Champions e à Serie A com modelo mais sustentável.",
  Atlético:
    "perfil único: comprar barato e formar valor, sob o comando técnico de Simeone há mais de uma década.",
  Arsenal:
    "Mikel Arteta liderou rejuvenescimento radical do elenco — média de idade caiu drasticamente desde 2020.",
  Tottenham:
    "Daniel Levy é famoso por ser 'duro de negociação', clube costuma ficar perto do topo da Premier mas sem títulos recentes.",
  Newcastle:
    "passou por aquisição saudita (PIF) em 2021, virou clube com altíssimo poder de compra.",
  "Bayern Munich":
    "monopoliza títulos alemães há mais de uma década; lidera o mercado interno e compra de rivais da Bundesliga regularmente.",
  Dortmund:
    "é o 'showcase' mais conhecido da Bundesliga — Lewandowski, Aubameyang, Sancho, Haaland, Bellingham passaram por lá.",
  Leverkusen:
    "campeão alemão inédito em 2024 sob Xabi Alonso, modelo focado em talentos jovens.",
  Ajax:
    "academia 'De Toekomst' formou Cruyff, Van Basten, Bergkamp; recentemente vendeu De Jong, De Ligt e Antony por valores massivos.",
  PSV:
    "rival do Ajax na Eredivisie, vendeu Cocu, Robben, Depay e Hakim Ziyech em momentos diferentes.",
  "River Plate":
    "junto com Boca, domina o futebol argentino; vende talentos jovens para Europa regularmente (Julián Álvarez ao City).",
  "Boca Juniors":
    "marca global, base de fanáticos massiva, vende jovens promessas frequentemente.",
  Palmeiras:
    "é o atual gigante do Brasileirão, com gestão financeira forte da WTorre e Crefisa.",
  Flamengo:
    "tem a maior torcida do Brasil e gasta agressivamente desde 2019, formando elenco caro para Libertadores.",
  "Al-Nassr":
    "fichou Cristiano Ronaldo em 2023, marco que abriu as portas para a invasão saudita no mercado europeu.",
  "Al-Hilal":
    "tentou contratar Mbappé e Messi, virou referência no novo mercado saudita financiado pelo PIF.",
};

// ── TEMPORADAS / ANOS ───────────────────────────────────────
export const SEASON_CONTEXT = {
  "17/18":
    "marcou o recorde absoluto de transferências — €222M de Neymar do Barcelona para o PSG, valor que ainda não foi superado.",
  "18/19":
    "viu Cristiano Ronaldo deixar o Real Madrid para a Juventus por €117M, encerrando um ciclo histórico no Bernabéu.",
  "19/20":
    "foi a temporada do início da COVID — vários clubes recuaram em contratações de alto valor.",
  "20/21":
    "ainda sob impacto da pandemia, com queda de receitas e contratos sem fee comuns (Messi para o PSG, Cristiano de volta ao Man Utd).",
  "21/22":
    "Lukaku voltou ao Chelsea por €113M, recorde do clube; mercado começou a se recuperar.",
  "22/23":
    "retomada pós-COVID, com Chelsea liderando gastos sob nova gestão Boehly e contratações múltiplas de €60M+.",
  "23/24":
    "ano da revolução saudita: dezenas de estrelas (Neymar, Benzema, Mané) foram para o Saudi Pro League.",
  "24/25":
    "temporada atual em andamento, com mercado mais cauteloso após excessos do ano anterior.",
  "25/26":
    "janela mais recente, em curso — Mbappé chegou ao Real Madrid e há rumores de novo recorde mundial.",
};

// ── FAIXAS DE VALOR ─────────────────────────────────────────
export const BUCKET_CONTEXT = {
  "< €100k":
    "faixa típica de transferências entre divisões menores, empréstimos com opção de compra e jovens da base.",
  "€100k–€1M":
    "faixa do 'mercado intermediário' — transferências entre clubes de meio de tabela de ligas grandes, ou de promessas regionais.",
  "€1M–€10M":
    "faixa onde acontecem a maioria das contratações de jogadores titulares de clubes de elite — janela mais movimentada do mercado.",
  "€10M–€50M":
    "patamar dos jogadores 'consolidados' e jovens promessas com vitrine internacional.",
  "€50M–€100M":
    "categoria de estrelas em ascensão e jogadores com potencial de protagonismo em clubes top.",
  "> €100M":
    "elite absoluta — só passa dos €100M jogador com status global comprovado, ou megalomania controlada (Neymar, Mbappé, Pogba).",
};

// ── HELPER: pega contexto ou um fallback genérico ──────────
export function leagueWhy(name) {
  return LEAGUE_CONTEXT[name] || "é uma liga cuja dinâmica depende de fatores locais (receitas de TV, contratos esportivos, fluxo de talentos regionais).";
}

export function clubWhy(name) {
  if (CLUB_CONTEXT[name]) return CLUB_CONTEXT[name];
  return "tem perfil ativo no mercado, seja por estratégia esportiva, posicionamento de marca ou estrutura financeira que favorece transações frequentes.";
}

export function seasonWhy(name) {
  if (SEASON_CONTEXT[name]) return SEASON_CONTEXT[name];
  return "teve dinâmica de mercado moldada por calendário, contratos televisivos e movimentações pontuais de grandes clubes.";
}

export function bucketWhy(name) {
  return BUCKET_CONTEXT[name] || "é uma faixa cujo volume reflete o equilíbrio entre poder de compra dos clubes e demanda por categorias específicas de jogadores.";
}

export function concentrationWhy(pct) {
  if (pct >= 60) return "distribuição típica de 'cauda longa' extrema — característica de mercados oligopolistas, onde poucos super-clubes dominam.";
  if (pct >= 40) return "concentração alta mas não extrema — sinal de que existe um 'grupo de elite' competitivo, sem monopólio absoluto.";
  return "distribuição relativamente democrática — incomum em mercados de futebol, costuma ocorrer só em recortes muito específicos.";
}
