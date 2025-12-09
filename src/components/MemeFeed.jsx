import { useState, useMemo } from 'react';
import { db } from '../utils/db';
import MemeCard from './MemeCard';
import MemeModal from './MemeModal';

export default function MemeFeed() {
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [error, setError] = useState(null);
  const { data, isLoading } = db.useQuery({
    memes: {},
    upvotes: {},
  });

  const memes = data?.memes || [];
  const upvotes = data?.upvotes || [];

  // Group upvotes by meme ID
  const upvotesByMeme = useMemo(() => {
    const grouped = {};
    upvotes.forEach(upvote => {
      if (!grouped[upvote.memeId]) {
        grouped[upvote.memeId] = [];
      }
      grouped[upvote.memeId].push(upvote);
    });
    return grouped;
  }, [upvotes]);

  // Sort memes by upvote count (descending), then by date (newest first)
  const sortedMemes = useMemo(() => {
    return [...memes].sort((a, b) => {
      const aUpvotes = upvotesByMeme[a.id]?.length || 0;
      const bUpvotes = upvotesByMeme[b.id]?.length || 0;
      
      if (bUpvotes !== aUpvotes) {
        return bUpvotes - aUpvotes;
      }
      
      return b.createdAt - a.createdAt;
    });
  }, [memes, upvotesByMeme]);

  if (isLoading) {
    return (
      <div className="feed-container">
        <h1 className="app-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
          Meme Feed
        </h1>
        <div className="empty-feed">
          <h3>Loading memes...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feed-container">
        <h1 className="app-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
          Meme Feed
        </h1>
        <div className="empty-feed">
          <h3>Error loading memes</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (sortedMemes.length === 0) {
    return (
      <div className="feed-container">
        <h1 className="app-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
          Meme Feed
        </h1>
        <div className="empty-feed">
          <h3>No memes yet!</h3>
          <p>Be the first to create and post a meme. Sign in to create one!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-container">
      <h1 className="app-title" style={{ textAlign: 'center', marginBottom: '16px' }}>
        Meme Feed
      </h1>
      <div className="feed-grid">
        {sortedMemes.map(meme => (
          <MemeCard
            key={meme.id}
            meme={meme}
            upvotes={upvotesByMeme[meme.id] || []}
            onImageClick={(meme) => setSelectedMeme({ meme, upvotes: upvotesByMeme[meme.id] || [] })}
          />
        ))}
      </div>
      {selectedMeme && (
        <MemeModal
          meme={selectedMeme.meme}
          upvotes={selectedMeme.upvotes}
          onClose={() => setSelectedMeme(null)}
        />
      )}
    </div>
  );
}

