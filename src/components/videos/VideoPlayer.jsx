// src/components/videos/VideoPlayer.jsx
export default function VideoPlayer({ url }) {
return (
<div className="w-full flex justify-center">
<iframe className="w-full max-w-4xl h-[400px] rounded-xl" src={url} title="Video" allowFullScreen />
</div>
);
}