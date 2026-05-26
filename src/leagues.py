"""
Mapeamento manual clube → liga, baseado nos nomes exatos como aparecem no
transferencias.csv (Transfermarkt). Cobre as 5 grandes europeias + outras
ligas grandes. Clubes fora dessas listas viram "Outras".
"""

PREMIER_LEAGUE = {
    "Liverpool", "Man City", "Man Utd", "Chelsea", "Arsenal", "Tottenham",
    "Newcastle", "Aston Villa", "Brighton", "West Ham", "Crystal Palace",
    "Brentford", "Fulham", "Wolves", "Everton", "Bournemouth",
    "Nott'm Forest", "Leicester", "Leeds", "Burnley", "Sheff Utd",
    "Southampton", "Ipswich", "Watford", "Norwich", "Cardiff", "Hull City",
    "Stoke City", "Swansea", "Sunderland", "WBA", "Middlesbrough",
    "Reading", "Huddersfield", "QPR",
}

LA_LIGA = {
    "Real Madrid", "Barcelona", "Atlético", "Sevilla FC", "Valencia",
    "Villarreal", "Real Betis", "Real Sociedad", "Athletic", "Osasuna",
    "Celta", "Getafe", "Mallorca", "Las Palmas", "Girona", "Rayo Vallecano",
    "Alavés", "Cádiz CF", "Espanyol", "Granada", "Levante", "Elche",
    "Almería", "UD Almería", "Real Valladolid", "Leganés", "Málaga CF",
}

SERIE_A = {
    "Juventus", "Inter", "AC Milan", "Napoli", "Roma", "Lazio", "Atalanta",
    "Fiorentina", "Bologna", "Torino", "Udinese", "Genoa", "Sassuolo",
    "Hellas Verona", "Cagliari", "Lecce", "Empoli", "Sampdoria", "Monza",
    "Salernitana", "Cremonese", "Spezia", "Frosinone", "Como 1907",
    "Parma", "Pisa", "FC Empoli", "Brescia", "Chievo Verona", "SPAL",
}

BUNDESLIGA = {
    "Bayern Munich", "Dortmund", "Leipzig", "Leverkusen", "Frankfurt",
    "Stuttgart", "Wolfsburg", "Borussia Mgladbach", "Hoffenheim",
    "Mainz 05", "Werder Bremen", "Union Berlin", "FC Augsburg",
    "FC Köln", "Heidenheim", "St. Pauli", "Bochum", "Hertha BSC",
    "Schalke 04", "Hannover 96", "Hamburger SV", "Holstein Kiel",
    "FC Nürnberg", "Fortuna Düsseldorf",
}

LIGUE_1 = {
    "PSG", "Marseille", "Lyon", "Monaco", "Lille", "Nice", "Stade Rennais",
    "Lens", "Stade Reims", "Strasbourg", "R. Strasbourg", "Toulouse",
    "Nantes", "FC Nantes", "Montpellier", "Brest", "Le Havre AC",
    "OGC Nice", "Bordeaux", "Saint-Étienne", "Angers SCO", "FC Lorient",
    "FC Metz", "Stade Brest", "Clermont Foot", "AC Ajaccio", "Troyes",
    "AS Monaco",
}

PRIMEIRA_LIGA = {
    "Porto", "Benfica", "Sporting", "Braga", "Vit. Guimarães",
    "Vitória Guimarães", "Boavista", "Rio Ave", "Famalicão", "Estoril",
    "Casa Pia AC", "Gil Vicente", "Arouca", "Moreirense", "Portimonense",
    "Marítimo", "Belenenses",
}

EREDIVISIE = {
    "Ajax", "PSV", "Feyenoord", "AZ Alkmaar", "FC Twente", "FC Utrecht",
    "FC Groningen", "Vitesse", "Heerenveen", "Sparta Rotterdam",
    "NEC Nijmegen", "Go Ahead Eagles", "Heracles", "Willem II",
    "PEC Zwolle", "RKC Waalwijk", "Fortuna Sittard", "Almere City FC",
    "Excelsior", "NAC Breda", "ADO Den Haag",
}

BRASILEIRAO = {
    "Flamengo", "Palmeiras", "Corinthians", "São Paulo", "Santos",
    "Internacional", "Grêmio", "Atlético MG", "Cruzeiro", "Fluminense",
    "Vasco da Gama", "Botafogo", "Bahia", "Athletico Paranaense",
    "Athletico-PR", "Fortaleza", "Ceará SC", "Atlético GO", "Goiás",
    "Coritiba", "Sport Recife", "Vitória", "RB Bragantino", "Cuiabá",
    "Avaí FC", "Chapecoense", "Juventude", "América Mineiro",
    "CSA", "CRB", "Náutico", "Ponte Preta", "Guarani",
}

ARGENTINA = {
    "River Plate", "Boca Juniors", "Independiente", "Racing Club",
    "San Lorenzo", "Vélez Sarsfield", "Estudiantes", "Lanús", "Banfield",
    "Newell's Old Boys", "Rosario Central", "Talleres", "Argentinos Jrs",
    "Defensa y Justicia", "Tigre", "Huracán", "Godoy Cruz", "Colón",
    "Gimnasia LP", "Belgrano",
}

MLS = {
    "LA Galaxy", "LAFC", "Inter Miami CF", "NY City FC", "NY Red Bulls",
    "Atlanta United", "Seattle Sounders", "Portland Timbers",
    "Toronto FC", "Chicago Fire", "Columbus Crew", "Philadelphia Union",
    "DC United", "D.C. United", "Orlando City SC", "FC Cincinnati",
    "Houston Dynamo", "FC Dallas", "Sporting KC", "Minnesota United",
    "Real Salt Lake", "Colorado Rapids", "Vancouver Whitecaps",
    "CF Montréal", "Nashville SC", "Austin FC", "Charlotte FC",
    "St. Louis CITY",
}

SAUDI = {
    "Al-Hilal", "Al-Nassr", "Al-Ittihad", "Al-Ahli", "Al-Ettifaq",
    "Al-Shabab", "Al-Taawoun", "Al-Fayha", "Al-Fateh", "Al-Khaleej",
    "Al-Wehda", "Al-Raed", "NEOM SC",
}

CHAMPIONSHIP = {
    "Norwich", "Leeds", "Watford", "Sheff Utd", "Sunderland", "Cardiff",
    "Hull City", "Stoke City", "Swansea", "Reading", "Huddersfield",
    "QPR", "Birmingham", "Blackburn", "Coventry", "Preston",
    "Bristol City", "Millwall", "Middlesbrough", "WBA", "Plymouth",
    "Luton Town",
}

LEAGUES = [
    ("Premier League", PREMIER_LEAGUE),
    ("La Liga", LA_LIGA),
    ("Serie A", SERIE_A),
    ("Bundesliga", BUNDESLIGA),
    ("Ligue 1", LIGUE_1),
    ("Liga Portugal", PRIMEIRA_LIGA),
    ("Eredivisie", EREDIVISIE),
    ("Brasileirão", BRASILEIRAO),
    ("Liga Argentina", ARGENTINA),
    ("MLS", MLS),
    ("Saudi Pro League", SAUDI),
    ("Championship (Inglaterra)", CHAMPIONSHIP),
]


def league_of(club_name: str) -> str:
    for league_name, clubs in LEAGUES:
        if club_name in clubs:
            return league_name
    return "Outras"


def all_league_names():
    return [name for name, _ in LEAGUES] + ["Outras"]
