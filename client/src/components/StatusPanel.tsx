import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { List, Trash2, Download, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { format } from "date-fns";
import type { ActivityLog } from "@shared/schema";

export default function StatusPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch activity logs
  const { data: logsData, isLoading } = useQuery({
    queryKey: ["/api/activity-logs"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const logs: ActivityLog[] = logsData?.logs || [];

  // Clear logs mutation
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/activity-logs");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity-logs"] });
      toast({
        title: "Logs Cleared",
        description: "Activity logs have been cleared successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to clear activity logs",
        variant: "destructive",
      });
    },
  });

  const handleExportLogs = () => {
    const logText = logs.map(log => 
      `[${format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}] ${log.type.toUpperCase()}: ${log.message}${log.details ? ` - ${log.details}` : ''}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Logs Exported",
      description: "Activity logs have been downloaded as a text file.",
    });
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'warning':
        return 'bg-yellow-400';
      default:
        return 'bg-blue-400';
    }
  };

  const formatTime = (timestamp: Date) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  // Mock status indicators - in a real app these would be from API calls
  const statusIndicators = [
    { name: "Claude API", status: "Connected", detail: "API key configured", connected: true },
    { name: "Beehiiv API", status: "Connected", detail: "Publication ready", connected: true },
    { name: "News Feed", status: "Active", detail: "Auto-refresh enabled", connected: true },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <List className="text-primary mr-3 w-5 h-5" />
            Activity Log & Status
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearLogsMutation.mutate()}
              disabled={clearLogsMutation.isPending || logs.length === 0}
              className="text-slate-600 hover:text-slate-800"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportLogs}
              disabled={logs.length === 0}
              className="text-primary hover:text-blue-700"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <List className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No activity logs yet.</p>
            <p className="text-sm">Activity will appear here as you use the app.</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${getLogColor(log.type)}`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{log.message}</span>
                      <span className="text-xs text-slate-500">{formatTime(log.timestamp)}</span>
                    </div>
                    {log.details && (
                      <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Status Indicators */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statusIndicators.map((indicator) => (
              <div key={indicator.name} className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${indicator.connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className="text-sm font-medium text-slate-800">{indicator.name}</span>
                </div>
                <span className="text-xs text-slate-600">{indicator.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
