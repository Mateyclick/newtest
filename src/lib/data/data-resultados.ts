import { Tournament } from "@/lib/types/tournament";

const pastTournaments: Tournament[] = [
  {
    id: 1,
    title: "Torneo Apertura 2023",
    date: new Date("2023-03-15"),
    description: "Campeonato oficial del Club Trebejos con participación de 32 jugadores.",
    matches: [
      {
        round: 1,
        matches: [
          { id: 1, whitePlayer: "Martínez, Federico", blackPlayer: "Gómez, Juan", result: "1-0", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-1" },
          { id: 2, whitePlayer: "Pérez, Ana", blackPlayer: "Rodríguez, Carlos", result: "½-½", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-2" },
          { id: 3, whitePlayer: "Fernández, Luis", blackPlayer: "López, María", result: "0-1", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-3" },
          { id: 4, whitePlayer: "González, Pedro", blackPlayer: "Díaz, Laura", result: "1-0", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-4" }
        ]
      },
      {
        round: 2,
        matches: [
          { id: 5, whitePlayer: "Martínez, Federico", blackPlayer: "López, María", result: "½-½", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-5" },
          { id: 6, whitePlayer: "González, Pedro", blackPlayer: "Pérez, Ana", result: "0-1", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-6" },
          { id: 7, whitePlayer: "Díaz, Laura", blackPlayer: "Fernández, Luis", result: "1-0", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-7" },
          { id: 8, whitePlayer: "Rodríguez, Carlos", blackPlayer: "Gómez, Juan", result: "½-½", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-8" }
        ]
      }
    ],
    rankings: [
      { position: 1, player: "Martínez, Federico", points: 3.5 },
      { position: 2, player: "López, María", points: 3.5 },
      { position: 3, player: "Pérez, Ana", points: 3.0 },
      { position: 4, player: "Díaz, Laura", points: 2.0 },
      { position: 5, player: "González, Pedro", points: 1.0 },
      { position: 6, player: "Rodríguez, Carlos", points: 1.0 },
      { position: 7, player: "Fernández, Luis", points: 0.5 },
      { position: 8, player: "Gómez, Juan", points: 0.5 }
    ]
  },
  {
    id: 2,
    title: "Torneo Clausura 2023",
    date: new Date("2023-11-10"),
    description: "Torneo final de la temporada con la participación de los mejores 16 jugadores del club.",
    matches: [
      {
        round: 1,
        matches: [
          { id: 1, whitePlayer: "Sánchez, Gabriel", blackPlayer: "Torres, Elena", result: "1-0", },
          { id: 2, whitePlayer: "Martínez, Federico", blackPlayer: "López, María", result: "0-1", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-10" },
          { id: 3, whitePlayer: "Pérez, Ana", blackPlayer: "Díaz, Laura", result: "½-½", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-11" },
          { id: 4, whitePlayer: "Fernández, Luis", blackPlayer: "González, Pedro", result: "0-1", pgnLink: "https://chess-results.com/PartieSuche.aspx?art=36&id=5557262-12" }
        ]
      }
    ],
    rankings: [
      { position: 1, player: "López, María", points: 5.0 },
      { position: 2, player: "Sánchez, Gabriel", points: 4.5 },
      { position: 3, player: "González, Pedro", points: 4.0 },
      { position: 4, player: "Pérez, Ana", points: 3.5 },
      { position: 5, player: "Díaz, Laura", points: 3.0 },
      { position: 6, player: "Martínez, Federico", points: 3.0 },
      { position: 7, player: "Torres, Elena", points: 2.5 },
      { position: 8, player: "Fernández, Luis", points: 1.5 }
    ]
  }
];

export { pastTournaments };