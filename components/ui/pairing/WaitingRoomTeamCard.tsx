'use client';

import React from 'react';
import { CheckCircle, Clock, Users } from 'lucide-react';

interface TeamData {
  teamRole: 'Team A' | 'Team B';
  teamName: string;
  isReady: boolean;
  players: {
    userId: string;
    name: string;
    role: string | null;
  }[];
}

interface WaitingRoomTeamCardProps {
  team: TeamData | null;
  title: string;
  isCurrentTeam: boolean;
}

const WaitingRoomTeamCard: React.FC<WaitingRoomTeamCardProps> = ({
  team,
  title,
  isCurrentTeam,
}) => {
  if (!team) {
    return (
      <div className="bg-white/50 rounded-xl border-2 border-dashed border-[#b18c5a] p-6 text-center">
        <Clock className="mx-auto h-12 w-12 text-[#8b7355] mb-3" />
        <p className="text-[#6d4b2a] font-medium">Waiting for opponent...</p>
        <p className="text-[#8b7355] text-sm mt-1">Share the room code with another team</p>
      </div>
    );
  }

  const allPlayersJoined = team.players.length === 3;
  const playerRoles = ['Municipality', 'MRF', 'Broker'];

  return (
    <div
      className={`rounded-xl border-2 p-5 transition-all ${
        isCurrentTeam
          ? 'bg-gradient-to-br from-[#3A7D2C] to-[#2d6322] border-[#5b8c3e] text-white shadow-lg'
          : 'bg-white border-[#d3c4ad] text-[#4f2d14] shadow-sm'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className={`text-sm ${isCurrentTeam ? 'text-green-100' : 'text-[#7a5f41]'}`}>
            {team.teamName}
          </p>
        </div>
        {team.isReady ? (
          <div className="flex items-center gap-1 bg-green-500 px-3 py-1 rounded-full">
            <CheckCircle size={14} className="text-white" />
            <span className="text-xs font-semibold text-white">Ready</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-yellow-500 px-3 py-1 rounded-full">
            <Clock size={14} className="text-white" />
            <span className="text-xs font-semibold text-white">Not Ready</span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Users size={16} className={isCurrentTeam ? 'text-green-200' : 'text-[#7a5f41]'} />
          <span className={`text-sm font-medium ${isCurrentTeam ? 'text-green-100' : 'text-[#6d4b2a]'}`}>
            Team Members ({team.players.length}/3)
          </span>
        </div>

        {playerRoles.map((role, index) => {
          const player = team.players[index];
          return (
            <div
              key={role}
              className={`flex items-center justify-between p-2 rounded-lg ${
                isCurrentTeam ? 'bg-white/10' : 'bg-[#f8f3ea]'
              }`}
            >
              <span className={`text-sm font-medium ${isCurrentTeam ? 'text-white' : 'text-[#4f2d14]'}`}>
                {role}
              </span>
              {player ? (
                <span className={`text-sm ${isCurrentTeam ? 'text-green-200' : 'text-[#33552C]'}`}>
                  {player.name}
                </span>
              ) : (
                <span className={`text-sm italic ${isCurrentTeam ? 'text-green-300/60' : 'text-[#b18c5a]'}`}>
                  Waiting...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WaitingRoomTeamCard;