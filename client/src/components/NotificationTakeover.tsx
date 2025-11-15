import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/store/notificationStore";

export default function NotificationTakeover() {
  const {
    activeNotification,
    isVisible,
    remainingTime,
    clearNotification,
    decrementTime,
  } = useNotificationStore();

  const [muted, setMuted] = useState(true);
  const [autoplayAllowed, setAutoplayAllowed] = useState(false);

  // 🔔 Notification sound (for text notifications only)
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // Preload notification sound once
  useEffect(() => {
    if (!notificationSoundRef.current) {
      // Make sure this file exists: /public/sounds/notification.mp3
      notificationSoundRef.current = new Audio("https://res.cloudinary.com/dugtxybef/video/upload/v1763200414/Akashakottayile_Sulthan_Mamukkoya_Comedy...-_AudioTrimmer.com_jlcgba.mp3");
      notificationSoundRef.current.preload = "auto";
    }
  }, []);

  // Timer for remaining time
  useEffect(() => {
    if (isVisible && remainingTime > 0) {
      const timer = setInterval(() => decrementTime(), 1000);
      return () => clearInterval(timer);
    }
  }, [isVisible, remainingTime, decrementTime]);

  // Check autoplay permission for video
  useEffect(() => {
    const allowed = localStorage.getItem("autoplayAllowed") === "true";
    setAutoplayAllowed(allowed);
    if (allowed) setMuted(false);
  }, []);

  // 🔔 Play sound ONLY when a text notification becomes visible
  useEffect(() => {
    if (
      isVisible &&
      activeNotification &&
      activeNotification.type === "text" &&
      notificationSoundRef.current
    ) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(() => {
        // Ignore autoplay errors (browser blocks, etc.)
      });
    }
  }, [isVisible, activeNotification]);

  if (!isVisible || !activeNotification) return null;

  const handleEnableSound = () => {
    const video = document.getElementById("notification-video") as HTMLVideoElement;
    if (video) {
      video.muted = false;
      video.play().catch(() => {});
      setMuted(false);
      localStorage.setItem("autoplayAllowed", "true");
      setAutoplayAllowed(true);
    }
  };

  const renderContent = () => {
    switch (activeNotification.type) {
      case "text":
        return (
          <div className="space-y-6">
            <div className="text-6xl mb-8">📢</div>
            <p
              className="text-2xl text-foreground leading-relaxed"
              data-testid="notification-message"
            >
              {activeNotification.message}
            </p>
          </div>
        );

      case "image":
        return (
          <img
            src={activeNotification.mediaUrl}
            alt="Notification image"
            className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
            data-testid="notification-image"
          />
        );

      case "video":
        return (
          <div className="space-y-4">
            <video
              id="notification-video"
              autoPlay
              playsInline
              muted={muted}
              controls
              className="max-w-full max-h-[80vh] w-auto h-auto rounded-lg shadow-lg mx-auto object-contain"
              data-testid="notification-video"
            >
              <source src={activeNotification.mediaUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {muted && !autoplayAllowed && (
              <Button
                onClick={handleEnableSound}
                className="bg-primary text-white px-4 py-2 rounded-lg"
              >
                🔊 Enable Sound
              </Button>
            )}
          </div>
        );

      case "audio":
        return (
          <div className="space-y-6">
            <div className="text-6xl mb-8">🎵</div>
            <audio
              controls
              autoPlay
              className="w-full max-w-md mx-auto"
              data-testid="notification-audio"
              src={activeNotification.mediaUrl} // supports URL or data: URL
            >
              Your browser does not support the audio element.
            </audio>
            <p className="text-lg text-muted-foreground">
              Audio message from Administration
            </p>
          </div>
        );

      default:
        return <div>Unknown notification type</div>;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-background z-50 notification-enter"
      data-testid="notification-takeover"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-card border-b border-border px-6 py-4 flex justify-between items-center">
          <div>
            <h2
              className="text-2xl font-bold text-foreground"
              data-testid="notification-title"
            >
              {activeNotification.title || "Important Announcement"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Notification from Administration
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearNotification}
            className="text-muted-foreground hover:text-foreground"
            data-testid="notification-close"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-4xl w-full text-center">{renderContent()}</div>
        </div>

        {/* Footer */}
        <div className="bg-card border-t border-border px-6 py-4 text-center">
          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <span>
              This notification will auto-close in{" "}
              <span
                className="font-bold"
                data-testid="notification-remaining-time"
              >
                {remainingTime}
              </span>{" "}
              seconds
            </span>
            <span>•</span>
            <Button
              variant="link"
              size="sm"
              onClick={clearNotification}
              className="text-primary hover:text-primary/80 p-0 h-auto"
              data-testid="notification-close-now"
            >
              Close Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
