// src/components/EditRestaurantModal.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditRestaurantModal from './EditRestaurantModal';
import { Restaurant } from '../types';
import { jest } from '@jest/globals'; // Ensure this is present for jest.fn()

// Corrected mock definition: Define type, assign jest.fn(), then implement in beforeEach
const mockGetRelativeTime = jest.fn() as jest.MockedFunction<(dateStr: string) => string>;

describe('EditRestaurantModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  const sampleRestaurant: Restaurant = {
    id: 'r1',
    name: 'Original Name',
    cooldownDays: 5,
    disabled: false,
    lastChosen: '2023-10-01T12:00:00.000Z',
    tags: ['tag1', 'tag2'],
    drawHistory: ['2023-10-01T12:00:00.000Z', '2023-09-01T12:00:00.000Z'].sort((a,b) => new Date(b).getTime() - new Date(a).getTime()), //Ensure descending for slice().reverse() in component
    tab: 'Home',
    locationLink: 'http://original.link',
  };

  // Single beforeEach for all mock setups and clears
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
    mockGetRelativeTime.mockClear(); // Clear any previous mocks or calls
    // Set implementation in beforeEach
    mockGetRelativeTime.mockImplementation((dateStr: string) => {
      if (!dateStr) return '';
      // Basic relative time for testing, e.g., "X days ago" or "Today"
      const date = new Date(dateStr);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 0 && today.getDate() === date.getDate()) return "Today";
      if (diffDays === 1 && today.getDate() !== date.getDate() ) return "Yesterday"; // crude
      return `${diffDays} days ago`;
    });
  });

  test('does not render when editingRestaurant is null', () => {
    const { container } = render(
      <EditRestaurantModal
        editingRestaurant={null}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        getRelativeTime={mockGetRelativeTime}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders correctly with restaurant data when editingRestaurant is provided', () => {
    render(
      <EditRestaurantModal
        editingRestaurant={sampleRestaurant}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        getRelativeTime={mockGetRelativeTime}
      />
    );

    expect(screen.getByText(`Edit: ${sampleRestaurant.name}`)).toBeInTheDocument();
    expect(screen.getByDisplayValue(sampleRestaurant.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(sampleRestaurant.cooldownDays!.toString())).toBeInTheDocument();
    expect(screen.getByDisplayValue(sampleRestaurant.locationLink!)).toBeInTheDocument();
    expect(screen.getByDisplayValue(sampleRestaurant.tags!.join(', '))).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  test('calls onClose when Cancel button is clicked', () => {
    render(
      <EditRestaurantModal
        editingRestaurant={sampleRestaurant}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        getRelativeTime={mockGetRelativeTime}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onSubmit with form data and restaurantId when form is submitted', () => {
    render(
      <EditRestaurantModal
        editingRestaurant={sampleRestaurant}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        getRelativeTime={mockGetRelativeTime}
      />
    );

    const nameInput = screen.getByDisplayValue(sampleRestaurant.name);
    const newName = 'Updated Name';
    fireEvent.change(nameInput, { target: { value: newName } });

    const formElement = screen.getByTestId('edit-restaurant-form');
    fireEvent.submit(formElement);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.anything(), sampleRestaurant.id);
  });

  test('displays draw history for the restaurant', () => {
    // Ensure the mock provides distinct values for different dates if component logic depends on it
    mockGetRelativeTime.mockImplementation((dateStr: string) => {
        if (dateStr === '2023-10-01T12:00:00.000Z') return 'Last month'; // Example
        if (dateStr === '2023-09-01T12:00:00.000Z') return 'Two months ago';
        return 'A while ago';
    });

    render(
      <EditRestaurantModal
        editingRestaurant={sampleRestaurant}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        getRelativeTime={mockGetRelativeTime}
      />
    );

    expect(screen.getByText('Draw History')).toBeInTheDocument();
    // The component sorts history (slice().reverse()), so '2023-10-01...' appears first in display
    const displayedHistory = [...sampleRestaurant.drawHistory!].reverse();

    displayedHistory.forEach(historyDate => {
      expect(mockGetRelativeTime).toHaveBeenCalledWith(historyDate);
      const expectedRelativeTime = mockGetRelativeTime(historyDate); // Get what the mock would return
      const expectedTextPattern = new RegExp(`${expectedRelativeTime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*\\(${historyDate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`);
      expect(screen.getByText(expectedTextPattern)).toBeInTheDocument();
    });
    expect(mockGetRelativeTime).toHaveBeenCalledTimes(sampleRestaurant.drawHistory!.length * 2); // Called once per historyDate in loop, once in mockGetRelativeTime(historyDate) for RegExp
  });

  test('does not display draw history if not available', () => {
     const restaurantWithoutHistory = { ...sampleRestaurant, drawHistory: [] };
    render(
      <EditRestaurantModal
        editingRestaurant={restaurantWithoutHistory}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        getRelativeTime={mockGetRelativeTime}
      />
    );
    expect(screen.queryByText('Draw History')).not.toBeInTheDocument();

    const restaurantWithNullHistory = { ...sampleRestaurant, drawHistory: undefined };
    const { unmount } = render(
      <EditRestaurantModal
        editingRestaurant={restaurantWithNullHistory}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        getRelativeTime={mockGetRelativeTime}
      />
    );
    expect(screen.queryByText('Draw History')).not.toBeInTheDocument();
    unmount();
  });
});
