// src/components/Tabs.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tabs from './Tabs';

describe('Tabs Component', () => {
  const mockSetCurrentTab = jest.fn();
  const mockDeleteTab = jest.fn();
  const mockShowAddTabModal = jest.fn();
  const DEFAULT_TAB = 'Home';
  const sampleTabs = ['Home', 'Work', 'Favorites'];

  beforeEach(() => {
    mockSetCurrentTab.mockClear();
    mockDeleteTab.mockClear();
    mockShowAddTabModal.mockClear();
    // Mock window.confirm for delete operations
    window.confirm = jest.fn(() => true);
  });

  test('renders all provided tabs', () => {
    render(
      <Tabs
        tabs={sampleTabs}
        currentTab={DEFAULT_TAB}
        DEFAULT_TAB={DEFAULT_TAB}
        onSetCurrentTab={mockSetCurrentTab}
        onDeleteTab={mockDeleteTab}
        onShowAddTabModal={mockShowAddTabModal}
      />
    );
    sampleTabs.forEach(tabName => {
      expect(screen.getByRole('button', { name: tabName })).toBeInTheDocument();
    });
  });

  test('highlights the current tab', () => {
    const current = 'Work';
    render(
      <Tabs
        tabs={sampleTabs}
        currentTab={current}
        DEFAULT_TAB={DEFAULT_TAB}
        onSetCurrentTab={mockSetCurrentTab}
        onDeleteTab={mockDeleteTab}
        onShowAddTabModal={mockShowAddTabModal}
      />
    );
    const currentTabButton = screen.getByRole('button', { name: current });
    // Tailwind classes are hard to test directly for active state without extra setup.
    // We'll rely on visual inspection or more complex testing if specific styling needs verification.
    // For now, we check presence. The active class `bg-blue-600 text-white` would be applied.
    expect(currentTabButton).toHaveClass('bg-blue-600');
  });

  test('calls onSetCurrentTab when a tab is clicked', () => {
    const tabToClick = 'Favorites';
    render(
      <Tabs
        tabs={sampleTabs}
        currentTab={DEFAULT_TAB}
        DEFAULT_TAB={DEFAULT_TAB}
        onSetCurrentTab={mockSetCurrentTab}
        onDeleteTab={mockDeleteTab}
        onShowAddTabModal={mockShowAddTabModal}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: tabToClick }));
    expect(mockSetCurrentTab).toHaveBeenCalledWith(tabToClick);
  });

  test('shows delete button for non-default tabs and calls onDeleteTab when clicked', () => {
    const tabToDelete = 'Work';
    render(
      <Tabs
        tabs={sampleTabs}
        currentTab={DEFAULT_TAB}
        DEFAULT_TAB={DEFAULT_TAB}
        onSetCurrentTab={mockSetCurrentTab}
        onDeleteTab={mockDeleteTab}
        onShowAddTabModal={mockShowAddTabModal}
      />
    );
    const deleteButton = screen.getByTitle(`Delete ${tabToDelete}`);
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);
    expect(window.confirm).toHaveBeenCalledWith(`Delete tab "${tabToDelete}"?`);
    expect(mockDeleteTab).toHaveBeenCalledWith(tabToDelete);
  });

  test('does not show delete button for the default tab', () => {
    render(
      <Tabs
        tabs={sampleTabs}
        currentTab={DEFAULT_TAB}
        DEFAULT_TAB={DEFAULT_TAB}
        onSetCurrentTab={mockSetCurrentTab}
        onDeleteTab={mockDeleteTab}
        onShowAddTabModal={mockShowAddTabModal}
      />
    );
    expect(screen.queryByTitle(`Delete ${DEFAULT_TAB}`)).not.toBeInTheDocument();
  });

  test('calls onShowAddTabModal when "Add Tab" button is clicked', () => {
    render(
      <Tabs
        tabs={sampleTabs}
        currentTab={DEFAULT_TAB}
        DEFAULT_TAB={DEFAULT_TAB}
        onSetCurrentTab={mockSetCurrentTab}
        onDeleteTab={mockDeleteTab}
        onShowAddTabModal={mockShowAddTabModal}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /\+ Add Tab/i }));
    expect(mockShowAddTabModal).toHaveBeenCalledTimes(1);
  });

  test('does not call onDeleteTab if confirm is false', () => {
    (window.confirm as jest.Mock).mockReturnValueOnce(false);
    const tabToDelete = 'Work';
    render(
      <Tabs
        tabs={sampleTabs}
        currentTab={DEFAULT_TAB}
        DEFAULT_TAB={DEFAULT_TAB}
        onSetCurrentTab={mockSetCurrentTab}
        onDeleteTab={mockDeleteTab}
        onShowAddTabModal={mockShowAddTabModal}
      />
    );
    const deleteButton = screen.getByTitle(`Delete ${tabToDelete}`);
    fireEvent.click(deleteButton);
    expect(mockDeleteTab).not.toHaveBeenCalled();
  });
});
