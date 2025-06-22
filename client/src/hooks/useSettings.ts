import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import type { Settings, InsertSettings } from "@shared/schema";

export function useSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const settings: Settings | null = settingsData?.settings || null;

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: InsertSettings) => {
      const response = await apiRequest("POST", "/api/settings", newSettings);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const updateSettings = (newSettings: InsertSettings) => {
    updateSettingsMutation.mutate(newSettings);
  };

  return {
    settings,
    isLoading,
    updateSettings,
    isUpdating: updateSettingsMutation.isPending,
  };
}
