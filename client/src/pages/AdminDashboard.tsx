import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Radio, XCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [notificationType, setNotificationType] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [duration, setDuration] = useState(15);
  const [defaultPopupDuration, setDefaultPopupDuration] = useState(5000);
  const [defaultNotificationDuration, setDefaultNotificationDuration] = useState(15000);
  const [globalSoundEnabled, setGlobalSoundEnabled] = useState(true);

  const pushNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/admin/notifications', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Notification Sent',
        description: 'Notification has been pushed to all clients',
      });
      // Clear form
      setTitle('');
      setMessage('');
      setMediaUrl('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Send Notification',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const clearNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/admin/notifications/clear');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Notifications Cleared',
        description: 'All active notifications have been cleared',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Clear Notifications',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handlePushNotification = () => {
    if (!message && !mediaUrl) {
      toast({
        title: 'Invalid Input',
        description: 'Please provide either a message or media URL',
        variant: 'destructive',
      });
      return;
    }

    pushNotificationMutation.mutate({
      type: notificationType,
      title: title || undefined,
      message: message || undefined,
      mediaUrl: mediaUrl || undefined,
      duration: duration * 1000, // Convert to milliseconds
    });
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-2">Manage notifications and system settings</p>
        </div>

        {/* Notification Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Push Takeover Notification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="notification-type">Notification Type</Label>
              <Select value={notificationType} onValueChange={(value: any) => setNotificationType(value)}>
                <SelectTrigger data-testid="notification-type-select">
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Message</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  placeholder="Notification title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="notification-title-input"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  max="300"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 15)}
                  data-testid="notification-duration-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here..."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                data-testid="notification-message-textarea"
              />
            </div>

            <div>
              <Label htmlFor="media-url">Media URL (for image/video/audio)</Label>
              <Input
                id="media-url"
                type="url"
                placeholder="https://example.com/media.jpg"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                data-testid="notification-media-url-input"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handlePushNotification}
                disabled={pushNotificationMutation.isPending}
                data-testid="push-notification-button"
              >
                <Radio className="w-4 h-4 mr-2" />
                {pushNotificationMutation.isPending ? 'Pushing...' : 'Push Notification'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => clearNotificationMutation.mutate()}
                disabled={clearNotificationMutation.isPending}
                data-testid="clear-notification-button"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {clearNotificationMutation.isPending ? 'Clearing...' : 'Clear Active'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="popup-duration">Default Popup Duration (ms)</Label>
                <Input
                  id="popup-duration"
                  type="number"
                  min="1000"
                  max="30000"
                  step="1000"
                  value={defaultPopupDuration}
                  onChange={(e) => setDefaultPopupDuration(parseInt(e.target.value) || 5000)}
                  data-testid="popup-duration-input"
                />
                <p className="text-xs text-muted-foreground mt-1">Duration for celebration popups</p>
              </div>
              <div>
                <Label htmlFor="notification-duration">Default Notification Duration (ms)</Label>
                <Input
                  id="notification-duration"
                  type="number"
                  min="5000"
                  max="300000"
                  step="1000"
                  value={defaultNotificationDuration}
                  onChange={(e) => setDefaultNotificationDuration(parseInt(e.target.value) || 15000)}
                  data-testid="notification-duration-setting-input"
                />
                <p className="text-xs text-muted-foreground mt-1">Duration for takeover notifications</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="global-sound">Global Sound</Label>
                <p className="text-xs text-muted-foreground">Enable/disable sound for all celebration popups</p>
              </div>
              <Switch
                id="global-sound"
                checked={globalSoundEnabled}
                onCheckedChange={setGlobalSoundEnabled}
                data-testid="global-sound-switch"
              />
            </div>

            <Button
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              data-testid="save-settings-button"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
