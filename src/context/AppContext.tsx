/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { Feed, RSSItem } from "../types";

interface AppContextType {
  feeds: Feed[];
  items: RSSItem[];
  selectedFeedId: number | null;
  selectedItemId: string | null;
  sortOrder: "desc" | "asc";
  isLoading: boolean;
  error: string | null;
  setSelectedFeedId: (id: number | null) => void;
  setSelectedItemId: (id: string | null) => void;
  setSortOrder: (order: "desc" | "asc") => void;
  addFeed: (url: string) => Promise<void>;
  deleteFeed: (id: number) => Promise<void>;
  markItemAsRead: (id: string) => Promise<void>;
  refreshFeeds: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<RSSItem[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFeeds = async () => {
    try {
      const data = await window.api.getFeeds();
      setFeeds(data);
    } catch {
      setError("Failed to load feeds");
    }
  };

  const loadItems = async (feedId?: number) => {
    setIsLoading(true);
    try {
      const data = await window.api.getItems(feedId);
      setItems(data);
    } catch {
      setError("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeeds();
    loadItems(); // Initially load all items
  }, []);

  // When selected feed changes, reload items
  useEffect(() => {
    loadItems(selectedFeedId || undefined);
    setSelectedItemId(null); // Reset item selection
  }, [selectedFeedId]);

  const addFeed = async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.addFeed(url);
      if (result.success) {
        await loadFeeds();
        // If it's the first feed, maybe select it
        if (result.feed) {
          setSelectedFeedId(result.feed.id);
        }
      } else {
        setError(result.error || "Failed to add feed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFeed = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.deleteFeed(id);
      if (result.success) {
        if (selectedFeedId === id) {
          setSelectedFeedId(null);
        }
        await loadFeeds();
        if (selectedFeedId === null || selectedFeedId === id) {
          await loadItems();
        }
      } else {
        setError(result.error || "Failed to delete feed");
      }
    } catch {
      setError("Failed to delete feed");
    } finally {
      setIsLoading(false);
    }
  };

  const markItemAsRead = async (id: string) => {
    try {
      await window.api.markAsRead(id);
      // Optimistically update UI
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, is_read: true } : item,
        ),
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.pub_date).getTime();
      const dateB = new Date(b.pub_date).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [items, sortOrder]);

  return (
    <AppContext.Provider
      value={{
        feeds,
        items: sortedItems,
        selectedFeedId,
        selectedItemId,
        sortOrder,
        isLoading,
        error,
        setSelectedFeedId,
        setSelectedItemId,
        setSortOrder,
        addFeed,
        deleteFeed,
        markItemAsRead,
        refreshFeeds: loadFeeds,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
