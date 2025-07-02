// src/components/DrawResult.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DrawResult from './DrawResult';
import { Restaurant } from '../types';

describe('DrawResult Component', () => {
  const mockOnAccept = jest.fn();
  const mockOnDrawAgain = jest.fn();
  const mockOnMarkAsRecentlyChosen = jest.fn();
  const mockOnDisable = jest.fn();

  const sampleRestaurant: Restaurant = {
    id: '1',
    name: 'Pizza Place',
    cooldownDays: 3,
    disabled: false,
    lastChosen: null,
    tags: ['Italian', 'Pizza'],
    drawHistory: [],
    tab: 'Home',
    locationLink: 'http://maps.google.com/?q=Pizza+Place',
  };

  beforeEach(() => {
    mockOnAccept.mockClear();
    mockOnDrawAgain.mockClear();
    mockOnMarkAsRecentlyChosen.mockClear();
    mockOnDisable.mockClear();
  });

  test('renders nothing if drawnRestaurant is null', () => {
    const { container } = render(
      <DrawResult
        drawnRestaurant={null}
        onAccept={mockOnAccept}
        onDrawAgain={mockOnDrawAgain}
        onMarkAsRecentlyChosen={mockOnMarkAsRecentlyChosen}
        onDisable={mockOnDisable}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders drawn restaurant details and action buttons', () => {
    render(
      <DrawResult
        drawnRestaurant={sampleRestaurant}
        onAccept={mockOnAccept}
        onDrawAgain={mockOnDrawAgain}
        onMarkAsRecentlyChosen={mockOnMarkAsRecentlyChosen}
        onDisable={mockOnDisable}
      />
    );

    expect(screen.getByText(`Today's Pick: ${sampleRestaurant.name}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view location/i })).toHaveAttribute(
      'href',
      sampleRestaurant.locationLink
    );
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /draw again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mark chosen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /disable/i })).toBeInTheDocument();
  });

  test('does not render location link if not provided', () => {
    const restaurantWithoutLink = { ...sampleRestaurant, locationLink: undefined };
    render(
      <DrawResult
        drawnRestaurant={restaurantWithoutLink}
        onAccept={mockOnAccept}
        onDrawAgain={mockOnDrawAgain}
        onMarkAsRecentlyChosen={mockOnMarkAsRecentlyChosen}
        onDisable={mockOnDisable}
      />
    );
    expect(screen.queryByRole('link', { name: /view location/i })).not.toBeInTheDocument();
  });

  test('calls onAccept when Accept button is clicked', () => {
    render(
      <DrawResult
        drawnRestaurant={sampleRestaurant}
        onAccept={mockOnAccept}
        onDrawAgain={mockOnDrawAgain}
        onMarkAsRecentlyChosen={mockOnMarkAsRecentlyChosen}
        onDisable={mockOnDisable}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /accept/i }));
    expect(mockOnAccept).toHaveBeenCalledTimes(1);
  });

  test('calls onDrawAgain when Draw Again button is clicked', () => {
    render(
      <DrawResult
        drawnRestaurant={sampleRestaurant}
        onAccept={mockOnAccept}
        onDrawAgain={mockOnDrawAgain}
        onMarkAsRecentlyChosen={mockOnMarkAsRecentlyChosen}
        onDisable={mockOnDisable}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /draw again/i }));
    expect(mockOnDrawAgain).toHaveBeenCalledTimes(1);
  });

  test('calls onMarkAsRecentlyChosen when Mark Chosen button is clicked', () => {
    render(
      <DrawResult
        drawnRestaurant={sampleRestaurant}
        onAccept={mockOnAccept}
        onDrawAgain={mockOnDrawAgain}
        onMarkAsRecentlyChosen={mockOnMarkAsRecentlyChosen}
        onDisable={mockOnDisable}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /mark chosen/i }));
    expect(mockOnMarkAsRecentlyChosen).toHaveBeenCalledTimes(1);
  });

  test('calls onDisable when Disable button is clicked', () => {
    render(
      <DrawResult
        drawnRestaurant={sampleRestaurant}
        onAccept={mockOnAccept}
        onDrawAgain={mockOnDrawAgain}
        onMarkAsRecentlyChosen={mockOnMarkAsRecentlyChosen}
        onDisable={mockOnDisable}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /disable/i }));
    expect(mockOnDisable).toHaveBeenCalledTimes(1);
  });
});
