import { useAppContext } from "../context/AppContext";
import { useEffect } from "react";

export const ReadingPane = () => {
  const { items, feeds, selectedItemId, markItemAsRead } = useAppContext();
  const item = items.find((i) => i.id === selectedItemId);
  const feed = item ? feeds.find((f) => f.id === item.feed_id) : null;

  useEffect(() => {
    // Mark as read when opened
    if (item && !item.is_read) {
      markItemAsRead(item.id);
    }
  }, [item, markItemAsRead]);

  if (!item) {
    return (
      <div className="reading-pane empty">
        <div className="placeholder">Select an item to read</div>
      </div>
    );
  }

  // Intercept clicks on links inside the HTML content
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Find the closest anchor tag in case the click was on a child element (e.g., an icon or span inside the link)
    const anchor = (e.target as HTMLElement).closest("a");

    if (anchor) {
      e.preventDefault();

      const targetUrl = anchor.getAttribute("href");
      if (!targetUrl) return;

      // Handle relative URLs (like /article/123) by resolving them against the original item link
      try {
        const urlObj = new URL(targetUrl, item.link);
        window.api.openExternal(urlObj.href);
      } catch (err) {
        console.error("Failed to parse URL:", targetUrl, err);
      }
    }
  };

  return (
    <div className="reading-pane">
      <header className="article-header">
        <h1>{item.title}</h1>
        <div className="article-meta">
          <a
            href={item.link}
            onClick={(e) => {
              e.preventDefault();
              window.api.openExternal(item.link);
            }}
          >
            View Original
          </a>
          <span>{new Date(item.pub_date).toLocaleString()}</span>
          {feed && <span className="feed-name">{feed.title}</span>}
        </div>
      </header>

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: item.content }}
        onClick={handleContentClick}
      />
    </div>
  );
};
