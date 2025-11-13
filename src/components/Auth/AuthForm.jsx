import { useState } from 'react';
import '../../styles/forms.css';
import './AuthForm.css';

const AuthForm = ({ onSubmit, title, submitText, error, isLogin = true }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <div className="modern-form-container">
      <div className="form-header">
        <h1 className="form-title">{title}</h1>
        <p className="form-subtitle">
          {isLogin ? 'Welcome back to Valiant Aircom! Please sign in to your account.' : 'Join Valiant Aircom and start calculating precise HVAC loads.'}
        </p>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label required" htmlFor="username">
              Username
            </label>
            <div className="input-with-icon">
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter your username"
              />
              <i className="bi bi-person input-icon"></i>
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label required" htmlFor="email">
            Email Address
          </label>
          <div className="input-with-icon">
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email address"
            />
            <i className="bi bi-envelope input-icon"></i>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label required" htmlFor="password">
            Password
          </label>
          <div className="input-with-icon">
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Enter your password"
            />
            <i className="bi bi-lock input-icon"></i>
          </div>
        </div>
        
        {!isLogin && (
          <div className="form-group">
            <label className="form-label required" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="input-with-icon">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
                placeholder="Confirm your password"
              />
              <i className="bi bi-shield-check input-icon"></i>
            </div>
          </div>
        )}
        
        <div className="form-actions form-actions-center">
          <button type="submit" className="btn btn-primary btn-full btn-lg">
            <i className="bi bi-arrow-right-circle"></i>
            {submitText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;