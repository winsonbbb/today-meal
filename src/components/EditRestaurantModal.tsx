// src/components/EditRestaurantModal.tsx
import React from "react";
import { Restaurant } from "../types"; // Assuming types.ts is in src

interface EditRestaurantModalProps {
  editingRestaurant: Restaurant | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, restaurantId: string) => void;
  getRelativeTime: (dateStr: string) => string; // Added for draw history
}

const EditRestaurantModal: React.FC<EditRestaurantModalProps> = ({
  editingRestaurant,
  onClose,
  onSubmit,
  getRelativeTime,
}) => {
  if (!editingRestaurant) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Edit: {editingRestaurant.name}
        </h2>
        <form
          onSubmit={(e) => onSubmit(e, editingRestaurant.id)}
          className="space-y-4"
          data-testid="edit-restaurant-form"
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
              onClick={onClose}
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

          return (
            <div className="mt-4 max-h-40 overflow-y-auto border-t pt-2 text-sm text-gray-700">
              <h3 className="font-semibold mb-1">Draw History</h3>
              <ul className="space-y-1">
                {history
                  .slice()
                  .reverse()
                  .map((date, idx) => (
                    <li key={idx}>
                      {getRelativeTime(date)} ({date})
                    </li>
                  ))}
              </ul>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default EditRestaurantModal;
