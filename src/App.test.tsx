// src/App.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
// import { jest } from '@jest/globals'; // Removed, relying on tsconfig types for Jest globals
import '@testing-library/jest-dom';
import App from './App';
import * as api from './api'; // To mock API calls
import { Restaurant } from './types';

// Mock the API module
jest.mock('./api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.confirm
global.confirm = jest.fn(() => true);

// Mock crypto.randomUUID for Jest environment
const mockUUID = () => {
  let d = new Date().getTime();
  if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
    d += performance.now();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (d + Math.random()*16)%16 | 0;
    d = Math.floor(d/16);
    return (c=='x' ? r : (r&0x3|0x8)).toString(16);
  });
};

if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {
    randomUUID: jest.fn(mockUUID),
  };
} else {
  if (!global.crypto.randomUUID) {
    (global.crypto as any).randomUUID = jest.fn(mockUUID);
  } else {
    // It's important to ensure this spy is effective.
    // If jest.spyOn was already called, this re-mocks its implementation.
    // If it wasn't, this will spy and mock.
    jest.spyOn(global.crypto, 'randomUUID').mockImplementation(mockUUID);
  }
}

// Use fake timers for controlling setTimeout in RestaurantWheel
jest.useFakeTimers();

const mockRestaurants: Restaurant[] = [
  { id: '1', name: 'Restaurant Alpha', cooldownDays: 0, disabled: false, lastChosen: null, tags: ['Fast Food'], drawHistory: [], tab: 'Home' },
  { id: '2', name: 'Restaurant Bravo', cooldownDays: 1, disabled: false, lastChosen: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), tags: ['Italian'], drawHistory: [], tab: 'Home' }, // Cooldown over
  { id: '3', name: 'Restaurant Charlie', cooldownDays: 3, disabled: true, lastChosen: null, tags: [], drawHistory: [], tab: 'Home' }, // Disabled
  { id: '4', name: 'Restaurant Delta', cooldownDays: 5, disabled: false, lastChosen: new Date().toISOString(), tags: [], drawHistory: [], tab: 'Home' }, // On cooldown
];

