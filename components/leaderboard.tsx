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
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Top 10 Leaderboard
          </h2>
          <Badge variant="outline" className="gap-1">
            <Flame className="w-3 h-3 text-orange-500" />
            {topStudents.length} Students
          </Badge>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">
                  Rank
                </th>
                <th className="text-left py-3 px-4 font-semibold text-sm text-muted-foreground">
                  Student Name
                </th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-muted-foreground">
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
                    <td className="py-4 px-4">
                      <Badge
                        className={`${getRankBadgeColor(
                          index
                        )} border-0 font-bold`}
                      >
                        {getMedalEmoji(index)}
                      </Badge>
                    </td>

                    {/* Name */}
                    <td className="py-4 px-4">
                      <div>
                        <p className={`font-medium text-foreground`}>
                          {student.nama}
                        </p>
                      </div>
                    </td>

                    {/* GS Balance */}
                    <td className="py-4 px-4 text-right">
                      <span className={`font-bold text-lg text-foreground`}>
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
