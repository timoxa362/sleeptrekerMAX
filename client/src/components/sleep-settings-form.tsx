import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SleepSettings } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Define the form schema
const formSchema = z.object({
  requiredSleepMinutes: z.preprocess(
    (value) => parseInt(value as string, 10),
    z.number().min(1, "Необхідно вказати хоча б 1 хвилину").max(1440, "Не може бути більше 24 годин")
  ),
});

type FormValues = z.infer<typeof formSchema>;

export function SleepSettingsForm() {
  const { toast } = useToast();
  
  // Query to fetch current settings
  const { data: settings, isLoading } = useQuery<SleepSettings | null>({ 
    queryKey: ['/api/settings/sleep'],
  });
  
  // Set up the form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requiredSleepMinutes: settings?.requiredSleepMinutes || 720, // Default to 12 hours if no settings
    },
    values: {
      requiredSleepMinutes: settings?.requiredSleepMinutes || 720,
    }
  });
  
  // Mutation to save settings
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/settings/sleep", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/sleep'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
      toast({
        title: "Налаштування збережено",
        description: "Нові налаштування сну успішно застосовані.",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка при збереженні",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };
  
  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Налаштування сну</CardTitle>
          <CardDescription>Завантаження...</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // Calculate the readable duration
  const requiredSleepDuration = formatDuration(form.watch("requiredSleepMinutes"));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Налаштування сну</CardTitle>
        <CardDescription>
          Установіть необхідну тривалість сну для дитини
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requiredSleepMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Необхідна тривалість сну (хвилини)</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-1.5">
                      <Input type="number" {...field} min={1} max={1440} />
                      <div className="text-sm text-muted-foreground">
                        Поточне значення: {requiredSleepDuration}
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Збереження..." : "Зберегти налаштування"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}