"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface LeaderboardProps {
  topStudents: { nama: string; saldo: number }[];
  currentUserNisn: string;
  semester: "Semester Ganjil" | "Semester Genap";
}

export function Leaderboard({
  topStudents,
  currentUserNisn,
  semester,
}: LeaderboardProps) {
  const getMedalEmoji = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  const getRankBadgeColor = (index: number) => {
    if (index === 0)
      return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300";
    if (index === 1) return "bg-gray-400/20 text-gray-700 dark:text-gray-300";
    if (index === 2)
      return "bg-orange-600/20 text-orange-700 dark:text-orange-300";
    return "bg-primary/20 text-primary";
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-foreground">
            Top 10 Leaderboard
          </h2>
          <Badge variant="outline" className="gap-1 self-start sm:self-center">
            <Flame className="w-3 h-3 text-orange-500" />
            {topStudents.length} Students
          </Badge>
        </div>

        {/* Table - Horizontal scroll on mobile */}
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[300px] sm:min-w-0">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2.5 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm text-muted-foreground">
                  Rank
                </th>
                <th className="text-left py-2.5 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm text-muted-foreground">
                  Student Name
                </th>
                <th className="text-right py-2.5 sm:py-3 px-2 sm:px-4 font-semibold text-xs sm:text-sm text-muted-foreground">
                  GS Balance
                </th>
              </tr>
            </thead>
            <tbody>
              {topStudents.map((student, index) => {
                return (
                  <tr
                    key={index}
                    className={`border-b border-border transition-colors hover:bg-accent/50`}
                  >
                    {/* Rank */}
                    <td className="py-3 sm:py-4 px-2 sm:px-4">
                      <Badge
                        className={`${getRankBadgeColor(
                          index,
                        )} border-0 font-bold text-xs sm:text-sm`}
                      >
                        {getMedalEmoji(index)}
                      </Badge>
                    </td>

                    {/* Name */}
                    <td className="py-3 sm:py-4 px-2 sm:px-4">
                      <div>
                        <p
                          className={`font-medium text-foreground text-sm sm:text-base truncate max-w-[150px] sm:max-w-none`}
                        >
                          {student.nama}
                        </p>
                      </div>
                    </td>

                    {/* GS Balance */}
                    <td className="py-3 sm:py-4 px-2 sm:px-4 text-right">
                      <span
                        className={`font-bold text-base sm:text-lg text-foreground`}
                      >
                        {student.saldo}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
