import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  PlayCircle, 
  Wand2, 
  Eye, 
  Save, 
  Send, 
  CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNewsletter } from "@/hooks/useNewsletter";
import { apiRequest } from "@/lib/api";
import { format } from "date-fns";

export default function ControlsPanel() {
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const { newsletter, isGenerating, generateNewsletter } = useNewsletter();

  // Get articles to check if any are selected
  const { data: articlesData } = useQuery({
    queryKey: ["/api/articles"],
  });

  // Get next issue number
  const { data: issueData } = useQuery({
    queryKey: ["/api/next-issue-number"],
  });

  // Get latest newsletter for last published info
  const { data: newslettersData } = useQuery({
    queryKey: ["/api/newsletters"],
  });

  const articles = articlesData?.articles || [];
  const selectedArticles = articles.filter((a: any) => a.selected);
  const nextIssueNumber = issueData?.issueNumber || 1;
  const newsletters = newslettersData?.newsletters || [];
  const lastPublished = newsletters.find((n: any) => n.status === "published");

  const handleGenerateNewsletter = () => {
    if (selectedArticles.length === 0) {
      toast({
        title: "No Articles Selected",
        description: "Please select at least one article to generate a newsletter.",
        variant: "destructive",
      });
      return;
    }

    generateNewsletter({
      issueNumber: nextIssueNumber,
      date: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const handlePublishToBeehiiv = async () => {
    if (!newsletter) {
      toast({
        title: "No Newsletter",
        description: "Please generate a newsletter first.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    try {
      const response = await apiRequest("POST", "/api/newsletter/publish", {
        newsletterId: newsletter.id,
        draft: false,
      });

      const result = await response.json();
      
      toast({
        title: "Newsletter Published!",
        description: `Successfully published to Beehiiv${result.beehiivPost.web_url ? ` - ${result.beehiivPost.web_url}` : ''}`,
      });
    } catch (error) {
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Failed to publish newsletter",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!newsletter) {
      toast({
        title: "No Newsletter",
        description: "Please generate a newsletter first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/newsletter/publish", {
        newsletterId: newsletter.id,
        draft: true,
      });

      toast({
        title: "Draft Saved",
        description: "Newsletter saved as draft in Beehiiv.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save draft",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PlayCircle className="text-primary mr-3 w-5 h-5" />
          Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleGenerateNewsletter}
          disabled={isGenerating || selectedArticles.length === 0}
          className="w-full bg-gradient-to-r from-primary to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-4"
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Generating...</span>
            </div>
          ) : (
            <>
              <Wand2 className="w-5 h-5 mr-3" />
              Generate Newsletter
            </>
          )}
        </Button>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={!newsletter}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSaveDraft}
            disabled={!newsletter}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-800">Beehiiv Publishing</h4>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ready
            </Badge>
          </div>

          <Button
            onClick={handlePublishToBeehiiv}
            disabled={!newsletter || isPublishing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            {isPublishing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Publishing...</span>
              </div>
            ) : (
              <>
                <Send className="w-4 h-4 mr-3" />
                Publish to Beehiiv
              </>
            )}
          </Button>

          <div className="mt-3 text-xs text-slate-600 text-center">
            {lastPublished ? (
              <span>
                Last published: Issue #{lastPublished.issueNumber} - {format(new Date(lastPublished.publishedAt), 'MMM d, yyyy')}
              </span>
            ) : (
              <span>No newsletters published yet</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
