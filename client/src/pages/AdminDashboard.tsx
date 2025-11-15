import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Radio, XCircle, Save, Mic, Square } from 'lucide-react';
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

  // 🔴 Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: 'Recording not supported',
          description: 'Your browser does not support audio recording.',
          variant: 'destructive',
        });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const dataUrl = await blobToDataUrl(audioBlob);

        // 🟢 Use data URL as mediaUrl so backend stays unchanged
        setRecordedAudioUrl(dataUrl);
        setMediaUrl(dataUrl);
        setNotificationType('audio');

        // Stop all tracks (mic)
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: 'Recording started',
        description: 'Speak now. Click stop when you are done.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Failed to start recording',
        description: error?.message || 'Microphone access was denied.',
        variant: 'destructive',
      });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({
        title: 'Recording stopped',
        description: 'You can preview the audio before sending.',
      });
    }
  };

  const handleClearRecording = () => {
    setRecordedAudioUrl(null);
    setMediaUrl('');
    // Optional: reset type back to text
    // setNotificationType('text');
  };

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
      setRecordedAudioUrl(null);
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
        description: 'Please provide either a message or media (recorded or URL)',
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
              <Select
                value={notificationType}
                onValueChange={(value: any) => setNotificationType(value)}
              >
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

            {/* Manual media URL (still supported) */}
            <div>
              <Label htmlFor="media-url">Media URL (for image/video/audio)</Label>
              <Input
                id="media-url"
                type="url"
                placeholder="https://example.com/media.jpg"
                value={mediaUrl.startsWith('data:') ? '' : mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                data-testid="notification-media-url-input"
              />
              {mediaUrl.startsWith('data:') && (
                <p className="text-xs text-muted-foreground mt-1">
                  Using recorded audio as media source.
                </p>
              )}
            </div>

            {/* 🎙 Recording controls */}
            <div className="space-y-2">
              <Label>Record Voice Message (optional)</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  onClick={handleStartRecording}
                  disabled={isRecording}
                  variant={isRecording ? 'outline' : 'default'}
                  className="flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  {isRecording ? 'Recording...' : 'Start Recording'}
                </Button>
                <Button
                  type="button"
                  onClick={handleStopRecording}
                  disabled={!isRecording}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  Stop
                </Button>

                {recordedAudioUrl && (
                  <>
                    <audio
                      controls
                      src={recordedAudioUrl}
                      className="h-10"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleClearRecording}
                    >
                      Clear Recording
                    </Button>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                After you stop recording, the audio will be attached to this notification as an
                audio message.
              </p>
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
                  onChange={(e) =>
                    setDefaultPopupDuration(parseInt(e.target.value) || 5000)
                  }
                  data-testid="popup-duration-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Duration for celebration popups
                </p>
              </div>
              <div>
                <Label htmlFor="notification-duration">
                  Default Notification Duration (ms)
                </Label>
                <Input
                  id="notification-duration"
                  type="number"
                  min="5000"
                  max="300000"
                  step="1000"
                  value={defaultNotificationDuration}
                  onChange={(e) =>
                    setDefaultNotificationDuration(
                      parseInt(e.target.value) || 15000
                    )
                  }
                  data-testid="notification-duration-setting-input"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Duration for takeover notifications
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <Label htmlFor="global-sound">Global Sound</Label>
                <p className="text-xs text-muted-foreground">
                  Enable/disable sound for all celebration popups
                </p>
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
