import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Calendar, 
  Share2, 
  Twitter, 
  Instagram, 
  Youtube, 
  TrendingUp, 
  Clock,
  Zap,
  Target
} from "lucide-react";
import type { SocialMediaPost, Newsletter } from "@shared/schema";

export default function SocialMediaManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/social-media-posts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/social-media-posts");
      return res.json();
    },
  });

  const { data: newslettersData } = useQuery({
    queryKey: ["/api/newsletters"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/newsletters");
      return res.json();
    },
  });

  const generatePostsMutation = useMutation({
    mutationFn: async (newsletterId: number) => {
      const res = await apiRequest("POST", "/api/social-media-posts/generate", {
        newsletterId
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-media-posts"] });
      toast({
        title: "Social Media Posts Generated",
        description: `Created ${data.posts.length} posts scheduled at random times`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const posts: SocialMediaPost[] = postsData?.posts || [];
  const newsletters: Newsletter[] = newslettersData?.newsletters || [];

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "twitter": return <Twitter className="h-4 w-4" />;
      case "instagram": return <Instagram className="h-4 w-4" />;
      case "youtube": return <Youtube className="h-4 w-4" />;
      default: return <Share2 className="h-4 w-4" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "twitter": return "bg-blue-500";
      case "instagram": return "bg-pink-500";
      case "youtube": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-yellow-500";
      case "posted": return "bg-green-500";
      case "failed": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const scheduledPosts = posts.filter(p => p.status === "scheduled");
  const postedPosts = posts.filter(p => p.status === "posted");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Social Media Manager</h2>
          <p className="text-muted-foreground">
            Generate and schedule engaging posts for Twitter, Instagram, and YouTube Shorts
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Posts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledPosts.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to publish
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{postedPosts.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platforms</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Twitter, Instagram, YouTube
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">AI</div>
            <p className="text-xs text-muted-foreground">
              Powered generation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Generate Posts for Newsletters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Generate Social Media Posts
          </CardTitle>
          <CardDescription>
            Create engaging posts from your newsletters to drive more subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {newsletters.length === 0 ? (
              <p className="text-muted-foreground">No newsletters available. Create a newsletter first.</p>
            ) : (
              <div className="grid gap-4">
                {newsletters.slice(0, 5).map((newsletter) => (
                  <div key={newsletter.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{newsletter.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Issue #{newsletter.issueNumber} • {formatTime(newsletter.createdAt)}
                      </p>
                      <Badge variant="outline">{newsletter.status}</Badge>
                    </div>
                    <Button
                      onClick={() => generatePostsMutation.mutate(newsletter.id)}
                      disabled={generatePostsMutation.isPending}
                      size="sm"
                    >
                      {generatePostsMutation.isPending ? "Generating..." : "Generate Posts"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Scheduled Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduled Posts ({scheduledPosts.length})
            </CardTitle>
            <CardDescription>
              Posts waiting to be published at optimal times
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {scheduledPosts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No scheduled posts</p>
                ) : (
                  scheduledPosts.map((post) => (
                    <div key={post.id} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full ${getPlatformColor(post.platform)}`}>
                            {getPlatformIcon(post.platform)}
                          </div>
                          <span className="capitalize font-medium">{post.platform}</span>
                        </div>
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm line-clamp-3">{post.content}</p>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {post.hashtags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{post.hashtags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Scheduled: {formatTime(post.scheduledFor)}</span>
                        <span>Newsletter #{post.newsletterId}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Published Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Published Posts ({postedPosts.length})
            </CardTitle>
            <CardDescription>
              Successfully published posts driving newsletter subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {postedPosts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No published posts yet</p>
                ) : (
                  postedPosts.map((post) => (
                    <div key={post.id} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded-full ${getPlatformColor(post.platform)}`}>
                            {getPlatformIcon(post.platform)}
                          </div>
                          <span className="capitalize font-medium">{post.platform}</span>
                        </div>
                        <Badge className={getStatusColor(post.status)}>
                          {post.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm line-clamp-2">{post.content}</p>
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.hashtags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Published: {formatTime(post.scheduledFor)}</span>
                        {post.postUrl && (
                          <a href={post.postUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            View Post
                          </a>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}