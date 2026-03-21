import { useAppContext } from "../context/AppContext";
import { useState } from "react";
import AddFeedIcon from '../assets/Add_Feed.png';
import AllItemsIcon from '../assets/All_Items.png';
import RefreshIcon from '../assets/Refresh_Button.png';

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
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => refreshFeeds()}
            title="Refresh All Feeds"
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.5 : 1, padding: '4px', display: 'flex', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {isLoading ? "⏳" : <img src={RefreshIcon} alt="Refresh" width="20" height="20" />}
          </button>
          <button onClick={() => setIsAdding(!isAdding)} title="Add Feed" disabled={isLoading} style={{ padding: '4px', display: 'flex', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <img src={AddFeedIcon} alt="Add" width="20" height="20" />
          </button>
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
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <img src={AllItemsIcon} alt="All" width="20" height="20" />
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
            {feed.title}
          </li>
        ))}
      </ul>
    </div>
  );
};