describe('App Component Integration Tests', () => {
  beforeEach(() => {
    // Reset mocks and localStorage before each test
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('mealdraw_token', 'test-token'); // Simulate logged-in state
    localStorageMock.setItem('mealdraw_user', 'TestUser');

    // Default API mock implementations
    mockedApi.getRestaurants.mockResolvedValue([...mockRestaurants].map(r => ({...r}))); // Return a deep copy
    mockedApi.addRestaurant.mockImplementation(async (restaurant: Omit<Restaurant, 'id'>) => ({ ...restaurant, id: crypto.randomUUID() } as Restaurant)); // Use mocked crypto
    mockedApi.updateRestaurant.mockImplementation(async (id: string, update: Partial<Restaurant>) => {
        const existingIndex = mockRestaurants.findIndex(r => r.id === id);
        // Simulate a successful update from a backend
        const updatedRestaurant = { ...mockRestaurants[existingIndex], ...update, id };
        // Update our "database" for subsequent getRestaurants calls if needed for the test flow
        // For many tests, simply returning the updated restaurant is enough.
        return updatedRestaurant as Restaurant;
    });
    mockedApi.deleteRestaurant.mockResolvedValue({});

    // Reset Math.random spy if it was used in other tests (though App itself doesn't directly use it)
    // Ensure it's restored if other tests have spied on it.
    // jest.restoreAllMocks() in afterEach might be more robust if Math.random is widely spied upon.
     if ((Math.random as jest.Mock).mockRestore) {
      (Math.random as jest.Mock).mockRestore();
    }
  });

  afterEach(() => {
    jest.clearAllTimers();
    // jest.restoreAllMocks(); // Could be useful to ensure mocks don't leak between tests
  });

  test('renders login page if not logged in', async () => {
    localStorageMock.removeItem('mealdraw_token');
    render(<App />);
    // LoginPage actual heading is "Login" or "Register"
    expect(screen.getByRole('heading', { name: /login/i })).toBeInTheDocument();
  });

  test('renders main app, fetches and displays restaurants if logged in', async () => {
    render(<App />);
    await waitFor(() => expect(mockedApi.getRestaurants).toHaveBeenCalledTimes(1));
    await waitFor(() => {
      expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
      // Restaurants are in the list and potentially in the wheel
      expect(screen.getAllByText('Restaurant Alpha')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Restaurant Bravo')[0]).toBeInTheDocument();
    });
  });

  test('can add a new restaurant', async () => {
    render(<App />);
    await waitFor(() => expect(mockedApi.getRestaurants).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /\+ Add Restaurant/i }));

    await screen.findByText('Add Restaurant');

    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'New Eatery' } });
    fireEvent.change(screen.getByPlaceholderText('Cooldown Days'), { target: { value: '3' } });
    fireEvent.change(screen.getByPlaceholderText('Tags (comma separated)'), { target: { value: 'new, test' } });

    // Define what the newly added restaurant will look like in the list
    const addedRestaurant = {
      id: 'mock-uuid-new-eatery', // Consistent with our crypto mock
      name: 'New Eatery',
      cooldownDays: 3,
      disabled: false,
      lastChosen: null,
      locationLink: '', // Assuming empty if not provided
      tags: ['new', 'test'],
      drawHistory: [],
      tab: 'Home' // Assuming currentTab is 'Home'
    };

    // Mock addRestaurant to return the new restaurant with a mocked ID
    mockedApi.addRestaurant.mockResolvedValueOnce(addedRestaurant);
    // Mock getRestaurants to return the list including the new one
    mockedApi.getRestaurants.mockResolvedValueOnce([...mockRestaurants, addedRestaurant]);

    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => expect(mockedApi.addRestaurant).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Eatery' })));
    // "New Eatery" will be in the list and potentially the wheel if it becomes eligible
    await waitFor(() => expect(screen.getAllByText('New Eatery')[0]).toBeInTheDocument());
  });

  test('spinning the wheel selects a restaurant and displays it', async () => {
    const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0); // Selects first eligible

    render(<App />);
    await waitFor(() => expect(mockedApi.getRestaurants).toHaveBeenCalledTimes(1));

    // Eligible for wheel: Alpha, Bravo
    // mockRestaurants[0] (Alpha) should be selected
    const expectedDrawnRestaurant = mockRestaurants[0];

    const spinButton = screen.getByRole('button', { name: /spin the wheel!/i });
    // Ensure button is enabled (eligible restaurants should be present)
    await waitFor(() => expect(spinButton).not.toBeDisabled());
    fireEvent.click(spinButton);

    act(() => { jest.advanceTimersByTime(4000); }); // Spin completes

    expect(await screen.findByText(`Today's Pick: ${expectedDrawnRestaurant.name}`)).toBeInTheDocument();

    // If "Today's Pick" is found, isWheelSpinning must be false.
    // Verify button state as a secondary check.
    expect(screen.queryByText(/Spinning.../i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /spin the wheel!/i })).toBeInTheDocument(); // Or its actual non-spinning text
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    mathRandomSpy.mockRestore();
  });

  test('accepting a drawn restaurant updates its lastChosen date', async () => {
    const mathRandomSpy = jest.spyOn(Math, 'random').mockReturnValue(0); // Selects Restaurant Alpha

    render(<App />);
    await waitFor(() => expect(mockedApi.getRestaurants).toHaveBeenCalledTimes(1));

    const spinButton = screen.getByRole('button', { name: /spin the wheel!/i });
    await waitFor(() => expect(spinButton).not.toBeDisabled());
    fireEvent.click(spinButton);

    act(() => { jest.advanceTimersByTime(4000); }); // Spin completes

    expect(await screen.findByText(`Today's Pick: Restaurant Alpha`)).toBeInTheDocument();
    // If "Today's Pick" is found, isWheelSpinning must be false.
    expect(screen.queryByText(/Spinning.../i)).not.toBeInTheDocument();


    // Mock the getRestaurants call that happens after update
    const updatedRestaurantAlpha = { ...mockRestaurants[0], lastChosen: 'some-new-date-string' };
    mockedApi.getRestaurants.mockResolvedValueOnce(
        [updatedRestaurantAlpha, {...mockRestaurants[1]}, {...mockRestaurants[2]}, {...mockRestaurants[3]}]
    );

    fireEvent.click(screen.getByRole('button', { name: /accept/i }));

    await waitFor(() => {
      expect(mockedApi.updateRestaurant).toHaveBeenCalledWith(
        mockRestaurants[0].id,
        expect.objectContaining({ lastChosen: expect.any(String) })
      );
    });

    await waitFor(() => {
        expect(screen.queryByText(`Today's Pick: Restaurant Alpha`)).not.toBeInTheDocument();
    });

    mathRandomSpy.mockRestore();
  });

  test('filters restaurants by search term', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getAllByText('Restaurant Alpha')[0]).toBeInTheDocument());

    const searchInput = screen.getByPlaceholderText('Search restaurants...');
    fireEvent.change(searchInput, { target: { value: 'Alpha' } });

    await waitFor(() => {
      expect(screen.getAllByText('Restaurant Alpha')[0]).toBeInTheDocument();
      expect(screen.queryByText('Restaurant Bravo')).not.toBeInTheDocument();
    });
  });

  test('filters restaurants by tag', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getAllByText('Restaurant Alpha')[0]).toBeInTheDocument());

    const tagButton = await screen.findByRole('button', { name: /#Fast Food/i });
    fireEvent.click(tagButton);

    await waitFor(() => {
      // After filtering, "Restaurant Alpha" should still be there (in the list)
      // And potentially in the wheel if it's the only one left.
      // We check the list specifically.
      const listItems = screen.getAllByRole('listitem'); // Assuming restaurant list items
      const alphaInList = listItems.some(item => item.textContent?.includes('Restaurant Alpha'));
      expect(alphaInList).toBe(true);

      const bravoInList = listItems.some(item => item.textContent?.includes('Restaurant Bravo'));
      expect(bravoInList).toBe(false);
    });
  });

});
