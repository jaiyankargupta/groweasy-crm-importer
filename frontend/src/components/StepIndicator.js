'use client';

import React from 'react';

export default function StepIndicator({ currentStep }) {
  const steps = [
    { id: 1, label: 'Upload' },
    { id: 2, label: 'Preview' },
    { id: 3, label: 'Results' },
  ];

  return (
    <nav aria-label="Progress" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0',
      padding: '1.5rem 1rem 0.75rem',
    }}>
      {steps.map((step, i) => {
        const isActive = step.id === currentStep;
        const isDone = step.id < currentStep;

        return (
          <React.Fragment key={step.id}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.45rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              background: isActive ? 'var(--accent-muted)' : 'transparent',
              border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
              transition: 'all 0.2s ease',
            }}>
              <div style={{
                width: '20px', height: '20px',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 700,
                background: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--bg-overlay)',
                color: isDone || isActive ? '#fff' : 'var(--text-tertiary)',
                transition: 'all 0.2s ease',
              }}>
                {isDone ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : step.id}
              </div>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : isDone ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                transition: 'color 0.2s ease',
              }}>
                {step.label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div style={{
                width: '40px', height: '1px',
                background: isDone ? 'var(--green-border)' : 'var(--border)',
                margin: '0 0.25rem',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
