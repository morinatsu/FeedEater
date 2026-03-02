import { useEffect } from "react";
import { useAppContext } from "../context/AppContext";

export const ItemList = () => {
  const { items, selectedItemId, setSelectedItemId, sortOrder, setSortOrder, isLoading, markItemAsUnread } =
    useAppContext();

  useEffect(() => {
    if (selectedItemId) {
      const selectedEl = document.querySelector(".item-card.selected");
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedItemId]);

  if (isLoading && items.length === 0) {
    return <div className="item-list-container loading">Loading items...</div>;
  }

  if (items.length === 0) {
    return <div className="item-list-container empty">No items found.</div>;
  }

  return (
    <div className="item-list-container">
      <div className="item-list-header">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
          className="sort-select"
        >
          <option value="desc">日付: 降順 (新しい順)</option>
          <option value="asc">日付: 昇順 (古い順)</option>
        </select>
      </div>
      <div className="item-list">
        {items.map((item) => (
          <div
            key={item.id}
            className={`item-card ${selectedItemId === item.id ? "selected" : ""} ${item.is_read ? "read" : "unread"}`}
            onClick={() => setSelectedItemId(item.id)}
            onContextMenu={async (e) => {
              e.preventDefault();
              const action = await window.api.showItemContextMenu();
              if (action === 'unread') {
                markItemAsUnread(item.id);
              }
            }}
          >
            <h3>{item.title}</h3>
            <div className="item-meta">
              <span className="date">
                {new Date(item.pub_date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
