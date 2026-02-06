"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Star } from "lucide-react";

interface RankCardProps {
  rank: number;
  totalStudents: number;
  score: number;
  student: {
    nama: string;
    kelas: string;
    semesterAktif: string;
    isDefault?: boolean;
  };
  semester: "Semester Ganjil" | "Semester Genap";
}

export function RankCard({
  rank,
  totalStudents,
  score,
  student,
  semester,
}: RankCardProps) {
  const isTop10 = rank <= 10;

  // Medal emoji mapping
  const getMedalEmoji = () => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-primary/10 via-background to-accent/5">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />

      <div className="relative p-6 space-y-4">
        {/* Top Section - Rank */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Your Golden Star Current Rank
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">#{rank}</span>
              <span className="text-lg text-muted-foreground">
                of {totalStudents}
              </span>
            </div>
          </div>

          {isTop10 && (
            <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-300 border-0 gap-1 text-sm py-1">
              <Flame className="w-3 h-3" />
              Top 10
            </Badge>
          )}
        </div>

        {/* Medal Display */}
        {getMedalEmoji() && (
          <div className="text-5xl text-center py-2">{getMedalEmoji()}</div>
        )}

        {/* Score Section */}
        <div className="bg-background/50 rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">
            Current Report Card Value
          </p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-foreground">{score}</span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Golden Star Balance */}
        {/* Saldo diambil dari parent, tampilkan di parent jika perlu */}

        {/* Student Info */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium text-foreground">{student.nama}</p>
          <p className="text-xs text-muted-foreground">{student.kelas}</p>
        </div>
      </div>
    </Card>
  );
}
