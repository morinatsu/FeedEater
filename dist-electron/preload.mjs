"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  getFeeds: () => electron.ipcRenderer.invoke("get-feeds"),
  getItems: (feedId) => electron.ipcRenderer.invoke("get-items", feedId),
  addFeed: (url) => electron.ipcRenderer.invoke("add-feed", url),
  markAsRead: (itemId) => electron.ipcRenderer.invoke("mark-as-read", itemId),
  openExternal: (url) => electron.ipcRenderer.send("open-external", url)
  // We'll handle this in main next
});
