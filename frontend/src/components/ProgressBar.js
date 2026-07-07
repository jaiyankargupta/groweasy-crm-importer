'use client';

import React from 'react';

export default function ProgressBar({ progress }) {
  const { processedRows = 0, totalRows = 0, percentage = 0, status = 'processing' } = progress || {};
  const isDone = status === 'completed';

  return (
    <div className="fade-up" style={{ maxWidth: '480px', margin: '4rem auto', padding: '0 1rem' }}>
      <div className="container-main" style={{ padding: '2.5rem', textAlign: 'center' }}>
        {/* Spinner / Check */}
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem',
          background: isDone ? 'var(--green-muted)' : 'var(--accent-muted)',
          border: `1px solid ${isDone ? 'var(--green-border)' : 'var(--accent-border)'}`,
          color: isDone ? 'var(--green)' : 'var(--accent-hover)',
          transition: 'all 0.3s ease',
        }}>
          {isDone ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pulse-soft">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          )}
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
          {isDone ? 'Extraction complete' : 'Processing records...'}
        </h3>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          {isDone
            ? `All ${totalRows} records have been mapped.`
            : `Mapping fields and validating contacts`}
        </p>

        {/* Progress track */}
        <div style={{
          width: '100%', height: '4px',
          background: 'var(--bg-elevated)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '0.75rem',
        }}>
          <div style={{
            width: `${percentage}%`,
            height: '100%',
            background: isDone
              ? 'var(--green)'
              : 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
            borderRadius: '2px',
            transition: 'width 0.3s ease, background 0.3s ease',
          }} />
        </div>

        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500,
          fontFamily: 'var(--font-mono)',
        }}>
          <span>{processedRows}/{totalRows} rows</span>
          <span style={{ color: isDone ? 'var(--green)' : 'var(--accent-hover)' }}>{percentage}%</span>
        </div>
      </div>
    </div>
  );
}
