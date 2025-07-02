// src/components/AddRestaurantModal.tsx
import React from "react";

interface AddRestaurantModalProps {
  showModal: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

const AddRestaurantModal: React.FC<AddRestaurantModalProps> = ({
  showModal,
  onClose,
  onSubmit,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Restaurant</h2>
        <form onSubmit={onSubmit} className="space-y-4" data-testid="add-restaurant-form">
          <input
            name="name"
            type="text"
            placeholder="Name"
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
            placeholder="Location Link (optional)"
            className="w-full border p-2 rounded"
          />
          <input
            name="tags"
            type="text"
            placeholder="Tags (comma separated)"
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
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRestaurantModal;
