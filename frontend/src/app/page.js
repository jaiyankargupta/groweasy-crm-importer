'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import StepIndicator from '@/components/StepIndicator';
import UploadStep from '@/components/UploadStep';
import PreviewStep from '@/components/PreviewStep';
import ProgressBar from '@/components/ProgressBar';
import ResultsStep from '@/components/ResultsStep';

export default function Home() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filename, setFilename] = useState('');
  const [totalRows, setTotalRows] = useState(0);
  const [headers, setHeaders] = useState([]);
  const [rawRecords, setRawRecords] = useState([]);

  const [extractionProgress, setExtractionProgress] = useState(null);
  const [extractedResult, setExtractedResult] = useState(null);
  const [aiProvider, setAiProvider] = useState('groq');

  const handleUpload = async (fileOrBlob) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', fileOrBlob);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${apiUrl}/api/upload`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to parse CSV file.');
      setFilename(data.filename || fileOrBlob.name || 'uploaded.csv');
      setTotalRows(data.totalRows);
      setHeaders(data.headers || []);
      setRawRecords(data.records || []);
      setStep(2);
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') console.error('[Upload Error]', err);
      setError(err.message || 'An error occurred during CSV ingestion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmExtraction = async () => {
    setIsLoading(true);
    setError(null);
    setExtractionProgress({ status: 'processing', percentage: 10, batchIndex: 1, totalBatches: 1, processedRows: 0, totalRows: rawRecords.length });
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const progressInterval = setInterval(() => {
        setExtractionProgress(prev => {
          if (!prev || prev.percentage >= 85) return prev;
          return { ...prev, percentage: prev.percentage + 15, processedRows: Math.min(rawRecords.length, Math.round((prev.percentage + 15) / 100 * rawRecords.length)) };
        });
      }, 800);
      const res = await fetch(`${apiUrl}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: rawRecords, provider: aiProvider, batchSize: 15 })
      });
      clearInterval(progressInterval);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Data mapping failed.');
      setExtractionProgress({ status: 'completed', percentage: 100, batchIndex: 1, totalBatches: 1, processedRows: rawRecords.length, totalRows: rawRecords.length });
      setExtractedResult(data);
      setTimeout(() => { setIsLoading(false); setStep(3); }, 600);
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') console.error('[Extraction Error]', err);
      setError(err.message || 'An error occurred during data mapping.');
      setIsLoading(false);
      setExtractionProgress(null);
    }
  };

  const handleReset = () => {
    setStep(1); setFilename(''); setTotalRows(0); setHeaders([]); setRawRecords([]);
    setExtractionProgress(null); setExtractedResult(null); setError(null); setIsLoading(false);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar aiProvider={aiProvider} onProviderChange={setAiProvider} onReset={handleReset} />
      <div style={{ flex: 1 }}>
        <StepIndicator currentStep={step} />
        {isLoading && extractionProgress ? (
          <ProgressBar progress={extractionProgress} />
        ) : (
          <>
            {step === 1 && <UploadStep onUpload={handleUpload} isLoading={isLoading} error={error} />}
            {step === 2 && <PreviewStep filename={filename} totalRows={totalRows} headers={headers} records={rawRecords} onConfirm={handleConfirmExtraction} onBack={() => setStep(1)} isLoading={isLoading} />}
            {step === 3 && extractedResult && <ResultsStep result={extractedResult} onReset={handleReset} />}
          </>
        )}
      </div>
      <footer style={{
        textAlign: 'center', padding: '1.25rem 1rem',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-tertiary)', fontSize: '0.7rem',
      }}>
        <span style={{ fontWeight: 500 }}>GrowEasy CRM Importer</span>
        <span style={{ margin: '0 0.5rem', opacity: 0.3 }}>·</span>
        <a href="https://groweasy.ai" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>groweasy.ai</a>
      </footer>
    </main>
  );
}
