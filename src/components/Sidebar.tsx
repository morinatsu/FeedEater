import { useAppContext } from "../context/AppContext";
import { useState } from "react";
import AddFeedIcon from '../assets/Add_Feed.png';
import AllItemsIcon from '../assets/All_Items.png';
import RefreshIcon from '../assets/Refresh_Button.png';
import type { Feed } from "../types";

export const Sidebar = () => {
  const { feeds, folders, selectedFeedId, setSelectedFeedId, addFeed, deleteFeed, refreshFeeds, isLoading, markFeedAsUnread, addFolder, deleteFolder, updateFeedFolder } = useAppContext();
  const [newUrl, setNewUrl] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  const toggleFolder = (folderId: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl) {
      await addFeed(newUrl);
      setNewUrl("");
      setIsAddingFeed(false);
    }
  };

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName) {
      await addFolder(newFolderName);
      setNewFolderName("");
      setIsAddingFolder(false);
    }
  };

  const renderFeedItem = (feed: Feed, depth: number = 0) => {
    const isUnread = (feed.unread_count ?? 0) > 0;
    return (
      <li
        key={feed.id}
        className={`${selectedFeedId === feed.id ? "selected" : ""} ${isUnread ? "unread" : "read"}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedFeedId(feed.id);
        }}
        onContextMenu={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const result = await window.api.showFeedContextMenu();
          if (result.action === 'unread') {
            markFeedAsUnread(feed.id);
          } else if (result.action === 'delete') {
            if (window.confirm(`「${feed.title}」を削除してもよろしいですか？`)) {
              deleteFeed(feed.id);
            }
          } else if (result.action === 'move') {
            updateFeedFolder(feed.id, result.folderId || null);
          }
        }}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
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
    );
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
          <button onClick={() => { setIsAddingFolder(!isAddingFolder); setIsAddingFeed(false); }} title="Add Folder" disabled={isLoading} style={{ padding: '4px', display: 'flex', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--text-color)' }}>
            📁+
          </button>
          <button onClick={() => { setIsAddingFeed(!isAddingFeed); setIsAddingFolder(false); }} title="Add Feed" disabled={isLoading} style={{ padding: '4px', display: 'flex', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <img src={AddFeedIcon} alt="Add" width="20" height="20" />
          </button>
        </div>
      </div>

      {isAddingFolder && (
        <form onSubmit={handleAddFolder} className="add-feed-form">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder Name"
            autoFocus
          />
          <button type="submit">Add</button>
        </form>
      )}

      {isAddingFeed && (
        <form onSubmit={handleAddFeed} className="add-feed-form">
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

        {/* Folders and Feeds inside them */}
        {folders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const folderFeeds = feeds.filter(f => f.folder_id === folder.id);
          const hasUnread = folderFeeds.some(f => (f.unread_count ?? 0) > 0);

          return (
            <div key={`folder-${folder.id}`}>
              <li
                onClick={() => toggleFolder(folder.id)}
                onContextMenu={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const action = await window.api.showFolderContextMenu();
                  if (action === 'delete') {
                    if (window.confirm(`フォルダ「${folder.name}」を削除してもよろしいですか？\n(中のフィードは削除されません)`)) {
                      deleteFolder(folder.id);
                    }
                  }
                }}
                style={{ fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingLeft: '8px' }}
                className={hasUnread ? "unread" : "read"}
              >
                <span>📁 {folder.name}</span>
                <span>{isExpanded ? '▼' : '▶'}</span>
              </li>
              {isExpanded && (
                <div className="folder-contents">
                  {folderFeeds.length > 0 ? (
                    folderFeeds.map(feed => renderFeedItem(feed, 1))
                  ) : (
                    <li style={{ paddingLeft: '24px', opacity: 0.5, fontStyle: 'italic', cursor: 'default' }}>
                      (No feeds)
                    </li>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned Feeds */}
        {feeds.filter(f => !f.folder_id).map(feed => renderFeedItem(feed, 0))}
      </ul>
    </div>
  );
};
