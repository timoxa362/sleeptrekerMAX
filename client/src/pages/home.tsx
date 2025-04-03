import { useQuery } from "@tanstack/react-query";
import { SummaryCards } from "@/components/summary-cards";
import { TimeEntryForm } from "@/components/time-entry-form";
import { TimelineDisplay } from "@/components/timeline-display";
import { HelpCard } from "@/components/help-card";
import { TimeEntry, SleepMetrics } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

export default function Home() {
  const { 
    data: entries = [], 
    isLoading: isLoadingEntries 
  } = useQuery<TimeEntry[]>({ 
    queryKey: ['/api/entries'] 
  });

  const { 
    data: metricsData,
    isLoading: isLoadingMetrics
  } = useQuery<{ 
    totalSleepMinutes: number; 
    totalAwakeMinutes: number; 
    nightSleepMinutes: number; 
  }>({ 
    queryKey: ['/api/metrics'] 
  });

  // Format metrics data
  const metrics: SleepMetrics = {
    totalSleep: isLoadingMetrics ? "..." : formatDuration(metricsData?.totalSleepMinutes || 0),
    totalAwake: isLoadingMetrics ? "..." : formatDuration(metricsData?.totalAwakeMinutes || 0),
    nightSleep: isLoadingMetrics ? "..." : formatDuration(metricsData?.nightSleepMinutes || 0),
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-center mb-2">Child Sleep Tracker</h1>
        <p className="text-slate-600 text-center">Track and analyze your child's sleep patterns</p>
      </header>

      <SummaryCards metrics={metrics} />
      <TimeEntryForm entries={entries} />
      <TimelineDisplay entries={entries} />
      <HelpCard />
    </div>
  );
}
