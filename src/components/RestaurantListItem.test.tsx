// src/components/RestaurantListItem.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RestaurantListItem from './RestaurantListItem';
import { Restaurant } from '../types';

import { jest } from '@jest/globals';

// Mock helper functions that would normally come from App.tsx or a context
const mockIsChosenToday = jest.fn() as jest.MockedFunction<(r: Restaurant) => boolean>;
const mockGetRecencyColor = jest.fn() as jest.MockedFunction<(dateStr: string | null) => string>;
const mockGetRelativeTime = jest.fn() as jest.MockedFunction<(dateStr: string) => string>;

describe('RestaurantListItem Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnToggleDisable = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnReactivate = jest.fn();

  const baseRestaurant: Restaurant = {
    id: 'r1',
    name: 'Tasty Burger',
    cooldownDays: 2,
    disabled: false,
    lastChosen: '2023-10-01 12:00:00', // Assume this is more than 2 days ago for some tests
    tags: ['Burger', 'Fast Food'],
    drawHistory: ['2023-10-01 12:00:00'],
    tab: 'Home',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockIsChosenToday.mockReturnValue(false);
    mockGetRecencyColor.mockReturnValue('text-gray-500'); // Ensure this is also reset if needed
    mockGetRelativeTime.mockImplementation((dateStr: string) => { // Explicitly type dateStr
      if (!dateStr) return '';
      // Simple mock, doesn't need to be super accurate for these tests
      const date = new Date(dateStr);
      const diffDays = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return "Today";
      return `${diffDays} days ago`;
    });
  });

  test('renders restaurant name and tags', () => {
    render(
      <RestaurantListItem
        restaurant={baseRestaurant}
        isChosenToday={mockIsChosenToday}
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );
    expect(screen.getByText(baseRestaurant.name)).toBeInTheDocument();
    baseRestaurant.tags?.forEach(tag => {
      expect(screen.getByText(`#${tag}`)).toBeInTheDocument();
    });
  });

  test('calls onEdit when list item is clicked', () => {
    render(
      <RestaurantListItem
        restaurant={baseRestaurant}
        isChosenToday={mockIsChosenToday}
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );
    fireEvent.click(screen.getByText(baseRestaurant.name).closest('li')!);
    expect(mockOnEdit).toHaveBeenCalledWith(baseRestaurant);
  });

  test('shows "Chosen Today" badge if isChosenToday returns true', () => {
    mockIsChosenToday.mockReturnValueOnce(true);
    render(
      <RestaurantListItem
        restaurant={baseRestaurant}
        isChosenToday={mockIsChosenToday}
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );
    expect(screen.getByText('Chosen Today')).toBeInTheDocument();
  });

  test('shows last chosen time', () => {
    const specificLastChosen = '2023-10-25 10:00:00';
    mockGetRelativeTime.mockReturnValueOnce('3 days ago'); // Specific mock for this test
    render(
      <RestaurantListItem
        restaurant={{ ...baseRestaurant, lastChosen: specificLastChosen, drawHistory: [specificLastChosen] }}
        isChosenToday={mockIsChosenToday}
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );
    expect(screen.getByText('Last chosen: 3 days ago')).toBeInTheDocument();
    expect(mockGetRecencyColor).toHaveBeenCalledWith(specificLastChosen);
  });

  test('shows "Disable" button for enabled restaurant and calls onToggleDisable', () => {
    render(
      <RestaurantListItem
        restaurant={{ ...baseRestaurant, disabled: false }}
        isChosenToday={mockIsChosenToday}
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );
    const disableButton = screen.getByRole('button', { name: /disable/i });
    fireEvent.click(disableButton);
    expect(mockOnToggleDisable).toHaveBeenCalledWith(baseRestaurant.id, true);
  });

  test('shows "Enable" button for disabled restaurant and calls onToggleDisable', () => {
    render(
      <RestaurantListItem
        restaurant={{ ...baseRestaurant, disabled: true }}
        isChosenToday={mockIsChosenToday}
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );
    const enableButton = screen.getByRole('button', { name: /enable/i });
    fireEvent.click(enableButton);
    expect(mockOnToggleDisable).toHaveBeenCalledWith(baseRestaurant.id, false);
  });

  test('calls onDelete when Delete button is clicked', () => {
     window.confirm = jest.fn(() => true); // Assume user confirms
    render(
      <RestaurantListItem
        restaurant={baseRestaurant}
        isChosenToday={mockIsChosenToday}
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    // Note: The actual `handleDeleteRestaurant` in App.tsx has the confirm.
    // Here we are testing that `onDelete` is called.
    expect(mockOnDelete).toHaveBeenCalledWith(baseRestaurant.id);
  });

  test('shows "Reactivate" button if restaurant is on cooldown and calls onReactivate', () => {
    // Simulate a scenario where the restaurant is on cooldown
    // For this, lastChosen should be recent enough that cooldownDays hasn't passed.
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const restaurantOnCooldown = {
      ...baseRestaurant,
      lastChosen: yesterday.toISOString(), // Chosen yesterday
      cooldownDays: 3, // 3-day cooldown
    };

    render(
      <RestaurantListItem
        restaurant={restaurantOnCooldown}
        isChosenToday={mockIsChosenToday} // Should be false for this test case
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );

    const reactivateButton = screen.getByRole('button', { name: /reactivate/i });
    expect(reactivateButton).toBeInTheDocument();
    fireEvent.click(reactivateButton);
    expect(mockOnReactivate).toHaveBeenCalledWith(restaurantOnCooldown.id);
  });

  test('does not show "Reactivate" button if not on cooldown', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(new Date().getDate() - 2);
    const restaurantNotOnCooldown = {
      ...baseRestaurant,
      lastChosen: twoDaysAgo.toISOString(), // Chosen 2 days ago
      cooldownDays: 1, // 1-day cooldown, so it's over
    };
    render(
      <RestaurantListItem
        restaurant={restaurantNotOnCooldown}
        isChosenToday={mockIsChosenToday}
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );
    expect(screen.queryByRole('button', { name: /reactivate/i })).not.toBeInTheDocument();
  });

   test('does not show "Reactivate" button if lastChosen is null', () => {
    render(
      <RestaurantListItem
        restaurant={{ ...baseRestaurant, lastChosen: null }}
        isChosenToday={mockIsChosenToday}
        getRecencyColor={mockGetRecencyColor}
        getRelativeTime={mockGetRelativeTime}
        onEdit={mockOnEdit}
        onToggleDisable={mockOnToggleDisable}
        onDelete={mockOnDelete}
        onReactivate={mockOnReactivate}
      />
    );
    expect(screen.queryByRole('button', { name: /reactivate/i })).not.toBeInTheDocument();
  });
});
