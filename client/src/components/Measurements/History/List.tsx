// Add this column to the table
<th className="px-6 py-3 text-left font-bold text-slate-700">Client</th>

// Add this cell
<td className="px-6 py-4">
  {measurement.clientName ? (
    <div className="flex items-center gap-2">
      {measurement.portraitId && (
        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
          {measurement.clientName[0].toUpperCase()}
        </div>
      )}
      <span className="text-sm text-slate-700">{measurement.clientName}</span>
    </div>
  ) : (
    <span className="text-xs text-slate-400">Unassigned</span>
  )}
</td>
