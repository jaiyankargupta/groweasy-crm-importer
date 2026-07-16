'use client';

import React, { useState } from 'react';

const DEMO_DATASETS = {
  groweasy: {
    name: 'GrowEasy Assignment Default Sample.csv',
    desc: 'Standard 4-row sample with all 15 target CRM fields.',
    content: `created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description
2026-05-13 14:20:48,John Doe,john.doe@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,test@gmail.com,GOOD_LEAD_FOLLOW_UP,Client is asking to reschedule demo,,,
2026-05-13 14:25:30,Sarah Johnson,sarah.johnson@example.com,+91,9876543211,Tech Solutions,Bangalore,Karnataka,India,test@gmail.com,DID_NOT_CONNECT,"Person was busy, will try again next week",,,
2026-05-13 14:30:15,Rajesh Patel,rajesh.patel@example.com,+91,9876543212,Startup Inc,Delhi,Delhi,India,test@gmail.com,BAD_LEAD,Not interested in our services,,,
2026-05-13 14:35:22,Priya Singh,priya.singh@example.com,+91,9876543213,Enterprise Corp,Pune,Maharashtra,India,test@gmail.com,SALE_DONE,"Deal closed, onboarding in progress",,,`
  },
  facebook: {
    name: 'Facebook Lead Ads Export (Messy Columns).csv',
    desc: 'Irregular headers, alt emails in notes, intentional invalid rows.',
    content: `submission_time,full_name,work_email,phone_number,company_name,city,state,country,campaign_name,adset_name,notes_or_questions,lead_quality
2026-06-01T10:15:00Z,Amit Kumar,amit.k@techinnovate.in,+91-9811223344,Tech Innovate,Bangalore,Karnataka,India,leads_on_demand,Q2_Campaign,"Interested in AI integration. Alt email: amit.personal@gmail.com",Good
2026-06-01T11:20:00Z,Neha Sharma,neha.s@designstudio.com,09822334455,Design Studio,Mumbai,Maharashtra,India,meridian_tower,FB_Retargeting,"Called twice, no response",No Answer
2026-06-01T12:00:00Z,Vikram Singh,vikram@enterprises.org,+91 9833445566,Enterprises Org,Delhi,Delhi,India,eden_park,Lookalike_Ad,"Budget too low, not a fit",Bad
2026-06-01T13:45:00Z,Ananya Desai,ananya@cloudscale.ai,9844556677,CloudScale AI,Pune,Maharashtra,India,varah_swamy,Direct_Lead,"Signed contract for 1 year",Closed Won
2026-06-01T14:00:00Z,Invalid Lead Without Contact,,,,No Contact Corp,Chennai,Tamil Nadu,India,sarjapur_plots,Test_Ad,"This row has no email and no phone, should be skipped",`
  },
  realestate: {
    name: 'Real Estate CRM Export (Multi-Email & Phone).csv',
    desc: 'Multiple emails and phone columns to test Rule 5 consolidation.',
    content: `Date Added,Prospect Name,Primary Email,Secondary Email,Mobile Phone,Alt Phone,Employer,Location City,State,Agent Assigned,Status,Remarks / Follow up,Project Source,Expected Possession,Budget & Specs
10/06/2026 09:30,Rohan Mehta,rohan.m@investments.com,rohan.personal@yahoo.com,9870011223,022-24567890,Mehta Investments,Mumbai,MH,varun@groweasy.ai,Follow Up Required,"Looking for 3BHK with sea view",meridian_tower,Dec 2026,"3.5 Cr, Sea view required"
11/06/2026 14:15,Sunita Rao,sunita.r@biotech.co.in,,+919880022334,9880022335,BioTech India,Bangalore,KA,varun@groweasy.ai,Unreachable,"Phone switched off when called at 2 PM",sarjapur_plots,Immediate,"1.2 Cr, Plot in Sarjapur"
12/06/2026 16:45,Karan Malhotra,karan@malhotra.com,info@malhotra.com,9810033445,,Malhotra Group,Delhi,DL,varun@groweasy.ai,Not Interested,"Looking for commercial space only, we don't have it",eden_park,,
13/06/2026 11:00,Divya Nair,divya.nair@fintech.io,,9840044556,9840044557,Fintech IO,Chennai,TN,varun@groweasy.ai,Deal Done,"Booking amount received, agreement signed",varah_swamy,June 2027,"2.0 Cr, 2BHK Luxury"`
  },
  comprehensive: {
    name: 'Master Test Suite (All Rules & Edge Cases).csv',
    desc: 'Covers all 7 rules: status/source normalization, multi-contacts, missing contacts (skipped), and messy columns.',
    content: `submission_date,prospect_name,primary_email,alt_email,mobile_no,office_phone,company_name,city_loc,state_loc,country_loc,assigned_to,lead_status,remarks,source_project,possession_date,budget_notes
2026-07-01 10:00,Vikram Malhotra,vikram@malhotra.in,vikram.personal@gmail.com,+91-9811223344,011-23456789,Malhotra Enterprises,New Delhi,Delhi,India,agent1@groweasy.ai,Follow Up Required,"Interested in 4BHK luxury penthouse",meridian_tower,Dec 2026,"4.5 Cr budget"
2026-07-01 11:15,Sneha Mukherjee,sneha.m@techcorp.com,,9822334455,,TechCorp India,Bangalore,Karnataka,India,agent2@groweasy.ai,Unreachable,"Called 3 times, phone busy",sarjapur_plots,Immediate,"1.5 Cr villa plot"
2026-07-01 12:30,Arjun Mehta,arjun@mehta.org,info@mehta.org,9833445566,9833445567,Mehta Group,Mumbai,Maharashtra,India,agent1@groweasy.ai,Not Interested,"Looking for commercial shop only",eden_park,June 2027,"Not matching inventory"
2026-07-01 14:00,Pooja Nair,pooja.nair@fintech.io,,+91 9844556677,,Fintech Solutions,Chennai,Tamil Nadu,India,agent3@groweasy.ai,Deal Closed,"Token advance paid, agreement executed",varah_swamy,Ready to Move,"2.2 Cr apartment"
2026-07-01 15:20,Rohan Joshi,rohan.joshi@cloud.com,,,,Cloud Systems,Pune,Maharashtra,India,agent2@groweasy.ai,Good Lead,"Email only lead from webinar",Google Ads,2028,"1.8 Cr"
2026-07-01 16:45,Kavita Rao,,,9855667788,080-45678901,Rao Consulting,Hyderabad,Telangana,India,agent3@groweasy.ai,Follow Up,"Phone only lead, requested WhatsApp brochure",Referral Campaign,Immediate,"1.1 Cr"
2026-07-01 17:30,Invalid Lead No Contact,,,,,,No Contact Corp,Kolkata,West Bengal,India,agent1@groweasy.ai,New Lead,"No contact info provided in this row",meridian_tower,,`
  }
};

