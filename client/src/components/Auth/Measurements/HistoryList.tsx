import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMeasurements } from '../../hooks/useMeasurements';
import { 
  Calendar, 
  Download, 
  Eye, 
  Trash2, 
  Share2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function HistoryList() {
  const navigate = useNavigate();
  const { measurements, loading, total, deleteMeasurement, exportMeasurement } = useMeasurements();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const filteredMeasurements = measurements.filter(m => 
    m.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.bodyShape?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(total / itemsPerPage);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this measurement?')) return;
    
    setDeletingId(id);
    try {
      await deleteMeasurement(id);
    } catch (error) {
      // Error handled by hook
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async (id: string, format: 'pdf' | 'csv' | 'json') => {
    setExportingId(id);
    try {
      await exportMeasurement(id, format);
    } catch (error) {
      // Error handled by hook
    } finally {
      setExportingId(null);
    }
  };

  if (loading && measurements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Loading measurements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto my-12">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Measurement History</h2>
              <p className="text-sm text-slate-500">
                {total} total measurements recorded
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search measurements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-48 sm:w-64"
                />
              </div>
              <button
                onClick={() => window.location.href = '/measure/capture'}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-4 rounded-xl transition"
              >
                New Scan
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {filteredMeasurements.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Measurements Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              {searchTerm ? 'Try adjusting your search' : 'Start by taking your first measurement'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => window.location.href = '/measure/capture'}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl transition"
              >
                Take First Measurement
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-bold text-slate-700">Session</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-700">Date</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-700">Body Shape</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-700">Height</th>
                    <th className="px-6 py-3 text-left font-bold text-slate-700">Status</th>
                    <th className="px-6 py-3 text-right font-bold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeasurements.map((measurement) => (
                    <tr key={measurement.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs">{measurement.sessionId}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(measurement.timestamp).toLocaleDateString()}
                        <span className="text-xs text-slate-400 ml-2">
                          {new Date(measurement.timestamp).toLocaleTimeString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-indigo-600">
                          {measurement.bodyShape || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{measurement.userHeightCm} cm</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          measurement.syncedToFysora 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {measurement.syncedToFysora ? 'Synced' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/measure/${measurement.id}`)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleExport(measurement.id, 'pdf')}
                            disabled={exportingId === measurement.id}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition disabled:opacity-50"
                            title="Download PDF"
                          >
                            {exportingId === measurement.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => {
                              const shareUrl = `${window.location.origin}/share/${measurement.sessionId}`;
                              navigator.clipboard.writeText(shareUrl);
                              toast.success('Share link copied to clipboard');
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Copy Share Link"
                          >
                            <Share2 className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(measurement.id)}
                            disabled={deletingId === measurement.id}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingId === measurement.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-300 rounded-xl hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
