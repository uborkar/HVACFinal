import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        {/* Logo Section */}
        <div className="header-left">
          <Link to="/" className="header-logo" onClick={closeMenu}>
            <div className="logo-icon">
              <i className="bi bi-wind"></i>
            </div>
            <span className="company-name">Valiant Aircom</span>
          </Link>
        </div>

        {/* Navigation Section */}
        <div className="header-center">
          {user && (
            <nav className="desktop-nav">
              <Link to="/" className="nav-link">
                <i className="bi bi-calculator"></i>
                <span>Calculator</span>
              </Link>
              <Link to="/projects" className="nav-link">
                <i className="bi bi-folder"></i>
                <span>Projects</span>
              </Link>
              <Link to="/help" className="nav-link">
                <i className="bi bi-question-circle"></i>
                <span>Help</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Actions Section */}
        <div className="header-right">
          {user ? (
            <div className="user-section">
              <div className="user-info">
                <span className="user-name">{user.displayName || user.email?.split('@')[0]}</span>
                <span className="user-role">Estimator</span>
              </div>
              <button onClick={handleLogout} className="logout-button" title="Logout">
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-button login-button" onClick={closeMenu}>
                Login
              </Link>
              <Link to="/register" className="auth-button register-button" onClick={closeMenu}>
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            className={`mobile-menu-button ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <>
          <div className="mobile-nav">
            {user && (
              <>
                <div className="mobile-user-info">
                  <div className="mobile-user-avatar">
                    <i className="bi bi-person-circle"></i>
                  </div>
                  <div className="mobile-user-details">
                    <span className="mobile-user-name">{user.displayName || user.email?.split('@')[0]}</span>
                    <span className="mobile-user-email">{user.email}</span>
                  </div>
                </div>
                
                <div className="mobile-nav-links">
                  <Link to="/" className="mobile-nav-link" onClick={closeMenu}>
                    <i className="bi bi-calculator"></i>
                    <span>Calculator</span>
                  </Link>
                  <Link to="/projects" className="mobile-nav-link" onClick={closeMenu}>
                    <i className="bi bi-folder"></i>
                    <span>Projects</span>
                  </Link>
                  <Link to="/help" className="mobile-nav-link" onClick={closeMenu}>
                    <i className="bi bi-question-circle"></i>
                    <span>Help</span>
                  </Link>
                  <button onClick={handleLogout} className="mobile-logout-button">
                    <i className="bi bi-box-arrow-right"></i>
                    <span>Logout</span>
                  </button>
                </div>
              </>
            )}
            
            {!user && (
              <div className="mobile-auth-links">
                <Link to="/login" className="mobile-auth-link" onClick={closeMenu}>
                  <i className="bi bi-box-arrow-in-right"></i>
                  <span>Login</span>
                </Link>
                <Link to="/register" className="mobile-auth-link" onClick={closeMenu}>
                  <i className="bi bi-person-plus"></i>
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
          <div className="mobile-menu-overlay" onClick={closeMenu}></div>
        </>
      )}
    </header>
  );
};

export default Header;