"use client";

import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AcademicGrowthChartProps {
  distribution: { range: string; count: number }[];
  trendData: { name: string; average: number }[];
}

export function AcademicGrowthChart({
  distribution,
  trendData,
}: AcademicGrowthChartProps) {
  return (
    <Card className="border-0 shadow-lg">
      <div className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-6">
          Academic Growth Analytics
        </h2>

        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
            <TabsTrigger value="trend">Class Average Trend</TabsTrigger>
          </TabsList>

          {/* Score Distribution */}
          <TabsContent value="distribution">
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="range"
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: "12px" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Number of students in each score range across all classes
            </p>
          </TabsContent>

          {/* Class Average Trend */}
          <TabsContent value="trend">
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    style={{ fontSize: "12px" }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                    formatter={(value) => [
                      typeof value === "number" ? value.toFixed(2) : value,
                      "Average",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="var(--primary)"
                    dot={{ fill: "var(--primary)", r: 5 }}
                    activeDot={{ r: 7 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Average academic score by class
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
