import { Card, CardContent } from "@/components/ui/card";
import { Moon, Sun, Bed, Percent } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SleepMetrics } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

interface SummaryCardsProps {
  metrics: SleepMetrics;
}

export function SummaryCards({ metrics }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* Total Sleep Card */}
      <Card className="border-l-4 border-[#8b5cf6]">
        <CardContent className="pt-4">
          <h2 className="text-sm font-medium text-slate-500 mb-1">Загальний сон за день</h2>
          <div className="flex items-center space-x-2">
            <Moon className="h-4 w-4 text-[#8b5cf6]" />
            <span className="text-xl font-semibold">{metrics.totalSleep}</span>
          </div>
          
          {/* Sleep Completion Progress */}
          {metrics.sleepCompletionPercentage !== undefined && metrics.requiredSleepMinutes && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Від необхідного</span>
                <span className="font-semibold flex items-center">
                  <Percent className="h-3 w-3 mr-1" />
                  {metrics.sleepCompletionPercentage}%
                </span>
              </div>
              <Progress 
                value={metrics.sleepCompletionPercentage} 
                className={`h-2 ${metrics.sleepCompletionPercentage >= 100 ? "bg-green-500/20" : "bg-[#8b5cf6]/20"}`}
                style={{
                  "--progress-foreground": metrics.sleepCompletionPercentage >= 100 ? "rgb(34 197 94)" : "#8b5cf6"
                } as React.CSSProperties}
              />
              <div className="text-xs text-muted-foreground mt-1">
                Ціль: {formatDuration(metrics.requiredSleepMinutes)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Awake Card */}
      <Card className="border-l-4 border-[#f97316]">
        <CardContent className="pt-4">
          <h2 className="text-sm font-medium text-slate-500 mb-1">Час бадьорості</h2>
          <div className="flex items-center space-x-2">
            <Sun className="h-4 w-4 text-[#f97316]" />
            <span className="text-xl font-semibold">{metrics.totalAwake}</span>
          </div>
        </CardContent>
      </Card>

      {/* Night Sleep Card */}
      <Card className="border-l-4 border-blue-500">
        <CardContent className="pt-4">
          <h2 className="text-sm font-medium text-slate-500 mb-1">Тривалість нічного сну</h2>
          <div className="flex items-center space-x-2">
            <Bed className="h-4 w-4 text-blue-500" />
            <span className="text-xl font-semibold">{metrics.nightSleep}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
