
'use client';

import * as React from 'react';

interface YouTubeEmbedProps {
  url: string;
}

const getYouTubeVideoId = (url: string): string | null => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1);
    }
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) return videoId;
    }
  } catch (error) {
    console.error("Invalid YouTube URL:", url);
    return null;
  }
  return null;
};

export const YouTubeEmbed = ({ url }: YouTubeEmbedProps) => {
  const videoId = getYouTubeVideoId(url);

  if (!videoId) {
    return <p className="text-destructive">URL de YouTube inválida o no soportada.</p>;
  }

  return (
    <div className="aspect-video w-full">
      <iframe
        className="w-full h-full rounded-lg shadow-xl"
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};
