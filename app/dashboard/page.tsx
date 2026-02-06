"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { DashboardHeader } from "@/components/dashboard-header";
import { SemesterSelector } from "@/components/semester-selector";
import { RankCard } from "@/components/rank-card";
import { Leaderboard } from "@/components/leaderboard";
import { AcademicGrowthChart } from "@/components/academic-growth-chart";
import { BioBankActivity } from "@/components/bio-bank-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchStudentData } from "@/lib/api";
import { AlertCircle } from "lucide-react";

// --- INTERFACES (Tetap sama sesuai keinginanmu) ---
interface HistoryItem {
  item: string;
  skor: number | string;
  isGS: boolean;
}
interface RankItem {
  nama: string;
  saldo: number;
}
interface StudentApiResponse {
  profile: {
    nama: string;
    kelas: string;
    semesterAktif: string;
    isDefault?: boolean;
  };
  gsData: {
    totalDapat: number;
    totalPakaiUH: number;
    pakaiUAS: number | string;
    saldoAkhir: number;
    kurs: number;
  };
  akademik: {
    rataHarian: number;
    uasAsli: number;
    uasFinal: number;
    nilaiRapor: number;
    historyBab: HistoryItem[];
  };
  leaderboard: {
    top10: RankItem[];
    userRank: number;
    totalStudents: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [studentData, setStudentData] = useState<StudentApiResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [semester, setSemester] = useState<
    "Semester Ganjil" | "Semester Genap"
  >("Semester Ganjil");

  const getSemesterNum = (s: string) => (s === "Semester Genap" ? 2 : 1);

  // FIXED: Memasukkan dependensi yang benar agar tidak berubah-ubah ukurannya
  const loadData = useCallback(
    async (semLabel?: "Semester Ganjil" | "Semester Genap") => {
      if (!user?.email) return;

      if (!studentData) setIsLoading(true);

      try {
        const targetSem = semLabel || semester;
        const data = await fetchStudentData(
          user.email,
          user.nisn || "",
          getSemesterNum(targetSem)
        );
        setStudentData(data);
        setError(null);
      } catch (err) {
        setError("Gagal memuat data terbaru.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user?.email, user?.nisn, semester] // Hanya refresh jika info user atau semester berubah
  );

  // FIXED: Dependency array dibuat konstan agar tidak memicu error "changed size"
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user?.email, loadData]);

  const handleSemesterChange = (
    newSem: "Semester Ganjil" | "Semester Genap"
  ) => {
    setSemester(newSem);
    setStudentData(null);
    loadData(newSem);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const gradesByChapter = (() => {
    if (!studentData?.akademik?.historyBab) return [];
    const chapters: Record<string, any[]> = {};
    studentData.akademik.historyBab.forEach((entry: any) => {
      const taskName = entry.item || entry.label || "Tugas";
      const babMatch = taskName.match(/Bab\s?(\d+)/i);
      const chapterName = babMatch ? `Bab ${babMatch[1]}` : "Lainnya";
      if (!chapters[chapterName]) chapters[chapterName] = [];
      chapters[chapterName].push({
        name: taskName,
        score: entry.skor,
        gs: entry.gs || (entry.isGS ? entry.skor : 0),
      });
    });
    return Object.entries(chapters).map(([chapter, tasks]) => ({
      chapter,
      tasks,
    }));
  })();

  // Proteksi render header agar tidak error 'user is null'
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <DashboardHeader
        user={user as any}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        currentSemester={semester} // Kirim state semester ke sini
        displayClass={studentData?.profile?.kelas}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <SemesterSelector
            currentSemester={semester}
            onSemesterChange={handleSemesterChange}
          />
        </div>

        {isLoading || !studentData ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
        ) : (
          <div className="grid gap-6 lg:gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RankCard
                rank={studentData.leaderboard?.userRank || 0}
                totalStudents={studentData.leaderboard?.totalStudents || 0}
                score={studentData.akademik?.nilaiRapor || 0}
                student={studentData.profile}
                semester={semester}
              />
            </div>

            <Leaderboard
              topStudents={studentData.leaderboard?.top10 || []}
              currentUserNisn={user?.nisn || ""}
              semester={semester}
            />

            <BioBankActivity
              student={studentData.profile}
              semester={semester}
              gradesByChapter={gradesByChapter}
              earned={studentData.gsData?.totalDapat || 0}
              used={Number(studentData.gsData?.totalPakaiUH) || 0}
              balance={Number(studentData.gsData?.saldoAkhir) || 0}
            />
          </div>
        )}
      </main>
    </div>
  );
}
