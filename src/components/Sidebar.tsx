import { useAppContext } from "../context/AppContext";
import { useState } from "react";

export const Sidebar = () => {
  const { feeds, selectedFeedId, setSelectedFeedId, addFeed, deleteFeed, refreshFeeds, isLoading, markFeedAsUnread } = useAppContext();
  const [newUrl, setNewUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl) {
      await addFeed(newUrl);
      setNewUrl("");
      setIsAdding(false);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Feeds</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => refreshFeeds()}
            title="Refresh All Feeds"
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.5 : 1 }}
          >
            {isLoading ? "⏳" : "🔄"}
          </button>
          <button onClick={() => setIsAdding(!isAdding)} title="Add Feed" disabled={isLoading}>+</button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="add-feed-form">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://example.com/rss"
            autoFocus
          />
          <button type="submit">Add</button>
        </form>
      )}

      <ul className="feed-list">
        <li
          className={selectedFeedId === null ? "selected" : ""}
          onClick={() => setSelectedFeedId(null)}
        >
          All Items
        </li>
        {feeds.map((feed) => (
          <li
            key={feed.id}
            className={selectedFeedId === feed.id ? "selected" : ""}
            onClick={() => setSelectedFeedId(feed.id)}
            onContextMenu={async (e) => {
              e.preventDefault();
              const action = await window.api.showFeedContextMenu();
              if (action === 'unread') {
                markFeedAsUnread(feed.id);
              } else if (action === 'delete') {
                if (window.confirm(`「${feed.title}」を削除してもよろしいですか？`)) {
                  deleteFeed(feed.id);
                }
              }
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <div>{feed.title}</div>
              {feed.error_msg && (
                <div style={{ fontSize: '0.8em', color: '#ff4444', textAlign: 'right', marginTop: '4px' }}>
                  unreachable
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
