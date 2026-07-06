import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface Measurement {
  id: string;
  sessionId: string;
  timestamp: string;
  bodyShape: string;
  data: Record<string, number>;
  confidenceScores: Record<string, number>;
  userHeightCm: number;
  syncedToFysora: boolean;
}

export function useMeasurements() {
  const { user } = useAuth();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchMeasurements = useCallback(async (limit = 50, offset = 0) => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/measurements?limit=${limit}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setMeasurements(data.measurements);
        setTotal(data.pagination.total);
      } else {
        toast.error(data.error || 'Failed to fetch measurements');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch measurements');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getMeasurement = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/measurements/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch measurement');
      }

      return data;
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  }, []);

  const deleteMeasurement = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/measurements/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Measurement deleted successfully');
        await fetchMeasurements();
        return data;
      } else {
        throw new Error(data.error || 'Failed to delete measurement');
      }
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  }, [fetchMeasurements]);

  const exportMeasurement = useCallback(async (id: string, format: 'pdf' | 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/exports/${id}?format=${format}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        window.open(data.downloadUrl, '_blank');
        toast.success(`${format.toUpperCase()} downloaded successfully`);
        return data;
      } else {
        throw new Error(data.error || 'Export failed');
      }
    } catch (error: any) {
      toast.error(error.message);
      throw error;
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMeasurements();
    }
  }, [user, fetchMeasurements]);

  return {
    measurements,
    loading,
    total,
    fetchMeasurements,
    getMeasurement,
    deleteMeasurement,
    exportMeasurement,
  };
          }
