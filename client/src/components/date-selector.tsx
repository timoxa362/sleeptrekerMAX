import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  // Format the selected date for display
  const formattedDate = formatDate(selectedDate);
  
  // Get available dates from API
  const datesQuery = useQuery({
    queryKey: ['/api/dates'],
  });

  const availableDates = datesQuery.data as string[] || [];
  
  // State for calendar date
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(
    selectedDate ? new Date(selectedDate) : undefined
  );

  // Handle calendar date change
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = date.toISOString().split('T')[0];
      setCalendarDate(date);
      onDateChange(dateString);
    }
  };

  // Handle select change for date history
  const handleSelectChange = (value: string) => {
    onDateChange(value);
    setCalendarDate(new Date(value));
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    if (calendarDate) {
      const prevDate = new Date(calendarDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const dateString = prevDate.toISOString().split('T')[0];
      setCalendarDate(prevDate);
      onDateChange(dateString);
    }
  };

  // Navigate to next day
  const goToNextDay = () => {
    if (calendarDate) {
      const nextDate = new Date(calendarDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const dateString = nextDate.toISOString().split('T')[0];
      setCalendarDate(nextDate);
      onDateChange(dateString);
    }
  };

  // Navigate to today
  const goToToday = () => {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    setCalendarDate(today);
    onDateChange(dateString);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between mb-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToPreviousDay}
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 text-center">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formattedDate}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={handleCalendarSelect}
                initialFocus
              />
              <div className="p-3 border-t">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={goToToday}
                >
                  Today
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={goToNextDay}
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {availableDates.length > 0 && (
        <div>
          <Select onValueChange={handleSelectChange} value={selectedDate}>
            <SelectTrigger>
              <SelectValue placeholder="Select from history" />
            </SelectTrigger>
            <SelectContent>
              {availableDates.map((date) => (
                <SelectItem key={date} value={date}>
                  {formatDate(date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}