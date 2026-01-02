"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import type { Team } from "@/lib/types/team";

async function fetchTeams(): Promise<Team[]> {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error("Failed to fetch teams");
  return response.json();
}

export default function Home() {
  const {
    data: teams,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });
  const [sortKey, setSortKey] = useState<
    | "name"
    | "wins"
    | "pointsPerGame"
    | "offensiveRating"
    | "defensiveRating"
    | "pace"
    | "fieldGoalPct"
    | "threePointPct"
    | "reboundsPerGame"
    | "assistsPerGame"
    | "turnoversPerGame"
  >("wins");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedTeams = teams
    ? [...teams].sort((a, b) => {
        const aStats = a.teamStats[0];
        const bStats = b.teamStats[0];

        if (sortKey === "name") {
          return sortOrder === "desc"
            ? b.name.localeCompare(a.name)
            : a.name.localeCompare(b.name);
        }

        let aValue: number;
        let bValue: number;

        switch (sortKey) {
          case "wins":
            aValue = aStats.wins;
            bValue = bStats.wins;
            break;
          case "pointsPerGame":
            aValue = aStats.pointsPerGame;
            bValue = bStats.pointsPerGame;
            break;
          case "offensiveRating":
            aValue = aStats.offensiveRating ?? 0;
            bValue = bStats.offensiveRating ?? 0;
            break;
          case "defensiveRating":
            aValue = aStats.defensiveRating ?? 0;
            bValue = bStats.defensiveRating ?? 0;
            break;
          case "pace":
            aValue = aStats.pace ?? 0;
            bValue = bStats.pace ?? 0;
            break;
          case "fieldGoalPct":
            aValue = aStats.fieldGoalPct;
            bValue = bStats.fieldGoalPct;
            break;
          case "threePointPct":
            aValue = aStats.threePointPct;
            bValue = bStats.threePointPct;
            break;
          case "reboundsPerGame":
            aValue = aStats.reboundsPerGame;
            bValue = bStats.reboundsPerGame;
            break;
          case "assistsPerGame":
            aValue = aStats.assistsPerGame;
            bValue = bStats.assistsPerGame;
            break;
          case "turnoversPerGame":
            aValue = aStats.turnoversPerGame;
            bValue = bStats.turnoversPerGame;
            break;
        }

        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      })
    : [];

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-lg p-6 border-t-4 border-accent">
      <h2 className="text-2xl font-semibold text-foreground mb-4">
        Team Stats - 2025-26 Season
      </h2>

      {isLoading && <p className="text-muted-foreground">Loading teams...</p>}

      {error && <p className="text-destructive">Error: {error.message}</p>}

      {teams && teams.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="w-62.5 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("name")}
                >
                  Team{" "}
                  {sortKey === "name" && (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("wins")}
                >
                  W-L {sortKey === "wins" && (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("pointsPerGame")}
                >
                  PPG{" "}
                  {sortKey === "pointsPerGame" &&
                    (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("offensiveRating")}
                >
                  ORtg{" "}
                  {sortKey === "offensiveRating" &&
                    (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("defensiveRating")}
                >
                  DRtg{" "}
                  {sortKey === "defensiveRating" &&
                    (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("pace")}
                >
                  Pace{" "}
                  {sortKey === "pace" && (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("fieldGoalPct")}
                >
                  FG%{" "}
                  {sortKey === "fieldGoalPct" &&
                    (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("threePointPct")}
                >
                  3P%{" "}
                  {sortKey === "threePointPct" &&
                    (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("reboundsPerGame")}
                >
                  RPG{" "}
                  {sortKey === "reboundsPerGame" &&
                    (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("assistsPerGame")}
                >
                  APG{" "}
                  {sortKey === "assistsPerGame" &&
                    (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
                <TableHead
                  className="text-center cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort("turnoversPerGame")}
                >
                  TOV{" "}
                  {sortKey === "turnoversPerGame" &&
                    (sortOrder === "desc" ? "↓" : "↑")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.map((team) => {
                const stats = team.teamStats[0];
                return (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">
                      <span className="font-semibold text-primary">
                        {team.abbreviation}
                      </span>
                      <span className="text-muted-foreground ml-2">
                        {team.name}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.wins}-{stats.losses}
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.pointsPerGame.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.offensiveRating?.toFixed(1) || "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.defensiveRating?.toFixed(1) || "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.pace?.toFixed(1) || "N/A"}
                    </TableCell>
                    <TableCell className="text-center">
                      {(stats.fieldGoalPct * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {(stats.threePointPct * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.reboundsPerGame.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.assistsPerGame.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center">
                      {stats.turnoversPerGame.toFixed(1)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {teams && teams.length === 0 && (
        <p className="text-muted-foreground">
          No teams found. Run{" "}
          <code className="bg-muted px-2 py-1 rounded">npm run fetch:nba</code>{" "}
          to import data.
        </p>
      )}
    </div>
  );
}
