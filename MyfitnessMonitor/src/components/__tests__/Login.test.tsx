import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import Login from '../Login';

// Mock the react-router-dom
const mockNavigate = jest.fn();
const mockUseNavigate = jest.fn().mockImplementation(() => mockNavigate);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
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
const mockLogin = jest.fn();
const mockUseAuth = jest.fn().mockReturnValue({
  login: mockLogin,
});

// Mock the context module
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful login response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access: 'test-token' }),
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  it('renders the login form', () => {
    renderComponent();
    
    // Check if the form elements are rendered
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
  });

  it('allows entering username and password', () => {
    renderComponent();
    
    const usernameInput = screen.getByLabelText('Username');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  it('submits the form with user credentials', async () => {
    renderComponent();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // Check if fetch was called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('https://myfitnesstracking-v3.onrender.com/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'password123',
        }),
      });
    });
    
    // Check if login and navigation happened
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'test-token');
      expect(toast.success).toHaveBeenCalledWith('Login successful!');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows error message on login failure', async () => {
    // Mock failed login response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    });
    
    renderComponent();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'wronguser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // Check if error toast was shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid credentials. Please try again.');
    });
  });

  it('shows network error message on fetch failure', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    renderComponent();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    
    // Check if network error toast was shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error. Please try again.');
    });
  });

  it('disables the submit button when loading', async () => {
    // Mock a slow response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ access: 'test-token' }),
      }), 1000))
    );
    
    await act(async () => {
      renderComponent();
      
      // Fill in the form
      fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
      
      // Submit the form
      const submitButton = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(submitButton);
      
      // Check if button is disabled and shows loading text
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Signing In...');
    });
  });
});
