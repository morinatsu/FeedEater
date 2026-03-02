// These types mirror the DB structure

export interface Feed {
  id: number;
  title: string;
  url: string;
  last_fetched: string | null;
}

export interface RSSItem {
  id: string; // guid or link
  feed_id: number;
  title: string;
  link: string;
  content: string;
  pub_date: string;
  is_read: boolean;
}

// Window API exposed from Preload
export interface IElectronAPI {
  getFeeds: () => Promise<Feed[]>;
  getItems: (feedId?: number) => Promise<RSSItem[]>;
  addFeed: (
    url: string,
  ) => Promise<{ success: boolean; feed?: Feed; error?: string }>;
  deleteFeed: (id: number) => Promise<{ success: boolean; error?: string }>;
  markAsRead: (itemId: string, isRead?: boolean) => Promise<{ success: boolean }>;
  markFeedAsRead: (feedId: number, isRead?: boolean) => Promise<{ success: boolean }>;
  showFeedContextMenu: () => Promise<'unread' | 'delete' | 'cancel'>;
  showItemContextMenu: () => Promise<'unread' | 'cancel'>;
  refreshFeeds: () => Promise<{ success: boolean; imported?: number; error?: string }>;
  openExternal: (url: string) => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
