import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Live Data Dashboard/i);
  expect(titleElement).toBeInTheDocument();
});
