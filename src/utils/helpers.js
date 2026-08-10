import {
  FileText, Mic, Image, Video, CheckSquare,
} from "lucide-react";
import React from "react";

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? "s" : ""} ago`;
};

export const formatFullDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getMemoryTypeIcon = (type, size = 16) => {
  const props = { size, strokeWidth: 1.5 };
  switch (type) {
    case "text": return React.createElement(FileText, props);
    case "voice": return React.createElement(Mic, props);
    case "image": return React.createElement(Image, props);
    case "video": return React.createElement(Video, props);
    case "checklist": return React.createElement(CheckSquare, props);
    default: return React.createElement(FileText, props);
  }
};


export const groupMemoriesByDate = (memories) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const groups = {
    Today: [],
    Yesterday: [],
    "Last Week": [],
    "Older Memories": [],
  };

  memories.forEach((m) => {
    const memDate = new Date(m.date);
    if (memDate.toDateString() === today.toDateString()) {
      groups["Today"].push(m);
    } else if (memDate.toDateString() === yesterday.toDateString()) {
      groups["Yesterday"].push(m);
    } else if (memDate > lastWeek) {
      groups["Last Week"].push(m);
    } else {
      groups["Older Memories"].push(m);
    }
  });

  return groups;
};

export const truncate = (str, len = 120) => {
  if (!str || str.length <= len) return str;
  return str.substring(0, len) + "...";
};

export const getInitials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

export const getDaysUntilDelete = (deletedAt) => {
  const deleteDate = new Date(deletedAt);
  const expiry = new Date(deleteDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysLeft);
};
