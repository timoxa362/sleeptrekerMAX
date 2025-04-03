import { Card, CardContent } from "@/components/ui/card";
import { Moon, Sun, Bed } from "lucide-react";
import { SleepMetrics } from "@/lib/types";

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
        </CardContent>
      </Card>

      {/* Total Awake Card */}
      <Card className="border-l-4 border-[#f97316]">
        <CardContent className="pt-4">
          <h2 className="text-sm font-medium text-slate-500 mb-1">Час неспання</h2>
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
