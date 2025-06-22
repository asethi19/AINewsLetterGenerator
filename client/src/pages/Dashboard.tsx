import { useState, useEffect } from "react";
import { Settings, Newspaper, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewsFeeder from "@/components/NewsFeeder";
import NewsletterGenerator from "@/components/NewsletterGenerator";
import ControlsPanel from "@/components/ControlsPanel";
import StatusPanel from "@/components/StatusPanel";
import SettingsModal from "@/components/SettingsModal";
import ScheduleManager from "@/components/ScheduleManager";

export default function Dashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-700 rounded-lg flex items-center justify-center">
                  <Newspaper className="text-white text-xl" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-800">AI Newsletter Automation Hub</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{formatDateTime(currentDateTime)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="text-slate-600 hover:text-slate-800"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          {/* Left Column */}
          <div className="space-y-6">
            <NewsFeeder />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <NewsletterGenerator />
            <ControlsPanel />
          </div>
        </div>

        {/* Status Panel (Full Width) */}
        <div className="mt-8">
          <StatusPanel />
        </div>

        {/* Schedule Manager (Full Width) */}
        <div className="mt-8">
          <ScheduleManager />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
