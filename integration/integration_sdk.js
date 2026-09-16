/**
 * ==============================================================================
 * VERIGRADE S3 — DROP-IN CLIENT INTEGRATION SDK (integration_sdk.js)
 * ==============================================================================
 * Product: VeriGrade S3 — The Waste Truth Infrastructure
 * Environment: Universal (Node.js & Modern Browser / PWA)
 * CLAIM MAP: Patent Claims 1, 9, 10, 23, 29, 32
 *
 * Capabilities:
 * - init(token, options)
 * - onItem(callback) -> live item telemetry stream
 * - onFlagged(callback) -> flagged / conflict items for human review
 * - submitCorrection(itemId, correctedClass, notes) -> closed-loop retraining
 * - printReceipt(tallyData) -> physical ESC/POS trigger
 * - sendSMS(traderId, customMessage) -> SIM800L cellular dispatch
 * - exportAudit(truckId) -> MRF / EPR PDF/JSON compliance export
 * - Built-in offline queue and exponential backoff auto-reconnect
 * ==============================================================================
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.VeriGradeSDK = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class VeriGradeSDK {
    constructor() {
      this.token = null;
      this.baseUrl = '';
      this.wsUrl = '';
      this.ws = null;
      this.reconnectAttempts = 0;
      this.maxReconnectDelay = 15000;
      this.isOnline = false;
      this.offlineQueue = [];
      this.listeners = {
        item: [],
        flagged: [],
        hazard: [],
        status: [],
        error: []
      };
    }

    /**
     * Initialize the SDK with device / auth token and server endpoints
     * @param {string} token - Device auth token or JWT
     * @param {object} [options] - Optional configurations
     */
    init(token, options = {}) {
      this.token = token;
      this.baseUrl = options.baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
      
      const protocol = this.baseUrl.startsWith('https') ? 'wss:' : 'ws:';
      const host = this.baseUrl.replace(/^https?:\/\//, '');
      this.wsUrl = options.wsUrl || `${protocol}//${host}/ws/belt`;

      this._loadOfflineQueue();
      this._connectWebSocket();

      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => this._onNetworkChange(true));
        window.addEventListener('offline', () => this._onNetworkChange(false));
      }

      console.log('[VeriGradeSDK] Initialized with endpoint:', this.baseUrl);
      return this;
    }

    /**
     * Subscribe to real-time item classification and sensor telemetry
     */
    onItem(callback) {
      if (typeof callback === 'function') {
        this.listeners.item.push(callback);
      }
      return this;
    }

    /**
     * Subscribe to items diverted to manual review spur (conflicts & low confidence)
     */
    onFlagged(callback) {
      if (typeof callback === 'function') {
        this.listeners.flagged.push(callback);
      }
      return this;
    }

    /**
     * Subscribe to shredder hazard alerts
     */
    onHazard(callback) {
      if (typeof callback === 'function') {
        this.listeners.hazard.push(callback);
      }
      return this;
    }

    /**
     * Submit human correction for closed-loop retraining (Patent Claim 23)
     */
    async submitCorrection(itemId, correctedClassId, notes = '') {
      const payload = {
        item_id: itemId,
        corrected_class_id: correctedClassId,
        notes: notes,
        timestamp: new Date().toISOString()
      };

      return this._sendRequest('/api/corrections', 'POST', payload);
    }

    /**
     * Trigger physical 58mm ESC/POS thermal receipt print
     */
    async printReceipt(tally) {
      return this._sendRequest('/api/payouts/print', 'POST', tally);
    }

    /**
     * Dispatch SMS receipt / credit score proof to trader
     */
    async sendSMS(traderId, customMessage = null) {
      return this._sendRequest('/api/reputation/sms', 'POST', {
        trader_id: traderId,
        custom_message: customMessage
      });
    }

    /**
     * Export MRF truckload composition and EPR audit manifest
     */
    async exportAudit(truckId) {
      return this._sendRequest(`/api/audit/${encodeURIComponent(truckId)}`, 'GET');
    }

    // -------------------------------------------------------------------------
    // Internal WebSocket & Networking
    // -------------------------------------------------------------------------
    _connectWebSocket() {
      if (typeof WebSocket === 'undefined') return;

      try {
        this.ws = new WebSocket(`${this.wsUrl}?token=${encodeURIComponent(this.token || '')}`);

        this.ws.onopen = () => {
          this.isOnline = true;
          this.reconnectAttempts = 0;
          this._emit('status', { connected: true });
          this._flushOfflineQueue();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'ITEM_GRADED') {
              this._emit('item', msg.data);
              if (msg.data.requires_human_review) {
                this._emit('flagged', msg.data);
              }
              if (msg.data.is_hazard) {
                this._emit('hazard', msg.data);
              }
            }
          } catch (err) {
            console.error('[VeriGradeSDK] Failed to parse WS message:', err);
          }
        };

        this.ws.onclose = () => {
          this.isOnline = false;
          this._emit('status', { connected: false });
          this._scheduleReconnect();
        };

        this.ws.onerror = (err) => {
          this._emit('error', err);
        };
      } catch (err) {
        this._scheduleReconnect();
      }
    }

    _scheduleReconnect() {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
      setTimeout(() => this._connectWebSocket(), delay);
    }

    _onNetworkChange(online) {
      this.isOnline = online;
      if (online) {
        this._connectWebSocket();
        this._flushOfflineQueue();
      }
    }

    async _sendRequest(path, method = 'GET', body = null) {
      const url = `${this.baseUrl}${path}`;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token || 'ANONYMOUS_DEV'}`
      };

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        return await response.json();
      } catch (err) {
        // Enqueue if offline and mutative
        if (method !== 'GET') {
          this._enqueueOffline({ path, method, body, timestamp: Date.now() });
        }
        throw err;
      }
    }

    _enqueueOffline(request) {
      this.offlineQueue.push(request);
      this._saveOfflineQueue();
    }

    async _flushOfflineQueue() {
      if (this.offlineQueue.length === 0) return;
      console.log(`[VeriGradeSDK] Flushing ${this.offlineQueue.length} queued requests...`);

      const queue = [...this.offlineQueue];
      this.offlineQueue = [];
      this._saveOfflineQueue();

      for (const item of queue) {
        try {
          await this._sendRequest(item.path, item.method, item.body);
        } catch (err) {
          console.warn('[VeriGradeSDK] Failed to flush item, re-queuing:', item);
          this.offlineQueue.push(item);
        }
      }
      this._saveOfflineQueue();
    }

    _saveOfflineQueue() {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('vgr3_sdk_offline_queue', JSON.stringify(this.offlineQueue));
      }
    }

    _loadOfflineQueue() {
      if (typeof localStorage !== 'undefined') {
        try {
          const stored = localStorage.getItem('vgr3_sdk_offline_queue');
          if (stored) this.offlineQueue = JSON.parse(stored);
        } catch (e) {
          this.offlineQueue = [];
        }
      }
    }

    _emit(event, data) {
      if (this.listeners[event]) {
        this.listeners[event].forEach(cb => {
          try { cb(data); } catch (e) { console.error(e); }
        });
      }
    }
  }

  return new VeriGradeSDK();
}));
