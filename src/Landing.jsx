import { useState } from 'react'
import './Landing.css'

function Landing({ onEnter }) {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="landing-header">
          <div className="logo-circle">
            <span className="logo-text">BH</span>
          </div>
          <h1 className="landing-title">Capareda Boarding House</h1>
          <p className="landing-subtitle">Debt Tracking System</p>
        </div>

        <div className="landing-features">
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Track Debts</h3>
            <p>Keep accurate records of who owes whom</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Manage Boarders</h3>
            <p>All residents in one secure platform</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>View Balances</h3>
            <p>Real-time balance updates and breakdowns</p>
          </div>
        </div>

        <button className="enter-button" onClick={onEnter}>
          <span>Enter System</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="landing-footer">
          <p>Secure • Private • Easy to Use</p>
        </div>
      </div>

      <div className="landing-decoration">
        <div className="decoration-circle circle-1"></div>
        <div className="decoration-circle circle-2"></div>
        <div className="decoration-circle circle-3"></div>
      </div>
    </div>
  )
}

export default Landing
