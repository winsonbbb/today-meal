// src/components/Header.tsx
import React from "react";

interface HeaderProps {
  username: string | null;
  onLogout: () => void;
  onShowAddRestaurantModal: () => void;
}

const Header: React.FC<HeaderProps> = ({
  username,
  onLogout,
  onShowAddRestaurantModal,
}) => {
  return (
    <header className="w-full max-w-3xl flex justify-between items-center py-4">
      <h1 className="text-2xl font-bold">Welcome, {username}</h1>
      <div className="flex items-center gap-2">
        <button
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-sm"
          onClick={onLogout}
        >
          Logout
        </button>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={onShowAddRestaurantModal}
        >
          + Add Restaurant
        </button>
      </div>
    </header>
  );
};

export default Header;
