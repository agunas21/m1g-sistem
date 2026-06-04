import { getCollectionDB, writeCollectionDB } from '@/lib/settings';

type LogLevel = "INFO" | "WARN" | "ERROR" | "SUCCESS";

interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  user: string;
  action: string;
  target: string;
  details?: any;
}

export async function getLogs(): Promise<LogEntry[]> {
  try {
    return await getCollectionDB('global_logs');
  } catch (error) {
    return [];
  }
}

export async function writeLog(level: LogLevel, user: string, action: string, target: string, details?: any) {
  try {
    const logs = await getLogs();
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      level,
      user,
      action,
      target,
      details
    };
    logs.unshift(newLog); // En yeni log en başa
    
    // Sadece son 1000 logu tutalım
    const trimmedLogs = logs.slice(0, 1000);
    
    await writeCollectionDB('global_logs', trimmedLogs);
    return newLog;
  } catch (error) {
    console.error("Failed to write log", error);
  }
}
