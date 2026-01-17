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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { Team } from "@/lib/types/team";
import { useSearchParams } from "next/navigation";
import { EnhancedMatchupPrediction } from "@/components/enhanced-matchup-prediction";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchTeams(): Promise<Team[]> {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error("Failed to fetch teams");
  return response.json();
}

async function fetchEnhancedMatchup(
  teamAId: string,
  teamBId: string,
  isTeamAHome: boolean,
  season: string = "2025-26",
) {
  const response = await fetch("/api/matchup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teamAId,
      teamBId,
      isTeamAHome,
      season,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch matchup prediction");
  }

  return response.json();
}

function MatchupContent() {
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });

  const searchParams = useSearchParams();
  const [awayTeamId, setAwayTeamId] = useState<string>(
    searchParams.get("awayTeamId") || "",
  );
  const [homeTeamId, setHomeTeamId] = useState<string>(
    searchParams.get("homeTeamId") || "",
  );
  const [isTeam1Home, setIsTeam1Home] = useState<boolean>(() => {
    const hasHome = searchParams.get("homeTeamId");
    const hasAway = searchParams.get("awayTeamId");

    // If both are present, team1 (away) is NOT home
    if (hasHome && hasAway) return false;

    // Fallback default
    return true;
  });

  const team1 = teams?.find((t) => t.id.toString() === awayTeamId);
  const team2 = teams?.find((t) => t.id.toString() === homeTeamId);

  // Fetch enhanced matchup prediction
  const {
    data: matchupData,
    isLoading: matchupLoading,
    error: matchupError,
  } = useQuery({
    queryKey: ["enhanced-matchup", awayTeamId, homeTeamId, isTeam1Home],
    queryFn: () => fetchEnhancedMatchup(awayTeamId, homeTeamId, isTeam1Home),
    enabled: !!awayTeamId && !!homeTeamId,
  });

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-card rounded-lg shadow-lg p-6 border-t-4 border-accent">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Enhanced Matchup Analyzer
        </h2>
        <p className="text-sm text-muted-foreground">
          Advanced predictions using Pythagorean expectations, home court
          advantage, and confidence scoring
        </p>
      </div>

      {/* Team Selection Card */}
      <div className="bg-card rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Select Teams
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Team 1 */}
          <div>
            <label className="block text-sm font-medium mb-2">Team 1</label>
            <Select value={awayTeamId} onValueChange={setAwayTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select first team" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={5}
                className="max-h-[300px]"
              >
                {teamsLoading ? (
                  <div className="p-2">Loading teams...</div>
                ) : (
                  teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.abbreviation} - {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Team 2 */}
          <div>
            <label className="block text-sm font-medium mb-2">Team 2</label>
            <Select value={homeTeamId} onValueChange={setHomeTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select second team" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={5}
                className="max-h-[300px]"
              >
                {teamsLoading ? (
                  <div className="p-2">Loading teams...</div>
                ) : (
                  teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.abbreviation} - {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Home Team Toggle */}
        {team1 && team2 && (
          <div className="flex items-center justify-center space-x-4 p-4 bg-muted/50 rounded-lg">
            <Label
              htmlFor="home-team-toggle"
              className={`cursor-pointer transition-colors ${
                isTeam1Home
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {team1.abbreviation} at home
            </Label>
            <Switch
              id="home-team-toggle"
              checked={!isTeam1Home}
              onCheckedChange={(checked) => setIsTeam1Home(!checked)}
            />
            <Label
              htmlFor="home-team-toggle"
              className={`cursor-pointer transition-colors ${
                !isTeam1Home
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              {team2.abbreviation} at home
            </Label>
          </div>
        )}
      </div>

      {/* Enhanced Prediction Display */}
      {matchupLoading && awayTeamId && homeTeamId && (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      )}

      {matchupError && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
          <p className="text-destructive font-semibold">
            Error loading matchup prediction
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {matchupError instanceof Error
              ? matchupError.message
              : "Please try again"}
          </p>
        </div>
      )}

      {matchupData && !matchupLoading && !matchupError && (
        <EnhancedMatchupPrediction
          prediction={matchupData.prediction}
          teamA={matchupData.teamA}
          teamB={matchupData.teamB}
          isTeamAHome={matchupData.isTeamAHome}
        />
      )}

      {/* Placeholder when no teams selected */}
      {(!awayTeamId || !homeTeamId) && !matchupLoading && (
        <div className="bg-card rounded-lg shadow-lg p-12 text-center">
          <p className="text-muted-foreground text-lg">
            Select two teams above to see enhanced matchup analysis
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Featuring Pythagorean expectations, home court advantage, and
            confidence levels
          </p>
        </div>
      )}
    </div>
  );
}

export default function MatchupPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <MatchupContent />
    </Suspense>
  );
}
