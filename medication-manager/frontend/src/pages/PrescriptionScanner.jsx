import React, { useState, useRef } from 'react';
import { ScanLine, Upload, FileText, Check, ChevronRight, X, Camera, Sparkles } from 'lucide-react';
import { api } from '../utils/api.js';
import { useNavigate } from 'react-router-dom';

export default function PrescriptionScanner() {
  const [mode, setMode] = useState('choose'); // 'choose' | 'image' | 'text' | 'result'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editResult, setEditResult] = useState(null);
  const fileRef = useRef();
  const navigate = useNavigate();

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setMode('image');
  };

  const handleScanImage = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('prescription', imageFile);
      const data = await api.parsePrescriptionImage(formData);
      setResult(data);
      setEditResult({ ...data });
      setMode('result');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScanText = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.parsePrescriptionText(textInput);
      setResult(data);
      setEditResult({ ...data });
      setMode('result');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.createMedication({
        name: editResult.name,
        dosage: editResult.dosage || '',
        frequency: editResult.frequency || 'Once daily',
        start_date: new Date().toISOString().split('T')[0],
        instructions: editResult.instructions || '',
        prescriber: editResult.prescriber || '',
        refills_remaining: editResult.refills || 0,
        supply_days: editResult.supply_days || 30,
        supply_remaining: editResult.supply_days || 30,
      });
      navigate('/medications');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const reset = () => {
    setMode('choose');
    setImageFile(null);
    setImagePreview(null);
    setTextInput('');
    setResult(null);
    setEditResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Prescription Scanner</h2>
        <p className="text-gray-500 text-lg mt-1">
          Use Claude AI to extract medication details from a prescription
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex justify-between items-center">
          <p className="text-red-800 font-medium">{error}</p>
          <button onClick={() => setError(null)}><X className="w-5 h-5 text-red-600" /></button>
        </div>
      )}

      {mode === 'choose' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">AI-Powered Extraction</p>
                <p className="text-gray-500">Claude reads your prescription and fills in the details automatically</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => fileRef.current.click()}
            className="card w-full text-left hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer"
          >
            <div className="flex items-center gap-5 py-4">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Camera className="w-9 h-9 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-gray-900">Upload Prescription Image</p>
                <p className="text-gray-500 text-lg mt-1">
                  Take a photo or upload an image of your prescription
                </p>
                <p className="text-sm text-gray-400 mt-1">JPG, PNG, GIF, WebP (max 10MB)</p>
              </div>
              <ChevronRight className="w-7 h-7 text-gray-400" />
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />

          <button
            onClick={() => setMode('text')}
            className="card w-full text-left hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 hover:border-green-400 cursor-pointer"
          >
            <div className="flex items-center gap-5 py-4">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-9 h-9 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold text-gray-900">Enter Prescription Text</p>
                <p className="text-gray-500 text-lg mt-1">
                  Type or paste prescription information manually
                </p>
              </div>
              <ChevronRight className="w-7 h-7 text-gray-400" />
            </div>
          </button>
        </div>
      )}

      {mode === 'image' && (
        <div className="space-y-5">
          <div className="card">
            <p className="font-semibold text-gray-700 mb-3 text-lg">Prescription Image</p>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Prescription"
                className="w-full max-h-80 object-contain rounded-xl border-2 border-gray-200 bg-gray-50"
              />
            )}
            <p className="text-gray-500 mt-2 truncate">{imageFile?.name}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleScanImage}
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Claude is reading...
                </>
              ) : (
                <>
                  <ScanLine className="w-5 h-5" />
                  Extract with Claude AI
                </>
              )}
            </button>
            <button onClick={reset} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {mode === 'text' && (
        <div className="space-y-5">
          <div className="card">
            <label className="label">Prescription Text</label>
            <textarea
              className="input-field"
              rows={8}
              placeholder="Paste or type the prescription text here...&#10;&#10;Example:&#10;Metformin 500mg&#10;Take twice daily with meals&#10;Dr. Johnson&#10;Refills: 3&#10;30 day supply"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleScanText}
              disabled={loading || !textInput.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Claude is reading...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Extract with Claude AI
                </>
              )}
            </button>
            <button onClick={reset} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {mode === 'result' && editResult && (
        <div className="space-y-5">
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-7 h-7 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-900 text-lg">Extraction Complete!</p>
              <p className="text-green-700">Review the details below and save when ready.</p>
            </div>
          </div>

          <div className="card space-y-5">
            <h3 className="text-xl font-bold text-gray-900">Extracted Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Medication Name</label>
                <input
                  className="input-field"
                  value={editResult.name || ''}
                  onChange={(e) => setEditResult((r) => ({ ...r, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Dosage</label>
                <input
                  className="input-field"
                  value={editResult.dosage || ''}
                  onChange={(e) => setEditResult((r) => ({ ...r, dosage: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="label">Frequency</label>
              <input
                className="input-field"
                value={editResult.frequency || ''}
                onChange={(e) => setEditResult((r) => ({ ...r, frequency: e.target.value }))}
              />
            </div>

            <div>
              <label className="label">Instructions</label>
              <textarea
                className="input-field"
                rows={2}
                value={editResult.instructions || ''}
                onChange={(e) => setEditResult((r) => ({ ...r, instructions: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Prescriber</label>
                <input
                  className="input-field"
                  value={editResult.prescriber || ''}
                  onChange={(e) => setEditResult((r) => ({ ...r, prescriber: e.target.value }))}
                />
              </div>
              <div>
                <label className="label">Refills</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={editResult.refills || 0}
                  onChange={(e) => setEditResult((r) => ({ ...r, refills: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="label">Days Supply</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  value={editResult.supply_days || 30}
                  onChange={(e) => setEditResult((r) => ({ ...r, supply_days: parseInt(e.target.value) || 30 }))}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving || !editResult.name}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : (
                <>
                  <Check className="w-5 h-5" />
                  Save to My Medications
                </>
              )}
            </button>
            <button onClick={reset} className="btn-secondary">Scan Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
