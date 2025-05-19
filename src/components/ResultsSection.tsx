import { useState } from "react";
import { ChevronDown, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Match {
  id: number;
  whitePlayer: string;
  blackPlayer: string;
  result: string;
  pgnLink?: string;
}

interface Round {
  round: number;
  matches: Match[];
}

interface Ranking {
  position: number;
  player: string;
  points: number;
}

interface Tournament {
  id: number;
  title: string;
  date: Date;
  description: string;
  matches: Round[];
  rankings: Ranking[];
}

interface ResultsSectionProps {
  tournaments: Tournament[];
}

const ResultsSection = ({ tournaments }: ResultsSectionProps) => {
  const [expandedTournament, setExpandedTournament] = useState<number | null>(null);

  const toggleTournament = (tournamentId: number) => {
    setExpandedTournament(expandedTournament === tournamentId ? null : tournamentId);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-ES", { 
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  return (
    <section id="results" className="bg-gray-50">
      <div className="section-container py-12 sm:py-16">
        <div className="text-center mb-12 reveal">
          <span className="inline-block px-3 py-1 text-sm font-medium bg-black/5 rounded-full mb-3">
            Resultados de Torneos
          </span>
        </div>

        <div className="max-w-4xl mx-auto space-y-4 reveal">
          {tournaments.map((tournament) => (
            <div 
              key={tournament.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300"
            >
              <div 
                className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50/50"
                onClick={() => toggleTournament(tournament.id)}
              >
                <div>
                  <h3 className="text-xl font-semibold">{tournament.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{formatDate(tournament.date)}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`transition-transform duration-300 ${
                    expandedTournament === tournament.id ? "rotate-180" : ""
                  }`}
                >
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </div>

              {expandedTournament === tournament.id && (
                <div className="p-5 pt-0 border-t animate-slide-down">
                  <div className="text-sm text-gray-600 mb-4 mt-2">
                    {tournament.description}
                  </div>

                  <div className="space-y-6">
                    {tournament.matches.map((round: Round) => (
                      <div key={round.round} className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-medium mb-3">Ronda {round.round}</h4>
                        <div className="space-y-2">
                          {round.matches.map((match: Match) => (
                            <div key={match.id} className="bg-white p-3 rounded-md shadow-xs">
                              <div className="flex justify-between items-center">
                                <div className="font-medium w-1/3 text-left text-[15px]">{match.whitePlayer}</div>
                                <div className="flex items-center space-x-2">
                                  <span className="w-2 h-2 rounded-full bg-white border border-gray-300"></span>
                                  <span className="font-medium text-[15px]">{match.result}</span>
                                  <span className="w-2 h-2 rounded-full bg-gray-800"></span>
                                </div>
                                <div className="font-medium w-1/3 text-right text-[15px]">{match.blackPlayer}</div>
                              </div>
                              {match.pgnLink && (
                                <div className="mt-2 flex justify-center w-full">
                                  <a
                                    href={match.pgnLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1 rounded-md transition-colors"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="h-3 w-3 mr-1.5 text-blue-600"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                    >
                                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                                      <path d="M14 2v6h6m-4 5H8m8 4H8m2-8H8"/>
                                    </svg>
                                    PGN
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div>
                      <h4 className="text-lg font-medium mb-3">Clasificación Final</h4>
                      <div className="bg-gray-50 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider w-12">Pos</th>
                              <th className="py-2 px-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Jugador</th>
                              <th className="py-2 px-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider w-16">Puntos</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {tournament.rankings.map((ranking: Ranking) => (
                              <tr key={ranking.position} className={ranking.position <= 3 ? "bg-gray-50/80" : ""}>
                                <td className="py-2 px-3 align-middle">
                                  {ranking.position <= 3 ? (
                                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full 
                                      ${ranking.position === 1 ? "bg-yellow-100 text-yellow-700" : 
                                        ranking.position === 2 ? "bg-gray-100 text-gray-700" : 
                                          "bg-amber-100 text-amber-700"}`}>
                                      {ranking.position === 1 ? (
                                        <Trophy className="h-3.5 w-3.5" />
                                      ) : (
                                        ranking.position
                                      )}
                                    </div>
                                  ) : (
                                    ranking.position
                                  )}
                                </td>
                                <td className="py-2 px-3 align-middle text-[15px]">
                                  <span className={ranking.position <= 3 ? "font-medium" : ""}>
                                    {ranking.player}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right align-middle font-medium text-[15px]">
                                  {ranking.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;