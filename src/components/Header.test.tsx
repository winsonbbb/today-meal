// src/components/Header.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

describe('Header Component', () => {
  const mockOnLogout = jest.fn();
  const mockOnShowAddRestaurantModal = jest.fn();
  const username = 'TestUser';

  beforeEach(() => {
    // Reset mocks before each test
    mockOnLogout.mockClear();
    mockOnShowAddRestaurantModal.mockClear();
  });

  test('renders welcome message with username', () => {
    render(
      <Header
        username={username}
        onLogout={mockOnLogout}
        onShowAddRestaurantModal={mockOnShowAddRestaurantModal}
      />
    );
    expect(screen.getByText(`Welcome, ${username}`)).toBeInTheDocument();
  });

  test('renders logout button and calls onLogout when clicked', () => {
    render(
      <Header
        username={username}
        onLogout={mockOnLogout}
        onShowAddRestaurantModal={mockOnShowAddRestaurantModal}
      />
    );
    const logoutButton = screen.getByRole('button', { name: /logout/i });
    expect(logoutButton).toBeInTheDocument();
    fireEvent.click(logoutButton);
    expect(mockOnLogout).toHaveBeenCalledTimes(1);
  });

  test('renders "Add Restaurant" button and calls onShowAddRestaurantModal when clicked', () => {
    render(
      <Header
        username={username}
        onLogout={mockOnLogout}
        onShowAddRestaurantModal={mockOnShowAddRestaurantModal}
      />
    );
    const addButton = screen.getByRole('button', { name: /\+ Add Restaurant/i });
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    expect(mockOnShowAddRestaurantModal).toHaveBeenCalledTimes(1);
  });

  test('renders correctly when username is null', () => {
    render(
      <Header
        username={null}
        onLogout={mockOnLogout}
        onShowAddRestaurantModal={mockOnShowAddRestaurantModal}
      />
    );
    // Check that it doesn't break and still renders "Welcome,"
    expect(screen.getByText(/Welcome,/i)).toBeInTheDocument();
    // Ensure username part is not there or is empty
    expect(screen.queryByText(`Welcome, ${username}`)).not.toBeInTheDocument();
  });
});
