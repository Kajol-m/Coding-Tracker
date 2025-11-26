"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTrackerStore } from "@/lib/store/userTrackerStore";
import type { DailyDataMap } from "@/types/tracker";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { PixelButton } from "@/components/ui/pixel-button";
import UserProfile from "@/components/UserProfile";

interface LanguageStats {
  language: string;
  count: number;
  percentage: number;
}

export default function Statistics() {
  const navigate = useRouter();
  const { data: session, status } = useSession();
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const dailyEntries = useTrackerStore((s) => s.dailyEntries);
  const loadAll = useTrackerStore((s) => s.loadAll);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user && !localStorage.getItem("token")) {
      navigate.push("/auth");
      return;
    }
    
    setIsAuthenticated(true);
    loadAll();
  }, [loadAll, session, status, navigate]);

  useEffect(() => {
    const dailyData: DailyDataMap = dailyEntries || {};

    // Count questions per language
    const languageCount: { [key: string]: number } = {};
    let total = 0;

    Object.values(dailyData).forEach((day) => {
      if (day.status === "done" && day.questions) {
        day.questions.forEach((question) => {
          total++;
          question.languages.forEach((lang) => {
            languageCount[lang] = (languageCount[lang] || 0) + 1;
          });
        });
      }
    });

    // Convert to array and sort by count
    const stats: LanguageStats[] = Object.entries(languageCount)
      .map(([language, count]) => ({
        language,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    setLanguageStats(stats);
    setTotalQuestions(total);
  }, [dailyEntries]);

  if (status === "loading" || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-pixel">Loading...</div>
      </div>
    );
  }

  const colors = [
    "#ffb3cc",
    "#e4d4ed",
    "#5c1f7a",
    "#ffb3cc",
    "#e4d4ed",
    "#5c1f7a",
    "#ffb3cc",
    "#e4d4ed",
    "#5c1f7a",
  ];

  return (
    <div className="min-h-screen  to-secondary/20 p-4 md:p-8">
      <div className="absolute top-10 left-10 text-4xl animate-sparkle">
        <img src="/sparkle-1.png" className="max-w-[100px]" />
      </div>
      <div
        className="absolute top-20 right-20 text-3xl animate-sparkle"
        style={{ animationDelay: "0.5s" }}
      >
        <img src="/sparkle-1.png" className="max-w-[100px]" />
      </div>
      <div
        className="absolute bottom-20 left-1/4 text-2xl animate-sparkle"
        style={{ animationDelay: "1s" }}
      >
        <img src="/sparkle-2.png" className="max-w-[100px]" />
      </div>
      <div
        className="absolute top-50 left-20 text-3xl animate-sparkle"
        style={{ animationDelay: "0.5s" }}
      >
        <img src="/sparkle-1.png" className="max-w-[100px]" />
      </div>
      <div
        className="absolute bottom-50 right-40 text-2xl animate-sparkle"
        style={{ animationDelay: "1s" }}
      >
        <img src="/sparkle-2.png" className="max-w-[100px]" />
      </div>

      <style>{`
        .recharts-wrapper * {
          outline: none !important;
        }
        .recharts-wrapper *:focus {
          outline: none !important;
        }
        svg * {
          outline: none !important;
        }
        .recharts-bar-rectangle:hover {
          filter: brightness(1.1) !important;
          opacity: 1 !important;
        }
        .recharts-active-bar {
          filter: none !important;
        }
        .recharts-tooltip-cursor {
          fill: transparent !important;
        }
        .recharts-active-dot {
          display: none !important;
        }
      `}</style>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-end mb-4">
          <UserProfile />
        </div>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <PixelButton
            variant="outline"
            size="icon"
            onClick={() => navigate.push("/")}
          >
            <ArrowLeft className="w-5 h-5" />
          </PixelButton>
          <h1 className="text-2xl md:text-3xl font-pixel text-primary">
            Statistics Dashboard
          </h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card pixel-border-lg p-6 text-center">
            <div className="text-4xl font-pixel text-primary mb-2">
              {totalQuestions}
            </div>
            <div className="text-xs font-pixel text-muted-foreground">
              Total Questions Solved
            </div>
          </div>

          <div className="bg-card pixel-border-lg p-6 text-center">
            <div className="text-4xl font-pixel text-accent mb-2">
              {languageStats.length}
            </div>
            <div className="text-xs font-pixel text-muted-foreground">
              Languages Used
            </div>
          </div>

          <div className="bg-card pixel-border-lg p-6 text-center">
            <div className="text-3xl font-pixel text-secondary mb-2">
              {languageStats[0]?.language || "N/A"}
            </div>
            <div className="text-xs font-pixel text-muted-foreground">
              Most Used Language
            </div>
          </div>
        </div>

        {/* Chart */}
        {languageStats.length > 0 ? (
          <div className="bg-card pixel-border-lg p-6 mb-8">
            <h2 className="text-lg font-pixel text-primary mb-6">
              Questions per Language
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={languageStats}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#ba9cc9"
                  horizontal={true}
                  vertical={true}
                />
                <XAxis
                  dataKey="language"
                  tick={{ fill: "#ba9cc9", fontSize: 10, fontFamily: "VT323" }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  tick={{ fill: "#ba9cc9", fontSize: 12, fontFamily: "VT323" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "2px solid #ba9cc9",
                    fontFamily: "VT323",
                    fontSize: "14px",
                    color: "#ba9cc9",
                  }}
                  labelStyle={{ color: "#ba9cc9" }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                >
                  {languageStats.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-card pixel-border-lg p-12 text-center">
            <p className="text-sm font-pixel text-muted-foreground">
              No data available yet. Start solving questions to see your
              statistics!
            </p>
          </div>
        )}

        {/* Top Languages List */}
        {languageStats.length > 0 && (
          <div className="bg-card pixel-border-lg p-6">
            <h2 className="text-lg font-pixel text-primary mb-6">
              Language Breakdown
            </h2>
            <div className="space-y-4">
              {languageStats.map((stat, index) => (
                <div key={stat.language} className="flex items-center gap-4">
                  <div className="w-8 text-center">
                    <span className="text-lg font-pixel text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-pixel">
                        {stat.language}
                      </span>
                      <span className="text-xs font-pixel text-muted-foreground">
                        {stat.count} questions ({stat.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-3 bg-secondary/30 pixel-border-sm overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${stat.percentage}%`,
                          backgroundColor: "#ba9cc9",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
