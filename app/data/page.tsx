"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { getSeasonOptions } from "@/lib/constants/nba";
import {
  useFetchTeams,
  useFetchGames,
  useFetchTodaysGames,
} from "@/hooks/use-fetch-nba-data";

/**
 * Data Management Page
 * Allows manual data fetching for teams, games, and today's games
 * 
 * Following principles:
 * - DRY: Reusable custom hooks
 * - Type Safety: Proper TypeScript types
 * - Component Organization: Clean, focused component
 */
export default function DataPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("2025-26");
  const seasons = getSeasonOptions();

  // Custom hooks for data fetching (DRY principle)
  const teams = useFetchTeams(selectedSeason);
  const games = useFetchGames(selectedSeason);
  const todaysGames = useFetchTodaysGames(selectedSeason);

  // Determine which status/message to show (priority: teams > games > today)
  const activeStatus =
    teams.status !== "idle"
      ? teams
      : games.status !== "idle"
      ? games
      : todaysGames;

  const isAnyLoading = teams.isLoading || games.isLoading || todaysGames.isLoading;

  return (
    <Card className="p-6 border-t-4 border-accent mb-4">
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Data Management
      </h2>

      <div className="space-y-6">
        {/* Season Selector */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Select Season
          </label>
          <Select value={selectedSeason} onValueChange={setSelectedSeason}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Select a season" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={5}
              className="max-h-75"
            >
              {seasons.map((season) => (
                <SelectItem key={season} value={season}>
                  {season} Season
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={teams.fetchData}
            disabled={isAnyLoading}
            className="w-full sm:w-auto sm:min-w-50"
          >
            {teams.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Teams...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Fetch Team Stats
              </>
            )}
          </Button>

          <Button
            onClick={games.fetchData}
            disabled={isAnyLoading}
            className="w-full sm:w-auto sm:min-w-50"
            variant="outline"
          >
            {games.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Games...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Fetch Season Games
              </>
            )}
          </Button>

          <Button
            onClick={todaysGames.fetchData}
            disabled={isAnyLoading}
            className="w-full sm:w-auto sm:min-w-50"
            variant="secondary"
          >
            {todaysGames.isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Today...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Fetch Today&apos;s Games
              </>
            )}
          </Button>
        </div>

        {/* Status Message */}
        {activeStatus.status !== "idle" && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              activeStatus.status === "success"
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {activeStatus.status === "success" ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm">{activeStatus.message}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="pt-4 border-t">
          <h3 className="font-semibold mb-2">How it works:</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Select the NBA season you want to import</li>
            <li>
              Click &quot;Fetch Team Stats&quot; to retrieve team statistics
            </li>
            <li>
              Click &quot;Fetch Season Games&quot; to retrieve all season games
              (historical)
            </li>
            <li>
              Click &quot;Fetch Today&apos;s Games&quot; to update today&apos;s
              scheduled/live games
            </li>
            <li>Previous data for the selected season will be updated</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}