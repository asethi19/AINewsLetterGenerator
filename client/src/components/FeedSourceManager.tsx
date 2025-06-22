import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Rss, 
  Plus, 
  Edit, 
  Trash2, 
  Globe, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  TrendingUp,
  Tag
} from "lucide-react";
import type { FeedSource } from "@shared/schema";

const feedSourceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Must be a valid URL"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  refreshInterval: z.number().min(5).max(1440).default(60),
  tags: z.array(z.string()).default([]),
});

type FeedSourceForm = z.infer<typeof feedSourceSchema>;

export default function FeedSourceManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFeed, setEditingFeed] = useState<FeedSource | null>(null);
  const [newTag, setNewTag] = useState("");

  const form = useForm<FeedSourceForm>({
    resolver: zodResolver(feedSourceSchema),
    defaultValues: {
      name: "",
      url: "",
      category: "",
      description: "",
      enabled: true,
      refreshInterval: 60,
      tags: [],
    },
  });

  const { data: feedsData, isLoading } = useQuery({
    queryKey: ["/api/feed-sources"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/feed-sources");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FeedSourceForm) => {
      const res = await apiRequest("POST", "/api/feed-sources", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed-sources"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Feed Source Created",
        description: "New feed source has been added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FeedSource> }) => {
      const res = await apiRequest("PUT", `/api/feed-sources/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed-sources"] });
      setEditingFeed(null);
      toast({
        title: "Feed Source Updated",
        description: "Feed source has been updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/feed-sources/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feed-sources"] });
      toast({
        title: "Feed Source Deleted",
        description: "Feed source has been removed successfully",
      });
    },
  });

  const testFeedMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/feed-sources/test", { url });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Feed Test Successful",
        description: `Found ${data.articleCount} articles`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feed Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const feeds: FeedSource[] = feedsData?.feedSources || [];

  const onSubmit = (data: FeedSourceForm) => {
    if (editingFeed) {
      updateMutation.mutate({ id: editingFeed.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (feed: FeedSource) => {
    setEditingFeed(feed);
    form.reset({
      name: feed.name,
      url: feed.url,
      category: feed.category,
      description: feed.description || "",
      enabled: feed.enabled,
      refreshInterval: feed.refreshInterval,
      tags: feed.tags || [],
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this feed source?")) {
      deleteMutation.mutate(id);
    }
  };

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = form.getValues("tags");
      if (!currentTags.includes(newTag.trim())) {
        form.setValue("tags", [...currentTags, newTag.trim()]);
      }
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const formatTime = (date: Date | null) => {
    return date ? new Date(date).toLocaleString() : "Never";
  };

  const categories = ["AI", "Technology", "Business", "Science", "News", "Marketing", "Development"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Feed Source Manager</h2>
          <p className="text-muted-foreground">
            Manage multiple RSS/JSON feeds for different newsletters and topics
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingFeed(null); form.reset(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Feed Source
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFeed ? "Edit" : "Add New"} Feed Source</DialogTitle>
              <DialogDescription>
                Configure RSS/JSON feed sources for automated content fetching
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="AI News Feed" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feed URL</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="https://example.com/feed.xml" {...field} />
                        </FormControl>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => testFeedMutation.mutate(field.value)}
                          disabled={!field.value || testFeedMutation.isPending}
                        >
                          Test
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of this feed source"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="refreshInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Refresh Interval (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="5" 
                            max="1440"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enabled</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Allow automatic fetching from this source
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {form.watch("tags").map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingFeed ? "Update" : "Create"} Feed Source
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sources</CardTitle>
            <Rss className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeds.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sources</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeds.filter(f => f.enabled).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feeds.reduce((sum, f) => sum + f.articleCount, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(feeds.map(f => f.category)).size}</div>
          </CardContent>
        </Card>
      </div>

      {/* Feed Sources List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Loading feed sources...</div>
            </CardContent>
          </Card>
        ) : feeds.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                No feed sources configured. Add your first feed source to get started.
              </div>
            </CardContent>
          </Card>
        ) : (
          feeds.map((feed) => (
            <Card key={feed.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{feed.name}</CardTitle>
                      <Badge variant="outline">{feed.category}</Badge>
                      {feed.enabled ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      {feed.url}
                    </CardDescription>
                    {feed.description && (
                      <p className="text-sm text-muted-foreground">{feed.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(feed)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(feed.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="font-medium">Articles Fetched</div>
                    <div className="text-muted-foreground">{feed.articleCount}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Last Fetched</div>
                    <div className="text-muted-foreground">{formatTime(feed.lastFetched)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Refresh Interval</div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {feed.refreshInterval}m
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Errors</div>
                    <div className="text-muted-foreground">{feed.errorCount}</div>
                  </div>
                </div>
                {feed.tags && feed.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {feed.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {feed.lastError && (
                  <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Last Error:</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">{feed.lastError}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}