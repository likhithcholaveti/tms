import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import authService from '../services/authService';
import logo from '../logo.jpg';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check if already authenticated
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authenticated = authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    // Don't auto-redirect, allow user to logout and switch accounts
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const result = await authService.login(formData);

      if (result.success) {
        // Redirect based on user role
        authService.redirectByRole();
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      {/* Logo in top left corner */}
      <div className="auth-logo">
        {/* <img src={logo} alt="Company Logo" /> */}
      </div>

      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="TMS Logo" className="login-logo" />
          <h1>TMS Login</h1>
          <p>Transport Management System</p>
        </div>

        {isAuthenticated && (
          <div className="already-logged-in">
            <div className="info-message">
              <span className="info-icon">ℹ️</span>
              <strong>You are already logged in.</strong>
              <br />
              <small>If you want to login with a different account, please logout first.</small>
            </div>
            <button
              type="button"
              onClick={() => authService.logout()}
              className="logout-btn"
            >
              Logout & Switch Account
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <strong>Login Failed:</strong> {error}
              <br />
              <small>Please check your email and password, then try again.</small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="login-btn"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="login-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="register-link">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
