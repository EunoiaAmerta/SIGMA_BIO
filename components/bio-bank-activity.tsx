"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowDown, ArrowUp, TrendingUp, Star } from "lucide-react";

interface BioBankActivityProps {
  student: {
    nama: string;
    kelas: string;
    semesterAktif: string;
    isDefault?: boolean;
  };
  semester: "Semester Ganjil" | "Semester Genap";
  gradesByChapter: {
    chapter: string;
    tasks: { name: string; score: number; gs: number }[];
  }[];
  earned: number;
  used: number;
  balance: number;
}

export function BioBankActivity({
  student,
  semester,
  gradesByChapter,
  earned,
  used,
  balance,
}: BioBankActivityProps) {
  // Grade badge color
  const getGradeBadgeColor = (score: number) => {
    if (score >= 90)
      return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    if (score >= 75)
      return "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/20";
    return "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/20";
  };

  const getGradeLabel = (score: number) => {
    if (score >= 90) return "Expert Biologist";
    if (score >= 75) return "Proficient";
    return "Needs Observation";
  };

  return (
    <Card className="border-0 shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Golden Star-Bank Activity
        </h2>

        {/* Transaction Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* Earned */}
          <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs text-muted-foreground font-medium">
                Earned
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {earned}
            </p>
          </div>

          {/* Used */}
          <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-xs text-muted-foreground font-medium">
                Used
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {used}
            </p>
          </div>

          {/* Balance */}
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                Balance
              </span>
            </div>
            <p className="text-2xl font-bold text-primary">{balance}</p>
          </div>
        </div>

        {/* Breakdown Text */}
        <div className="bg-muted/50 rounded-lg p-4 mb-6 border border-border">
          <p className="text-sm text-foreground">
            <span className="font-bold">{earned}</span>
            <span className="text-muted-foreground"> earned - </span>
            <span className="font-bold">{used}</span>
            <span className="text-muted-foreground"> used = </span>
            <span className="font-bold text-primary">{balance}</span>
            <span className="text-muted-foreground"> remaining</span>
          </p>
        </div>

        {/* Grades by Chapter */}
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Detailed Grade Breakdown
        </h3>

        <Accordion type="single" collapsible className="w-full space-y-2">
          {gradesByChapter.map((chapter, idx) => (
            <AccordionItem
              key={idx}
              value={chapter.chapter}
              className="border border-border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-3 text-left">
                  <span className="font-semibold text-foreground">
                    {chapter.chapter}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {chapter.tasks.length} Tasks
                  </Badge>
                </div>
              </AccordionTrigger>

              <AccordionContent className="space-y-3 pt-4">
                {chapter.tasks.map((task, taskIdx) => (
                  <div
                    key={taskIdx}
                    className="relative p-4 border rounded-lg bg-card flex flex-col gap-2"
                  >
                    <span className="text-sm text-muted-foreground">
                      {task.name}
                    </span>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-2xl font-bold">{task.score}</span>
                      {task.gs !== null && task.gs > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-yellow-900 bg-yellow-400 rounded-md">
                          <Star size={12} fill="currentColor" />
                          {task.gs}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {gradesByChapter.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No task data available yet</p>
          </div>
        )}
      </div>
    </Card>
  );
}
