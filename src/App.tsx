// src/App.tsx (Responsive, Clean Layout)
import React, { useState, useEffect } from "react";
import LoginPage from "./LoginPage";
import { Restaurant } from "./types";
import {
  getRestaurants,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "./api";
import Header from "./components/Header";
import AddRestaurantModal from "./components/AddRestaurantModal";
import EditRestaurantModal from "./components/EditRestaurantModal";
import Tabs from "./components/Tabs";
import DrawResult from "./components/DrawResult";
import RestaurantList from "./components/RestaurantList";
import DrawHistory from "./components/DrawHistory";
import RestaurantWheel from "./components/RestaurantWheel"; // Import the wheel

function App() {
  const DEFAULT_TAB = "Home";
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("mealdraw_token"));
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [drawnRestaurant, setDrawnRestaurant] = useState<Restaurant | null>(null);
  const [showAddRestaurantModal, setShowAddRestaurantModal] = useState(false);
  const [drawHistoryState, setDrawHistoryState] = useState<{ name: string; timestamp: string }[]>([]);
  const [showAddTabModal, setShowAddTabModal] = useState(false);
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [triggerWheelSpin, setTriggerWheelSpin] = useState(false);
  const [newTabName, setNewTabName] = useState("");

  const [currentTab, setCurrentTab] = useState("Home");
  const [tabsState, setTabsState] = useState<string[]>(() => {
    const saved = localStorage.getItem("mealdraw_tabs");
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.includes("Home") ? parsed : ["Home", ...parsed];
  });

  const username = localStorage.getItem("mealdraw_user");

  useEffect(() => {
    if (!loggedIn) return;
    getRestaurants().then(setRestaurants).catch(console.error);
  }, [loggedIn]);

  useEffect(() => {
    const savedTabs = localStorage.getItem("mealdraw_tabs");
    if (savedTabs) setTabsState(JSON.parse(savedTabs));
  }, []);

  useEffect(() => {
    setDrawnRestaurant(null); // Clear the drawn result when tab changes
  }, [currentTab]);

  useEffect(() => {
    localStorage.setItem("mealdraw_tabs", JSON.stringify(tabsState));
  }, [tabsState]);


  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }

  const getFormattedNow = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hour = pad(now.getHours());
    const minute = pad(now.getMinutes());
    const second = pad(now.getSeconds());
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  const isChosenToday = (r: Restaurant) => {
    const latest = r.drawHistory?.[r.drawHistory.length - 1];
    if (!latest) return false;
    const today = getFormattedNow();
    return latest.startsWith(today);
  };

  const getRelativeTime = (dateStr: string) => {
    const today = new Date();
    const chosen = new Date(dateStr);
    const diff = Math.floor((today.getTime() - chosen.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return `${diff} days ago`;
  };

  const getRecencyColor = (dateStr: string | null) => {
    if (!dateStr) return "text-gray-400";
    const daysAgo = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo <= 1) return "text-red-600";
    if (daysAgo <= 3) return "text-yellow-600";
    return "text-gray-500";
  };

  const eligibleRestaurants = restaurants.filter((r) => {
    const inTab = (r.tab || "Home") === currentTab;
    const matchesTags = activeTags.length === 0 || (r.tags || []).some((tag) => activeTags.includes(tag));
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (!inTab || !matchesTags || !matchesSearch || r.disabled) return false;

    if (r.lastChosen && r.cooldownDays) {
      const lastDate = new Date(r.lastChosen);
      const cooldownOver = new Date(lastDate);
      cooldownOver.setDate(lastDate.getDate() + Number(r.cooldownDays));
      return new Date() >= cooldownOver;
    }
    return true;
  });

  const filteredRestaurantsForList = restaurants.filter((r) => {
    const inTab = (r.tab || "Home") === currentTab;
    const matchesTags = activeTags.length === 0 || (r.tags || []).some((tag) => activeTags.includes(tag));
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    return inTab && matchesTags && matchesSearch;
  });


  const applyRestaurantUpdate = async (id: string, update: Partial<Restaurant>) => {
    await updateRestaurant(id, update);
    setRestaurants(await getRestaurants());
  };

  const reactivateRestaurantHandler = async (id: string) => {
    await applyRestaurantUpdate(id, { lastChosen: null });
    setRestaurants(await getRestaurants());
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(restaurants, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meal-draw-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) return alert("Invalid data format.");
        for (const r of imported) {
          const exists = restaurants.some((x) => x.name === r.name);
          if (!exists) await addRestaurant(r);
        }
        setRestaurants(await getRestaurants());
        alert("Import successful!");
      } catch (err) {
        alert("Failed to import: " + err);
      }
    };
    reader.readAsText(file);
  };

  const handleAddRestaurantSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const cooldown = parseInt((form.elements.namedItem("cooldown") as HTMLInputElement).value);
    const locationLink = (form.elements.namedItem("locationLink") as HTMLInputElement).value.trim();
    const tagsString = (form.elements.namedItem("tags") as HTMLInputElement).value;
    const tags = tagsString.split(",").map(t => t.trim()).filter(Boolean);
    if (!name) return alert("Restaurant name is required.");
    if (restaurants.some(r => r.name === name)) return alert("This restaurant already exists.");

    await addRestaurant({
      id: crypto.randomUUID(),
      name,
      cooldownDays: isNaN(cooldown) ? 0 : cooldown,
      disabled: false,
      lastChosen: null,
      locationLink: locationLink || undefined,
      tags,
      drawHistory: [],
      tab: currentTab,
    });
    setRestaurants(await getRestaurants());
    setShowAddRestaurantModal(false);
    form.reset();
  };

  const handleEditRestaurantSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
    editingRestaurantId: string
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const cooldown = parseInt((form.elements.namedItem("cooldown") as HTMLInputElement).value);
    const locationLink = (form.elements.namedItem("locationLink") as HTMLInputElement).value.trim();
    const tagsString = (form.elements.namedItem("tags") as HTMLInputElement).value;
    const tags = tagsString.split(",").map(t => t.trim()).filter(Boolean);

    await applyRestaurantUpdate(editingRestaurantId, {
      name,
      cooldownDays: isNaN(cooldown) ? 0 : cooldown,
      locationLink,
      tags,
    });

    setEditingRestaurant(null);
  };

  const drawRestaurantHandler = () => {
    if (isWheelSpinning) return;

    if (eligibleRestaurants.length === 0) {
      alert("No restaurants available to draw. Add more, adjust filters, or check cooldowns!");
      return;
    }

    setDrawnRestaurant(null);
    setIsWheelSpinning(true);
    setTriggerWheelSpin(true);
  };

  const handleSpinComplete = (selectedRestaurant: Restaurant) => {
    setDrawnRestaurant(selectedRestaurant);
    setIsWheelSpinning(false);
    setTriggerWheelSpin(false);
  };

  const acceptRestaurantHandler = async () => {
    if (!drawnRestaurant) return;
    const today = getFormattedNow();
    await applyRestaurantUpdate(drawnRestaurant.id, {
      lastChosen: today,
      drawHistory: [...(drawnRestaurant.drawHistory || []), today],
    });
    setDrawHistoryState((prev) => [
      { name: drawnRestaurant.name, timestamp: today },
      ...prev,
    ]);
    setDrawnRestaurant(null); // Clear after accepting
  };

  const markAsRecentlyChosenHandler = async () => {
    if (!drawnRestaurant) return;
    const today = getFormattedNow();
    await applyRestaurantUpdate(drawnRestaurant.id, { lastChosen: today });
    setDrawHistoryState((prev) => [
      { name: drawnRestaurant.name, timestamp: today },
      ...prev,
    ]);
    // Instead of drawing again immediately, clear the drawn restaurant
    // The user can then choose to spin again if they wish.
    setDrawnRestaurant(null);
  };

  const disableDrawnRestaurantHandler = async () => {
    if (!drawnRestaurant) return;
    await applyRestaurantUpdate(drawnRestaurant.id, { disabled: true });
    setDrawnRestaurant(null); // Clear after disabling
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (window.confirm(`Delete restaurant? This action cannot be undone.`)) {
      await deleteRestaurant(id);
      setRestaurants(await getRestaurants());
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mealdraw_token");
    localStorage.removeItem("mealdraw_user");
    setLoggedIn(false);
  };

  const handleDeleteTab = (tabToDelete: string) => {
    setTabsState((prev) => {
      const updated = prev.filter((t) => t !== tabToDelete);
      localStorage.setItem("mealdraw_tabs", JSON.stringify(updated));
      return updated;
    });
    setRestaurants((prev) => prev.filter((r) => r.tab !== tabToDelete));
    if (tabToDelete === currentTab) setCurrentTab(DEFAULT_TAB);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 px-4 pb-20">
      <Header
        username={username}
        onLogout={handleLogout}
        onShowAddRestaurantModal={() => setShowAddRestaurantModal(true)}
      />

      <main className="w-full max-w-3xl space-y-6"> {/* Increased space-y for better separation */}
        <Tabs
          tabs={tabsState}
          currentTab={currentTab}
          DEFAULT_TAB={DEFAULT_TAB}
          onSetCurrentTab={setCurrentTab}
          onDeleteTab={handleDeleteTab}
          onShowAddTabModal={() => setShowAddTabModal(true)}
        />

        {/* Wheel and Draw Button Section */}
        <div className="flex flex-col items-center gap-6">
          <RestaurantWheel
            restaurants={eligibleRestaurants}
            onSpinComplete={handleSpinComplete}
            isSpinning={isWheelSpinning}
            triggerSpin={triggerWheelSpin}
          />
          <button
            className={`w-full sm:w-auto px-6 py-3 text-lg font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 ${
              isWheelSpinning || eligibleRestaurants.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
            onClick={drawRestaurantHandler}
            disabled={isWheelSpinning || eligibleRestaurants.length === 0}
          >
            {isWheelSpinning ? "Spinning..." : "Spin the Wheel!"}
          </button>
        </div>

        {/* Draw Result Section - only shown when a restaurant is drawn and not spinning */}
        {!isWheelSpinning && drawnRestaurant && (
          <DrawResult
            drawnRestaurant={drawnRestaurant}
            onAccept={acceptRestaurantHandler}
            onDrawAgain={drawRestaurantHandler} // Allows re-spin from results
            onMarkAsRecentlyChosen={markAsRecentlyChosenHandler}
            onDisable={disableDrawnRestaurantHandler}
          />
        )}

        {/* Search and Filters Section */}
        <div className="space-y-4 pt-4">
          <input
            type="text"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border p-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
            {Array.from(
              new Set(
                restaurants
                  .filter((r) => (r.tab || DEFAULT_TAB) === currentTab)
                  .flatMap((r) => r.tags || [])
              )
            ).map((tag) => (
              <button
                key={tag}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeTags.includes(tag)
                    ? "bg-blue-600 text-white border-blue-700"
                    : "bg-white hover:bg-gray-100 border-gray-300 text-gray-700"
                }`}
                onClick={() => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
              >
                #{tag}
              </button>
            ))}
            {activeTags.length > 0 && (
              <button
                onClick={() => setActiveTags([])}
                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full text-xs font-medium transition-colors"
              >
                Clear Tags
              </button>
            )}
          </div>
        </div>

        {/* Import/Export Buttons */}
        <div className="flex justify-end gap-2 pt-4">
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm"
              onClick={handleExport}
            >
              Export JSON
            </button>
            <label className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 cursor-pointer text-sm font-medium shadow-sm">
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </div>

        <RestaurantList
          restaurants={filteredRestaurantsForList}
          isChosenToday={isChosenToday}
          getRecencyColor={getRecencyColor}
          getRelativeTime={getRelativeTime}
          onEditRestaurant={setEditingRestaurant}
          onToggleRestaurantDisable={(id, disabled) => applyRestaurantUpdate(id, { disabled })}
          onDeleteRestaurant={handleDeleteRestaurant}
          onReactivateRestaurant={reactivateRestaurantHandler}
        />

        <DrawHistory history={drawHistoryState} />

        <AddRestaurantModal
          showModal={showAddRestaurantModal}
          onClose={() => setShowAddRestaurantModal(false)}
          onSubmit={handleAddRestaurantSubmit}
        />

        <EditRestaurantModal
          editingRestaurant={editingRestaurant}
          onClose={() => setEditingRestaurant(null)}
          onSubmit={handleEditRestaurantSubmit}
          getRelativeTime={getRelativeTime}
        />

      </main>
      {showAddTabModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Add New Tab</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const name = newTabName.trim();
                if (!name) return alert("Tab name is required.");
                if (tabsState.includes(name)) return alert("Tab already exists.");
                const updated = [...tabsState, name];
                setTabsState(updated);
                localStorage.setItem("mealdraw_tabs", JSON.stringify(updated));
                setCurrentTab(name);
                setNewTabName("");
                setShowAddTabModal(false);
              }}
              className="space-y-4"
            >
              <input
                type="text"
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="e.g. Work, Family, Travel"
                className="w-full border p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewTabName("");
                    setShowAddTabModal(false);
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                >
                  Add Tab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
