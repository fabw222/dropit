import { useParams } from "react-router-dom";
import { WALRUS_AGGREGATOR_URL } from "../constants";

export default function Watch() {
  const { blobId } = useParams<{ blobId: string }>();

  if (!blobId) {
    return <div className="watch-page"><p>Invalid video link</p></div>;
  }

  const videoUrl = `${WALRUS_AGGREGATOR_URL}/v1/blobs/${blobId}`;

  return (
    <div className="watch-page">
      <div className="video-container">
        <video controls autoPlay className="video-player">
          <source src={videoUrl} />
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  );
}
