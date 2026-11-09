"use client";

import { AlertCircle, ExternalLink, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getYouTubeEmbedUrl, parseYouTubeVideo } from "../lib/youtube";

type YouTubeEmbedProps = {
  url?: string | null;
  title: string;
  className?: string;
};

export function YouTubeEmbed({ url, title, className = "" }: YouTubeEmbedProps) {
  const video = url ? parseYouTubeVideo(url) : null;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    setStatus("loading");
    const timeout = window.setTimeout(() => setStatus((current) => current === "loading" ? "error" : current), 15_000);
    return () => window.clearTimeout(timeout);
  }, [url]);

  if (!video) {
    return (
      <div className={`grid aspect-video place-items-center rounded-xl border border-dashed border-current/20 p-6 text-center ${className}`} role="alert">
        <div>
          <AlertCircle className="mx-auto text-current/45" size={24} aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">This video link is invalid.</p>
          <p className="mt-1 text-xs text-current/55">Use a YouTube watch, share, or embed link.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`grid aspect-video place-items-center rounded-xl border border-dashed border-current/20 p-6 text-center ${className}`} role="alert">
        <div>
          <AlertCircle className="mx-auto text-current/45" size={24} aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">This video cannot be embedded here.</p>
            <a href={url ?? undefined} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm underline underline-offset-4">
            Watch on YouTube <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video overflow-hidden rounded-xl bg-black ${className}`}>
      {status === "loading" && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-current/[.06]" aria-live="polite" aria-label="Loading video">
          <LoaderCircle className="animate-spin text-current/50" size={24} aria-hidden="true" />
        </div>
      )}
      <iframe
        className="absolute inset-0 h-full w-full"
        src={getYouTubeEmbedUrl(video)}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
      />
    </div>
  );
}
