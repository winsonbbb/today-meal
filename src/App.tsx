import React, { useState } from "react";
import { Restaurant } from "./types";
import { useEffect } from "react";
import {
  getRestaurants,
  addRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from "./api";

function App() {

  useEffect(() => {
    getRestaurants().then(setRestaurants);
  }, []);

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {
      name: "Sushi House",
      disabled: false,
      lastChosen: "2025-06-20",
      cooldownDays: 3,
      tags: ["Japanese", "dinner"],
      rating: 5,
      locationLink: "https://maps.google.com/?q=Sushi+House",
    },
    {
      name: "Pizza Place",
      disabled: true,
      lastChosen: null,
      cooldownDays: 0,
      tags: ["Italian"],
      rating: 4,
      locationLink: "https://maps.google.com/?q=Pizza+Place",
    },
  ]);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
  const [drawnRestaurant, setDrawnRestaurant] = useState<Restaurant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [drawHistory, setDrawHistory] = useState<
    { name: string; timestamp: string }[]
  >([]);

  const filteredRestaurants = restaurants.filter((r) =>
    activeTag ? r.tags?.includes(activeTag) : true
  );

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

        if (!Array.isArray(imported)) {
          alert("Invalid data format.");
          return;
        }

        for (const r of imported) {
          const exists = restaurants.some((x) => x.name === r.name);
          if (!exists) {
            await addRestaurant(r);
          }
        }

        setRestaurants(await getRestaurants());
        alert("Import successful!");
      } catch (err) {
        alert("Failed to import: " + err);
      }
    };
    reader.readAsText(file);
  };

  function isEligible(r: Restaurant) {
    if (r.disabled) return false;
    if (!r.lastChosen) return true;

    const lastChosenDate = new Date(r.lastChosen);
    const now = new Date();
    const cooldownEnd = new Date(lastChosenDate);
    cooldownEnd.setDate(cooldownEnd.getDate() + r.cooldownDays);

    return now >= cooldownEnd;
  }

  function drawRestaurant() {
    const eligible = filteredRestaurants.filter(isEligible);
    if (eligible.length === 0) {
      alert("No eligible restaurants to draw!");
      return;
    }
    const randomIndex = Math.floor(Math.random() * eligible.length);
    setDrawnRestaurant(eligible[randomIndex]);
  }

  const applyRestaurantUpdate = async (name: string, update: Partial<Restaurant>) => {
    await updateRestaurant(name, update);
    const latest = await getRestaurants();
    setRestaurants(latest);
  };

  const acceptRestaurant = async () => {
    if (!drawnRestaurant) return;
    const today = new Date().toISOString().slice(0, 10);
    await applyRestaurantUpdate(drawnRestaurant.name, { lastChosen: today });
    setRestaurants(await getRestaurants());

    // ➕ Add to history
    setDrawHistory((prev) => [
      { name: drawnRestaurant.name, timestamp: today },
      ...prev,
    ]);

    setDrawnRestaurant(null);
  };

  const markAsRecentlyChosen = async () => {
    if (!drawnRestaurant) return;
    const today = new Date().toISOString().slice(0, 10);
    await applyRestaurantUpdate(drawnRestaurant.name, { lastChosen: today });
    setDrawHistory((prev) => [
      { name: drawnRestaurant.name, timestamp: today },
      ...prev,
    ]);
    drawRestaurant(); // 👈 draw again without closing the panel
  };

  const disableRestaurant = async () => {
    if (!drawnRestaurant) return;
    await applyRestaurantUpdate(drawnRestaurant.name, { disabled: true });
    const latest = await getRestaurants(); // 👈 refresh state
    setRestaurants(latest);
    setDrawnRestaurant(null);
  };

  const handleAddRestaurant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const cooldown = parseInt((form.elements.namedItem("cooldown") as HTMLInputElement).value);
    const locationLink = (form.elements.namedItem("locationLink") as HTMLInputElement).value.trim();
    const tagsString = (form.elements.namedItem("tags") as HTMLInputElement).value;
    const tags = tagsString.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
    if (!name) {
      alert("Restaurant name is required.");
      return;
    }

    const exists = restaurants.some((r) => r.name === name);
    if (exists) {
      alert("This restaurant already exists.");
      return;
    }

    const newRestaurant: Restaurant = {
      name,
      cooldownDays: isNaN(cooldown) ? 0 : cooldown,
      disabled: false,
      lastChosen: null,
      locationLink: locationLink || undefined,
      tags,
    };

    await addRestaurant(newRestaurant);
    setRestaurants(await getRestaurants());
    setShowModal(false);
    form.reset();
  }
  const handleDeleteRestaurant = async (name: string) => {
    if (window.confirm(`Delete "${name}"?`)) {
      await deleteRestaurant(name);
      setRestaurants(await getRestaurants());
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Your Restaurants</h1>
        <button
          className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => setShowModal(true)}
        >
          + Add Restaurant
        </button>
      </div>

      <button
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={drawRestaurant}
      >
        Draw Restaurant
      </button>

      {drawnRestaurant && (
        <div className="mb-4 p-4 border rounded bg-green-100">
          <h2 className="text-xl font-semibold">Drawn Restaurant:</h2>
          <p>{drawnRestaurant.name}</p>
          <p>Rating: {drawnRestaurant.rating ?? "N/A"}</p>
          <p>Cooldown Days: {drawnRestaurant.cooldownDays}</p>
          {drawnRestaurant.locationLink && (
            <p>
              Location:{" "}
              <a
                href={drawnRestaurant.locationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View on Map
              </a>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="flex-1 min-w-[120px] px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              onClick={acceptRestaurant}
            >
              Accept
            </button>
            <button
              className="flex-1 min-w-[120px] px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              onClick={drawRestaurant}
            >
              Draw Again
            </button>
            <button
              className="flex-1 min-w-[160px] px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              onClick={markAsRecentlyChosen}
            >
              Mark as Recently Chosen
            </button>
            <button
              className="flex-1 min-w-[140px] px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={disableRestaurant}
            >
              Disable Restaurant
            </button>
          </div>
        </div>
      )}
      <div className="mb-4 flex gap-4">
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

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          className={`px-2 py-1 rounded ${activeTag === null ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          onClick={() => setActiveTag(null)}
        >
          All
        </button>
        {Array.from(new Set(restaurants.flatMap(r => r.tags || []))).map((tag) => (
          <button
            key={tag}
            className={`px-2 py-1 rounded ${activeTag === tag ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>


      <ul className="space-y-2">
        {filteredRestaurants.map((r, idx) => (
          <li
            key={idx}
            className={`p-3 rounded border ${r.disabled ? "bg-gray-200 text-gray-500" : "bg-white"
              }`}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="font-semibold text-base truncate max-w-[70%]">{r.name}</div>
              <div className="flex items-center gap-2">
                <button
                  className={`text-sm px-3 py-1 rounded ${r.disabled
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-red-500 text-white hover:bg-red-600"
                    }`}
                  onClick={async () => {
                    await applyRestaurantUpdate(r.name, { disabled: !r.disabled });
                    setRestaurants(await getRestaurants());
                  }}
                >
                  {r.disabled ? "Enable" : "Disable"}
                </button>

                <button
                  className="text-sm px-2 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600 ml-2"
                  onClick={() => setEditingRestaurant(r)}
                >
                  Edit
                </button>
                <button
                  className="text-sm px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 ml-2"
                  onClick={() => handleDeleteRestaurant(r.name)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="text-sm">Cooldown: {r.cooldownDays} days</div>
            <div className="text-sm">Rating: {r.rating ?? "N/A"}</div>
            <div className="text-sm">Last Chosen: {r.lastChosen ?? "Never"}</div>
            {r.tags && r.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {r.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}

      </ul>
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Draw History</h2>
        {drawHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No draws yet.</p>
        ) : (
          <ul className="max-h-64 overflow-y-auto space-y-1 text-sm">
            {drawHistory.map((entry, index) => (
              <li key={index} className="border-b py-1 flex justify-between">
                <span>{entry.name}</span>
                <span className="text-gray-500">{entry.timestamp}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Restaurant</h2>
            <form onSubmit={handleAddRestaurant} className="space-y-4">
              <input
                name="name"
                type="text"
                placeholder="Restaurant Name"
                className="w-full border p-2 rounded"
                required
              />
              <input
                name="cooldown"
                type="number"
                placeholder="Cooldown Days"
                className="w-full border p-2 rounded"
              />
              <input
                name="locationLink"
                type="url"
                placeholder="Google Maps Link (optional)"
                className="w-full border p-2 rounded"
              />
              <input
                name="tags"
                type="text"
                placeholder="Tags (comma separated)"
                className="w-full border p-2 rounded"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Restaurant</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
                const cooldown = parseInt((form.elements.namedItem("cooldown") as HTMLInputElement).value);
                const locationLink = (form.elements.namedItem("locationLink") as HTMLInputElement).value.trim();
                const tags = (form.elements.namedItem("tags") as HTMLInputElement).value.trim();
                const tagsArr = tags.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);

                if (!editingRestaurant) return;

                await applyRestaurantUpdate(editingRestaurant.name, {
                  name,
                  cooldownDays: isNaN(cooldown) ? 0 : cooldown,
                  locationLink: locationLink || undefined,
                  tags: tagsArr,
                });

                setEditingRestaurant(null);
              }}
              className="space-y-4"
            >
              <input
                name="name"
                defaultValue={editingRestaurant.name}
                type="text"
                placeholder="Restaurant Name"
                className="w-full border p-2 rounded"
                required
              />
              <input
                name="cooldown"
                defaultValue={editingRestaurant.cooldownDays}
                type="number"
                placeholder="Cooldown Days"
                className="w-full border p-2 rounded"
              />
              <input
                name="locationLink"
                defaultValue={editingRestaurant.locationLink}
                type="url"
                placeholder="Google Maps Link (optional)"
                className="w-full border p-2 rounded"
              />
              <input
                name="tags"
                type="text"
                placeholder="Tags (comma separated)"
                className="w-full border p-2 rounded"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  onClick={() => setEditingRestaurant(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
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
