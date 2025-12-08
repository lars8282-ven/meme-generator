import { useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, tx } from '../utils/db';

export default function MemeModal({ meme, upvotes, onClose }) {
  const { user } = useAuth();

  const upvoteCount = upvotes?.length || 0;
  const hasUpvoted = useMemo(() => {
    if (!user || !upvotes) return false;
    return upvotes.some(upvote => upvote.userId === user.id);
  }, [user, upvotes]);

  const handleUpvote = async () => {
    if (!user) {
      alert('Please sign in to upvote memes');
      return;
    }

    if (hasUpvoted) {
      // Remove upvote
      const existingUpvote = upvotes.find(upvote => upvote.userId === user.id);
      if (existingUpvote) {
        try {
          await db.transact(
            tx.upvotes[existingUpvote.id].delete()
          );
        } catch (error) {
          console.error('Error removing upvote:', error);
        }
      }
    } else {
      // Add upvote
      const id = crypto.randomUUID();
      try {
        await db.transact(
          tx.upvotes[id].update({
            memeId: meme.id,
            userId: user.id,
            createdAt: Date.now(),
          })
        );
      } catch (error) {
        console.error('Error adding upvote:', error);
      }
    }
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="meme-modal-overlay" onClick={onClose}>
      <div className="meme-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="meme-modal-close" onClick={onClose}>×</button>
        <img src={meme.imageUrl} alt="Meme" className="meme-modal-image" />
        <div className="meme-modal-footer">
          <div className="upvote-section">
            <button
              className={`btn-upvote ${hasUpvoted ? 'upvoted' : ''}`}
              onClick={handleUpvote}
              disabled={!user}
            >
              <span>▲</span>
              <span className="upvote-count">{upvoteCount}</span>
            </button>
          </div>
          <div className="meme-modal-meta">
            <span>{formatDate(meme.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

