import { AppProvider, useAppContext } from "./context/AppContext";
import { Sidebar } from "./components/Sidebar";
import { ItemList } from "./components/ItemList";
import { ReadingPane } from "./components/ReadingPane";
import { useEffect } from "react";
import "./index.css";

function AppContent() {
  const { items, selectedItemId, setSelectedItemId } = useAppContext();

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (document.activeElement?.tagName === "INPUT") return;

      if (e.key.toLowerCase() === "j" || e.key === "ArrowDown") {
        const currentIndex = items.findIndex((i) => i.id === selectedItemId);
        if (e.shiftKey && e.key.toLowerCase() === "j") {
          const nextUnreadIndex = items.findIndex((i, idx) => idx > Math.max(currentIndex, -1) && !i.is_read);
          if (nextUnreadIndex !== -1) {
            setSelectedItemId(items[nextUnreadIndex].id);
          }
        } else {
          if (currentIndex < items.length - 1) {
            setSelectedItemId(items[currentIndex + 1].id);
          } else if (items.length > 0 && currentIndex === -1) {
            setSelectedItemId(items[0].id);
          }
        }
      } else if (e.key.toLowerCase() === "k" || e.key === "ArrowUp") {
        const currentIndex = items.findIndex((i) => i.id === selectedItemId);
        if (e.shiftKey && e.key.toLowerCase() === "k") {
          let prevUnreadIndex = -1;
          for (let i = (currentIndex !== -1 ? currentIndex : items.length) - 1; i >= 0; i--) {
            if (!items[i].is_read) {
              prevUnreadIndex = i;
              break;
            }
          }
          if (prevUnreadIndex !== -1) {
            setSelectedItemId(items[prevUnreadIndex].id);
          }
        } else {
          if (currentIndex > 0) {
            setSelectedItemId(items[currentIndex - 1].id);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, selectedItemId, setSelectedItemId]);

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <ItemList />
        <ReadingPane />
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
