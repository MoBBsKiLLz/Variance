"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Team, ProgressionData } from "@/lib/types/team";

async function fetchTeams(): Promise<Team[]> {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error("Failed to fetch teams");
  return response.json();
}

async function fetchTeamProgression(teamId: string, season: string) {
  const response = await fetch(
    `/api/team-progression?teamId=${teamId}&season=${season}`
  );
  if (!response.ok) throw new Error("Failed to fetch progression");
  return response.json();
}

export default function TrendsPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  const { data: progression, isLoading } = useQuery({
    queryKey: ["team-progression", selectedTeamId],
    queryFn: () => fetchTeamProgression(selectedTeamId, "2025-26"),
    enabled: !!selectedTeamId,
  });

  const selectedTeam = teams?.find((t) => t.id.toString() === selectedTeamId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Season Trends
        </h1>
        <p className="text-muted-foreground">
          Track team performance over the season
        </p>
      </div>

      <Card className="p-6 border-t-4 border-accent">
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Select Team</label>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Choose a team to analyze" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={5}
              className="max-h-75"
            >
              {teams?.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.abbreviation} - {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <p className="text-muted-foreground text-center py-8">
            Loading trends...
          </p>
        )}

        {!selectedTeamId && !isLoading && (
          <p className="text-muted-foreground text-center py-8">
            Select a team to view their season trends
          </p>
        )}

        {progression && progression.length > 0 && selectedTeam && (
          <div className="space-y-6">
            {/* Current Record */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Record</div>
                <div className="text-2xl font-bold">
                  {progression[progression.length - 1].wins}-
                  {progression[progression.length - 1].losses}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Win %</div>
                <div className="text-2xl font-bold">
                  {(progression[progression.length - 1].winPct * 100).toFixed(
                    1
                  )}
                  %
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Avg Points</div>
                <div className="text-2xl font-bold">
                  {progression[progression.length - 1].avgPointsScored.toFixed(
                    1
                  )}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-sm text-muted-foreground">Avg Allowed</div>
                <div className="text-2xl font-bold">
                  {progression[progression.length - 1].avgPointsAllowed.toFixed(
                    1
                  )}
                </div>
              </Card>
            </div>

            {/* Win Percentage Trend */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-4">
                Win Percentage Over Season
              </h3>
              <ResponsiveContainer
                width="100%"
                height={250}
                className="md:h-75"
              >
                <LineChart
                  data={progression}
                  margin={{ top: 5, right: 10, left: 0, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis
                    dataKey="gameNumber"
                    label={{
                      value: "Games",
                      position: "insideBottomRight",
                      offset: 0,
                      style: { fontSize: "12px" },
                    }}
                    tick={{ fontSize: 10 }}
                    height={50}
                    type="number"
                  />
                  <YAxis
                    domain={[0, 1]}
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    label={{
                      value: "Win %",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: "12px" },
                    }}
                    tick={{ fontSize: 10 }}
                    width={50}
                    type="number"
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value !== undefined
                        ? `${(value * 100).toFixed(1)}%`
                        : "N/A"
                    }
                    labelFormatter={(label) => `Game ${label}`}
                    contentStyle={{
                      fontSize: "12px",
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      color: "var(--foreground)",
                    }}
                    labelStyle={{
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="winPct"
                    stroke="#0088FE"
                    strokeWidth={2}
                    name="Win %"
                    dot={{ fill: "#0088FE", r: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Points Scored vs Allowed */}
            <Card className="p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-4">
                Average Points: Scored vs Allowed
              </h3>
              <ResponsiveContainer
                width="100%"
                height={250}
                className="md:h-75"
              >
                <LineChart
                  data={progression}
                  margin={{ top: 5, right: 10, left: 0, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                  <XAxis
                    dataKey="gameNumber"
                    label={{
                      value: "Games",
                      position: "insideBottomRight",
                      offset: 0,
                      style: { fontSize: "12px" },
                    }}
                    tick={{ fontSize: 10 }}
                    height={50}
                    type="number"
                  />
                  <YAxis
                    label={{
                      value: "Points",
                      angle: -90,
                      position: "insideLeft",
                      style: { fontSize: "12px" },
                    }}
                    tick={{ fontSize: 10 }}
                    width={50}
                    type="number"
                  />
                  <Tooltip
                    labelFormatter={(label) => `Game ${label}`}
                    contentStyle={{
                      fontSize: "12px",
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      color: "var(--foreground)",
                    }}
                    labelStyle={{
                      color: "var(--foreground)",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPointsScored"
                    stroke="#00C49F"
                    strokeWidth={2}
                    name="Scored"
                    dot={{ fill: "#00C49F", r: 2 }}
                    isAnimationActive={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgPointsAllowed"
                    stroke="#FF8042"
                    strokeWidth={2}
                    name="Allowed"
                    dot={{ fill: "#FF8042", r: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Recent Form (Last 10 Games) */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Recent Form (Last 10 Games)
              </h3>
              <div className="flex gap-2 flex-wrap">
                {progression
                  .slice(-10)
                  .map((game: ProgressionData, idx: number) => (
                    <div
                      key={idx}
                      className={`w-10 h-10 flex items-center justify-center rounded font-semibold ${
                        game.result === "W"
                          ? "bg-green-500/20 text-green-600 dark:text-green-400"
                          : "bg-red-500/20 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {game.result}
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        )}

        {progression && progression.length === 0 && selectedTeamId && (
          <p className="text-muted-foreground text-center py-8">
            No game data available for this team yet
          </p>
        )}
      </Card>
    </div>
  );
}
