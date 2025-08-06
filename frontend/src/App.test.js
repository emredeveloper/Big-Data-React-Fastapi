import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Canlı Veri Dashboard/i);
  expect(titleElement).toBeInTheDocument();
});
