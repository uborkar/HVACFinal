import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">
          Professional HVAC Load Calculator
        </h1>
        <p className="hero-subtitle">
          Calculate precise cooling loads and generate comprehensive equipment recommendations 
          for your HVAC projects with our advanced psychrometric calculations.
        </p>
        
        <div className="hero-features">
          <div className="hero-feature">
            <i className="bi bi-calculator hero-feature-icon"></i>
            <h3>Precise Calculations</h3>
            <p>Advanced psychrometric calculations for accurate load determination</p>
          </div>
          
          <div className="hero-feature">
            <i className="bi bi-file-earmark-pdf hero-feature-icon"></i>
            <h3>PDF Export</h3>
            <p>Generate professional BOQ reports with detailed equipment specifications</p>
          </div>
          
          <div className="hero-feature">
            <i className="bi bi-cloud-arrow-up hero-feature-icon"></i>
            <h3>Cloud Storage</h3>
            <p>Save and access your projects from anywhere with Firebase integration</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
