import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Edit, Clock, AlignLeft, RotateCcw, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNewsletter } from "@/hooks/useNewsletter";
import RichTextEditor from "@/components/RichTextEditor";
import { format } from "date-fns";

export default function NewsletterGenerator() {
  const [newsletterDate, setNewsletterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTemplate, setSelectedTemplate] = useState("standard");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  
  const { newsletter, isGenerating, generateNewsletter, regenerateNewsletter } = useNewsletter();

  // Get next issue number
  const { data: issueData } = useQuery({
    queryKey: ["/api/next-issue-number"],
  });

  const nextIssueNumber = issueData?.issueNumber || 1;

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes === 1) return "1 minute ago";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  const handleRegenerate = () => {
    regenerateNewsletter({
      issueNumber: nextIssueNumber,
      date: newsletterDate,
    });
  };

  const handleEdit = () => {
    setEditedContent(newsletter?.content || "");
    setIsEditorOpen(true);
  };

  const handleSaveEdit = (content: string) => {
    setEditedContent(content);
    // Here you would typically save the edited content to the backend
    setIsEditorOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="text-primary mr-3 w-5 h-5" />
            Newsletter Preview
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-600">
              Issue #{newsletter?.issueNumber || nextIssueNumber}
            </span>
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={!newsletter?.content} onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Newsletter</DialogTitle>
                </DialogHeader>
                {isEditorOpen && (
                  <RichTextEditor
                    content={editedContent}
                    onChange={handleSaveEdit}
                    title={newsletter?.title || "Newsletter"}
                  />
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Label htmlFor="newsletter-date" className="text-sm font-medium text-slate-700 mb-2 block">
              Newsletter Date
            </Label>
            <Input
              id="newsletter-date"
              type="date"
              value={newsletterDate}
              onChange={(e) => setNewsletterDate(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="template" className="text-sm font-medium text-slate-700 mb-2 block">
              Template
            </Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard Weekly</SelectItem>
                <SelectItem value="curated">Curated Highlights</SelectItem>
                <SelectItem value="brief">Brief Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Newsletter Content Preview */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <ScrollArea className="h-64">
            {newsletter?.content ? (
              <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                {newsletter.content}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No newsletter generated yet.</p>
                  <p className="text-sm">Click "Generate Newsletter" to create content.</p>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            {newsletter?.generatedAt && (
              <>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Generated {formatTimeAgo(newsletter.generatedAt)}
                </span>
                <span className="flex items-center">
                  <AlignLeft className="w-4 h-4 mr-1" />
                  {newsletter.wordCount || 0} words
                </span>
              </>
            )}
          </div>
          {newsletter?.content && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="text-primary hover:text-blue-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Regenerate
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
