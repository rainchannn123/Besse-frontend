'use client';

import { gameService } from '@/services/gameService';
import { TeamData } from '@/types/besse';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import React from 'react';

interface LiveTeamRankingToggleProps {
  teams: TeamData[];
  currentSessionId?: string;
}

type RankingRow = {
  rank: number;
  teamId: string;
  sessionId: string;
  teamLabel: string;
  score: number;
  status: string;
  isMine: boolean;
};

const getTeamScore = (team: TeamData): number => {
  if (typeof team.totalProjectScore === 'number') return team.totalProjectScore;
  if (typeof team.teamScore === 'number') return team.teamScore;

  return (team.cityProjects || [])
    .filter((project) => project.completed)
    .reduce((sum, project) => sum + Number(project.score ?? project.scoreBonus ?? 0), 0);
};

const LiveTeamRankingToggle: React.FC<LiveTeamRankingToggleProps> = ({
  teams,
  currentSessionId,
}) => {
  const [open, setOpen] = React.useState(false);
  const [liveTeams, setLiveTeams] = React.useState<TeamData[]>(teams || []);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setLiveTeams(teams || []);
  }, [teams]);

  React.useEffect(() => {
    if (!currentSessionId) return;

    let isMounted = true;

    const refreshRankings = async () => {
      try {
        const response = await gameService.getGameState(currentSessionId);
        const nextTeams = response?.data?.gameState?.teams;
        if (isMounted && Array.isArray(nextTeams)) {
          setLiveTeams(nextTeams);
        }
      } catch {
        // Silent fallback: keep last known teams from websocket/props.
      }
    };

    refreshRankings();
    const intervalId = window.setInterval(refreshRankings, 2000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [currentSessionId]);

  const rankingRows = React.useMemo<RankingRow[]>(() => {
    const sorted = [...(liveTeams || [])]
      .map((team) => ({
        team,
        score: getTeamScore(team),
      }))
      .sort((a, b) => b.score - a.score);

    return sorted.map(({ team, score }, index) => ({
      rank: index + 1,
      teamId: team.teamId,
      sessionId: team.sessionId,
      teamLabel: `${team.teamName || `City ${team.citySlot}`} (City ${team.citySlot})`,
      score,
      status: team.gameStatus,
      isMine: team.sessionId === currentSessionId,
    }));
  }, [liveTeams, currentSessionId]);

  React.useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative z-30">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-md border border-[#A99065] bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#3F2C1B] shadow-sm hover:bg-white"
      >
        <Trophy className="h-3.5 w-3.5 text-[#8B6B2E]" />
        Live Score Ranking
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[min(92vw,420px)] overflow-hidden rounded-lg border border-[#C7B292] bg-white shadow-xl">
          <div className="max-h-72 overflow-auto">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 bg-[#F5EFE2] text-[#4F2D14]">
                <tr>
                  <th className="px-2 py-2 text-left font-semibold">Rank</th>
                  <th className="px-2 py-2 text-left font-semibold">Team</th>
                  <th className="px-2 py-2 text-right font-semibold">Score</th>
                  <th className="px-2 py-2 text-right font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rankingRows.map((row) => (
                  <tr
                    key={row.teamId}
                    className={`border-t border-[#EFE4D0] ${
                      row.isMine ? 'bg-[#EEF7EE]' : 'bg-white'
                    }`}
                  >
                    <td className="px-2 py-1.5 font-bold text-[#3F2C1B]">#{row.rank}</td>
                    <td className="px-2 py-1.5 text-[#3F2C1B]">
                      {row.teamLabel}
                      {row.isMine && <span className="ml-1 font-semibold text-[#2E7D32]">(You)</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right font-bold text-[#33552C]">{row.score}</td>
                    <td className="px-2 py-1.5 text-right text-[#6B5A45] capitalize">{row.status}</td>
                  </tr>
                ))}
                {rankingRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 text-center text-[#7A6A56]">
                      No team data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTeamRankingToggle;
