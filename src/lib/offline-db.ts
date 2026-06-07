import localforage from 'localforage';

localforage.config({
  name: 'M1G_DB',
  storeName: 'operations_store',
  description: 'Offline storage for M1G operations'
});

export interface PendingLog {
  id: number;
  operationId: string;
  type: string;
  category: string;
  message: string;
  timestamp: string;
}

export const offlineDB = {
  // Pending Logs queue
  async addPendingLog(log: Omit<PendingLog, 'id' | 'timestamp'>) {
    const pendingLogs = await localforage.getItem<PendingLog[]>('pending_logs') || [];
    pendingLogs.push({ 
      ...log, 
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    await localforage.setItem('pending_logs', pendingLogs);
  },
  
  async getPendingLogs(): Promise<PendingLog[]> {
    return await localforage.getItem<PendingLog[]>('pending_logs') || [];
  },
  
  async removePendingLog(id: number) {
    let pendingLogs = await localforage.getItem<PendingLog[]>('pending_logs') || [];
    pendingLogs = pendingLogs.filter(log => log.id !== id);
    await localforage.setItem('pending_logs', pendingLogs);
  },
  
  async clearPendingLogs() {
    await localforage.setItem('pending_logs', []);
  }
};
