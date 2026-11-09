/** A parsed YouTube link, including an optional start position in seconds. */
export type YouTubeVideo = {
  videoId: string;
  startSeconds?: number;
};

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

function parseStartTime(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value);

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match || !match[0]) return undefined;
  const seconds = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  return seconds > 0 ? seconds : undefined;
}

/**
 * Safely extracts the canonical 11-character video ID from supported YouTube
 * URLs. It intentionally rejects arbitrary URLs and malformed IDs.
 */
export function parseYouTubeVideo(url: string): YouTubeVideo | null {
  if (!url.trim()) return null;

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (parsed.pathname === "/watch") videoId = parsed.searchParams.get("v");
      else if (/^\/(embed|shorts)\//.test(parsed.pathname)) videoId = parsed.pathname.split("/")[2] ?? null;
    }

    if (!videoId || !VIDEO_ID.test(videoId)) return null;
    return {
      videoId,
      startSeconds: parseStartTime(parsed.searchParams.get("t") ?? parsed.searchParams.get("start")),
    };
  } catch {
    return null;
  }
}

/** Extracts only the video ID for form validation and data-model consumers. */
export function parseYouTubeVideoId(url: string): string | null {
  return parseYouTubeVideo(url)?.videoId ?? null;
}

export function getYouTubeEmbedUrl(video: YouTubeVideo): string {
  const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
  if (video.startSeconds) params.set("start", String(video.startSeconds));
  return `https://www.youtube-nocookie.com/embed/${video.videoId}?${params.toString()}`;
}

export function getYouTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
