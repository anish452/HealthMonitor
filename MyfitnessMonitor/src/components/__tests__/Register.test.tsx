import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'sonner';
import Register from '../Register';

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

describe('Register Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful registration response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
  };

  it('renders the registration form', () => {
    renderComponent();
    
    // Check if the form elements are rendered
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.getByText('Already have an account?')).toBeInTheDocument();
  });

  it('allows entering registration details', () => {
    renderComponent();
    
    const usernameInput = screen.getByLabelText('Username');
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(usernameInput).toHaveValue('testuser');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('submits the form with user registration data', async () => {
    renderComponent();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    
    // Check if fetch was called with the correct data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('https://myfitnesstracking-v3.onrender.com/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });
    
    // Check if success toast was shown and navigation happened
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Registration successful! Please login.');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error message on registration failure', async () => {
    // Mock failed registration response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Username already exists' }),
    });
    
    renderComponent();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'existinguser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    
    // Check if error toast was shown with the server message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Username already exists');
    });
  });

  it('shows network error message on fetch failure', async () => {
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    renderComponent();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
    
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
        json: async () => ({}),
      }), 1000))
    );
    
    renderComponent();
    
    // Fill in the form
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(submitButton);
    
    // Check if button is disabled and shows loading text
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Creating Account...');
  });

  it('shows validation error for required fields', async () => {
    await act(async () => {
      renderComponent();
      
      // Try to submit the form without filling any fields
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      fireEvent.click(submitButton);
      
      // Check if validation errors are shown
      expect(screen.getByLabelText('Username')).toBeInvalid();
      expect(screen.getByLabelText('Email')).toBeInvalid();
      expect(screen.getByLabelText('Password')).toBeInvalid();
      
      // Check that the API was not called
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
