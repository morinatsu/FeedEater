import { useAppContext } from "../context/AppContext";
import { useState } from "react";

export const Sidebar = () => {
  const { feeds, selectedFeedId, setSelectedFeedId, addFeed } = useAppContext();
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
        <button onClick={() => setIsAdding(!isAdding)}>+</button>
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
          >
            {feed.title}
          </li>
        ))}
      </ul>
    </div>
  );
};
