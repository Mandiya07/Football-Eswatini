
import React from 'react';

interface VideoPlayerProps {
  src: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, title }) => {
  const getEmbedUrl = (url: string) => {
    if (!url) return null;

    // YouTube (standard, shorts, embed, shortened)
    // Handles: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
        return `https://www.youtube.com/embed/${ytMatch[2]}`;
    }

    // Facebook
    // Handles standard video posts and watch URLs
    if (url.includes('facebook.com') || url.includes('fb.watch')) {
        // Facebook requires the URL to be encoded in their plugins endpoint
        return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
    }

    // Vimeo
    const vimeoRegExp = /vimeo\.com\/(\d+)/;
    const vimeoMatch = url.match(vimeoRegExp);
    if (vimeoMatch && vimeoMatch[1]) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Check if it is a direct video file (mp4, etc)
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
        return null; // Use native video tag
    }

    // Fallback: Return generic URL if it looks like an embed link already
    if (url.includes('embed') || url.includes('player')) {
        return url; 
    }
    
    return null; 
  };

  const embedUrl = getEmbedUrl(src);

  if (embedUrl) {
    return (
      <div className="relative w-full pb-[56.25%] bg-black rounded-lg overflow-hidden shadow-lg">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
