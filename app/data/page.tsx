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

export default function DataPage() {
  const [selectedSeason, setSelectedSeason] = useState<string>("2025-26");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [isLoadingToday, setIsLoadingToday] = useState(false);

  const seasons = getSeasonOptions();

  const handleFetchTeams = async () => {
    setIsLoadingTeams(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/fetch-nba-teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ season: selectedSeason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      setStatus("success");
      setMessage(
        `Successfully imported ${data.teamsCount} teams for ${selectedSeason} season`
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const handleFetchGames = async () => {
    setIsLoadingGames(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/fetch-nba-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ season: selectedSeason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch games");
      }

      setStatus("success");
      setMessage(
        `Successfully imported ${data.gamesCount} games for ${selectedSeason} season`
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoadingGames(false);
    }
  };

  const handleFetchToday = async () => {
    setIsLoadingToday(true);
    setStatus("idle");
    setMessage("");

    try {
      const response = await fetch("/api/fetch-todays-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ season: selectedSeason }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch today's games");
      }

      setStatus("success");
      setMessage(`Successfully updated ${data.gamesCount} games for today`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoadingToday(false);
    }
  };

  return (
    <Card className="p-6 border-t-4 border-accent mb-4">
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Data Management
      </h2>

      <div className="space-y-6">
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

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleFetchTeams}
            disabled={isLoadingTeams || isLoadingGames}
            className="w-full sm:w-auto sm:min-w-50"
          >
            {isLoadingTeams ? (
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
            onClick={handleFetchGames}
            disabled={isLoadingTeams || isLoadingGames}
            className="w-full sm:w-auto sm:min-w-50"
            variant="outline"
          >
            {isLoadingGames ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Games...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Fetch Seasons Games
              </>
            )}
          </Button>

          <Button
            onClick={handleFetchToday}
            disabled={isLoadingTeams || isLoadingGames || isLoadingToday}
            className="w-full sm:w-auto sm:min-w-50"
            variant="secondary"
          >
            {isLoadingToday ? (
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

        {status !== "idle" && (
          <div
            className={`p-4 rounded-lg flex items-start gap-3 ${
              status === "success"
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm">{message}</p>
          </div>
        )}

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
