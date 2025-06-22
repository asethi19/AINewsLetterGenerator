import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Eye, EyeOff, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { apiRequest } from "@/lib/api";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { settings, updateSettings } = useSettings();
  
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showBeehiivKey, setShowBeehiivKey] = useState(false);
  const [isTestingClaude, setIsTestingClaude] = useState(false);
  const [isTestingBeehiiv, setIsTestingBeehiiv] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    claudeApiKey: '',
    claudeModel: 'claude-sonnet-4-20250514',
    claudeTemperature: '0.7',
    claudeMaxTokens: 4000,
    beehiivApiKey: '',
    beehiivPublicationId: '',
    newsletterTitle: 'AI Weekly',
    issueStartNumber: 1,
    defaultNewsSource: 'https://www.inoreader.com/stream/user/1003985272/tag/AI/view/json',
  });

  // Load settings into form when modal opens
  useEffect(() => {
    if (isOpen && settings) {
      setFormData({
        claudeApiKey: settings.claudeApiKey === '***masked***' ? '' : settings.claudeApiKey || '',
        claudeModel: settings.claudeModel || 'claude-sonnet-4-20250514',
        claudeTemperature: settings.claudeTemperature || '0.7',
        claudeMaxTokens: settings.claudeMaxTokens || 4000,
        beehiivApiKey: settings.beehiivApiKey === '***masked***' ? '' : settings.beehiivApiKey || '',
        beehiivPublicationId: settings.beehiivPublicationId || '',
        newsletterTitle: settings.newsletterTitle || 'AI Weekly',
        issueStartNumber: settings.issueStartNumber || 1,
        defaultNewsSource: settings.defaultNewsSource || 'https://www.inoreader.com/stream/user/1003985272/tag/AI/view/json',
      });
    }
  }, [isOpen, settings]);

  const handleSave = () => {
    updateSettings(formData);
    onClose();
  };

  const handleTestConnection = async (service: 'claude' | 'beehiiv') => {
    const apiKey = service === 'claude' ? formData.claudeApiKey : formData.beehiivApiKey;
    
    if (!apiKey) {
      toast({
        title: "Missing API Key",
        description: "Please enter an API key to test the connection.",
        variant: "destructive",
      });
      return;
    }

    const setTesting = service === 'claude' ? setIsTestingClaude : setIsTestingBeehiiv;
    setTesting(true);

    try {
      const response = await apiRequest("POST", `/api/test-connection/${service}`, {
        apiKey,
        publicationId: service === 'beehiiv' ? formData.beehiivPublicationId : undefined,
      });

      const result = await response.json();
      
      if (result.connected) {
        toast({
          title: "Connection Successful",
          description: `Successfully connected to ${service === 'claude' ? 'Claude' : 'Beehiiv'} API.`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || `Failed to connect to ${service === 'claude' ? 'Claude' : 'Beehiiv'} API.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings & Configuration</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="claude" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="claude">Claude API</TabsTrigger>
            <TabsTrigger value="beehiiv">Beehiiv API</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="claude" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="claude-api-key" className="text-sm font-medium text-slate-700 mb-2 block">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="claude-api-key"
                    type={showClaudeKey ? "text" : "password"}
                    value={formData.claudeApiKey}
                    onChange={(e) => setFormData({ ...formData, claudeApiKey: e.target.value })}
                    placeholder="sk-ant-api03-..."
                    className="pr-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClaudeKey(!showClaudeKey)}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    {showClaudeKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestConnection('claude')}
                    disabled={isTestingClaude || !formData.claudeApiKey}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Your Claude API key from Anthropic</p>
              </div>

              <div>
                <Label htmlFor="claude-model" className="text-sm font-medium text-slate-700 mb-2 block">
                  Model
                </Label>
                <Select value={formData.claudeModel} onValueChange={(value) => setFormData({ ...formData, claudeModel: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet (Latest)</SelectItem>
                    <SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</SelectItem>
                    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                    <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="claude-temperature" className="text-sm font-medium text-slate-700 mb-2 block">
                  Temperature ({formData.claudeTemperature})
                </Label>
                <Slider
                  value={[parseFloat(formData.claudeTemperature)]}
                  onValueChange={(value) => setFormData({ ...formData, claudeTemperature: value[0].toString() })}
                  max={1}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Conservative</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <Label htmlFor="claude-max-tokens" className="text-sm font-medium text-slate-700 mb-2 block">
                  Max Tokens
                </Label>
                <Input
                  id="claude-max-tokens"
                  type="number"
                  value={formData.claudeMaxTokens}
                  onChange={(e) => setFormData({ ...formData, claudeMaxTokens: parseInt(e.target.value) || 4000 })}
                  min={100}
                  max={8000}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => handleTestConnection('claude')}
                disabled={isTestingClaude || !formData.claudeApiKey}
              >
                {isTestingClaude ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-primary rounded-full animate-spin mr-2" />
                ) : (
                  <TestTube className="w-4 h-4 mr-2" />
                )}
                Test Connection
              </Button>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600">Status:</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Ready
                </Badge>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="beehiiv" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="beehiiv-api-key" className="text-sm font-medium text-slate-700 mb-2 block">
                  API Key
                </Label>
                <div className="relative">
                  <Input
                    id="beehiiv-api-key"
                    type={showBeehiivKey ? "text" : "password"}
                    value={formData.beehiivApiKey}
                    onChange={(e) => setFormData({ ...formData, beehiivApiKey: e.target.value })}
                    placeholder="your_beehiiv_api_key"
                    className="pr-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBeehiivKey(!showBeehiivKey)}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    {showBeehiivKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTestConnection('beehiiv')}
                    disabled={isTestingBeehiiv || !formData.beehiivApiKey}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Your Beehiiv API key</p>
              </div>

              <div>
                <Label htmlFor="beehiiv-publication-id" className="text-sm font-medium text-slate-700 mb-2 block">
                  Publication ID
                </Label>
                <Input
                  id="beehiiv-publication-id"
                  value={formData.beehiivPublicationId}
                  onChange={(e) => setFormData({ ...formData, beehiivPublicationId: e.target.value })}
                  placeholder="your_publication_id"
                />
                <p className="text-xs text-slate-500 mt-1">Your Beehiiv publication ID</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="newsletter-title" className="text-sm font-medium text-slate-700 mb-2 block">
                  Newsletter Title
                </Label>
                <Input
                  id="newsletter-title"
                  value={formData.newsletterTitle}
                  onChange={(e) => setFormData({ ...formData, newsletterTitle: e.target.value })}
                  placeholder="AI Weekly"
                />
              </div>

              <div>
                <Label htmlFor="issue-start-number" className="text-sm font-medium text-slate-700 mb-2 block">
                  Starting Issue Number
                </Label>
                <Input
                  id="issue-start-number"
                  type="number"
                  value={formData.issueStartNumber}
                  onChange={(e) => setFormData({ ...formData, issueStartNumber: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="default-news-source" className="text-sm font-medium text-slate-700 mb-2 block">
                Default News Source URL
              </Label>
              <Input
                id="default-news-source"
                value={formData.defaultNewsSource}
                onChange={(e) => setFormData({ ...formData, defaultNewsSource: e.target.value })}
                placeholder="https://www.inoreader.com/stream/user/1003985272/tag/AI/view/json"
              />
              <p className="text-xs text-slate-500 mt-1">Default RSS/JSON feed URL for fetching news</p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="text-center py-8">
              <p className="text-slate-500">Advanced settings coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
