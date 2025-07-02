// src/components/RestaurantListItem.tsx
import React from "react";
import { Restaurant } from "../types";

interface RestaurantListItemProps {
  restaurant: Restaurant;
  isChosenToday: (r: Restaurant) => boolean;
  getRecencyColor: (dateStr: string | null) => string;
  getRelativeTime: (dateStr: string) => string;
  onEdit: (restaurant: Restaurant) => void;
  onToggleDisable: (id: string, disabled: boolean) => void;
  onDelete: (id: string) => void;
  onReactivate: (id: string) => void; // Added for reactivate button
}

const RestaurantListItem: React.FC<RestaurantListItemProps> = ({
  restaurant: r,
  isChosenToday,
  getRecencyColor,
  getRelativeTime,
  onEdit,
  onToggleDisable,
  onDelete,
  onReactivate,
}) => {
  const withStop = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <li
      onClick={() => onEdit(r)}
      className={`p-3 shadow rounded cursor-pointer transition hover:bg-blue-50 ${
        r.disabled ? "bg-gray-200 opacity-60" : "bg-white"
      }`}
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
        {r.lastChosen &&
        (() => {
          const today = new Date();
          const last = new Date(r.lastChosen!);
          const diff = Math.floor(
            (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
          );
          return diff < (r.cooldownDays || 0);
        })() && (
          <button
            onClick={withStop(() => onReactivate(r.id))}
            className="text-sm px-2 py-1 rounded bg-pink-500 text-white"
          >
            Reactivate
          </button>
        )}
        <div className="flex gap-2">
          <button
            onClick={withStop(() => onToggleDisable(r.id, !r.disabled))}
            className={`text-sm px-2 py-1 rounded ${
              r.disabled ? "bg-green-500" : "bg-red-500"
            } text-white`}
          >
            {r.disabled ? "Enable" : "Disable"}
          </button>
          <button
            onClick={withStop(() => onDelete(r.id))}
            className="text-sm px-2 py-1 rounded bg-gray-600 text-white"
          >
            Delete
          </button>
        </div>
      </div>
      {r.tags && (
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
  );
};

export default RestaurantListItem;
