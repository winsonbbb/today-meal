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

function App() {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("mealdraw_token"));
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [drawnRestaurant, setDrawnRestaurant] = useState<Restaurant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [drawHistory, setDrawHistory] = useState<{ name: string; timestamp: string }[]>([]);

  const token = localStorage.getItem("mealdraw_token");
  const username = localStorage.getItem("mealdraw_user");

  useEffect(() => {
    if (!loggedIn) return;
    getRestaurants().then(setRestaurants).catch(console.error);
  }, [loggedIn]);

  if (!loggedIn) {
    return <LoginPage onLogin={() => setLoggedIn(true)} />;
  }
  const withStop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };
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


  const filteredRestaurants = restaurants.filter((r) => {
    const matchesTags =
      activeTags.length === 0 ||
      (r.tags || []).some((tag) => activeTags.includes(tag));
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTags && matchesSearch;
  });

  const applyRestaurantUpdate = async (id: string, update: Partial<Restaurant>) => {
    await updateRestaurant(id, update);
    setRestaurants(await getRestaurants());
  };
  const reactivateRestaurant = async (id: string) => {
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

  const handleAddRestaurant = async (e: React.FormEvent<HTMLFormElement>) => {
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
      id: crypto.randomUUID(), // ✅ new
      name,
      cooldownDays: isNaN(cooldown) ? 0 : cooldown,
      disabled: false,
      lastChosen: null,
      locationLink: locationLink || undefined,
      tags,
      drawHistory: [],
    });
    setRestaurants(await getRestaurants());
    setShowModal(false);
    form.reset();
  };

  const handleEditSubmit = async (
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

  const drawRestaurant = () => {
    const today = getFormattedNow();
    const eligible = filteredRestaurants.filter((r) => {
      if (r.disabled) return false;
      if (r.lastChosen && r.cooldownDays) {
        const lastDate = new Date(r.lastChosen);
        const cooldownOver = new Date(lastDate);
        cooldownOver.setDate(lastDate.getDate() + r.cooldownDays);
        return new Date(today) >= cooldownOver;
      }
      return true;
    });
    if (eligible.length === 0) return alert("No restaurants available to draw.");
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    setDrawnRestaurant(pick);
  };

  const acceptRestaurant = async () => {
    if (!drawnRestaurant) return;
    const today = getFormattedNow();
    await applyRestaurantUpdate(drawnRestaurant.id, {
      lastChosen: today,
      drawHistory: [...(drawnRestaurant.drawHistory || []), today],
    });
    setDrawHistory((prev) => [
      { name: drawnRestaurant.name, timestamp: today },
      ...prev,
    ]);
    setDrawnRestaurant(null);
  };

  const markAsRecentlyChosen = async () => {
    if (!drawnRestaurant) return;
    const today = getFormattedNow();
    await applyRestaurantUpdate(drawnRestaurant.id, { lastChosen: today });
    setDrawHistory((prev) => [
      { name: drawnRestaurant.name, timestamp: today },
      ...prev,
    ]);
    drawRestaurant();
  };

  const disableRestaurant = async () => {
    if (!drawnRestaurant) return;
    await applyRestaurantUpdate(drawnRestaurant.id, { disabled: true });
    setDrawnRestaurant(null);
  };

  const handleDeleteRestaurant = async (id: string) => {
    if (window.confirm(`Delete "${id}"?`)) {
      await deleteRestaurant(id);
      setRestaurants(await getRestaurants());
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 px-4 pb-20">
      <header className="w-full max-w-3xl flex justify-between items-center py-4">
        <h1 className="text-2xl font-bold">Welcome, {username}</h1>
        <div className="flex items-center gap-2">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
            onClick={() => {
              localStorage.removeItem("mealdraw_token");
              localStorage.removeItem("mealdraw_user");
              setLoggedIn(false);
            }}
          >
            Logout
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowModal(true)}
          >
            + Add Restaurant
          </button>
        </div>
      </header>

      <main className="w-full max-w-3xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <button
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={drawRestaurant}
          >
            Draw Restaurant
          </button>

          <div className="flex gap-2">
            <button
              className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={handleExport}
            >
              Export JSON
            </button>
            <label className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer">
              Import JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border p-2 rounded"
        />

        {drawnRestaurant && (
          <div className="p-4 bg-white shadow rounded text-center space-y-2">
            <h2 className="text-lg font-bold">Today's Pick: {drawnRestaurant.name}</h2>
            {drawnRestaurant.locationLink && (
              <a
                href={drawnRestaurant.locationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Location
              </a>
            )}
            <div className="flex justify-center gap-2">
              <button onClick={acceptRestaurant} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>
              <button onClick={drawRestaurant} className="px-3 py-1 bg-yellow-500 text-white rounded">Draw Again</button>
              <button onClick={markAsRecentlyChosen} className="px-3 py-1 bg-blue-600 text-white rounded">Mark Chosen</button>
              <button onClick={disableRestaurant} className="px-3 py-1 bg-red-600 text-white rounded">Disable</button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {Array.from(new Set(restaurants.flatMap(r => r.tags || []))).map(tag => (
            <button
              key={tag}
              className={`px-2 py-1 rounded border ${activeTags.includes(tag) ? "bg-blue-600 text-white border-blue-700" : "bg-white border-gray-300"}`}
              onClick={() => setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
            >
              #{tag}
            </button>
          ))}
          {activeTags.length > 0 && (
            <button onClick={() => setActiveTags([])} className="px-2 py-1 bg-gray-300 rounded">Clear Tags</button>
          )}
        </div>

        <ul className="space-y-2">
          {filteredRestaurants.map((r) => (
            <li
              key={r.id}
              onClick={() => setEditingRestaurant(r)}
              className={`p-3 shadow rounded cursor-pointer transition hover:bg-blue-50 ${r.disabled ? "bg-gray-200 opacity-60" : "bg-white"}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold text-base truncate max-w-[60%]">
                  <span>{r.name}</span>
                  {isChosenToday(r) && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-300">
                      Chosen Today
                    </span>
                  )}
                </div>
                {(() => {
                  const history = r.drawHistory;
                  if (!history || history.length === 0) return null;

                  const latest = history[history.length - 1];
                  return (
                    <div className={`text-xs mt-1 ${getRecencyColor(latest)}`}>
                      Last chosen: {getRelativeTime(latest)}
                    </div>
                  );
                })()}
                {r.lastChosen && (() => {
                  const today = new Date();
                  const last = new Date(r.lastChosen);
                  const diff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
                  return diff < (r.cooldownDays || 0);
                })() && (
                    <button
                      onClick={withStop(() => reactivateRestaurant(r.id))}
                      className="text-sm px-2 py-1 rounded bg-pink-500 text-white"
                    >
                      Reactivate
                    </button>
                  )}
                <div className="flex gap-2">
                  <button
                    onClick={withStop(() => applyRestaurantUpdate(r.id, { disabled: !r.disabled }))}
                    className={`text-sm px-2 py-1 rounded ${r.disabled ? "bg-green-500" : "bg-red-500"} text-white`}
                  >
                    {r.disabled ? "Enable" : "Disable"}
                  </button>
                  <button
                    onClick={withStop(() => handleDeleteRestaurant(r.id))}
                    className="text-sm px-2 py-1 rounded bg-gray-600 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
              {r.tags && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {r.tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        {drawHistory.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-2">Draw History</h2>
            <ul className="space-y-1 text-sm text-gray-700">
              {drawHistory.map((entry, i) => (
                <li key={i} className="bg-white p-2 rounded shadow-sm flex justify-between">
                  <span>{entry.name}</span>
                  <span className="text-xs text-gray-500">{entry.timestamp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Add Restaurant</h2>
              <form onSubmit={handleAddRestaurant} className="space-y-4">
                <input name="name" type="text" placeholder="Name" className="w-full border p-2 rounded" required />
                <input name="cooldown" type="number" placeholder="Cooldown Days" className="w-full border p-2 rounded" />
                <input name="locationLink" type="url" placeholder="Location Link (optional)" className="w-full border p-2 rounded" />
                <input name="tags" type="text" placeholder="Tags (comma separated)" className="w-full border p-2 rounded" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingRestaurant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit: {editingRestaurant.name}</h2>
              <form
                onSubmit={(e) => handleEditSubmit(e, editingRestaurant.id)}
                className="space-y-4"
              >
                <input
                  name="name"
                  type="text"
                  defaultValue={editingRestaurant.name}
                  className="w-full border p-2 rounded"
                />
                <input
                  name="cooldown"
                  type="number"
                  placeholder="Cooldown Days"
                  defaultValue={editingRestaurant.cooldownDays}
                  className="w-full border p-2 rounded"
                />
                <input
                  name="locationLink"
                  type="url"
                  placeholder="Location Link (optional)"
                  defaultValue={editingRestaurant.locationLink || ""}
                  className="w-full border p-2 rounded"
                />
                <input
                  name="tags"
                  type="text"
                  placeholder="Tags (comma separated)"
                  defaultValue={(editingRestaurant.tags || []).join(", ")}
                  className="w-full border p-2 rounded"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRestaurant(null)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </form>
              {(() => {
                const history = editingRestaurant.drawHistory;
                if (!history || history.length === 0) return null;

                const latest = history[history.length - 1];
                return (
                  <div className="mt-4 max-h-40 overflow-y-auto border-t pt-2 text-sm text-gray-700">
                    <h3 className="font-semibold mb-1">Draw History</h3>
                    <ul className="space-y-1">
                      {history
                        .slice()
                        .reverse()
                        .map((date, idx) => (
                          <li key={idx}>{getRelativeTime(date)} ({date})</li>
                        ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          </div>
        )
        }

      </main>
    </div>
  );
}

export default App;
