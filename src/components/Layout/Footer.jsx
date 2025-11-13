import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <div className="footer-logo-icon">
              <i className="bi bi-thermometer-half"></i>
            </div>
            <div className="footer-logo-text">
              <h3>Valiant Aircom</h3>
              <p>Professional Load Calculation</p>
            </div>
          </div>
          <p className="footer-description">
            Advanced HVAC load calculation tool for professionals. 
            Calculate precise cooling loads and generate comprehensive equipment recommendations.
          </p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Calculator</Link></li>
            <li><Link to="/projects">Projects</Link></li>
            <li><Link to="/help">Help & Support</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Features</h4>
          <ul className="footer-links">
            <li><span>Psychrometric Calculations</span></li>
            <li><span>PDF Export</span></li>
            <li><span>Cloud Storage</span></li>
            <li><span>Multi-step Workflow</span></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <div className="footer-contact">
            <div className="contact-item">
              <i className="bi bi-envelope"></i>
              <span>support@hvaccalculator.com</span>
            </div>
            <div className="contact-item">
              <i className="bi bi-telephone"></i>
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="contact-item">
              <i className="bi bi-geo-alt"></i>
              <span>Professional HVAC Solutions</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {currentYear} HVAC Calculator. All rights reserved.</p>
          <div className="footer-social">
            <a href="#" aria-label="LinkedIn">
              <i className="bi bi-linkedin"></i>
            </a>
            <a href="#" aria-label="Twitter">
              <i className="bi bi-twitter"></i>
            </a>
            <a href="#" aria-label="GitHub">
              <i className="bi bi-github"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
