// src/components/RestaurantWheel.test.tsx
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RestaurantWheel from './RestaurantWheel';
import { Restaurant } from '../types';

// Setup fake timers
// import { jest } from '@jest/globals'; // Removed
jest.useFakeTimers();

describe('RestaurantWheel Component', () => {
  const mockOnSpinComplete: jest.Mock<(selectedRestaurant: Restaurant) => void> = jest.fn();
  const sampleRestaurants: Restaurant[] = [
    { id: '1', name: 'Restaurant A', cooldownDays: 0, disabled: false, lastChosen: null, tags: [], drawHistory: [], tab: 'Home' },
    { id: '2', name: 'Restaurant B', cooldownDays: 0, disabled: false, lastChosen: null, tags: [], drawHistory: [], tab: 'Home' },
    { id: '3', name: 'Restaurant C', cooldownDays: 0, disabled: false, lastChosen: null, tags: [], drawHistory: [], tab: 'Home' },
  ];

  let mathRandomSpy: jest.SpyInstance;

  beforeEach(() => {
    mockOnSpinComplete.mockClear();
    // Mock Math.random to return a predictable value (e.g., 0.5, which would select the middle element if length is odd)
    // For index selection: Math.floor(Math.random() * array.length)
    // If Math.random() is 0, it selects index 0.
    // If Math.random() is just under 1 (e.g., 0.999), it selects the last index.
    mathRandomSpy = jest.spyOn(Math, 'random');
  });

  afterEach(() => {
    mathRandomSpy.mockRestore(); // Restore original Math.random
    jest.clearAllTimers(); // Clear any remaining timers
  });

  test('renders segments for each restaurant', () => {
    render(
      <RestaurantWheel
        restaurants={sampleRestaurants}
        onSpinComplete={mockOnSpinComplete}
        isSpinning={false}
        triggerSpin={false}
      />
    );
    sampleRestaurants.forEach(restaurant => {
      expect(screen.getByText(restaurant.name)).toBeInTheDocument();
    });
    // Check for the correct number of list items (segments)
    const segments = screen.getAllByRole('listitem');
    expect(segments).toHaveLength(sampleRestaurants.length);
  });

  test('renders "Add some restaurants" message when restaurants array is empty', () => {
    render(
      <RestaurantWheel
        restaurants={[]}
        onSpinComplete={mockOnSpinComplete}
        isSpinning={false}
        triggerSpin={false}
      />
    );
    expect(screen.getByText('Add some restaurants to spin the wheel!')).toBeInTheDocument();
  });

  test('initiates spin and calls onSpinComplete with selected restaurant', () => {
    // Mock Math.random to select the first restaurant (index 0)
    mathRandomSpy.mockReturnValue(0);

    const { rerender } = render(
      <RestaurantWheel
        restaurants={sampleRestaurants}
        onSpinComplete={mockOnSpinComplete}
        isSpinning={false} // Initially not spinning
        triggerSpin={false} // Spin not yet triggered
      />
    );

    // Trigger the spin
    rerender(
      <RestaurantWheel
        restaurants={sampleRestaurants}
        onSpinComplete={mockOnSpinComplete}
        isSpinning={false} // isSpinning will be set by App.tsx, here we test the effect of triggerSpin
        triggerSpin={true}
      />
    );

    // Fast-forward timers to complete the animation
    act(() => {
      jest.advanceTimersByTime(4000); // Duration of the spin animation
    });

    expect(mockOnSpinComplete).toHaveBeenCalledTimes(1);
    expect(mockOnSpinComplete).toHaveBeenCalledWith(sampleRestaurants[0]); // Expects the first restaurant
  });

  test('updates wheel style for spinning animation', async () => { // Made this test async
    mathRandomSpy.mockReturnValue(0.6); // Should pick index 1 for length 3 (0.6 * 3 = 1.8 -> floor is 1)

    const { rerender } = render(
      <RestaurantWheel
        restaurants={sampleRestaurants}
        onSpinComplete={mockOnSpinComplete}
        isSpinning={false}
        triggerSpin={false}
      />
    );

    const wheelElement = screen.getByRole('list').closest('ul'); // Assuming the ref is on the ul
    // Initial check might be empty or rotate(0deg), let's not assert a specific rotate unless it's 0.
    // For now, we'll focus on the state *after* spin is triggered.

    rerender(
      <RestaurantWheel
        restaurants={sampleRestaurants}
        onSpinComplete={mockOnSpinComplete}
        isSpinning={false}
        triggerSpin={true}
      />
    );

    // Check if the style is applied (transform and transition)
    // The exact angle is complex to calculate here without replicating all logic,
    // but we can check that a transform is applied.
    expect(wheelElement).toHaveStyle('transition: transform 4s ease-out');
    // A rotate transform should be applied. The exact value is complex to assert here.
    // We check that *a* rotate transform is present.
    expect(wheelElement?.style.transform).toContain('rotate(');


    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      // console.log('Inside waitFor, transition style:', wheelElement?.style.transition);
      expect(wheelElement?.style.transition).toBe('none');
    });
    expect(wheelElement?.style.transform).toContain('rotate('); // Still has a rotation
    expect(mockOnSpinComplete).toHaveBeenCalledWith(sampleRestaurants[1]);
  });

  test('does not spin if restaurants list is empty when triggered', () => {
    const { rerender } = render(
      <RestaurantWheel
        restaurants={[]} // Empty list
        onSpinComplete={mockOnSpinComplete}
        isSpinning={false}
        triggerSpin={false}
      />
    );

     rerender(
      <RestaurantWheel
        restaurants={[]}
        onSpinComplete={mockOnSpinComplete}
        isSpinning={false}
        triggerSpin={true}
      />
    );

    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(mockOnSpinComplete).not.toHaveBeenCalled();
  });

  // The test 'does not spin if isSpinning is true, even if triggerSpin becomes true'
  // was removed because the component's internal logic changed, and App.tsx now handles this condition.
});
