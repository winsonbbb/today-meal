// src/components/AddRestaurantModal.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import AddRestaurantModal from './AddRestaurantModal';

describe('AddRestaurantModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  test('does not render when showModal is false', () => {
    const { container } = render(
      <AddRestaurantModal showModal={false} onClose={mockOnClose} onSubmit={mockOnSubmit} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders correctly when showModal is true', () => {
    render(<AddRestaurantModal showModal={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    expect(screen.getByText('Add Restaurant')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Cooldown Days')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Location Link (optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Tags (comma separated)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  test('calls onClose when Cancel button is clicked', () => {
    render(<AddRestaurantModal showModal={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onSubmit when form is submitted', () => {
    render(<AddRestaurantModal showModal={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByPlaceholderText('Name');
    const cooldownInput = screen.getByPlaceholderText('Cooldown Days');
    const locationInput = screen.getByPlaceholderText('Location Link (optional)');
    const tagsInput = screen.getByPlaceholderText('Tags (comma separated)');
    const addButton = screen.getByRole('button', { name: /add/i });

    fireEvent.change(nameInput, { target: { value: 'New Sushi Place' } });
    fireEvent.change(cooldownInput, { target: { value: '7' } });
    fireEvent.change(locationInput, { target: { value: 'http://maps.google.com' } });
    fireEvent.change(tagsInput, { target: { value: 'sushi, japanese' } });

    // Ensure the form element is retrieved correctly.
    // The previous error "Unable to find an accessible element with the role 'form'"
    // suggests getByRole might be failing. Let's try querySelector as a workaround
    // or to see if the form is present in a way getByRole doesn't pick up.
    const formElement = screen.getByTestId('add-restaurant-form'); // Add data-testid to form for robustness
    fireEvent.submit(formElement);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    // More detailed form data checking would happen in the App component's test or an integration test
    // as the modal itself doesn't handle the form data processing beyond submission.
  });

  test('Name input is required', () => {
    render(<AddRestaurantModal showModal={true} onClose={mockOnClose} onSubmit={mockOnSubmit} />);
    const nameInput = screen.getByPlaceholderText('Name');
    expect(nameInput).toBeRequired();
  });
});
