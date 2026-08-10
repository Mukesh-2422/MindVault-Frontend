import React, { useState, useRef, useEffect } from "react";
import { Play, Square, Trash2 } from "lucide-react";
import { getMediaUrl } from "../../api/voice";
import "./VoicePlayer.css";

export default function VoicePlayer({ voiceMemory, onDelete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(voiceMemory.duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || voiceMemory.duration || 0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [voiceMemory.duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    if (audioRef.current) {
      audioRef.current.currentTime = pct * duration;
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="voice-player">
      <div className="voice-player-header">
        <div className="voice-player-info">
          <h4>🎙 Voice Memory</h4>
          <div className="voice-player-meta">
            <span className="voice-recorded-date">Recorded: {formatDate(voiceMemory.date || voiceMemory.createdAt)}</span>
            <span className="voice-duration">Duration: {formatTime(duration)}</span>
          </div>
        </div>
        {onDelete && (
          <button className="delete-btn" onClick={() => onDelete(voiceMemory.id)}>
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="voice-player-controls">
        <button className="play-btn" onClick={togglePlay}>
          {isPlaying ? <Square size={20} /> : <Play size={20} />}
        </button>

        <div className="voice-progress" onClick={handleSeek}>
          <div className="voice-progress-bar">
            <div className="voice-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="voice-times">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={getMediaUrl(voiceMemory.mediaUrl || voiceMemory.audioUrl)}
        style={{ display: "none" }}
      />
    </div>
  );
}