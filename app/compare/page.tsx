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
import type { Team } from "@/lib/types/team";
import { Card } from "@/components/ui/card";

async function fetchTeams(): Promise<Team[]> {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error("Failed to fetch teams");
  return response.json();
}

export default function ComparePage() {
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

  return (
    <div className="bg-card rounded-lg shadow-lg p-6 border-t-4 border-accent mb-6">
      <h2 className="text-2xl font-semibold text-foreground mb-6">
        Select Teams to Compare
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">Team 1</label>
          <Select value={team1Id} onValueChange={setTeam1Id}>
            <SelectTrigger>
              <SelectValue placeholder="Select a team" />
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
              <SelectValue placeholder="Select a team" />
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

      {stats1 && stats2 && (
        <>
          {/* Desktop view - 3 columns */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {/* Team 1 Column */}
            <div className="text-right">
              <h3 className="text-xl font-bold text-primary mb-4">
                {team1?.name}
              </h3>
              <div className="space-y-3">
                <div className="text-2xl font-semibold">
                  {stats1.wins}-{stats1.losses}
                </div>
                <div className="text-lg">{stats1.pointsPerGame.toFixed(1)}</div>
                <div className="text-lg">
                  {stats1.offensiveRating?.toFixed(1) || "N/A"}
                </div>
                <div className="text-lg">
                  {stats1.defensiveRating?.toFixed(1) || "N/A"}
                </div>
                <div className="text-lg">
                  {stats1.pace?.toFixed(1) || "N/A"}
                </div>
                <div className="text-lg">
                  {(stats1.fieldGoalPct * 100).toFixed(1)}%
                </div>
                <div className="text-lg">
                  {(stats1.threePointPct * 100).toFixed(1)}%
                </div>
                <div className="text-lg">
                  {stats1.reboundsPerGame.toFixed(1)}
                </div>
                <div className="text-lg">
                  {stats1.assistsPerGame.toFixed(1)}
                </div>
                <div className="text-lg">
                  {stats1.turnoversPerGame.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Labels Column */}
            <div className="text-center">
              <h3 className="text-xl font-bold text-muted-foreground mb-4">
                Stats
              </h3>
              <div className="space-y-3 text-muted-foreground font-medium">
                <div className="text-lg">Record</div>
                <div className="text-lg">PPG</div>
                <div className="text-lg">Offensive Rating</div>
                <div className="text-lg">Defensive Rating</div>
                <div className="text-lg">Pace</div>
                <div className="text-lg">FG%</div>
                <div className="text-lg">3P%</div>
                <div className="text-lg">Rebounds</div>
                <div className="text-lg">Assists</div>
                <div className="text-lg">Turnovers</div>
              </div>
            </div>

            {/* Team 2 Column */}
            <div className="text-left">
              <h3 className="text-xl font-bold text-primary mb-4">
                {team2?.name}
              </h3>
              <div className="space-y-3">
                <div className="text-2xl font-semibold">
                  {stats2.wins}-{stats2.losses}
                </div>
                <div className="text-lg">{stats2.pointsPerGame.toFixed(1)}</div>
                <div className="text-lg">
                  {stats2.offensiveRating?.toFixed(1) || "N/A"}
                </div>
                <div className="text-lg">
                  {stats2.defensiveRating?.toFixed(1) || "N/A"}
                </div>
                <div className="text-lg">
                  {stats2.pace?.toFixed(1) || "N/A"}
                </div>
                <div className="text-lg">
                  {(stats2.fieldGoalPct * 100).toFixed(1)}%
                </div>
                <div className="text-lg">
                  {(stats2.threePointPct * 100).toFixed(1)}%
                </div>
                <div className="text-lg">
                  {stats2.reboundsPerGame.toFixed(1)}
                </div>
                <div className="text-lg">
                  {stats2.assistsPerGame.toFixed(1)}
                </div>
                <div className="text-lg">
                  {stats2.turnoversPerGame.toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile view - Stacked cards */}
          <div className="md:hidden space-y-6">
            <Card className="p-4">
              <h3 className="text-lg font-bold text-primary mb-4">
                {team1?.name}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Record:</span>{" "}
                  <span className="font-semibold">
                    {stats1.wins}-{stats1.losses}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">PPG:</span>{" "}
                  <span className="font-semibold">
                    {stats1.pointsPerGame.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">ORtg:</span>{" "}
                  <span className="font-semibold">
                    {stats1.offensiveRating?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">DRtg:</span>{" "}
                  <span className="font-semibold">
                    {stats1.defensiveRating?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pace:</span>{" "}
                  <span className="font-semibold">
                    {stats1.pace?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">FG%:</span>{" "}
                  <span className="font-semibold">
                    {(stats1.fieldGoalPct * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">3P%:</span>{" "}
                  <span className="font-semibold">
                    {(stats1.threePointPct * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">RPG:</span>{" "}
                  <span className="font-semibold">
                    {stats1.reboundsPerGame.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">APG:</span>{" "}
                  <span className="font-semibold">
                    {stats1.assistsPerGame.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">TOV:</span>{" "}
                  <span className="font-semibold">
                    {stats1.turnoversPerGame.toFixed(1)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-bold text-primary mb-4">
                {team2?.name}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Record:</span>{" "}
                  <span className="font-semibold">
                    {stats2.wins}-{stats2.losses}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">PPG:</span>{" "}
                  <span className="font-semibold">
                    {stats2.pointsPerGame.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">ORtg:</span>{" "}
                  <span className="font-semibold">
                    {stats2.offensiveRating?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">DRtg:</span>{" "}
                  <span className="font-semibold">
                    {stats2.defensiveRating?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Pace:</span>{" "}
                  <span className="font-semibold">
                    {stats2.pace?.toFixed(1) || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">FG%:</span>{" "}
                  <span className="font-semibold">
                    {(stats2.fieldGoalPct * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">3P%:</span>{" "}
                  <span className="font-semibold">
                    {(stats2.threePointPct * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">RPG:</span>{" "}
                  <span className="font-semibold">
                    {stats2.reboundsPerGame.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">APG:</span>{" "}
                  <span className="font-semibold">
                    {stats2.assistsPerGame.toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">TOV:</span>{" "}
                  <span className="font-semibold">
                    {stats2.turnoversPerGame.toFixed(1)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {(!team1Id || !team2Id) && (
        <p className="text-center text-muted-foreground">
          Select two teams to compare their stats
        </p>
      )}
    </div>
  );
}
