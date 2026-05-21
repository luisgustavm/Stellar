// src/components/videos/VideoGallery.jsx
import VideoCard from "./VideoCard";

export default function VideoGallery({ videos = [] }) {
  return (
    <div className="video-grid">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
