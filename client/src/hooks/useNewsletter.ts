import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import type { Newsletter } from "@shared/schema";

interface GenerateNewsletterParams {
  issueNumber: number;
  date: string;
  customPrompt?: string;
}

export function useNewsletter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the latest newsletter
  const { data: newslettersData } = useQuery({
    queryKey: ["/api/newsletters"],
  });

  const newsletters: Newsletter[] = newslettersData?.newsletters || [];
  const newsletter: Newsletter | undefined = newsletters[0]; // Latest newsletter

  const generateMutation = useMutation({
    mutationFn: async (params: GenerateNewsletterParams) => {
      const response = await apiRequest("POST", "/api/newsletter/generate", params);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({
        title: "Newsletter Generated!",
        description: `Successfully generated newsletter with ${data.newsletter.wordCount} words.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate newsletter",
        variant: "destructive",
      });
    },
  });

  const generateNewsletter = (params: GenerateNewsletterParams) => {
    generateMutation.mutate(params);
  };

  const regenerateNewsletter = (params: GenerateNewsletterParams) => {
    generateMutation.mutate(params);
  };

  return {
    newsletter,
    newsletters,
    generateNewsletter,
    regenerateNewsletter,
    isGenerating: generateMutation.isPending,
  };
}
