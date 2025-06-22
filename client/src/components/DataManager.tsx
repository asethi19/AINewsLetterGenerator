import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Download, 
  Trash2, 
  Database, 
  Shield, 
  AlertTriangle, 
  FileText, 
  Calendar,
  HardDrive,
  Archive,
  RefreshCw
} from "lucide-react";
import type { DataBackup } from "@shared/schema";

export default function DataManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState("");

  const { data: backupsData, isLoading } = useQuery({
    queryKey: ["/api/data-backups"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/data-backups");
      return res.json();
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ["/api/data-stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/data-stats");
      return res.json();
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/data-export");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-backups"] });
      toast({
        title: "Export Successful",
        description: `Data exported successfully with ${data.recordCount} records`,
      });
      // Trigger download
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const purgeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/data-purge");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setShowPurgeConfirm(false);
      setPurgeConfirmText("");
      toast({
        title: "Data Purged",
        description: "All data has been permanently deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Purge Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/data-backups/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/data-backups"] });
      toast({
        title: "Backup Deleted",
        description: "Backup file has been removed",
      });
    },
  });

  const backups: DataBackup[] = backupsData?.backups || [];
  const stats = statsData || {};

  const handleExport = () => {
    setIsExporting(true);
    exportMutation.mutate();
    setTimeout(() => setIsExporting(false), 3000);
  };

  const handlePurge = () => {
    if (purgeConfirmText === "DELETE ALL DATA") {
      setIsPurging(true);
      purgeMutation.mutate();
      setTimeout(() => setIsPurging(false), 3000);
    } else {
      toast({
        title: "Confirmation Required",
        description: "Please type 'DELETE ALL DATA' exactly to confirm",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Data Management</h2>
          <p className="text-muted-foreground">
            Export, backup, and manage your application data
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export All Data
          </Button>
          <Dialog open={showPurgeConfirm} onOpenChange={setShowPurgeConfirm}>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={isPurging}>
                {isPurging ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Purge All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Dangerous Action: Purge All Data
                </DialogTitle>
                <DialogDescription>
                  This action will permanently delete ALL data including articles, newsletters, 
                  schedules, social media posts, feed sources, and activity logs. This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <strong>Warning:</strong> This action is irreversible. All your data will be permanently lost.
                  Make sure you have exported your data first if you want to keep a backup.
                </AlertDescription>
              </Alert>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    Type "DELETE ALL DATA" to confirm:
                  </label>
                  <input
                    type="text"
                    value={purgeConfirmText}
                    onChange={(e) => setPurgeConfirmText(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="DELETE ALL DATA"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowPurgeConfirm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handlePurge}
                    disabled={purgeConfirmText !== "DELETE ALL DATA" || purgeMutation.isPending}
                  >
                    Purge All Data
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Data Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.articles || 0}</div>
            <p className="text-xs text-muted-foreground">
              Fetched articles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Newsletters</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newsletters || 0}</div>
            <p className="text-xs text-muted-foreground">
              Generated newsletters
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Posts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.socialPosts || 0}</div>
            <p className="text-xs text-muted-foreground">
              Social media posts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats.totalSize || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated size
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Export Progress */}
      {isExporting && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Exporting data...</span>
                <span className="text-sm text-muted-foreground">Please wait</span>
              </div>
              <Progress value={66} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Export History
          </CardTitle>
          <CardDescription>
            Previous data exports and backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading backups...</div>
          ) : backups.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No exports found. Create your first export to see it here.
            </div>
          ) : (
            <div className="space-y-4">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{backup.filename}</span>
                      <Badge variant="outline">{formatFileSize(backup.size)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(backup.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {backup.recordCount} records
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {backup.tables.join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {backup.downloadUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(backup.downloadUrl!, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteBackupMutation.mutate(backup.id)}
                      disabled={deleteBackupMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Regular Backups:</strong> Export your data regularly to prevent data loss. 
                Consider setting up automated exports for critical data.
              </AlertDescription>
            </Alert>
            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                <strong>Data Retention:</strong> Old articles and logs can be safely deleted to reduce 
                database size while keeping newsletters and settings.
              </AlertDescription>
            </Alert>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Purge Warning:</strong> The purge operation deletes everything permanently. 
                Always export data first if you want to keep any records.
              </AlertDescription>
            </Alert>
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <strong>Export Format:</strong> Data is exported in JSON format, making it easy to 
                import into other systems or restore if needed.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}