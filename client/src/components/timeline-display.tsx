import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TimeEntry } from "@/lib/types";
import { formatTime, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { X, Sun, Moon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TimelineDisplayProps {
  entries: TimeEntry[];
  selectedDate: string;
}

export function TimelineDisplay({ entries, selectedDate }: TimelineDisplayProps) {
  const { toast } = useToast();
  const [isClearing, setIsClearing] = useState(false);
  
  // Filter entries by the selected date and sort by creation date (newest first)
  const dateEntries = entries
    .filter(entry => entry.date === selectedDate)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const handleDeleteEntry = async (id: number) => {
    try {
      await apiRequest("DELETE", `/api/entries/${id}`, undefined);
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dates'] });
      
      toast({
        title: "Запис видалено",
        description: "Ваш запис часу було успішно видалено",
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити запис. Будь ласка, спробуйте ще раз.",
        variant: "destructive",
      });
      console.error("Failed to delete entry:", error);
    }
  };

  const handleClearEntries = async () => {
    try {
      setIsClearing(true);
      // Clear entries for the specific date
      await apiRequest("DELETE", `/api/entries?date=${selectedDate}`, undefined);
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dates'] });
      
      toast({
        title: "Записи очищено",
        description: `Усі записи для ${formatDate(selectedDate)} було успішно очищено`,
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося очистити записи. Будь ласка, спробуйте ще раз.",
        variant: "destructive",
      });
      console.error("Failed to clear entries:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const isToday = new Date().toISOString().split('T')[0] === selectedDate;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">
            {isToday ? "Часова шкала на сьогодні" : `Часова шкала на ${formatDate(selectedDate)}`}
          </h2>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-sm text-red-500 hover:text-red-600 font-medium"
                disabled={dateEntries.length === 0 || isClearing}
              >
                Очистити день
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                <AlertDialogDescription>
                  Це видалить усі записи часу для {formatDate(selectedDate)}. Цю дію не можна скасувати.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Скасувати</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearEntries}>Продовжити</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="space-y-3">
          {dateEntries.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Bed className="h-6 w-6 mx-auto mb-2" />
              <p>Немає записів на цю дату. Додайте час сну/пробудження вище.</p>
            </div>
          ) : (
            dateEntries.map((entry) => (
              <div 
                key={entry.id} 
                className={`flex items-center p-3 rounded-md border ${
                  entry.type === 'woke-up' 
                    ? 'border-[#f97316] bg-orange-50' 
                    : 'border-[#8b5cf6] bg-violet-50'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                      entry.type === 'woke-up' 
                        ? 'bg-[#f97316] text-white' 
                        : 'bg-[#8b5cf6] text-white'
                    }`}>
                      {entry.type === 'woke-up' ? (
                        <Sun className="h-3 w-3" />
                      ) : (
                        <Moon className="h-3 w-3" />
                      )}
                    </span>
                    <span className="font-medium">
                      {entry.type === 'woke-up' ? 'Прокинувся' : 'Заснув'}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 ml-8">{formatTime(entry.time)}</div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 text-slate-400 hover:text-red-500"
                  onClick={() => handleDeleteEntry(entry.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Exporting Bed icon component for reuse
function Bed(props: React.ComponentProps<typeof Sun>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    </svg>
  );
}
