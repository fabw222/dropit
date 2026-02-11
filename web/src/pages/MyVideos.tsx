import {
  useCurrentAccount,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { Link } from "react-router-dom";
import { PACKAGE_ID } from "../constants";

interface VideoFields {
  title: string;
  blob_id: string;
  owner: string;
  created_at: string;
}

export default function MyVideos() {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const { data, isPending, refetch } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: {
        StructType: `${PACKAGE_ID}::video::Video`,
      },
      options: { showContent: true },
    },
    { enabled: !!account?.address }
  );

  if (!account) {
    return (
      <div className="my-videos-page">
        <p>Connect your wallet to see your videos</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="my-videos-page">
        <p>Loading...</p>
      </div>
    );
  }

  const videos = data?.data || [];

  const handleDelete = async (objectId: string) => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::video::delete_video`,
        arguments: [tx.object(objectId)],
      });
      await signAndExecute({ transaction: tx });
      refetch();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="my-videos-page">
      <h2>My Videos</h2>
      {videos.length === 0 ? (
        <p>No videos yet. <Link to="/">Upload one!</Link></p>
      ) : (
        <div className="video-list">
          {videos.map((obj) => {
            const fields = (obj.data?.content as any)?.fields as VideoFields;
            const objectId = obj.data?.objectId || "";
            if (!fields) return null;

            const shareLink = `${window.location.origin}/watch/${fields.blob_id}`;
            const date = new Date(Number(fields.created_at)).toLocaleDateString();

            return (
              <div key={objectId} className="video-card">
                <div className="video-card-info">
                  <h3>{fields.title}</h3>
                  <p className="video-date">{date}</p>
                </div>
                <div className="video-card-actions">
                  <Link to={`/watch/${fields.blob_id}`} className="btn">Watch</Link>
                  <button onClick={() => navigator.clipboard.writeText(shareLink)} className="btn">Copy Link</button>
                  <button onClick={() => handleDelete(objectId)} className="btn btn-danger">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
