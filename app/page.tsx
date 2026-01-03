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
import { useEffect, useState } from "react";
import type { Team } from "@/lib/types/team";
import { Card } from "@/components/ui/card";
import { TodaysGame } from "@/lib/types/nba-data";
import { Button } from "@/components/ui/button";
import { Target, Scale } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    refetchInterval: 2 * 60 * 60 * 1000, // Refetch every 2 hours (in milliseconds)
    refetchIntervalInBackground: false, // Only refetch when tab is active
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

  const { data: todaysGames, isLoading: gamesLoading } = useQuery({
    queryKey: ["todays-games"],
    queryFn: async () => {
      const response = await fetch("/api/todays-games");
      if (!response.ok) throw new Error("Failed to fetch games");
      return response.json();
    },
    refetchInterval: 30000,
    enabled: process.env.NODE_ENV === "development",
  });

  // Add this useEffect in app/page.tsx
  useEffect(() => {
    const refreshData = async () => {
      try {
        await fetch("/api/fetch-nba-teams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ season: "2025-26" }),
        });
        console.log("Data refreshed");
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    };

    // Run immediately on mount
    refreshData();

    // Then every 2 hours
    const interval = setInterval(refreshData, 2 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Today's Games Section */}
      {todaysGames && todaysGames.length > 0 && (
        <TooltipProvider>
          <Card className="p-6 border-t-4 border-accent mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-foreground">
                Today&apos;s Games{" "}
                {todaysGames.length > 0 && `(${todaysGames.length})`}
              </h2>
              <span className="text-xs text-muted-foreground">
                Scores shown when final
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todaysGames.map((game: TodaysGame) => {
                return (
                  <Card
                    key={game.gameId}
                    className={`p-4 hover:shadow-md transition-shadow ${
                      game.isFinal ? "border-l-4 border-l-green-500" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Away Team */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-semibold text-primary">
                            {game.awayTeam?.abbreviation}
                          </span>
                          <span className="text-sm text-muted-foreground hidden sm:inline">
                            {game.awayTeam?.name}
                          </span>
                        </div>
                        {game.isFinal && game.awayScore !== null && (
                          <span className="text-2xl font-bold ml-2">
                            {game.awayScore}
                          </span>
                        )}
                      </div>

                      {/* Home Team */}
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-semibold text-primary">
                            {game.homeTeam?.abbreviation}
                          </span>
                          <span className="text-sm text-muted-foreground hidden sm:inline">
                            {game.homeTeam?.name}
                          </span>
                        </div>
                        {game.isFinal && game.homeScore !== null && (
                          <span className="text-2xl font-bold ml-2">
                            {game.homeScore}
                          </span>
                        )}
                      </div>

                      {/* Status/Time */}
                      <div className="text-center pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          {new Date(game.gameDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })}{" "}
                          • {game.isFinal ? "✅ Final" : game.gameTime}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/compare?team1=${game.awayTeam?.id}&team2=${game.homeTeam?.id}`}
                              className="flex-1"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Scale className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Compare Teams</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={`/matchup?team1=${game.awayTeam?.id}&team2=${game.homeTeam?.id}&home=team2`}
                              className="flex-1"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full"
                              >
                                <Target className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Analyze Matchup</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        </TooltipProvider>
      )}

      {!gamesLoading && (!todaysGames || todaysGames.length === 0) && (
        <Card className="p-6 border-t-4 border-accent mb-6">
          <p className="text-muted-foreground text-center">
            No games scheduled or in progress today
          </p>
        </Card>
      )}

      {gamesLoading && (
        <Card className="p-6 border-t-4 border-accent mb-6">
          <p className="text-muted-foreground text-center">
            Loading today&apos;s games...
          </p>
        </Card>
      )}

      {/* Team Stats Card */}
      <Card className="p-6 border-t-4 border-accent">
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
                    W-L{" "}
                    {sortKey === "wins" && (sortOrder === "desc" ? "↓" : "↑")}
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
            <code className="bg-muted px-2 py-1 rounded">
              npm run fetch:nba
            </code>{" "}
            to import data.
          </p>
        )}
      </Card>
    </>
  );
}
