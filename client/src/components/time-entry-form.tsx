import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { EntryType, TimeEntry } from "@/lib/types";
import { getCurrentTime, timeToMinutes } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TimeEntryFormProps {
  entries: TimeEntry[];
  selectedDate: string;
}

const timeEntrySchema = z.object({
  type: z.enum(["woke-up", "fell-asleep"]),
  time: z.string().min(1, "Time is required"),
  date: z.string(),
});

type FormValues = z.infer<typeof timeEntrySchema>;

export function TimeEntryForm({ entries, selectedDate }: TimeEntryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Стан для поточного часу, який оновлюється щосекунди
  const [currentTimeDisplay, setCurrentTimeDisplay] = useState(getCurrentTime());

  // Визначаємо тип запису на основі останнього запису для вибраної дати
  const determineEntryType = (): EntryType => {
    // Фільтруємо записи для вибраної дати
    const dateEntries = entries.filter(entry => entry.date === selectedDate);
    
    if (dateEntries.length === 0) {
      // Якщо записів немає, починаємо з "прокинувся"
      return "woke-up";
    }
    
    // Отримуємо останній запис
    const lastEntry = dateEntries[dateEntries.length - 1];
    
    // Повертаємо протилежний тип
    return lastEntry.type === "woke-up" ? "fell-asleep" : "woke-up";
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      type: determineEntryType(),
      time: getCurrentTime(),
      date: selectedDate,
    },
  });

  // Оновлюємо форму, коли змінюється вибрана дата або список записів
  useEffect(() => {
    // Оновлюємо дату
    form.setValue("date", selectedDate);
    // Оновлюємо тип запису на основі останнього запису
    form.setValue("type", determineEntryType());
    // Оновлюємо час на поточний
    form.setValue("time", getCurrentTime());
  }, [selectedDate, entries, form]);
  
  // Інтервал для оновлення поточного часу кожну секунду
  useEffect(() => {
    const updateInterval = setInterval(() => {
      const newTime = getCurrentTime();
      setCurrentTimeDisplay(newTime);
      form.setValue("time", newTime);
    }, 1000);
    
    // Очищуємо інтервал при розмонтуванні компонента
    return () => clearInterval(updateInterval);
  }, [form]);

  const validateEntry = (type: EntryType, time: string): boolean => {
    if (!time) {
      toast({
        title: "Недійсний час",
        description: "Будь ласка, введіть дійсний час",
        variant: "destructive",
      });
      return false;
    }

    // Filter entries for the selected date
    const dateEntries = entries.filter(entry => entry.date === selectedDate);

    if (dateEntries.length > 0) {
      const lastEntry = dateEntries[dateEntries.length - 1];

      // Check if entry types alternate (wake-sleep-wake-sleep)
      if (lastEntry.type === type) {
        const typeText = type === "woke-up" ? "прокинувся" : "заснув";
        toast({
          title: "Недійсний тип запису",
          description: `Ви не можете додати два послідовних записи типу "${typeText}". Записи повинні чергуватися між сном та неспанням.`,
          variant: "destructive",
        });
        return false;
      }

      // Check if new time is after last entry time
      const lastTime = timeToMinutes(lastEntry.time);
      const newTime = timeToMinutes(time);

      if (newTime < lastTime) {
        toast({
          title: "Недійсний час",
          description: "Новий час запису повинен бути пізніше попереднього запису",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      // Використовуємо значення часу, яке ввів користувач
      const userTime = data.time;
      
      // Валідація введеного часу
      if (!validateEntry(data.type, userTime)) {
        return;
      }

      setIsSubmitting(true);
      
      // Використовуємо дані форми як введені користувачем
      const submissionData = {
        type: data.type,
        time: userTime,
        date: selectedDate,
      };
      
      await apiRequest("POST", "/api/entries", submissionData);
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/entries', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['/api/dates'] });
      
      // Reset the type to opposite of what was just submitted
      form.setValue("type", data.type === "woke-up" ? "fell-asleep" : "woke-up");
      
      toast({
        title: "Запис додано",
        description: "Ваш запис часу успішно додано о " + userTime,
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося додати запис. Будь ласка, спробуйте ще раз.",
        variant: "destructive",
      });
      console.error("Failed to add entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <h2 className="text-lg font-medium mb-4">Додати новий запис</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="entry-type" className="text-sm font-medium text-slate-700 mb-1">Тип запису (автовибір)</Label>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Оберіть тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="woke-up">Прокинувся</SelectItem>
                          <SelectItem value="fell-asleep">Заснув</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="entry-time" className="text-sm font-medium text-slate-700 mb-1">Час (автооновлення)</Label>
                      <FormControl>
                        <Input 
                          type="time" 
                          id="entry-time" 
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Hidden date field */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <input type="hidden" {...field} />
                )}
              />
              
              <div className="flex-none md:self-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  Додати запис
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
