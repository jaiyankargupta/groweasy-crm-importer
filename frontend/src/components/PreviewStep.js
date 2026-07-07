'use client';

import React from 'react';

export default function PreviewStep({ filename, totalRows, headers, records, onConfirm, onBack, isLoading }) {
  return (
    <div className="fade-up" style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 1rem 3rem' }}>
      <div className="container-main" style={{ padding: '2rem 2.5rem' }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {filename}
              </h2>
            </div>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', margin: 0 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{totalRows}</span> rows
              <span style={{ margin: '0 0.35rem', opacity: 0.4 }}>·</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{headers.length}</span> columns detected
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onBack} disabled={isLoading} className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back
            </button>
            <button onClick={onConfirm} disabled={isLoading} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1.25rem' }}>
              {isLoading ? (
                <>
                  <span className="pulse-soft">Processing...</span>
                </>
              ) : (
                <>
                  Run extraction
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '44px', textAlign: 'center' }}>#</th>
                {headers.map((h, i) => <th key={i}>{h || `col_${i + 1}`}</th>)}
              </tr>
            </thead>
            <tbody>
              {records.slice(0, 50).map((row, ri) => (
                <tr key={ri}>
                  <td style={{ color: 'var(--text-tertiary)', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>{ri + 1}</td>
                  {headers.map((h, ci) => (
                    <td key={ci} title={row[h]}>
                      {row[h] != null && row[h] !== '' ? String(row[h]) : <span style={{ color: 'var(--text-tertiary)', opacity: 0.4 }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {records.length > 50 && (
          <div style={{
            textAlign: 'center', padding: '0.65rem',
            color: 'var(--text-tertiary)', fontSize: '0.75rem',
            borderTop: '1px solid var(--border)',
          }}>
            Showing 50 of {records.length} rows — all will be processed
          </div>
        )}

        {/* Info banner */}
        <div style={{
          marginTop: '1.25rem', padding: '0.85rem 1rem',
          background: 'var(--accent-muted)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)',
          display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
          fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-hover)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            The extraction engine will map these columns to the GrowEasy CRM schema, normalize statuses to
            {' '}<code className="mono" style={{ color: 'var(--green)', fontSize: '0.7rem' }}>GOOD_LEAD</code>,{' '}
            <code className="mono" style={{ color: 'var(--cyan)', fontSize: '0.7rem' }}>SALE_DONE</code>,{' '}
            <code className="mono" style={{ color: 'var(--amber)', fontSize: '0.7rem' }}>DID_NOT_CONNECT</code>,{' '}
            <code className="mono" style={{ color: 'var(--red)', fontSize: '0.7rem' }}>BAD_LEAD</code>,{' '}
            and consolidate multi-contact fields.
          </span>
        </div>
      </div>
    </div>
  );
}
