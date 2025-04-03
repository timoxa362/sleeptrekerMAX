import { useState } from "react";
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
}

const timeEntrySchema = z.object({
  type: z.enum(["woke-up", "fell-asleep"]),
  time: z.string().min(1, "Time is required"),
});

type FormValues = z.infer<typeof timeEntrySchema>;

export function TimeEntryForm({ entries }: TimeEntryFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(timeEntrySchema),
    defaultValues: {
      type: "woke-up",
      time: getCurrentTime(),
    },
  });

  const validateEntry = (type: EntryType, time: string): boolean => {
    if (!time) {
      toast({
        title: "Invalid time",
        description: "Please enter a valid time",
        variant: "destructive",
      });
      return false;
    }

    if (entries.length > 0) {
      const lastEntry = entries[entries.length - 1];

      // Check if entry types alternate (wake-sleep-wake-sleep)
      if (lastEntry.type === type) {
        toast({
          title: "Invalid entry type",
          description: `You cannot add two consecutive "${type}" entries. Entries should alternate between wake and sleep.`,
          variant: "destructive",
        });
        return false;
      }

      // Check if new time is after last entry time
      const lastTime = timeToMinutes(lastEntry.time);
      const newTime = timeToMinutes(time);

      if (newTime < lastTime) {
        toast({
          title: "Invalid time",
          description: "New entry time must be after the previous entry time",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const onSubmit = async (data: FormValues) => {
    try {
      if (!validateEntry(data.type, data.time)) {
        return;
      }

      setIsSubmitting(true);
      
      await apiRequest("POST", "/api/entries", data);
      
      queryClient.invalidateQueries({ queryKey: ['/api/entries'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
      
      // Reset the type to opposite of what was just submitted
      form.setValue("type", data.type === "woke-up" ? "fell-asleep" : "woke-up");
      
      toast({
        title: "Entry added",
        description: "Your time entry has been added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add entry. Please try again.",
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
        <h2 className="text-lg font-medium mb-4">Add New Entry</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
              <div className="flex-1">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="entry-type" className="text-sm font-medium text-slate-700 mb-1">Entry Type</Label>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="woke-up">Woke Up</SelectItem>
                          <SelectItem value="fell-asleep">Fell Asleep</SelectItem>
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
                      <Label htmlFor="entry-time" className="text-sm font-medium text-slate-700 mb-1">Time</Label>
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
              
              <div className="flex-none md:self-end">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full md:w-auto"
                >
                  Add Entry
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
