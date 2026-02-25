"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { DashboardHeader } from "@/components/dashboard-header";
import { SemesterSelector } from "@/components/semester-selector";
import { RankCard } from "@/components/rank-card";
import { Leaderboard } from "@/components/leaderboard";
import { BioBankActivity } from "@/components/bio-bank-activity";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchStudentData } from "@/lib/api";

// --- INTERFACES ---
interface HistoryItem {
  item: string;
  skor: number | string;
  isGS: boolean;
  label?: string;
  gs?: number;
  semester?: string;
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
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [semester, setSemester] = useState<
    "Semester Ganjil" | "Semester Genap"
  >("Semester Ganjil");

  // Use ref to prevent race conditions
  const isInitialLoadRef = useRef(true);
  const isFetchingRef = useRef(false);

  const getSemesterNum = (s: string) => (s === "Semester Genap" ? 2 : 1);

  // Load data function
  const loadData = useCallback(
    async (semLabel?: "Semester Ganjil" | "Semester Genap") => {
      if (!user?.email || isFetchingRef.current) return;

      isFetchingRef.current = true;
      setIsLoading(true);
      setStudentData(null);

      try {
        const targetSem = semLabel || semester;
        const data = await fetchStudentData(
          user.email,
          user.nisn || "",
          getSemesterNum(targetSem),
        );
        setStudentData(data);

        // Update semester state if this is initial load
        if (isInitialLoadRef.current && semLabel) {
          setSemester(semLabel);
          isInitialLoadRef.current = false;
        }

        setError(null);
      } catch (err) {
        setError("Gagal memuat data terbaru.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isFetchingRef.current = false;
      }
    },
    [user?.email, user?.nisn, semester],
  );

  // Initial load - get semesterAktif and load correct semester
  useEffect(() => {
    if (user && isInitialLoadRef.current && !isFetchingRef.current) {
      isFetchingRef.current = true;

      const fetchInitialData = async () => {
        setIsLoading(true);

        try {
          // Step 1: Fetch semester 1 to get semesterAktif
          console.log(
            "[Dashboard] Step 1: Fetching semester 1 for semesterAktif...",
          );
          const data1 = await fetchStudentData(user.email, user.nisn || "", 1);

          // Step 2: Get semesterAktif from response
          const activeSemester = data1.profile?.semesterAktif || "1";
          console.log("[Dashboard] semesterAktif received:", activeSemester);

          // Step 3: Determine correct semester
          const correctSemNum = activeSemester === "2" ? 2 : 1;
          const correctSemLabel =
            correctSemNum === 2 ? "Semester Genap" : "Semester Ganjil";
          console.log(
            "[Dashboard] Will load:",
            correctSemLabel,
            "(semester",
            correctSemNum,
            ")",
          );

          // Step 4: Set semester state FIRST (before fetching)
          setSemester(correctSemLabel);

          // Step 5: Fetch the correct semester data
          console.log("[Dashboard] Step 2: Fetching correct semester data...");
          const correctData = await fetchStudentData(
            user.email,
            user.nisn || "",
            correctSemNum,
          );

          // Step 6: Set the data
          console.log("[Dashboard] Setting studentData with correct semester");
          setStudentData(correctData);

          // Mark initial load as done
          isInitialLoadRef.current = false;

          setError(null);
        } catch (err) {
          console.error("[Dashboard] Error:", err);
          setError("Gagal memuat data terbaru.");
        } finally {
          setIsLoading(false);
          isFetchingRef.current = false;
        }
      };

      fetchInitialData();
    }
  }, [user?.email, user?.nisn]);

  const handleSemesterChange = (
    newSem: "Semester Ganjil" | "Semester Genap",
  ) => {
    isInitialLoadRef.current = false; // No longer initial load
    setSemester(newSem);
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
        currentSemester={semester}
        displayClass={studentData?.profile?.kelas}
      />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Dashboard</h2>
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
