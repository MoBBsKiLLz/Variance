/**
 * Enhanced Matchup Analyzer Component
 * 
 * New features:
 * - Pythagorean expectations display
 * - Home court advantage indicator
 * - Confidence level badges
 * - Key insights cards
 * - Component breakdown visualization
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, TrendingUp, TrendingDown, AlertCircle, Target } from 'lucide-react';

interface MatchupPredictionProps {
  prediction: {
    teamAWinProbability: number;
    teamBWinProbability: number;
    confidence: 'high' | 'medium' | 'low';
    confidenceScore: number;
    components: {
      base: number;
      homeAdvantage: number;
      fourFactors?: number;
    };
    keyInsights: string[];
  };
  teamA: {
    name: string;
    abbreviation: string;
    record: string;
    homeRecord: string;
    awayRecord: string;
    offensiveRating?: number | null;
    defensiveRating?: number | null;
    pythagoreanWinPct?: number | null;
    luckFactor?: number | null;
  };
  teamB: {
    name: string;
    abbreviation: string;
    record: string;
    homeRecord: string;
    awayRecord: string;
    offensiveRating?: number | null;
    defensiveRating?: number | null;
    pythagoreanWinPct?: number | null;
    luckFactor?: number | null;
  };
  isTeamAHome?: boolean;
}

export function EnhancedMatchupPrediction({ 
  prediction, 
  teamA, 
  teamB, 
  isTeamAHome = true 
}: MatchupPredictionProps) {
  const getConfidenceBadgeVariant = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  
  const getLuckFactorIcon = (luckFactor: number | null | undefined) => {
    if (!luckFactor) return null;
    if (luckFactor > 0.05) return <TrendingDown className="h-4 w-4 text-yellow-500" />;
    if (luckFactor < -0.05) return <TrendingUp className="h-4 w-4 text-green-500" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Main Prediction Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Matchup Prediction</CardTitle>
            <Badge variant={getConfidenceBadgeVariant(prediction.confidence)}>
              {prediction.confidence.toUpperCase()} Confidence ({prediction.confidenceScore})
            </Badge>
          </div>
          <CardDescription>
            Enhanced prediction with Pythagorean expectations and home court advantage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Win Probability */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{teamA.abbreviation}</span>
                {isTeamAHome && <Home className="h-4 w-4 text-blue-500" />}
              </div>
              <span className="text-2xl font-bold text-primary">
                {formatPercentage(prediction.teamAWinProbability)}
              </span>
            </div>
            <Progress value={prediction.teamAWinProbability} className="h-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{teamB.abbreviation}</span>
                {!isTeamAHome && <Home className="h-4 w-4 text-blue-500" />}
              </div>
              <span className="text-2xl font-bold text-primary">
                {formatPercentage(prediction.teamBWinProbability)}
              </span>
            </div>
          </div>

          {/* Component Breakdown */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Prediction Components
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Base Rating:</span>
                <span className="ml-2 font-medium">{formatPercentage(prediction.components.base)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Home Advantage:</span>
                <span className="ml-2 font-medium">
                  {prediction.components.homeAdvantage > 0 ? '+' : ''}
                  {formatPercentage(prediction.components.homeAdvantage)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Statistics Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Team A Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              {teamA.name}
              {isTeamAHome && <Home className="h-5 w-5 text-blue-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Record:</span>
              <span className="font-medium">{teamA.record}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Home/Away:</span>
              <span className="font-medium">{teamA.homeRecord} / {teamA.awayRecord}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Offensive Rating:</span>
              <span className="font-medium">{teamA.offensiveRating?.toFixed(1) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Defensive Rating:</span>
              <span className="font-medium">{teamA.defensiveRating?.toFixed(1) || 'N/A'}</span>
            </div>
            {teamA.pythagoreanWinPct && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pythagorean Win %:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatPercentage(teamA.pythagoreanWinPct * 100)}
                  </span>
                  {getLuckFactorIcon(teamA.luckFactor)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team B Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              {teamB.name}
              {!isTeamAHome && <Home className="h-5 w-5 text-blue-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Record:</span>
              <span className="font-medium">{teamB.record}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Home/Away:</span>
              <span className="font-medium">{teamB.homeRecord} / {teamB.awayRecord}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Offensive Rating:</span>
              <span className="font-medium">{teamB.offensiveRating?.toFixed(1) || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Defensive Rating:</span>
              <span className="font-medium">{teamB.defensiveRating?.toFixed(1) || 'N/A'}</span>
            </div>
            {teamB.pythagoreanWinPct && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pythagorean Win %:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatPercentage(teamB.pythagoreanWinPct * 100)}
                  </span>
                  {getLuckFactorIcon(teamB.luckFactor)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      {prediction.keyInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {prediction.keyInsights.map((insight, index) => (
                <Alert key={index}>
                  <AlertDescription>{insight}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Algorithm Info */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground text-center">
            Enhanced prediction using Pythagorean expectations (70%), home court advantage (15%), 
            and contextual factors (15%). Confidence based on rating differential and sample size.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}