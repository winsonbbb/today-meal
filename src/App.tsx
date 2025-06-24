import React, { useState } from "react";
import { Restaurant } from "./types";
import { useEffect } from "react";
import { getRestaurants, addRestaurant, updateRestaurantApi, deleteRestaurant } from "./api";

function App() {

  useEffect(() => {
    getRestaurants().then(setRestaurants);
  }, []);


  const today = new Date().toISOString().slice(0, 10);

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

  const [drawnRestaurant, setDrawnRestaurant] = useState<Restaurant | null>(null);
  const [showModal, setShowModal] = useState(false);

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
    const eligible = restaurants.filter(isEligible);
    if (eligible.length === 0) {
      alert("No eligible restaurants to draw!");
      return;
    }
    const randomIndex = Math.floor(Math.random() * eligible.length);
    setDrawnRestaurant(eligible[randomIndex]);
  }
  const updateRestaurant = async (name: string, update: Partial<Restaurant>) => {
    if (!drawnRestaurant) return;
    await updateRestaurantApi(drawnRestaurant.name, { update });

    setRestaurants(await getRestaurants());
  }

  const applyRestaurantUpdate = async (name: string, update: any) => {
    await updateRestaurant(name, update); // Now calls the API function correctly
    setRestaurants(await getRestaurants());
  };

  const acceptRestaurant = async () => {
    if (!drawnRestaurant) return;
    const today = new Date().toISOString().slice(0, 10);
    await applyRestaurantUpdate(drawnRestaurant.name, { lastChosen: today });
    setDrawnRestaurant(null);
  };

  function markAsRecentlyChosen() {
    if (!drawnRestaurant) return;
    updateRestaurant(drawnRestaurant.name, { lastChosen: today });
    alert(`Marked ${drawnRestaurant.name} as recently chosen.`);
    setDrawnRestaurant(null);
  }

  const disableRestaurant = async () => {
    if (!drawnRestaurant) return;
    await updateRestaurant(drawnRestaurant.name, { disabled: true });
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
    };

    await addRestaurant(newRestaurant);
    setRestaurants(await getRestaurants());
    setShowModal(false);
    form.reset();
  }

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

      <ul className="space-y-2">
        {restaurants.map((r, idx) => (
          <li
            key={idx}
            className={`p-3 rounded border ${r.disabled ? "bg-gray-200 text-gray-500" : "bg-white"
              }`}
          >
            <div className="flex justify-between items-center">
              <div className="font-semibold">{r.name}</div>
              <button
                className={`text-sm px-2 py-1 rounded ${r.disabled
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                onClick={async () => {
                  await updateRestaurant(r.name, { disabled: !r.disabled });
                  setRestaurants(await getRestaurants());
                }}
              >
                {r.disabled ? "Enable" : "Disable"}
              </button>
            </div>
            <div className="text-sm">Cooldown: {r.cooldownDays} days</div>
            <div className="text-sm">Rating: {r.rating ?? "N/A"}</div>
            <div className="text-sm">Last Chosen: {r.lastChosen ?? "Never"}</div>
            <div className="text-sm">Disable: {r.disabled}</div>
          </li>
        ))}

      </ul>

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
    </div>
  );
}

export default App;
