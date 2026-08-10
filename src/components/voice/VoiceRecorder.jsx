import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Upload } from "lucide-react";
import "./VoiceRecorder.css";

export default function VoiceRecorder({ onSaveSuccess, onCancel }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const uploadAudio = async () => {
    if (!audioBlob || !title.trim()) {
      setError("Please enter a title for the voice memory");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording_${Date.now()}.webm`);
      formData.append("title", title.trim());
      formData.append("description", "");
      formData.append("duration", recordingTime.toString());

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.onload = async () => {
        if (xhr.status === 201 || xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            onSaveSuccess?.(response.memory);
            resetRecorder();
          } else {
            setError(response.message || "Failed to save voice memory");
          }
        } else {
          setError("Failed to upload audio");
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        setError("Network error occurred");
        setUploading(false);
      };

      const token = localStorage.getItem("mv_auth_token");
      xhr.open("POST", `${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/voice`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);
    } catch (err) {
      console.error("Error uploading audio:", err);
      setError("Failed to upload audio. Please try again.");
      setUploading(false);
    }
  };

  const resetRecorder = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setTitle("");
    setUploadProgress(0);
  };

  const cancelRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    resetRecorder();
    onCancel?.();
  };

  return (
    <div className="voice-recorder">
      <div className="voice-recorder-header">
        <h3>🎙 Voice Memory</h3>
      </div>

      {error && (
        <div className="voice-error">
          {error}
        </div>
      )}

      {!audioUrl ? (
        <div className="voice-recorder-controls">
          <div className="recording-timer">
            {isRecording ? (
              <>
                <span className="recording-indicator"></span>
                <span className="recording-time">{formatTime(recordingTime)}</span>
              </>
            ) : (
              <span className="recording-time">00:00</span>
            )}
          </div>

          <button
            className={`mic-button ${isRecording ? "recording" : ""}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={uploading}
          >
            {isRecording ? <Square size={24} /> : <Mic size={24} />}
          </button>

          {isRecording && (
            <p className="recording-hint">Click to stop recording</p>
          )}
        </div>
      ) : (
        <div className="voice-preview">
          <div className="voice-preview-header">
            <h4>Recording Complete</h4>
            <span className="recording-duration">{formatTime(recordingTime)}</span>
          </div>

          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="voice-audio-player"
          />

          <div className="voice-preview-form">
            <input
              type="text"
              placeholder="Enter title for this voice memory..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="voice-title-input"
              disabled={uploading}
            />

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <span className="progress-text">{uploadProgress}%</span>
              </div>
            )}

            <div className="voice-preview-actions">
              <button
                className="btn btn-secondary"
                onClick={cancelRecording}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={uploadAudio}
                disabled={uploading || !title.trim()}
              >
                {uploading ? "Saving..." : "Save Voice Memory"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}