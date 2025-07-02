// src/components/DrawHistory.tsx
import React from "react";

interface DrawHistoryEntry {
  name: string;
  timestamp: string;
}

interface DrawHistoryProps {
  history: DrawHistoryEntry[];
}

const DrawHistory: React.FC<DrawHistoryProps> = ({ history }) => {
  if (history.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-2">Draw History</h2>
      <ul className="space-y-1 text-sm text-gray-700">
        {history.map((entry, i) => (
          <li
            key={i}
            className="bg-white p-2 rounded shadow-sm flex justify-between"
          >
            <span>{entry.name}</span>
            <span className="text-xs text-gray-500">{entry.timestamp}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DrawHistory;
