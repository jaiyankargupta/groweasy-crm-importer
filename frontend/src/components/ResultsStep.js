'use client';

import React, { useState } from 'react';

export default function ResultsStep({ result, onReset }) {
  const [tab, setTab] = useState('mapped');
  const { parsedRecords = [], skippedRecords = [], totalImported = 0, totalSkipped = 0 } = result || {};

  const statusClass = (s) => {
    const map = {
      'GOOD_LEAD_FOLLOW_UP': 'badge-green',
      'SALE_DONE': 'badge-cyan',
      'DID_NOT_CONNECT': 'badge-amber',
      'BAD_LEAD': 'badge-red',
    };
    return map[s] || 'badge-green';
  };

  const download = (content, name, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleJSON = () => {
    download(
      JSON.stringify({ records: parsedRecords, skipped: skippedRecords }, null, 2),
      'groweasy_leads.json',
      'application/json'
    );
  };

  const handleCSV = () => {
    if (!parsedRecords.length) return;
    const cols = [
      'created_at','name','email','country_code','mobile_without_country_code',
      'company','city','state','country','lead_owner',
      'crm_status','crm_note','data_source','possession_time','description'
    ];
    const rows = [cols.join(',')];
    for (const r of parsedRecords) {
      rows.push(cols.map(c => {
        const v = String(r[c] || '').replace(/"/g, '""');
        return v.includes(',') || v.includes('\n') || v.includes('"') ? `"${v}"` : v;
      }).join(','));
    }
    download(rows.join('\n'), 'groweasy_crm_leads.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <div className="fade-up" style={{ maxWidth: '1300px', margin: '0 auto', padding: '1rem 1rem 3rem' }}>
      {/* Stats strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem', marginBottom: '1.5rem',
      }}>
        {[
          { label: 'Processed', value: totalImported + totalSkipped, color: 'var(--text-primary)', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2 14 8 20 8' },
          { label: 'Imported', value: totalImported, color: 'var(--green)', icon: 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01 9 11.01' },
          { label: 'Skipped', value: totalSkipped, color: 'var(--red)', icon: 'M12 2a10 10 0 1 0 10 10M15 9 9 15M9 9 15 15' },
        ].map((s, i) => (
          <div key={i} className="card" style={{
            padding: '1.15rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '1rem',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i === 0 ? 'var(--bg-overlay)' : i === 1 ? 'var(--green-muted)' : 'var(--red-muted)',
              border: `1px solid ${i === 0 ? 'var(--border)' : i === 1 ? 'var(--green-border)' : 'var(--red-border)'}`,
              color: s.color,
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {i === 0 && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
                {i === 1 && <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>}
                {i === 2 && <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>}
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, lineHeight: 1.2, fontFamily: 'var(--font-mono)' }}>
                {s.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main panel */}
      <div className="container-main" style={{ padding: '1.5rem 2rem' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '2px',
            background: 'var(--bg-elevated)',
            padding: '3px',
            borderRadius: 'var(--r-md)',
            border: '1px solid var(--border)',
          }}>
            {[
              { id: 'mapped', label: `Imported (${totalImported})` },
              { id: 'skipped', label: `Skipped (${totalSkipped})` },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '5px',
                  border: 'none',
                  background: tab === t.id ? 'var(--bg-canvas)' : 'transparent',
                  color: tab === t.id ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: 600, fontSize: '0.75rem',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                  boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >{t.label}</button>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleJSON} className="btn btn-ghost" style={{ fontSize: '0.75rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              JSON
            </button>
            <button onClick={handleCSV} className="btn btn-success" style={{ fontSize: '0.75rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Export CSV
            </button>
            <button onClick={onReset} className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              New import
            </button>
          </div>
        </div>

        {/* Mapped tab */}
        {tab === 'mapped' && (
          totalImported === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-tertiary)' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>No valid leads found in this dataset.</p>
            </div>
          ) : (
            <div className="table-wrap" style={{ maxHeight: '600px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Company</th>
                    <th>Location</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRecords.map((r, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-tertiary)', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.name || '—'}</td>
                      <td style={{ color: 'var(--accent-hover)', fontSize: '0.8rem' }}>{r.email || '—'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        {r.mobile_without_country_code
                          ? <><span style={{ color: 'var(--text-tertiary)' }}>{r.country_code} </span>{r.mobile_without_country_code}</>
                          : '—'}
                      </td>
                      <td><span className={`badge ${statusClass(r.crm_status)}`}>{r.crm_status || 'GOOD_LEAD'}</span></td>
                      <td>{r.data_source ? <span className="badge badge-muted">{r.data_source}</span> : <span style={{ color: 'var(--text-tertiary)' }}>—</span>}</td>
                      <td style={{ fontSize: '0.8rem' }}>{r.company || '—'}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{[r.city, r.state, r.country].filter(Boolean).join(', ') || '—'}</td>
                      <td style={{ maxWidth: '280px', whiteSpace: 'normal', fontSize: '0.75rem', lineHeight: 1.4, color: r.crm_note ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                        {r.crm_note || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Skipped tab */}
        {tab === 'skipped' && (
          totalSkipped === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ color: 'var(--green)', marginBottom: '0.5rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>All records are valid</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Every row had a valid email or phone number.</p>
            </div>
          ) : (
            <div className="table-wrap" style={{ maxHeight: '500px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                    <th>Reason</th>
                    <th>Raw data</th>
                  </tr>
                </thead>
                <tbody>
                  {skippedRecords.map((item, i) => (
                    <tr key={i}>
                      <td style={{ color: 'var(--text-tertiary)', textAlign: 'center', fontWeight: 600, fontSize: '0.75rem' }}>{i + 1}</td>
                      <td><span className="badge badge-red">{item.reason || 'Missing email & phone'}</span></td>
                      <td>
                        <pre style={{
                          margin: 0, padding: '0.5rem 0.75rem',
                          background: 'var(--bg-elevated)',
                          borderRadius: '6px',
                          fontSize: '0.7rem', color: 'var(--text-secondary)',
                          maxWidth: '600px', overflowX: 'auto',
                          fontFamily: 'var(--font-mono)',
                          border: '1px solid var(--border)',
                        }}>
                          {JSON.stringify(item.rawRow, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
