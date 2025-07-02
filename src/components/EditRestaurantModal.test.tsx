// src/components/EditRestaurantModal.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditRestaurantModal from './EditRestaurantModal';
import { Restaurant } from '../types';

// Mock helper function that would normally come from App.tsx
const mockGetRelativeTime = jest.fn((dateStr: string) => `${dateStr} relative`);

describe('EditRestaurantModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
    mockGetRelativeTime.mockImplementation((dateStr: string) => `${dateStr} relative`);
  });

  const sampleRestaurant: Restaurant = {
    id: 'r1',
    name: 'Original Name',
    cooldownDays: 5,
    disabled: false,
    lastChosen: '2023-10-01T12:00:00.000Z',
    tags: ['tag1', 'tag2'],
    drawHistory: ['2023-10-01T12:00:00.000Z', '2023-09-01T12:00:00.000Z'],
    tab: 'Home',
    locationLink: 'http://original.link',
  };

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
    mockGetRelativeTime.mockClear();
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
    fireEvent.submit(formElement); // Or click Save button

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith(expect.anything(), sampleRestaurant.id);
    // expect.anything() for the event object.
    // More detailed form data checking (e.g. ensuring newName is part of the event)
    // would typically be part of an integration test or by directly inspecting form elements
    // if the onSubmit handler in the component extracted them before passing up.
    // For this component, it passes the event up, so App.tsx's handler is responsible for extraction.
  });

  test('displays draw history for the restaurant', () => {
    render(
      <EditRestaurantModal
        editingRestaurant={sampleRestaurant}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        getRelativeTime={mockGetRelativeTime}
      />
    );

    expect(screen.getByText('Draw History')).toBeInTheDocument();
    sampleRestaurant.drawHistory!.forEach(historyDate => {
      // Check if getRelativeTime was called for each history entry
      expect(mockGetRelativeTime).toHaveBeenCalledWith(historyDate);
      // The component renders: <li>{getRelativeTime(date)} ({date})</li>
      // The mock returns: `${dateStr} relative`
      // So the text becomes: `${historyDate} relative (${historyDate})`
      const expectedTextPattern = new RegExp(`${historyDate} relative.*\\(${historyDate}\\)`);
      expect(screen.getByText(expectedTextPattern)).toBeInTheDocument();
    });
     expect(mockGetRelativeTime).toHaveBeenCalledTimes(sampleRestaurant.drawHistory!.length);
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
