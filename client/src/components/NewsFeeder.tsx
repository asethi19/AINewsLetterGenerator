import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, RefreshCw, Rss, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import type { Article } from "@shared/schema";

export default function NewsFeeder() {
  const [newsUrl, setNewsUrl] = useState("https://www.inoreader.com/stream/user/1003985272/tag/AI/view/json");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch articles
  const { data: articlesData, isLoading: isLoadingArticles } = useQuery({
    queryKey: ["/api/articles"],
    refetchInterval: autoRefresh ? 300000 : false, // 5 minutes if auto-refresh
  });

  const articles: Article[] = articlesData?.articles || [];
  const selectedCount = articles.filter(a => a.selected).length;

  // Fetch news mutation
  const fetchNewsMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("GET", `/api/news/fetch?url=${encodeURIComponent(url)}`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({
        title: "Success!",
        description: `Fetched ${data.articles.length} articles successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch news",
        variant: "destructive",
      });
    },
  });

  // Update article selection
  const updateSelectionMutation = useMutation({
    mutationFn: async ({ id, selected }: { id: number; selected: boolean }) => {
      const response = await apiRequest("PATCH", `/api/articles/${id}/select`, { selected });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update article selection",
        variant: "destructive",
      });
    },
  });

  const handleFetchNews = () => {
    if (!newsUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }
    fetchNewsMutation.mutate(newsUrl);
  };

  const handleSelectAll = () => {
    const allSelected = articles.every(a => a.selected);
    articles.forEach(article => {
      if (article.selected !== !allSelected) {
        updateSelectionMutation.mutate({ id: article.id, selected: !allSelected });
      }
    });
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours === 1) return "1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* News Fetch Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Rss className="text-primary mr-3 w-5 h-5" />
              News Feed Source
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Connected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="news-url" className="text-sm font-medium text-slate-700 mb-2 block">
              RSS/JSON Feed URL
            </Label>
            <div className="flex space-x-3">
              <Input
                id="news-url"
                type="url"
                value={newsUrl}
                onChange={(e) => setNewsUrl(e.target.value)}
                placeholder="https://www.inoreader.com/stream/user/1003985272/tag/AI/view/json"
                className="flex-1"
              />
              <Button
                onClick={handleFetchNews}
                disabled={fetchNewsMutation.isPending}
                className="px-6"
              >
                {fetchNewsMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Fetch
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">
              Last updated: {articles.length > 0 ? formatTimeAgo(new Date(articles[0]?.fetchedAt || Date.now())) : "Never"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-primary hover:text-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fetched Articles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Latest AI News</span>
            <span className="text-sm font-normal text-slate-600">
              {articles.length} articles found
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingArticles ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Rss className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No articles found. Click "Fetch" to load news articles.</p>
            </div>
          ) : (
            <>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {articles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-start space-x-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <Checkbox
                        checked={article.selected}
                        onCheckedChange={(checked) =>
                          updateSelectionMutation.mutate({
                            id: article.id,
                            selected: !!checked,
                          })
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-slate-800 line-clamp-2">
                          {article.title}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <span>{article.source}</span>
                          <span>{formatTimeAgo(article.publishedDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-primary hover:text-blue-700"
                >
                  {articles.every(a => a.selected) ? "Deselect All" : "Select All"}
                </Button>
                <span className="text-sm text-slate-600">
                  {selectedCount} articles selected
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
