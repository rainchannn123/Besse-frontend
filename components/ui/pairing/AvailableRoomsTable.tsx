'use client';

import React from 'react';
import { Users, Clock, ChevronRight, Crown } from 'lucide-react';

interface AvailableRoom {
  roomCode: string;
  createdAt: string;
  teams: {
    teamName: string;
    players: { name: string; userId: string }[];
  }[];
  ownerName?: string;
  isAdminRoom?: boolean;
  maxTeams?: number;
}

interface AvailableRoomsTableProps {
  rooms: AvailableRoom[];
  onJoinRoom: (roomCode: string) => void;
  isLoading: boolean;
  isLeader: boolean;
}

const AvailableRoomsTable: React.FC<AvailableRoomsTableProps> = ({
  rooms,
  onJoinRoom,
  isLoading,
  isLeader,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#50704C]"></div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-[#d3c4ad]">
        <Users className="mx-auto h-12 w-12 text-[#8b7355] mb-3" />
        <p className="text-[#6d4b2a] text-lg">No available game rooms</p>
        <p className="text-[#8b7355] text-sm mt-1">Wait for an admin to create a game room</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-[#7a5f41]">
            <th className="px-4 py-2">Room Code</th>
            <th className="px-4 py-2">Created By</th>
            <th className="px-4 py-2">Teams</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => {
            const teamCount = room.teams?.length || 0;
            const maxTeams = room.maxTeams || 30;
            const isFull = teamCount >= maxTeams;

            return (
              <tr
                key={room.roomCode}
                className="bg-white rounded-lg shadow-[0_1px_6px_rgba(52,37,12,0.08)] hover:shadow-md transition-shadow"
              >
                <td className="px-4 py-3">
                  <span className="font-mono font-bold text-[#33552C] text-lg">
                    {room.roomCode}
                  </span>
                  {room.isAdminRoom && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                      Admin
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-[#4f2d14]">
                  {room.ownerName || 'Admin'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Users size={14} className="text-[#7a5f41]" />
                    <span className="text-sm text-[#6d4b2a]">
                      {teamCount}/{maxTeams} teams
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {isFull ? (
                    <span className="text-sm text-gray-500">Full</span>
                  ) : isLeader ? (
                    <button
                      onClick={() => onJoinRoom(room.roomCode)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#50704C] text-white rounded-md hover:bg-[#3A7D2C] transition-colors text-sm font-semibold"
                    >
                      Join Room
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <span className="text-sm text-[#8b7355] flex items-center gap-1">
                      <Crown size={14} />
                      Leader only
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AvailableRoomsTable;