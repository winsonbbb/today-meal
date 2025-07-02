// src/components/DrawResult.tsx
import React from "react";
import { Restaurant } from "../types";

interface DrawResultProps {
  drawnRestaurant: Restaurant | null;
  onAccept: () => void;
  onDrawAgain: () => void;
  onMarkAsRecentlyChosen: () => void;
  onDisable: () => void;
}

const DrawResult: React.FC<DrawResultProps> = ({
  drawnRestaurant,
  onAccept,
  onDrawAgain,
  onMarkAsRecentlyChosen,
  onDisable,
}) => {
  if (!drawnRestaurant) return null;

  return (
    <div className="p-4 bg-white shadow rounded text-center space-y-2">
      <h2 className="text-lg font-bold">
        Today's Pick: {drawnRestaurant.name}
      </h2>
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
        <button
          onClick={onAccept}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          Accept
        </button>
        <button
          onClick={onDrawAgain}
          className="px-3 py-1 bg-yellow-500 text-white rounded"
        >
          Draw Again
        </button>
        <button
          onClick={onMarkAsRecentlyChosen}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Mark Chosen
        </button>
        <button
          onClick={onDisable}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          Disable
        </button>
      </div>
    </div>
  );
};

export default DrawResult;
