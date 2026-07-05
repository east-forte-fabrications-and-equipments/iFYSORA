import React, { useState, useEffect } from 'react';
import { Cloud, Check, X, Link, Unlink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CloudBackupSettings() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  useEffect(() => {
    fetchProviders();
  }, []);
  
  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/exports/cloud-providers', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      toast.error('Failed to load cloud providers');
    } finally {
      setLoading(false);
    }
  };
  
  const connectProvider = async (provider: 'google_drive' | 'dropbox' | 'onedrive') => {
    // OAuth flow - redirect to provider
    const authUrl = `/api/auth/${provider}`;
    window.open(authUrl, '_blank', 'width=600,height=600');
    
    // Poll for connection status
    const checkConnection = setInterval(async () => {
      await fetchProviders();
      const connected = providers.some(p => p.type === provider);
      if (connected) {
        clearInterval(checkConnection);
        toast.success(`Connected to ${provider}`);
      }
    }, 3000);
  };
  
  const disconnectProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/exports/cloud-providers/${providerId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (response.ok) {
        toast.success('Provider disconnected');
        await fetchProviders();
      } else {
        toast.error('Failed to disconnect');
      }
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };
  
  const saveSettings = async () => {
    try {
      const response = await fetch('/api/exports/backup-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          autoBackup,
          frequency: backupFrequency,
        }),
      });
      
      if (response.ok) {
        toast.success('Backup settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };
  
  const providerIcons: Record<string, { color: string; icon: string }> = {
    google_drive: { color: 'bg-blue-500', icon: 'Google Drive' },
    dropbox: { color: 'bg-blue-600', icon: 'Dropbox' },
    onedrive: { color: 'bg-blue-400', icon: 'OneDrive' },
  };
  
  return (
    <div className="max-w-2xl mx-auto my-12 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="p-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cloud Backup</h2>
          <p className="text-sm text-slate-500 mt-1">
            Automatically backup your measurements to the cloud
          </p>
        </div>
        
        {/* Auto Backup Settings */}
        <div className="bg-slate-50 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Auto-Backup Settings</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Enable Auto-Backup</p>
              <p className="text-xs text-slate-400">Automatically backup new measurements</p>
            </div>
            <button
              onClick={() => setAutoBackup(!autoBackup)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                autoBackup ? 'bg-indigo-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  autoBackup ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {autoBackup && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Backup Frequency
              </label>
              <select
                value={backupFrequency}
                onChange={(e) => setBackupFrequency(e.target.value as any)}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}
          
          <button
            onClick={saveSettings}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition"
          >
            Save Settings
          </button>
        </div>
        
        {/* Connected Providers */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Connected Providers</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 text-slate-400 animate-spin" />
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Cloud className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No cloud providers connected</p>
              <p className="text-xs">Connect your account to backup measurements</p>
            </div>
          ) : (
            providers.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${providerIcons[provider.type]?.color || 'bg-slate-500'} flex items-center justify-center text-white font-bold text-xs`}>
                    {providerIcons[provider.type]?.icon?.[0] || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {providerIcons[provider.type]?.icon || provider.type}
                    </p>
                    <p className="text-xs text-slate-400">
                      Connected {new Date(provider.connectedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => disconnectProvider(provider.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                >
                  <Unlink className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
          
          {/* Connect Buttons */}
          <div className="grid grid-cols-3 gap-3">
            {['google_drive', 'dropbox', 'onedrive'].map((provider) => {
              const isConnected = providers.some(p => p.type === provider);
              return (
                <button
                  key={provider}
                  onClick={() => connectProvider(provider as any)}
                  disabled={isConnected}
                  className={`p-3 border rounded-xl text-sm font-medium transition disabled:opacity-50 ${
                    isConnected
                      ? 'border-green-300 bg-green-50 text-green-700'
                      : 'border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isConnected ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Link className="h-4 w-4" />
                    )}
                    {providerIcons[provider]?.icon || provider}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
          }