export default function UploadStep({ onUpload, isLoading, error }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState('');

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith('.csv')) onUpload(file);
    else alert('Please upload a valid .csv file.');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onUpload(file);
  };

  const handleDownloadSample = () => {
    const blob = new Blob([DEMO_DATASETS.groweasy.content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'groweasy_sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDemoSelect = (key) => {
    if (!key || !DEMO_DATASETS[key]) return;
    setSelectedDemo(key);
    const ds = DEMO_DATASETS[key];
    onUpload(new File([ds.content], ds.name, { type: 'text/csv' }));
  };

  return (
    <div className="fade-up" style={{ maxWidth: '720px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
      <div className="container-main" style={{ padding: '2.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)',
            marginBottom: '0.5rem',
          }}>
            Import your leads
          </h1>
          <p style={{
            color: 'var(--text-secondary)', fontSize: '0.9rem',
            maxWidth: '480px', margin: '0 auto', lineHeight: 1.6,
          }}>
            Upload any CSV — Facebook Ads, Google Ads, CRM exports, or custom spreadsheets. 
            We'll map it to your GrowEasy schema automatically.
          </p>
        </div>

        {/* Dropzone */}
        <div
          className={`dropzone ${isDragging ? 'active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => { if (!isLoading) document.getElementById('csv-file-input').click(); }}
          style={{
            marginBottom: '1.5rem',
            position: 'relative',
            zIndex: 1,
            cursor: isLoading ? 'wait' : 'pointer',
            opacity: isLoading ? 0.75 : 1,
            pointerEvents: isLoading ? 'none' : 'auto',
          }}
        >
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            disabled={isLoading}
          />
          <div style={{ position: 'relative', zIndex: 2 }}>
            {isLoading ? (
              <>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--accent-hover)',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="spin">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                </div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  Uploading and analyzing CSV...
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }} className="pulse-soft">
                  Parsing headers and records (Render server cold-start can take up to 50s)
                </p>
              </>
            ) : (
              <>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'var(--accent-muted)',
                  border: '1px solid var(--accent-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--accent-hover)',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {isDragging ? 'Drop your file here' : 'Drop CSV here, or click to browse'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: 0 }}>
                  Supports any column layout • Max 10 MB
                </p>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'var(--red-muted)',
            border: '1px solid var(--red-border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--red)',
            marginBottom: '1.5rem',
            fontSize: '0.8125rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '1rem',
          margin: '0.5rem 0 1.5rem',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
            or try a demo
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Demo datasets as clickable cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {Object.entries(DEMO_DATASETS).map(([key, ds]) => (
            <button
              key={key}
              onClick={() => handleDemoSelect(key)}
              disabled={isLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.75rem 1rem',
                background: selectedDemo === key ? 'var(--accent-muted)' : 'var(--bg-surface)',
                border: `1px solid ${selectedDemo === key ? 'var(--accent-border)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                cursor: isLoading ? 'wait' : 'pointer',
                textAlign: 'left',
                width: '100%',
                fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s ease',
                opacity: isLoading && selectedDemo !== key ? 0.5 : 1,
              }}
              onMouseEnter={e => { if (selectedDemo !== key && !isLoading) e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
              onMouseLeave={e => { if (selectedDemo !== key && !isLoading) e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <div style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: selectedDemo === key ? 'var(--accent-hover)' : 'var(--text-tertiary)', flexShrink: 0,
              }}>
                {isLoading && selectedDemo === key ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="spin">
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.1rem' }}>
                  {ds.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                  {ds.desc}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        {/* Download template */}
        <button
          onClick={handleDownloadSample}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            width: '100%', padding: '0.6rem',
            background: 'transparent',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--r-md)',
            color: 'var(--text-tertiary)',
            fontSize: '0.75rem', fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download sample CSV template
        </button>
      </div>
    </div>
  );
}
