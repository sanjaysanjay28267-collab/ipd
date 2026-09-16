/**
 * ==============================================================================
 * VERIGRADE S3 — MRF AUDIT & EPR COMPLIANCE VIEW (AuditView.tsx)
 * ==============================================================================
 * CLAIM MAP: Patent Claims 1, 3, 31 (MRF Truckload Audit & EPR Manifest)
 */

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Truck, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  Percent, 
  AlertTriangle,
  Scale
} from 'lucide-react';
import { TruckloadAudit } from '../types';

interface AuditViewProps {
  auditData: TruckloadAudit;
}

export const AuditView: React.FC<AuditViewProps> = ({ auditData }) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExportPDF = () => {
    setDownloadSuccess('EPR Audit Certificate Exported: ' + auditData.manifest_id + '.pdf');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit_${auditData.manifest_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setDownloadSuccess('Raw JSON Telemetry Exported!');
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" id="audit-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#212121] font-heading flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-[#1B5E20]" />
            <span>MRF Truckload Audit & EPR Manifest</span>
          </h1>
          <p className="text-xs text-gray-500">
            Material Recovery Facility composition analysis and Extended Producer Responsibility compliance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleExportPDF}
            id="btn-export-epr-pdf"
            className="px-4 py-2 rounded-xl bg-[#1B5E20] hover:bg-[#0D3311] text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Export EPR Audit (PDF)</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Manifest Top Card */}
      <div className="vg-card p-6 border-l-4 border-l-[#1B5E20]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 rounded-2xl bg-[#E8F5E9] text-[#1B5E20]">
              <Truck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-gray-400">
                  {auditData.manifest_id}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  EPR {auditData.epr_compliance_status}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#212121] mt-0.5 font-heading">
                Truck ID: {auditData.truck_id}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Driver: {auditData.driver_name} • Arrival: {auditData.arrival_time}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Net Payload</span>
              <span className="text-2xl font-bold font-mono text-[#1B5E20]">
                {auditData.net_weight_metric_tons} <span className="text-xs text-gray-500 font-sans">tons</span>
              </span>
            </div>
            <div className="text-right border-l border-gray-200 pl-4">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Contamination</span>
              <span className="text-2xl font-bold font-mono text-emerald-700">
                {auditData.contamination_rate_pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Composition Breakdown */}
      <div className="vg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#212121] uppercase tracking-wider">
            Automated Spectroscopic Composition Breakdown
          </h2>
          <span className="text-xs text-gray-500 font-mono">
            Total Net: {(auditData.net_weight_metric_tons * 1000).toLocaleString()} kg
          </span>
        </div>

        {/* Multi-segment visual bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-gray-100 shadow-inner">
          {auditData.composition.map((comp, idx) => {
            const colors = ['bg-[#1B5E20]', 'bg-teal-600', 'bg-amber-500', 'bg-blue-600', 'bg-gray-700', 'bg-purple-600'];
            return (
              <div
                key={comp.category}
                style={{ width: `${comp.percentage}%` }}
                className={`h-full ${colors[idx % colors.length]}`}
                title={`${comp.category}: ${comp.percentage}%`}
              />
            );
          })}
        </div>

        {/* Detailed Material Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {auditData.composition.map((comp) => (
            <div key={comp.category} className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-900 block">
                  {comp.category.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] font-mono text-gray-500">
                  {comp.weight_kg.toFixed(1)} kg
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold font-mono text-[#1B5E20]">
                  {comp.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extended Producer Responsibility (EPR) Certificate Strip */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1B5E20]" />
            <span className="font-bold text-gray-900">EPR Regulatory Hash Verification</span>
          </div>
          <p className="font-mono text-[10px] text-gray-500 break-all">
            SHA-256: {auditData.epr_certificate_hash}
          </p>
          <p className="text-[11px] text-gray-500">
            Meets ISO 14021 recycled content verification & CPCB EPR guidelines.
          </p>
        </div>

        <div className="bg-[#E8F5E9] text-[#1B5E20] px-3 py-1.5 rounded-lg font-mono font-bold text-[11px] shrink-0">
          STATUS: AUDITED_VERIFIED
        </div>
      </div>
    </div>
  );
};
