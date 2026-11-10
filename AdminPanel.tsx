import React, { useEffect, useState } from 'react';
import { AlertCircle, LogOut, Save, Shield, Trash2 } from 'lucide-react';
import { Petition, PetitionStatus, WardInfo } from '../types';

interface AdminPanelProps {
  petitions: Petition[];
  wards: WardInfo[];
  onRefresh: () => Promise<void>;
}

const statusOptions: { value: PetitionStatus; label: string }[] = [
  { value: 'pending', label: 'புதிய மனு' },
  { value: 'in_progress', label: 'பரிசீலனையில்' },
  { value: 'action_taken', label: 'நடவடிக்கை எடுக்கப்பட்டது' },
  { value: 'resolved', label: 'தீர்க்கப்பட்டது' }
];

export const AdminPanel: React.FC<AdminPanelProps> = ({ petitions, wards, onRefresh }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [username, setUsername] = useState('ASHOK');
  const [password, setPassword] = useState('');
  const [activeSection, setActiveSection] = useState<'wards' | 'petitions'>('wards');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/session')
      .then(response => {
        if (response.ok) setIsAuthenticated(true);
      })
      .catch(() => setErrorMessage('சேவையகத்துடன் இணைக்க முடியவில்லை.'))
      .finally(() => setIsCheckingSession(false));
  }, []);

  const request = async (url: string, method: string, body?: unknown) => {
    const response = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'கோரிக்கையை நிறைவேற்ற முடியவில்லை.');
    return result;
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSaving(true);
    try {
      await request('/api/admin/login', 'POST', { username, password });
      setIsAuthenticated(true);
      setPassword('');
      await onRefresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'உள்நுழைய முடியவில்லை.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await request('/api/admin/logout', 'POST');
      setIsAuthenticated(false);
      setSuccessMessage('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'வெளியேற முடியவில்லை.');
    }
  };

  const saveWard = async (event: React.FormEvent<HTMLFormElement>, ward: WardInfo) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const streets = String(formData.get('streets') || '')
      .split(/\r?\n/)
      .map(street => street.trim())
      .filter(Boolean);
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await request(`/api/admin/wards/${ward.wardNo}`, 'PUT', {
        name: formData.get('name'),
        keyStreets: streets
      });
      await onRefresh();
      setSuccessMessage(`வார்டு ${ward.wardNo} விவரங்கள் சேமிக்கப்பட்டன.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'வார்டு விவரங்களைச் சேமிக்க முடியவில்லை.');
    } finally {
      setIsSaving(false);
    }
  };

  const savePetition = async (event: React.FormEvent<HTMLFormElement>, petition: Petition) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await request(`/api/admin/petitions/${encodeURIComponent(petition.id)}`, 'PATCH', {
        title: formData.get('title'),
        description: formData.get('description'),
        status: formData.get('status'),
        officialNote: formData.get('officialNote')
      });
      await onRefresh();
      setSuccessMessage(`${petition.trackingNo} மனு விவரங்கள் சேமிக்கப்பட்டன.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'மனு விவரங்களைச் சேமிக்க முடியவில்லை.');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePetition = async (petition: Petition) => {
    if (!window.confirm(`${petition.trackingNo} மனுவை நிரந்தரமாக நீக்க வேண்டுமா?`)) return;
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await request(`/api/admin/petitions/${encodeURIComponent(petition.id)}`, 'DELETE');
      await onRefresh();
      setSuccessMessage(`${petition.trackingNo} மனு நீக்கப்பட்டது.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'மனுவை நீக்க முடியவில்லை.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isCheckingSession) {
    return <div className="p-8 text-center text-neutral-600">நிர்வாக உள்நுழைவைச் சரிபார்க்கிறது...</div>;
  }

  if (!isAuthenticated) {
    return (
      <section className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-neutral-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#4a0000] text-[#ffcc00] flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#4a0000]">நிர்வாகி உள்நுழைவு</h2>
            <p className="text-xs text-neutral-600">வார்டுகள் மற்றும் புகார்களை நிர்வகிக்க</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-sm font-bold text-neutral-700">
            பயனர்பெயர்
            <input
              required
              autoComplete="username"
              value={username}
              onChange={event => setUsername(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 font-normal"
            />
          </label>
          <label className="block text-sm font-bold text-neutral-700">
            கடவுச்சொல்
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 font-normal"
            />
          </label>
          {errorMessage && (
            <p role="alert" className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />{errorMessage}
            </p>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-md bg-[#4a0000] px-4 py-2.5 font-bold text-white disabled:opacity-60"
          >
            {isSaving ? 'உள்நுழைகிறது...' : 'உள்நுழைக'}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold text-emerald-700">ASHOK · நிர்வாகி</p>
          <h2 className="text-2xl font-extrabold text-[#4a0000]">நிர்வாகப் பலகை</h2>
        </div>
        <button onClick={handleLogout} className="inline-flex items-center gap-2 self-start rounded-md border border-neutral-300 px-3 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50">
          <LogOut className="w-4 h-4" /> வெளியேறு
        </button>
      </div>

      <div className="flex gap-2 border-b border-neutral-200 mb-5">
        <button onClick={() => setActiveSection('wards')} className={`px-4 py-2 text-sm font-bold ${activeSection === 'wards' ? 'border-b-2 border-[#4a0000] text-[#4a0000]' : 'text-neutral-500'}`}>
          வார்டுகள் மற்றும் வீதிகள் ({wards.length})
        </button>
        <button onClick={() => setActiveSection('petitions')} className={`px-4 py-2 text-sm font-bold ${activeSection === 'petitions' ? 'border-b-2 border-[#4a0000] text-[#4a0000]' : 'text-neutral-500'}`}>
          புகார் மேலாண்மை ({petitions.length})
        </button>
      </div>

      {errorMessage && <p role="alert" className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>}
      {successMessage && <p role="status" className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p>}

      {activeSection === 'wards' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {wards.map(ward => (
            <form key={ward.wardNo} onSubmit={event => saveWard(event, ward)} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="font-extrabold text-[#4a0000]">வார்டு எண் {ward.wardNo}</h3>
              <label className="block text-xs font-bold text-neutral-700">
                வார்டு பகுதி பெயர்
                <input name="name" required maxLength={120} defaultValue={ward.name} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal" />
              </label>
              <label className="block text-xs font-bold text-neutral-700">
                முக்கிய வீதிகள் (ஒவ்வொரு வரியிலும் ஒரு வீதி)
                <textarea name="streets" rows={4} defaultValue={ward.keyStreets.join('\n')} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal" />
              </label>
              <button disabled={isSaving} type="submit" className="inline-flex items-center gap-2 rounded-md bg-[#4a0000] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                <Save className="w-4 h-4" /> சேமி
              </button>
            </form>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {petitions.map(petition => (
            <form key={petition.id} onSubmit={event => savePetition(event, petition)} className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold text-[#4a0000]">{petition.trackingNo}</h3>
                <button type="button" onClick={() => deletePetition(petition)} disabled={isSaving} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-60">
                  <Trash2 className="w-3.5 h-3.5" /> நீக்கு
                </button>
              </div>
              <label className="block text-xs font-bold text-neutral-700">
                தலைப்பு
                <input name="title" required maxLength={200} defaultValue={petition.title} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal" />
              </label>
              <label className="block text-xs font-bold text-neutral-700">
                புகார் விவரம்
                <textarea name="description" required maxLength={5000} rows={3} defaultValue={petition.description} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-neutral-700">
                  நிலை
                  <select name="status" defaultValue={petition.status} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal">
                    {statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-bold text-neutral-700">
                  நிர்வாகக் குறிப்பு
                  <input name="officialNote" maxLength={2000} defaultValue={petition.officialNote || ''} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm font-normal" />
                </label>
              </div>
              <button disabled={isSaving} type="submit" className="inline-flex items-center gap-2 rounded-md bg-[#4a0000] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">
                <Save className="w-4 h-4" /> மாற்றங்களைச் சேமி
              </button>
            </form>
          ))}
          {petitions.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-neutral-600">புகார்கள் எதுவும் இல்லை.</p>}
        </div>
      )}
    </section>
  );
};
