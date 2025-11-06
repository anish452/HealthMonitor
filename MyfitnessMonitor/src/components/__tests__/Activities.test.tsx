import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import Activities from '../Activities';

// Mock the react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock the toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the fetch API
global.fetch = jest.fn();

// Mock the AuthContext
const mockLogout = jest.fn();
const mockUseAuth = jest.fn().mockReturnValue({
  token: 'test-token',
  username: 'testuser',
  logout: mockLogout,
});

// Mock the context module
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Activities Component', () => {
  const queryClient = new QueryClient();
  
  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Activities />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful fetch for activities
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });
  });

  it('renders the activities page with header and add button', async () => {
    await act(async () => {
      renderComponent();
    });
    
    // Check if the header is rendered
    expect(screen.getByText('FitTrack Pro')).toBeInTheDocument();
    expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
    
    // Check if the main title and add button are rendered
    expect(screen.getByText('Your Activities')).toBeInTheDocument();
    expect(screen.getByText('Add Activity')).toBeInTheDocument();
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('opens the create activity dialog when add button is clicked', async () => {
    await act(async () => {
      renderComponent();
    });
    
    // Click the add activity button
    const addButton = screen.getByText('Add Activity');
    await act(async () => {
      fireEvent.click(addButton);
    });
    
    // Check if the dialog is opened
    expect(screen.getByText('Add New Activity')).toBeInTheDocument();
  });

  it('displays activities when fetched successfully', async () => {
    const mockActivities = [
      {
        id: 1,
        activity_type: 'workout',
        title: 'Morning Run',
        description: '5k run in the park',
        date: '2023-01-01',
        duration_minutes: 30,
        calories: 300,
        status: 'completed',
        created_at: '2023-01-01T10:00:00Z',
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockActivities,
    });

    await act(async () => {
      renderComponent();
    });

    // Wait for the activities to be loaded
    await waitFor(() => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('5k run in the park')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('300 cal')).toBeInTheDocument();
    });
  });

  it('handles API error when fetching activities', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    await act(async () => {
      renderComponent();
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch activities');
    });
  });

  it('allows user to log out', async () => {
    await act(async () => {
      renderComponent();
    });
    
    // Click the logout button
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      fireEvent.click(logoutButton);
    });
    
    // Check if logout function was called
    expect(mockLogout).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Logged out successfully');
  });
});
