import { StudentData } from "./types";

const API_URL = "/api/students";

export async function fetchStudentData(
  email: string,
  nisn: string,
  semester?: number
): Promise<any> {
  try {
    console.log("[v0] Fetching student data from server...", {
      email,
      nisn,
      semester,
    });
    if (!email || !nisn) {
      throw new Error("Email dan NISN harus diisi!");
    }
    let url = `${API_URL}?email=${encodeURIComponent(
      email
    )}&nisn=${encodeURIComponent(nisn)}`;
    if (semester) {
      url += `&semester=${semester}`;
    }
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          errorMessage += ` - ${errorBody}`;
        }
      } catch {}
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("[v0] Successfully fetched student data");
    return data;
  } catch (error) {
    console.error("[v0] Error fetching student data:", error);
    throw error;
  }
}

export function getUserByEmail(
  students: StudentData[],
  email: string
): StudentData | undefined {
  return students.find(
    (student) => student["Email Google"]?.toLowerCase() === email.toLowerCase()
  );
}

export function getStudentRank(
  students: StudentData[],
  nisn: string,
  semester: "Semester Ganjil" | "Semester Genap"
): { rank: number; totalStudents: number; score: number } {
  const scoreKey =
    semester === "Semester Ganjil" ? "NILAI RAPOR S1" : "NILAI RAPOR S2";

  const sorted = [...students]
    .filter((s) => s[scoreKey] !== undefined && s[scoreKey] !== null)
    .sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number));

  const rankIndex = sorted.findIndex((s) => s.NISN === nisn);
  const score = sorted[rankIndex]?.[scoreKey] as number;

  return {
    rank: rankIndex + 1,
    totalStudents: sorted.length,
    score: score || 0,
  };
}

export function getTopStudents(
  students: StudentData[],
  semester: "Semester Ganjil" | "Semester Genap",
  limit: number = 10
): StudentData[] {
  const scoreKey =
    semester === "Semester Ganjil" ? "NILAI RAPOR S1" : "NILAI RAPOR S2";

  return [...students]
    .filter((s) => s[scoreKey] !== undefined && s[scoreKey] !== null)
    .sort((a, b) => (b[scoreKey] as number) - (a[scoreKey] as number))
    .slice(0, limit);
}

export function getGoldenStarBalance(
  student: StudentData,
  semester: "Semester Ganjil" | "Semester Genap"
): number {
  const balanceKey =
    semester === "Semester Ganjil" ? "SALDO SAAT INI S1" : "SALDO SAAT INI S2";
  return student[balanceKey] || 0;
}

export function getTransactionBreakdown(
  student: StudentData,
  semester: "Semester Ganjil" | "Semester Genap"
): { earned: number; used: number; balance: number } {
  const earnedKey =
    semester === "Semester Ganjil" ? "TOTAL GS DAPAT S1" : "TOTAL GS DAPAT S2";
  const usedKey =
    semester === "Semester Ganjil"
      ? "TOTAL GS TERPAKAI S1"
      : "TOTAL GS TERPAKAI S2";
  const balanceKey =
    semester === "Semester Ganjil" ? "SALDO SAAT INI S1" : "SALDO SAAT INI S2";

  return {
    earned: student[earnedKey] || 0,
    used: student[usedKey] || 0,
    balance: student[balanceKey] || 0,
  };
}

export function getGradesByChapter(
  student: StudentData,
  semester: "Semester Ganjil" | "Semester Genap"
): { chapter: string; tasks: { name: string; score: number; gs: number }[] }[] {
  const taskPrefix = semester === "Semester Ganjil" ? " S1" : " S2";
  const chapters: Map<string, { name: string; score: number; gs: number }[]> =
    new Map();

  // Extract task data from student object
  for (const [key, value] of Object.entries(student)) {
    if (
      key.includes("Tugas") &&
      key.includes("Bab") &&
      key.includes(taskPrefix)
    ) {
      // Extract chapter number from key like "Tugas 1 Bab 1 S1"
      const match = key.match(/Bab (\d+)/);
      if (match) {
        const chapNum = match[1];
        const chapter = `Bab ${chapNum}`;

        if (!chapters.has(chapter)) {
          chapters.set(chapter, []);
        }

        const tasks = chapters.get(chapter)!;
        const taskNum = key.match(/Tugas (\d+)/)?.[1];

        // Look for corresponding GS value
        const gsKey = key
          .replace(/Tugas \d+ /, "")
          .replace(/ S[12]$/, " GS S1")
          .replace(/ S[12]$/, " GS S2");
        const gsValue = student[gsKey] || 0;

        if (taskNum) {
          tasks.push({
            name: `Tugas ${taskNum}`,
            score: Number(value) || 0,
            gs: Number(gsValue) || 0,
          });
        }
      }
    }
  }

  return Array.from(chapters.entries()).map(([chapter, tasks]) => ({
    chapter,
    tasks: tasks.sort(
      (a, b) =>
        Number(a.name.match(/\d+/)?.[0]) - Number(b.name.match(/\d+/)?.[0])
    ),
  }));
}

export function getAcademicGrowthData(
  students: StudentData[],
  semester: "Semester Ganjil" | "Semester Genap"
) {
  const scoreKey =
    semester === "Semester Ganjil" ? "NILAI RAPOR S1" : "NILAI RAPOR S2";

  // Group by score ranges for distribution chart
  const distribution: { range: string; count: number }[] = [
    { range: "90-100", count: 0 },
    { range: "80-89", count: 0 },
    { range: "70-79", count: 0 },
    { range: "60-69", count: 0 },
    { range: "0-59", count: 0 },
  ];

  students.forEach((s) => {
    const score = s[scoreKey] as number;
    if (score >= 90) distribution[0].count++;
    else if (score >= 80) distribution[1].count++;
    else if (score >= 70) distribution[2].count++;
    else if (score >= 60) distribution[3].count++;
    else distribution[4].count++;
  });

  // Average by class for trend data
  const classTrend: Map<string, { total: number; count: number }> = new Map();
  students.forEach((s) => {
    const score = s[scoreKey] as number;
    if (score !== undefined) {
      const current = classTrend.get(s.Kelas) || { total: 0, count: 0 };
      current.total += score;
      current.count += 1;
      classTrend.set(s.Kelas, current);
    }
  });

  const trendData = Array.from(classTrend.entries()).map(([name, data]) => ({
    name,
    average: Number((data.total / data.count).toFixed(2)),
  }));

  return { distribution, trendData };
}
