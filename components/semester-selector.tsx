"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen } from "lucide-react";

interface SemesterSelectorProps {
  currentSemester: "Semester Ganjil" | "Semester Genap";
  onSemesterChange: (semester: "Semester Ganjil" | "Semester Genap") => void;
}

export function SemesterSelector({
  currentSemester,
  onSemesterChange,
}: SemesterSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <BookOpen className="w-5 h-5 text-primary" />
      <Select value={currentSemester} onValueChange={onSemesterChange}>
        <SelectTrigger className="w-48 h-10">
          <SelectValue placeholder="Select semester" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Semester Ganjil">Semester Ganjil (Odd)</SelectItem>
          <SelectItem value="Semester Genap">Semester Genap (Even)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
