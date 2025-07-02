// src/components/Tabs.tsx
import React from "react";

interface TabsProps {
  tabs: string[];
  currentTab: string;
  DEFAULT_TAB: string;
  onSetCurrentTab: (tab: string) => void;
  onDeleteTab: (tab: string) => void;
  onShowAddTabModal: () => void;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  currentTab,
  DEFAULT_TAB,
  onSetCurrentTab,
  onDeleteTab,
  onShowAddTabModal,
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tabs.map((tab) => (
        <div key={tab} className="flex items-center gap-1">
          <button
            onClick={() => onSetCurrentTab(tab)}
            className={`px-3 py-1 rounded-full text-sm border ${
              tab === currentTab
                ? "bg-blue-600 text-white border-blue-700"
                : "bg-white border-gray-300"
            }`}
          >
            {tab}
          </button>

          {tab !== DEFAULT_TAB && (
            <button
              onClick={() => {
                if (!window.confirm(`Delete tab "${tab}"?`)) return;
                onDeleteTab(tab);
              }}
              className="text-xs text-red-500 hover:text-red-700"
              title={`Delete ${tab}`}
            >
              ✕
            </button>
          )}
        </div>
      ))}

      <button
        onClick={onShowAddTabModal}
        className="px-3 py-1 rounded-full border bg-green-500 text-white text-sm"
      >
        + Add Tab
      </button>
    </div>
  );
};

export default Tabs;
