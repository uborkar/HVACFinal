import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ToastProvider } from './components/ui/toast';
import Header from './components/Layout/Header';
import Hero from './components/Layout/Hero';
import Footer from './components/Layout/Footer';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CalculatorDashboard from './components/Calculator/CalculatorDashboard';
import ProjectManager from './components/Projects/ProjectManager';
import ProtectedRoute from './components/Layout/ProtectedRoute';
import DesignedInputs from './components/Calculator/DesignedInputs';
import './styles/forms.css';
import './App.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #667eea',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ color: '#4a5568', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
      <div className="app">
        <Header />
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                user ? (
                  <Navigate to="/projects" />
                ) : (
                  <>
                    <Hero />
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                      <h2 style={{ marginBottom: '1rem', color: '#2d3748' }}>
                        Get Started with Professional HVAC Calculations
                      </h2>
                      <p style={{ marginBottom: '2rem', color: '#4a5568', maxWidth: '600px', margin: '0 auto 2rem' }}>
                        Sign in to access your projects and start calculating precise cooling loads for your HVAC systems.
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a 
                          href="/login" 
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '0.75rem 2rem',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'transform 0.3s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          <i className="bi bi-box-arrow-in-right"></i>
                          Sign In
                        </a>
                        <a 
                          href="/register" 
                          style={{
                            background: 'rgba(34, 197, 94, 0.9)',
                            color: 'white',
                            padding: '0.75rem 2rem',
                            borderRadius: '10px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            transition: 'transform 0.3s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          <i className="bi bi-person-plus"></i>
                          Get Started
                        </a>
                      </div>
                    </div>
                  </>
                )
              } 
            />
            <Route 
              path="/projects" 
              element={
                <ProtectedRoute>
                  <ProjectManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/calculator" 
              element={
                <ProtectedRoute>
                  <div className="calculator-wrapper">
                    <CalculatorDashboard />
                  </div>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                !user ? (
                  <div className="auth-pages">
                    <Login />
                  </div>
                ) : (
                  <Navigate to="/projects" />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                !user ? (
                  <div className="auth-pages">
                    <Register />
                  </div>
                ) : (
                  <Navigate to="/projects" />
                )
              } 
            />
          </Routes>
        </main>
        
        <Footer />
      </div>
    </Router>
    </ToastProvider>
  );
}

export default App;