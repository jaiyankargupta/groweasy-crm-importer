'use client';

import React from 'react';

export default function Navbar({ aiProvider = 'groq', onProviderChange, onReset }) {
  const providers = [
    { id: 'groq', label: 'Llama 3.3 70B — Versatile' },
    { id: 'groq-llama-8b', label: 'Llama 3.1 8B — Fast' },
    { id: 'groq-mixtral', label: 'Mixtral 8x7B' },
    { id: 'groq-gemma', label: 'Gemma 2 9B' },
    { id: 'heuristic', label: 'Rule-Based (Offline)' }
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      height: '56px',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div
        onClick={onReset}
        style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}
      >
        <img
          src="https://groweasy.ai/_next/image?url=%2Fimages%2Fgroweasy-logo-square.png&w=96&q=75"
          alt="GrowEasy"
          style={{ width: '28px', height: '28px', borderRadius: '6px' }}
        />
        <span style={{
          fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>GrowEasy</span>

      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Model selector */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0 0.65rem', height: '32px',
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--border)',
          background: 'var(--bg-surface)',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: aiProvider === 'heuristic' ? 'var(--amber)' : 'var(--green)',
            boxShadow: aiProvider === 'heuristic'
              ? '0 0 6px rgba(245,158,11,0.5)'
              : '0 0 6px rgba(34,197,94,0.5)',
          }} />
          <select
            value={aiProvider}
            onChange={(e) => onProviderChange?.(e.target.value)}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-secondary)', fontWeight: 500,
              fontSize: '0.75rem', fontFamily: 'var(--font-sans)',
              cursor: 'pointer', outline: 'none',
              paddingRight: '0.25rem',
            }}
          >
            {providers.map(p => (
              <option key={p.id} value={p.id} style={{ background: 'var(--bg-elevated)', color: '#fff' }}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Portal link */}
        <a
          href="https://groweasy.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            fontSize: '0.75rem', fontWeight: 500,
            color: 'var(--text-tertiary)',
            textDecoration: 'none',
            padding: '0 0.5rem', height: '32px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          <span>groweasy.ai</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </a>
      </div>
    </header>
  );
}
