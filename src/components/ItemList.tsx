import { useAppContext } from "../context/AppContext";

export const ItemList = () => {
  const { items, selectedItemId, setSelectedItemId, isLoading } =
    useAppContext();

  if (isLoading && items.length === 0) {
    return <div className="item-list loading">Loading items...</div>;
  }

  if (items.length === 0) {
    return <div className="item-list empty">No items found.</div>;
  }

  return (
    <div className="item-list">
      {items.map((item) => (
        <div
          key={item.id}
          className={`item-card ${selectedItemId === item.id ? "selected" : ""} ${item.is_read ? "read" : "unread"}`}
          onClick={() => setSelectedItemId(item.id)}
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
  );
};
