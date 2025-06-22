import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Globe, 
  Edit, 
  Trash2, 
  Play, 
  Pause,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';
import { format } from 'date-fns';
import type { Schedule, InsertSchedule } from '@shared/schema';

export default function ScheduleManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    frequency: 'daily',
    time: '09:00',
    newsSourceUrl: 'https://www.inoreader.com/stream/user/1003985272/tag/AI/view/json',
    maxArticles: 5,
    autoApprove: false,
    enabled: true,
  });

  // Fetch schedules
  const { data: schedulesData, isLoading } = useQuery({
    queryKey: ['/api/schedules'],
  });

  const schedules: Schedule[] = schedulesData?.schedules || [];

  // Create/Update schedule mutation
  const saveScheduleMutation = useMutation({
    mutationFn: async (scheduleData: InsertSchedule | (Partial<Schedule> & { id: number })) => {
      const url = 'id' in scheduleData ? `/api/schedules/${scheduleData.id}` : '/api/schedules';
      const method = 'id' in scheduleData ? 'PATCH' : 'POST';
      const response = await apiRequest(method, url, scheduleData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      setIsDialogOpen(false);
      setEditingSchedule(null);
      resetForm();
      toast({
        title: 'Success',
        description: editingSchedule ? 'Schedule updated successfully' : 'Schedule created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save schedule',
        variant: 'destructive',
      });
    },
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/schedules/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete schedule',
        variant: 'destructive',
      });
    },
  });

  // Toggle schedule mutation
  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const response = await apiRequest('PATCH', `/api/schedules/${id}`, { enabled });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      frequency: 'daily',
      time: '09:00',
      newsSourceUrl: 'https://www.inoreader.com/stream/user/1003985272/tag/AI/view/json',
      maxArticles: 5,
      autoApprove: false,
      enabled: true,
    });
  };

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name,
      frequency: schedule.frequency,
      time: schedule.time,
      newsSourceUrl: schedule.newsSourceUrl,
      maxArticles: schedule.maxArticles || 5,
      autoApprove: schedule.autoApprove || false,
      enabled: schedule.enabled || true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.newsSourceUrl.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (editingSchedule) {
      saveScheduleMutation.mutate({ ...formData, id: editingSchedule.id });
    } else {
      saveScheduleMutation.mutate(formData);
    }
  };

  const formatNextRun = (date: Date | null) => {
    if (!date) return 'Not scheduled';
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const getFrequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-green-100 text-green-800';
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="text-primary mr-3 w-5 h-5" />
            Schedule Manager
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingSchedule(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="schedule-name">Schedule Name *</Label>
                    <Input
                      id="schedule-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Daily AI News"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="max-articles">Max Articles</Label>
                    <Input
                      id="max-articles"
                      type="number"
                      min="1"
                      max="20"
                      value={formData.maxArticles}
                      onChange={(e) => setFormData({ ...formData, maxArticles: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="news-source">News Source URL *</Label>
                    <Input
                      id="news-source"
                      value={formData.newsSourceUrl}
                      onChange={(e) => setFormData({ ...formData, newsSourceUrl: e.target.value })}
                      placeholder="https://example.com/feed.json"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.autoApprove}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoApprove: checked })}
                    />
                    <Label>Auto-approve newsletters</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.enabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                    />
                    <Label>Enable schedule</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveScheduleMutation.isPending}>
                  {saveScheduleMutation.isPending ? 'Saving...' : (editingSchedule ? 'Update' : 'Create')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-slate-300 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>No schedules configured</p>
            <p className="text-sm">Create your first automated newsletter schedule</p>
          </div>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-slate-800">{schedule.name}</h3>
                      <Badge className={getFrequencyBadgeColor(schedule.frequency)}>
                        {schedule.frequency}
                      </Badge>
                      {schedule.autoApprove && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Auto-approve
                        </Badge>
                      )}
                      {!schedule.enabled && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <Pause className="w-3 h-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-6 text-sm text-slate-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {schedule.time}
                      </span>
                      <span className="flex items-center">
                        <Globe className="w-4 h-4 mr-1" />
                        {schedule.maxArticles} articles max
                      </span>
                      <span>Next: {formatNextRun(schedule.nextRun)}</span>
                    </div>
                    
                    {schedule.lastRun && (
                      <div className="text-xs text-slate-500 mt-1">
                        Last run: {format(new Date(schedule.lastRun), 'MMM d, yyyy h:mm a')}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleScheduleMutation.mutate({ 
                        id: schedule.id, 
                        enabled: !schedule.enabled 
                      })}
                      disabled={toggleScheduleMutation.isPending}
                    >
                      {schedule.enabled ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                      disabled={deleteScheduleMutation.isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}