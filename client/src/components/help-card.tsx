import { Card, CardContent } from "@/components/ui/card";

export function HelpCard() {
  return (
    <Card className="bg-slate-100 mb-6">
      <CardContent className="pt-6">
        <h3 className="font-medium mb-2 text-slate-700">How to use:</h3>
        <ul className="text-sm text-slate-600 space-y-1">
          <li className="flex items-start">
            <span className="text-[#8b5cf6] mr-2">•</span>
            <span>Add each time your child wakes up or falls asleep</span>
          </li>
          <li className="flex items-start">
            <span className="text-[#f97316] mr-2">•</span>
            <span>Entries should alternate between wake and sleep</span>
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            <span>View the summary at the top to see sleep metrics</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            <span>Use the date selector to view or add entries for different days</span>
          </li>
          <li className="flex items-start">
            <span className="text-purple-500 mr-2">•</span>
            <span>Select a date from history to see previous sleep patterns</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
