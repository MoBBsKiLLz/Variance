"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Team } from "@/lib/types/team";
import { Header } from '@/components/header';

async function fetchTeams(): Promise<Team[]> {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error("Failed to fetch teams");
  return response.json();
}

export default function MatchupPage() {
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  const [team1Id, setTeam1Id] = useState<string>("");
  const [team2Id, setTeam2Id] = useState<string>("");

  const team1 = teams?.find((t) => t.id.toString() === team1Id);
  const team2 = teams?.find((t) => t.id.toString() === team2Id);

  const stats1 = team1?.teamStats[0];
  const stats2 = team2?.teamStats[0];

  // Matchup analysis calculations
  const getMatchupAdvantage = () => {
    if (
      !stats1 ||
      !stats2 ||
      !stats1.offensiveRating ||
      !stats1.defensiveRating ||
      !stats2.offensiveRating ||
      !stats2.defensiveRating
    ) {
      return null;
    }

    // Team 1 offense vs Team 2 defense
    const team1OffenseAdvantage =
      stats1.offensiveRating - stats2.defensiveRating;

    // Team 2 offense vs Team 1 defense
    const team2OffenseAdvantage =
      stats2.offensiveRating - stats1.defensiveRating;

    // Net rating difference
    const team1NetRating = stats1.offensiveRating - stats1.defensiveRating;
    const team2NetRating = stats2.offensiveRating - stats2.defensiveRating;
    const netRatingDiff = team1NetRating - team2NetRating;

    // Pace differential
    const paceDiff =
      stats1.pace && stats2.pace ? Math.abs(stats1.pace - stats2.pace) : 0;

    return {
      team1OffenseAdvantage,
      team2OffenseAdvantage,
      netRatingDiff,
      paceDiff,
      predictedWinner: netRatingDiff > 0 ? team1 : team2,
      confidence: Math.abs(netRatingDiff),
    };
  };

  const matchup = getMatchupAdvantage();

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Header />

        <div className="bg-card rounded-lg shadow-lg p-6 border-t-4 border-accent mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Analyze Head-to-Head Matchup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">Team 1</label>
              <Select value={team1Id} onValueChange={setTeam1Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first team" />
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

            <div>
              <label className="block text-sm font-medium mb-2">Team 2</label>
              <Select value={team2Id} onValueChange={setTeam2Id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second team" />
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
          </div>

          {matchup && stats1 && stats2 && (
            <div className="space-y-6">
              {/* Prediction */}
              <div className="bg-muted p-6 rounded-lg text-center">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Predicted Winner
                </h3>
                <p className="text-3xl font-bold text-primary">
                  {matchup.predictedWinner?.name}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Confidence: {matchup.confidence.toFixed(1)} point net rating
                  advantage
                </p>
              </div>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Offensive Matchups */}
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-4">
                    Offensive Matchups
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {team1?.abbreviation} Offense vs {team2?.abbreviation}{" "}
                          Defense
                        </span>
                        <span
                          className={
                            matchup.team1OffenseAdvantage > 0
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {matchup.team1OffenseAdvantage > 0 ? "+" : ""}
                          {matchup.team1OffenseAdvantage.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats1.offensiveRating?.toFixed(1)} ORtg vs{" "}
                        {stats2.defensiveRating?.toFixed(1)} DRtg
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {team2?.abbreviation} Offense vs {team1?.abbreviation}{" "}
                          Defense
                        </span>
                        <span
                          className={
                            matchup.team2OffenseAdvantage > 0
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {matchup.team2OffenseAdvantage > 0 ? "+" : ""}
                          {matchup.team2OffenseAdvantage.toFixed(1)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats2.offensiveRating?.toFixed(1)} ORtg vs{" "}
                        {stats1.defensiveRating?.toFixed(1)} DRtg
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team Ratings */}
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-4">
                    Net Ratings
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {team1?.abbreviation} Net Rating
                        </span>
                        <span className="font-semibold">
                          {stats1.offensiveRating && stats1.defensiveRating
                            ? (
                                stats1.offensiveRating - stats1.defensiveRating
                              ).toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats1.offensiveRating?.toFixed(1)} ORtg -{" "}
                        {stats1.defensiveRating?.toFixed(1)} DRtg
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">
                          {team2?.abbreviation} Net Rating
                        </span>
                        <span className="font-semibold">
                          {stats2.offensiveRating && stats2.defensiveRating
                            ? (
                                stats2.offensiveRating - stats2.defensiveRating
                              ).toFixed(1)
                            : "N/A"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stats2.offensiveRating?.toFixed(1)} ORtg -{" "}
                        {stats2.defensiveRating?.toFixed(1)} DRtg
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pace Analysis */}
              {stats1.pace && stats2.pace && (
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">
                    Pace Analysis
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {team1?.abbreviation}: {stats1.pace.toFixed(1)}{" "}
                    possessions/game | {team2?.abbreviation}:{" "}
                    {stats2.pace.toFixed(1)} possessions/game
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pace differential: {matchup.paceDiff.toFixed(1)} possessions
                    {matchup.paceDiff > 2 &&
                      " (Significant difference - expect pace to favor faster team)"}
                  </p>
                </div>
              )}

              {/* Key Insights */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">
                  Key Insights
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    •{" "}
                    {matchup.team1OffenseAdvantage >
                    matchup.team2OffenseAdvantage
                      ? `${team1?.abbreviation} has the better offensive matchup advantage`
                      : `${team2?.abbreviation} has the better offensive matchup advantage`}
                  </li>
                  <li>
                    • Net rating favors {matchup.predictedWinner?.abbreviation}{" "}
                    by {matchup.confidence.toFixed(1)} points
                  </li>
                  {stats1.pace && stats2.pace && matchup.paceDiff > 2 && (
                    <li>
                      • Pace advantage to{" "}
                      {stats1.pace > stats2.pace
                        ? team1?.abbreviation
                        : team2?.abbreviation}{" "}
                      (faster tempo)
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {(!team1Id || !team2Id) && (
            <p className="text-center text-muted-foreground">
              Select two teams to analyze their matchup
            </p>
          )}
        </div>

        <Link href="/">
          <Button variant="outline">← Back to all teams</Button>
        </Link>
      </div>
    </div>
  );
}
