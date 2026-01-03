"use client";

import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Team } from "@/lib/types/team";
import {
  calculateMatchupHistory,
  adjustPredictionWithHistory,
  calculateHomeCourtAdvantage,
} from "@/lib/utils/matchup-calculator";
import {
  calculateWeightedRatings,
  getFormDescription,
} from "@/lib/utils/weighted-prediction";
import { useSearchParams } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

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

  const searchParams = useSearchParams();
  const [team1Id, setTeam1Id] = useState<string>(
    searchParams.get("team1") || ""
  );
  const [team2Id, setTeam2Id] = useState<string>(
    searchParams.get("team2") || ""
  );
  const [homeTeam, setHomeTeam] = useState<"team1" | "team2" | "neutral">(
    (searchParams.get("home") as "team1" | "team2" | "neutral") || "neutral"
  );

  const team1 = teams?.find((t) => t.id.toString() === team1Id);
  const team2 = teams?.find((t) => t.id.toString() === team2Id);

  const stats1 = team1?.teamStats[0];
  const stats2 = team2?.teamStats[0];

  const { data: h2hGames } = useQuery({
    queryKey: ["head-to-head", team1Id, team2Id],
    queryFn: async () => {
      if (!team1Id || !team2Id) return [];
      const response = await fetch(
        `/api/head-to-head?team1Id=${team1Id}&team2Id=${team2Id}&season=2025-26`
      );
      if (!response.ok) throw new Error("Failed to fetch head-to-head games");
      return response.json();
    },
    enabled: !!team1Id && !!team2Id,
  });

  const { data: team1RecentForm } = useQuery({
    queryKey: ["recent-form", team1Id],
    queryFn: async () => {
      if (!team1Id) return null;
      const response = await fetch(
        `/api/recent-games?teamId=${team1Id}&limit=10&season=2025-26`
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.recentForm;
    },
    enabled: !!team1Id,
  });

  const { data: team2RecentForm } = useQuery({
    queryKey: ["recent-form", team2Id],
    queryFn: async () => {
      if (!team2Id) return null;
      const response = await fetch(
        `/api/recent-games?teamId=${team2Id}&limit=10&season=2025-26`
      );
      if (!response.ok) return null;
      const data = await response.json();
      return data.recentForm;
    },
    enabled: !!team2Id,
  });

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

    // Calculate weighted ratings based on recent form
    const team1Weighted = calculateWeightedRatings(
      {
        offensiveRating: stats1.offensiveRating,
        defensiveRating: stats1.defensiveRating,
        wins: stats1.wins,
        losses: stats1.losses,
      },
      team1RecentForm
    );

    const team2Weighted = calculateWeightedRatings(
      {
        offensiveRating: stats2.offensiveRating,
        defensiveRating: stats2.defensiveRating,
        wins: stats2.wins,
        losses: stats2.losses,
      },
      team2RecentForm
    );

    // Use weighted ratings instead of raw season ratings
    const team1OffenseAdvantage =
      team1Weighted.weightedOffensiveRating -
      team2Weighted.weightedDefensiveRating;
    const team2OffenseAdvantage =
      team2Weighted.weightedOffensiveRating -
      team1Weighted.weightedDefensiveRating;

    const team1NetRating =
      team1Weighted.weightedOffensiveRating -
      team1Weighted.weightedDefensiveRating;
    const team2NetRating =
      team2Weighted.weightedOffensiveRating -
      team2Weighted.weightedDefensiveRating;
    const baseNetRatingDiff = team1NetRating - team2NetRating;

    // Rest of the function stays the same...
    const matchupHistory = h2hGames
      ? calculateMatchupHistory(parseInt(team1Id), parseInt(team2Id), h2hGames)
      : null;

    const adjusted = matchupHistory
      ? adjustPredictionWithHistory(baseNetRatingDiff, matchupHistory)
      : null;

    const homeCourtAdv = calculateHomeCourtAdvantage(
      homeTeam === "team1" ? true : homeTeam === "team2" ? false : null,
      { wins: stats1.wins, losses: stats1.losses },
      { wins: stats2.wins, losses: stats2.losses }
    );

    const finalNetRatingDiff =
      (adjusted?.adjustedNetRatingDiff || baseNetRatingDiff) +
      homeCourtAdv.adjustment;
    const paceDiff =
      stats1.pace && stats2.pace ? Math.abs(stats1.pace - stats2.pace) : 0;

    return {
      team1OffenseAdvantage,
      team2OffenseAdvantage,
      baseNetRatingDiff,
      adjustedNetRatingDiff:
        adjusted?.adjustedNetRatingDiff || baseNetRatingDiff,
      adjustmentAmount: adjusted?.adjustmentAmount || 0,
      homeCourtAdjustment: homeCourtAdv.adjustment,
      homeCourtDescription: homeCourtAdv.description,
      finalNetRatingDiff,
      matchupHistory,
      historicalContext: adjusted?.historicalContext || "No historical data",
      paceDiff,
      predictedWinner: finalNetRatingDiff > 0 ? team1 : team2,
      confidence: Math.abs(finalNetRatingDiff),
      team1Form: team1Weighted.formTrend,
      team2Form: team2Weighted.formTrend,
      team1FormDescription: getFormDescription(
        team1RecentForm,
        team1Weighted.formTrend
      ),
      team2FormDescription: getFormDescription(
        team2RecentForm,
        team2Weighted.formTrend
      ),
    };
  };

  const matchup = getMatchupAdvantage();

  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <div className="bg-card rounded-lg shadow-lg p-6 border-t-4 border-accent mb-6">
        <h2 className="text-2xl font-semibold text-foreground mb-6">
          Analyze Head-to-Head Matchup
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

        <div className="md:col-span-2 mb-6">
          <label className="block text-sm font-medium mb-2">Home Court</label>
          <Select
            value={homeTeam}
            onValueChange={(value: "team1" | "team2" | "neutral") =>
              setHomeTeam(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select home team" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={5}
              className="max-h-75"
            >
              <SelectItem value="neutral">Neutral Court</SelectItem>
              <SelectItem value="team1">
                {team1?.abbreviation || "Team 1"} (Home)
              </SelectItem>
              <SelectItem value="team2">
                {team2?.abbreviation || "Team 2"} (Home)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {matchup && stats1 && stats2 && (
          <div className="space-y-6">
            {/* Prediction */}
            <div className="bg-muted p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-muted-foreground mb-2 flex items-center justify-center gap-2">
                Predicted Winner
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">
                      Prediction based on net rating difference (Offensive
                      Rating - Defensive Rating). Higher is better. Even
                      negative numbers can win if opponent is worse.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </h3>
              <p className="text-3xl font-bold text-primary">
                {matchup.predictedWinner?.name}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Net Rating: {matchup.finalNetRatingDiff.toFixed(1)} pts
                {matchup.finalNetRatingDiff > 0
                  ? " advantage"
                  : matchup.finalNetRatingDiff < 0
                  ? " (less negative)"
                  : ""}
              </p>
              {/* Add confidence level context */}
              <p className="text-xs text-muted-foreground mt-1">
                {Math.abs(matchup.finalNetRatingDiff) >= 10 &&
                  "🔥 High confidence"}
                {Math.abs(matchup.finalNetRatingDiff) >= 5 &&
                  Math.abs(matchup.finalNetRatingDiff) < 10 &&
                  "✓ Strong advantage"}
                {Math.abs(matchup.finalNetRatingDiff) >= 2 &&
                  Math.abs(matchup.finalNetRatingDiff) < 5 &&
                  "⚡ Moderate edge"}
                {Math.abs(matchup.finalNetRatingDiff) < 2 &&
                  "🤝 Close game - Toss-up"}
              </p>
              {matchup.homeCourtAdjustment !== 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {matchup.homeCourtDescription}
                </p>
              )}
            </div>

            {/* Recent Form Section */}
            {matchup && (team1RecentForm || team2RecentForm) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team1RecentForm && (
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">
                      {team1?.abbreviation} Recent Form
                    </h4>
                    <p className="text-sm mb-2">
                      {matchup.team1FormDescription}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        Avg: {team1RecentForm.avgPointsScored.toFixed(1)} pts
                        scored, {team1RecentForm.avgPointsAllowed.toFixed(1)}{" "}
                        allowed
                      </div>
                      {team1RecentForm.recentOffensiveRating && (
                        <div>
                          ORtg:{" "}
                          {team1RecentForm.recentOffensiveRating.toFixed(1)} |
                          DRtg:{" "}
                          {team1RecentForm.recentDefensiveRating?.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {team2RecentForm && (
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">
                      {team2?.abbreviation} Recent Form
                    </h4>
                    <p className="text-sm mb-2">
                      {matchup.team2FormDescription}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        Avg: {team2RecentForm.avgPointsScored.toFixed(1)} pts
                        scored, {team2RecentForm.avgPointsAllowed.toFixed(1)}{" "}
                        allowed
                      </div>
                      {team2RecentForm.recentOffensiveRating && (
                        <div>
                          ORtg:{" "}
                          {team2RecentForm.recentOffensiveRating.toFixed(1)} |
                          DRtg:{" "}
                          {team2RecentForm.recentDefensiveRating?.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Historical Matchup Section */}
            {matchup?.matchupHistory &&
              matchup.matchupHistory.gamesPlayed > 0 && (
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-semibold text-foreground mb-2">
                    Season Series: {matchup.historicalContext}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                      <span className="text-muted-foreground">
                        Games Played:
                      </span>
                      <div className="font-semibold">
                        {matchup.matchupHistory.gamesPlayed}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Record:</span>
                      <div className="font-semibold">
                        {matchup.matchupHistory.team1Wins}-
                        {matchup.matchupHistory.team2Wins}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Avg Point Diff:
                      </span>
                      <div
                        className={`font-semibold ${
                          matchup.matchupHistory.avgPointDifferential > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {matchup.matchupHistory.avgPointDifferential > 0
                          ? "+"
                          : ""}
                        {matchup.matchupHistory.avgPointDifferential.toFixed(1)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Adjustment:</span>
                      <div
                        className={`font-semibold ${
                          matchup.adjustmentAmount > 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {matchup.adjustmentAmount > 0 ? "+" : ""}
                        {matchup.adjustmentAmount.toFixed(1)} pts
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                  {matchup.team1OffenseAdvantage > matchup.team2OffenseAdvantage
                    ? `${team1?.abbreviation} has the better offensive matchup advantage`
                    : `${team2?.abbreviation} has the better offensive matchup advantage`}
                </li>
                <li>
                  • Net rating favors {matchup.predictedWinner?.abbreviation} by{" "}
                  {matchup.confidence.toFixed(1)} points
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
    </Suspense>
  );
}
