/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import type { Feed, RSSItem, Folder } from "../types";

interface AppContextType {
  feeds: Feed[];
  items: RSSItem[];
  folders: Folder[];
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
  markItemAsUnread: (id: string) => Promise<void>;
  markFeedAsUnread: (feedId: number) => Promise<void>;
  refreshFeeds: () => Promise<{ success: boolean; imported?: number; error?: string }>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (id: number) => Promise<void>;
  updateFeedFolder: (feedId: number, folderId: number | null) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [items, setItems] = useState<RSSItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFolders = async () => {
    try {
      const data = await window.api.getFolders();
      setFolders(data);
    } catch {
      setError("Failed to load folders");
    }
  };

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
    loadFolders();
    loadFeeds();
    loadItems();
    refreshFeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const addFolderFunc = async (name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.addFolder(name);
      if (result.success) {
        await loadFolders();
      } else {
        setError(result.error || "Failed to add folder");
      }
    } catch {
      setError("Failed to add folder");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFolderFunc = async (id: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.deleteFolder(id);
      if (result.success) {
        await loadFolders();
        await loadFeeds(); // Feed's folder_id might have been updated to null
      } else {
        setError(result.error || "Failed to delete folder");
      }
    } catch {
      setError("Failed to delete folder");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFeedFolderFunc = async (feedId: number, folderId: number | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.updateFeedFolder(feedId, folderId);
      if (result.success) {
        await loadFeeds();
      } else {
        setError(result.error || "Failed to update feed folder");
      }
    } catch {
      setError("Failed to update feed folder");
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
      // Optimistically update feeds unread_count
      const targetItem = items.find((i) => i.id === id);
      if (targetItem && !targetItem.is_read) {
        setFeeds((prevFeeds) =>
          prevFeeds.map((feed) =>
            feed.id === targetItem.feed_id
              ? { ...feed, unread_count: Math.max(0, (feed.unread_count || 0) - 1) }
              : feed
          )
        );
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markItemAsUnread = async (id: string) => {
    try {
      await window.api.markAsRead(id, false);
      // Optimistically update UI
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, is_read: false } : item,
        ),
      );
      // Optimistically update feeds unread_count
      const targetItem = items.find((i) => i.id === id);
      if (targetItem && targetItem.is_read) {
        setFeeds((prevFeeds) =>
          prevFeeds.map((feed) =>
            feed.id === targetItem.feed_id
              ? { ...feed, unread_count: (feed.unread_count || 0) + 1 }
              : feed
          )
        );
      }
    } catch (err) {
      console.error("Failed to mark as unread", err);
    }
  };

  const markFeedAsUnread = async (feedId: number) => {
    try {
      await window.api.markFeedAsRead(feedId, false);
      // Optimistically update UI
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.feed_id === feedId ? { ...item, is_read: false } : item,
        ),
      );
      // Reload feeds to get correct unread_count
      await loadFeeds();
    } catch (err) {
      console.error("Failed to mark feed as unread", err);
    }
  };

  const refreshFeeds = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await window.api.refreshFeeds();
      if (result.success) {
        // Reload feeds and items to show new data
        await loadFeeds();
        await loadItems(selectedFeedId || undefined);
      } else {
        setError(result.error || "Failed to refresh feeds");
      }
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to refresh feeds";
      setError("Failed to refresh feeds");
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
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
        folders,
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
        markItemAsUnread,
        markFeedAsUnread,
        refreshFeeds,
        addFolder: addFolderFunc,
        deleteFolder: deleteFolderFunc,
        updateFeedFolder: updateFeedFolderFunc,
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
