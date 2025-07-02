// src/components/DrawHistory.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DrawHistory from './DrawHistory';

interface DrawHistoryEntry {
  name: string;
  timestamp: string;
}

describe('DrawHistory Component', () => {
  const sampleHistory: DrawHistoryEntry[] = [
    { name: 'Restaurant Alpha', timestamp: '2023-10-28 10:00:00' },
    { name: 'Restaurant Beta', timestamp: '2023-10-27 14:30:00' },
  ];

  test('renders nothing if history is empty', () => {
    const { container } = render(<DrawHistory history={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders "Draw History" title and list items when history is provided', () => {
    render(<DrawHistory history={sampleHistory} />);

    expect(screen.getByText('Draw History')).toBeInTheDocument();
    sampleHistory.forEach(entry => {
      expect(screen.getByText(entry.name)).toBeInTheDocument();
      expect(screen.getByText(entry.timestamp)).toBeInTheDocument();
    });
  });

  test('renders correct number of history entries', () => {
    render(<DrawHistory history={sampleHistory} />);
    const listItems = screen.getAllByRole('listitem'); // Assumes each entry is an <li>
    expect(listItems).toHaveLength(sampleHistory.length);
  });
});
