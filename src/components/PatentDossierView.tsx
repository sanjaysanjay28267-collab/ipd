/**
 * ==============================================================================
 * VERIGRADE S3 — PATENT SPECIFICATION & TECHNICAL DOSSIER VIEWER (PatentDossierView.tsx)
 * ==============================================================================
 * CLAIM MAP: Complete Patent Claims 1-33 (USPTO / Indian Patent Office Ready)
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  FileText, 
  Code, 
  Cpu, 
  CheckCircle, 
  ExternalLink, 
  Layers, 
  BookOpen,
  Search
} from 'lucide-react';

export const PatentDossierView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'claims' | 'matrix' | 'pinout' | 'architecture'>('claims');
  const [filterQuery, setFilterQuery] = useState<string>('');

  const claimsList = [
    {
      num: 1,
      type: 'Independent Claim',
      title: 'Multi-Modal Autonomous Scrap Conveyor Verification and Grading System',
      text: 'An autonomous multi-modal scrap verification apparatus comprising: a continuous conveyor belt; a drive motor; a tachometer generating pulses proportional to conveyor linear speed; an inspection zone comprising: an optical camera with an illumination source; an inductive proximity sensor detecting metallic conductivity; an ultrasonic sensor measuring continuous cross-sectional volumetric profiles; a load-cell scale measuring item mass; a moisture sensor measuring dielectric capacitance; and an edge processing unit programmed to compute an Adaptive Multi-Criteria Fusion (AMCF) score fusing optical inference with physical sensor signals.',
      files: ['amcf_engine.cpp', 'main.cpp', 'types.ts']
    },
    {
      num: 3,
      type: 'Dependent Claim',
      title: 'Cryptographic Point-of-Sale Settlement and HMAC Verification',
      text: 'The system of claim 1, further comprising a thermal printer outputting a physical receipt bearing an itemized breakdown of net weights, deducted moisture tare penalties, commodity pricing, a calculated reputation score, and an HMAC-SHA256 cryptographic signature computed from the physical sensor measurements.',
      files: ['receipt_printer.cpp', 'PayoutView.tsx', 'server.ts']
    },
    {
      num: 4,
      type: 'Dependent Claim',
      title: 'Dynamic Optical Confidence Attenuation (Image Sharpness Modulation)',
      text: 'The system of claim 1, wherein the edge processor calculates an optical blur metric of the acquired image, and wherein the optical weighting factor alpha is dynamically attenuated proportionally to detected optical degradation.',
      files: ['amcf_engine.cpp', 'main.cpp']
    },
    {
      num: 12,
      type: 'Dependent Claim',
      title: 'Deterministic Time-of-Flight (ToF) Conveyor Ejection Scheduling',
      text: 'The system of claim 1, wherein the edge processor computes an instantaneous linear speed v(t) from the tachometer and schedules an actuation delay t_wait = (d / v) - t_servo using an asynchronous microsecond-precision hardware timer.',
      files: ['tof_scheduler.cpp']
    },
    {
      num: 18,
      type: 'Dependent Claim',
      title: 'Sub-Second Shredder Hazard Diversion (Fire Protection)',
      text: 'The system of claim 1, wherein detection of a lithium-ion battery, pressurized gas canister, or oversized metal billet overrides sorting classification and commands instantaneous deflection into a fire-safe containment chute in under 50 milliseconds.',
      files: ['amcf_engine.cpp', 'tof_scheduler.cpp', 'LiveBeltView.tsx']
    },
    {
      num: 23,
      type: 'Independent Claim',
      title: 'Edge Closed-Loop Machine Learning Retraining Arbitration Method',
      text: 'A method for continuous edge adaptation comprising: acquiring multi-modal sensory data; computing an AMCF score; detecting a conflict state where optical inference and sensor signals contradict; routing the conflicting item to a manual review spur; logging operator correction; and appending the corrected data package to an onboard edge model retraining pool.',
      files: ['ReviewView.tsx', 'server.ts', 'integration_sdk.js']
    },
    {
      num: 29,
      type: 'Independent Claim',
      title: 'Informal Waste Recycler Reputation Scoring and Micro-Credit Underwriting Method',
      text: 'A method for establishing verifiable financial identity for unbanked scrap recyclers comprising: aggregating verified clean scrap weight W; tracking consecutive deliveries without hazardous materials S_clean; calculating historical classification error rate N_corr / N_total; computing mean moisture adulteration ratio M; and generating an explainable reputation score R bounded between 300 and 850 points.',
      files: ['reputationEngine.ts', 'ReputationView.tsx', 'server.ts']
    },
    {
      num: 32,
      type: 'Independent Claim',
      title: 'Cellular-Interfaced Dual-Core Edge Telemetry System',
      text: 'An edge telemetry computing node for industrial scrap yards comprising: a dual-core microcontroller where Core 0 executes non-blocking cellular and sensor telemetry acquisition and Core 1 executes deterministic motor control and neural inference.',
      files: ['main.cpp', 'sim800l_sms.cpp', 'sim_gateway.ino']
    }
  ];

  const filteredClaims = claimsList.filter(c => 
    c.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.text.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.num.toString().includes(filterQuery)
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" id="patent-dossier-view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0D3311] via-[#1B5E20] to-[#00695C] text-white p-6 rounded-2xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                USPTO & IPO Patent Specification
              </span>
              <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                33 Complete Claims
              </span>
            </div>
            <h1 className="text-2xl font-bold font-heading">
              VeriGrade S3 Technical Patent Dossier
            </h1>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              "Multi-Modal Autonomous Scrap Verification, Conveyor Grading Apparatus, and Financial Reputation Scoring Method"
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/docs/PATENT_SPECIFICATION.md"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-white text-[#1B5E20] font-bold text-xs shadow-sm hover:bg-gray-100 transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Patent Markdown</span>
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'claims' ? 'bg-[#1B5E20] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Key Patent Claims (1-33)
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'matrix' ? 'bg-[#1B5E20] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Claim-to-Code Matrix
        </button>
        <button
          onClick={() => setActiveTab('pinout')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'pinout' ? 'bg-[#1B5E20] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          ESP32-S3 Hardware Pinout
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'architecture' ? 'bg-[#1B5E20] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Dual-Core Architecture
        </button>
      </div>

      {/* Tab 1: Claims List */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search claims by keyword (e.g. ToF, AMCF, Reputation, Hazard)..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full text-xs outline-none"
            />
          </div>

          <div className="space-y-4">
            {filteredClaims.map((claim) => (
              <div key={claim.num} className="vg-card p-5 space-y-2 border-l-4 border-l-[#1B5E20]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#1B5E20] text-white text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                      Claim {claim.num}
                    </span>
                    <span className="text-xs font-semibold text-gray-500">
                      {claim.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-gray-500">
                    <Code className="w-3.5 h-3.5 text-[#00695C]" />
                    <span>Implemented in: {claim.files.join(', ')}</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#212121]">
                  {claim.title}
                </h3>

                <p className="text-xs text-gray-700 leading-relaxed font-serif bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                  {claim.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Claim to Code Matrix */}
      {activeTab === 'matrix' && (
        <div className="vg-card p-5 space-y-4 overflow-x-auto">
          <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider">
            Examiner Code Citation & Verification Matrix
          </h3>
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3">Claim #</th>
                <th className="py-2.5 px-3">Subject Matter</th>
                <th className="py-2.5 px-3">Primary Source File</th>
                <th className="py-2.5 px-3">Key Function / Method</th>
                <th className="py-2.5 px-3">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-bold text-[#1B5E20]">Claim 1</td>
                <td className="py-2.5 px-3 font-sans">Multi-Modal AMCF Sensor Fusion</td>
                <td className="py-2.5 px-3 text-indigo-700">amcf_engine.cpp</td>
                <td className="py-2.5 px-3">AMCF_Evaluate()</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">100% Implemented</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-bold text-[#1B5E20]">Claim 3</td>
                <td className="py-2.5 px-3 font-sans">Cryptographic HMAC Receipt</td>
                <td className="py-2.5 px-3 text-indigo-700">receipt_printer.cpp</td>
                <td className="py-2.5 px-3">Printer_PrintReceipt()</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">100% Implemented</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-bold text-[#1B5E20]">Claim 4</td>
                <td className="py-2.5 px-3 font-sans">Dynamic Alpha Blur Attenuation</td>
                <td className="py-2.5 px-3 text-indigo-700">amcf_engine.cpp</td>
                <td className="py-2.5 px-3">alpha = base_alpha * sharpness</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">100% Implemented</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-bold text-[#1B5E20]">Claim 12</td>
                <td className="py-2.5 px-3 font-sans">Deterministic ToF Ejection Scheduler</td>
                <td className="py-2.5 px-3 text-indigo-700">tof_scheduler.cpp</td>
                <td className="py-2.5 px-3">ToF_ScheduleEjection()</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">100% Implemented</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-bold text-[#1B5E20]">Claim 18</td>
                <td className="py-2.5 px-3 font-sans">Sub-50ms Fire Hazard Intercept</td>
                <td className="py-2.5 px-3 text-indigo-700">amcf_engine.cpp</td>
                <td className="py-2.5 px-3">{"decision->is_hazard = true"}</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">100% Implemented</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-bold text-[#1B5E20]">Claim 23</td>
                <td className="py-2.5 px-3 font-sans">Closed-Loop Model Retraining Pool</td>
                <td className="py-2.5 px-3 text-indigo-700">ReviewView.tsx / server.ts</td>
                <td className="py-2.5 px-3">POST /api/corrections</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">100% Implemented</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-bold text-[#1B5E20]">Claim 29</td>
                <td className="py-2.5 px-3 font-sans">Explainable Reputation Engine (300-850)</td>
                <td className="py-2.5 px-3 text-indigo-700">reputationEngine.ts</td>
                <td className="py-2.5 px-3">calculateReputationScore()</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">100% Implemented</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2.5 px-3 font-bold text-[#1B5E20]">Claim 32</td>
                <td className="py-2.5 px-3 font-sans">Cellular SIM800L Dual-Core Microcontroller</td>
                <td className="py-2.5 px-3 text-indigo-700">main.cpp / sim800l_sms.cpp</td>
                <td className="py-2.5 px-3">commsTask pinned to Core 0</td>
                <td className="py-2.5 px-3 text-emerald-700 font-bold">100% Implemented</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Hardware Pinout Chart */}
      {activeTab === 'pinout' && (
        <div className="vg-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider">
            ESP32-S3 Physical GPIO Pinout Table
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="space-y-2">
              <p className="font-sans font-bold text-gray-800">Sensors & Cameras</p>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 4, 5:</span> Ultrasonic HC-SR04 (Trig / Echo)
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 6:</span> Infrared Encoder TCRT5000 (ISR, Pull-up)
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 7:</span> Inductive Proximity LJ12A3-4-Z/BX (Optocoupled)
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 8:</span> Capacitive Moisture Sensor v1.2 (ADC1_CH7)
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 9, 10:</span> Load Cell Scale HX711 (DOUT / SCK)
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-sans font-bold text-gray-800">Actuators, Power & Radios</p>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 11, 12, 13:</span> Conveyor Motor L298N (ENA_PWM, IN1, IN2)
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 14:</span> Diverter Servo SG90 (LEDC Channel 0, 50Hz)
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 15:</span> Strobe LED Driver MOSFET (50ms Strobe Pulse)
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 16, 17:</span> Thermal Printer ESC/POS (UART1 RX / TX)
              </div>
              <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                <span className="font-bold text-emerald-800">GPIO 43, 44:</span> SIM800L GPRS/SMS Modem (UART2 RX / TX)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Architecture */}
      {activeTab === 'architecture' && (
        <div className="vg-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider">
            Dual-Core FreeRTOS Concurrency Architecture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <Cpu className="w-4 h-4 text-[#1B5E20]" />
                <span>CORE 0 (I/O, Logging & Comms)</span>
              </div>
              <ul className="space-y-1.5 text-gray-700">
                <li>• <strong>sensorTask:</strong> 100Hz round-robin sensor acquisition (ADC, HX711, HC-SR04).</li>
                <li>• <strong>commsTask:</strong> Cellular SIM800L AT command queue & WiFi MQTT sync.</li>
                <li>• <strong>loggerTask:</strong> Atomic SD card write-ahead logging to survive power cut.</li>
                <li>• <strong>tachometerISR:</strong> Interrupt on GPIO6 tracking linear belt pulses.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-900">
                <Cpu className="w-4 h-4 text-[#00695C]" />
                <span>CORE 1 (AI Inference & Real-Time Motor Control)</span>
              </div>
              <ul className="space-y-1.5 text-gray-700">
                <li>• <strong>aiTask:</strong> OV2640 camera capture, strobe pulse, INT8 CNN classification.</li>
                <li>• <strong>amcf_engine:</strong> Real-time multi-modal fusion & dynamic alpha modulation.</li>
                <li>• <strong>motorTask:</strong> L298N PWM speed control and SG90 servo ejection.</li>
                <li>• <strong>tof_scheduler:</strong> Microsecond hardware timer for precision ejection.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
