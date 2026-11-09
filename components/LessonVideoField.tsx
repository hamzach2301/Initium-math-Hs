"use client";

import { CheckCircle2, Link2, TriangleAlert } from "lucide-react";
import { getYouTubeThumbnailUrl, parseYouTubeVideo } from "../lib/youtube";

type LessonVideoFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
};

/** Controlled YouTube URL field for lesson create and edit forms. */
export function LessonVideoField({ value, onChange, id = "youtube-url", label = "YouTube video", disabled = false }: LessonVideoFieldProps) {
  const video = parseYouTubeVideo(value);
  const hasValue = value.trim().length > 0;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Link2 size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-current/45" />
        <input
          id={id}
          type="url"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://youtu.be/VIDEO_ID"
          aria-invalid={hasValue && !video}
          aria-describedby={`${id}-help ${hasValue ? `${id}-status` : ""}`}
          className="w-full rounded-lg border border-current/15 bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-current/45 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>
      <p id={`${id}-help`} className="mt-2 text-xs text-current/55">Optional. Paste a YouTube watch, share, or embed link.</p>
      {hasValue && !video && <p id={`${id}-status`} role="alert" className="mt-2 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"><TriangleAlert size={14} aria-hidden="true" />Enter a valid YouTube URL.</p>}
      {video && (
        <figure id={`${id}-status`} className="mt-3 overflow-hidden rounded-lg border border-current/10">
          <img src={getYouTubeThumbnailUrl(video.videoId)} alt="YouTube video preview" className="aspect-video w-full object-cover" />
          <figcaption className="flex items-center gap-1.5 px-3 py-2 text-xs text-current/65"><CheckCircle2 size={14} className="text-emerald-600" aria-hidden="true" />Video preview ready{video.startSeconds ? ` · starts at ${video.startSeconds}s` : ""}</figcaption>
        </figure>
      )}
    </div>
  );
}
