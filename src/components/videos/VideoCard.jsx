// src/components/videos/VideoCard.jsx
export default function VideoCard({ video }) {
  const hasTakeaways = Array.isArray(video.takeaways) && video.takeaways.length > 0;

  return (
    <article className="video-card">
      <iframe
        src={video.url}
        title={video.title}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      <div className="video-card-content">
        <div className="video-card-meta">
          <span>{video.category}</span>
          <span>{video.source}</span>
          {video.level && <span>{video.level}</span>}
          {video.duration && <span>{video.duration}</span>}
        </div>
        <h2>{video.title}</h2>
        <p>{video.description}</p>
        {hasTakeaways && (
          <ul className="video-takeaways" aria-label="Pontos principais">
            {video.takeaways.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
        {video.watchUrl && (
          <a className="video-open-link" href={video.watchUrl} target="_blank" rel="noreferrer">
            Abrir no YouTube
          </a>
        )}
      </div>
    </article>
  );
}
