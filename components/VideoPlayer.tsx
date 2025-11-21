
import React from 'react';

interface VideoPlayerProps {
  src: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title }) => {
  const getYouTubeEmbedUrl = (url: string) => {
    // Matches standard, short, and embed YouTube URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const embedUrl = getYouTubeEmbedUrl(src);

  if (embedUrl) {
    return (
      <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          frameBorder="0"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg">
      <video
        className="w-full h-auto"
        controls
        playsInline
        src={src}
        title={title}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
