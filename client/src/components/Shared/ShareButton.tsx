import React, { useState } from 'react';
import { Share2, Download, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface ShareButtonProps {
  measurementId: string;
  variant?: 'icon' | 'full';
  onShare?: () => void;
}

export default function ShareButton({ measurementId, variant = 'full', onShare }: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  
  const handleShare = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/exports/${measurementId}/whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      if (data.success) {
        setShareData(data);
        if (onShare) onShare();
        toast.success('Share link generated!');
        
        // Open WhatsApp
        window.open(data.whatsappUrl, '_blank');
      } else {
        toast.error(data.error || 'Share failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Share failed');
    } finally {
      setLoading(false);
    }
  };
  
  if (variant === 'icon') {
    return (
      <button
        onClick={handleShare}
        disabled={loading}
        className="p-2 hover:bg-slate-100 rounded-xl transition disabled:opacity-50"
        title="Share on WhatsApp"
      >
        {loading ? <Share2 className="h-4 w-4 animate-pulse" /> : <Share2 className="h-4 w-4" />}
      </button>
    );
  }
  
  return (
    <button
      onClick={handleShare}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
    >
      <Share2 className="h-4 w-4" />
      {loading ? 'Sharing...' : 'Share on WhatsApp'}
    </button>
  );
}
