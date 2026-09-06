import React, { useState } from 'react';
import {
  CloudUpload,
  ArrowRight,
  CheckCircle2,
  Clock,
  Database,
  Trash2,
  RefreshCw,
  Code2,
  Server,
} from 'lucide-react';
import { SyncQueueEntity } from '../types';
import { storage } from '../services/storage';

interface SyncQueueScreenProps {
  onBackToDashboard: () => void;
  isOnline: boolean;
  onSyncStateChanged?: () => void;
}

export const SyncQueueScreen: React.FC<SyncQueueScreenProps> = ({
  onBackToDashboard,
  isOnline,
  onSyncStateChanged,
}) => {
  const [queue, setQueue] = useState<SyncQueueEntity[]>(() => storage.getSyncQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [activePayload, setActivePayload] = useState<SyncQueueEntity | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'PENDING' | 'SYNCED'>('ALL');

  const refreshQueue = () => {
    setQueue(storage.getSyncQueue());
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setStatusMessage('جارٍ الاتصال بسحابة جوجل ومزامنة المعاملات الذرية...');
    try {
      const result = await storage.syncAllPending();
      refreshQueue();
      setStatusMessage(`تمت مزامنة ${result.syncedCount} معاملة بنجاح مع السحابة.`);
      if (onSyncStateChanged) onSyncStateChanged();
    } catch {
      setStatusMessage('حدث خطأ أثناء الاتصال بالسحابة.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handleClearSynced = () => {
    storage.clearSyncedQueue();
    refreshQueue();
    if (onSyncStateChanged) onSyncStateChanged();
  };

  const pendingCount = queue.filter((item) => !item.synced).length;
  const syncedCount = queue.filter((item) => item.synced).length;

  const filteredQueue = queue.filter((item) => {
    if (filterType === 'PENDING') return !item.synced;
    if (filterType === 'SYNCED') return item.synced;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Status banner */}
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3 rounded-xl flex items-center gap-2.5 text-sm font-semibold shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#dce5df]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">العودة للوحة التحكم</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              طابور المزامنة مع السحابة (Sync Queue)
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              إدارة ترحيل المعاملات المحلية إلى Google Cloud / Firestore
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {syncedCount > 0 && (
            <button
              onClick={handleClearSynced}
              title="حذف العمليات التي تم رفعها بنجاح لتنظيف الذاكرة"
              className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>تنظيف المكتمل</span>
            </button>
          )}

          <button
            id="btn-sync-now"
            onClick={handleSyncNow}
            disabled={isSyncing || pendingCount === 0}
            className="px-5 py-2.5 bg-[#006C50] hover:bg-[#00543e] disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جارٍ المزامنة...' : `مزامنة الآن (${pendingCount} معلقة)`}</span>
          </button>
        </div>
      </div>

      {/* Cloud Architecture status */}
      <div className="bg-white p-5 rounded-2xl border border-[#dce5df] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">محرك المزامنة غير المتزامن (Async Cloud Pipeline)</div>
            <div className="text-xs text-gray-500">
              بروتوكول المعاملات الذرية: يخزن العمليات محلياً ثم يرفعها لسحابة جوجل عند توفر الشبكة.
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              filterType === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            الكل ({queue.length})
          </button>
          <button
            onClick={() => setFilterType('PENDING')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              filterType === 'PENDING' ? 'bg-white text-amber-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            معلقة ({pendingCount})
          </button>
          <button
            onClick={() => setFilterType('SYNCED')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              filterType === 'SYNCED' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            متزامنة ({syncedCount})
          </button>
        </div>
      </div>

      {/* Queue items list */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-gray-700">
          العمليات المسجلة محلياً في انتظار الرفع لسحابة جوجل ({filteredQueue.length}):
        </div>

        {filteredQueue.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-800">لا توجد عمليات معلقة</h3>
            <p className="text-xs text-gray-500 mt-1">النظام متزامن بالكامل مع سحابة جوجل وقواعد البيانات.</p>
          </div>
        ) : (
          filteredQueue.map((log) => {
            const formattedDate = new Date(log.timestamp).toLocaleString('ar-EG', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={log.queueId}
                className="bg-white p-4 rounded-2xl border border-[#dce5df] shadow-xs text-right transition-all hover:border-[#006C50]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        log.entityType === 'SALE'
                          ? 'bg-blue-100 text-blue-800'
                          : log.entityType === 'PRODUCT'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      نوع الكيان: {log.entityType}
                    </span>

                    <span className="text-xs text-gray-500 font-mono">
                      معرف: <strong className="text-gray-800">{log.entityId}</strong>
                    </span>

                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">
                      {log.action}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.synced ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>تمت المزامنة</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>بانتظار الرفع</span>
                      </span>
                    )}

                    <span className="text-xs text-gray-400 font-mono">{formattedDate}</span>
                  </div>
                </div>

                {/* Payload snippet & Inspector button */}
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs font-mono text-gray-700 break-all flex items-center justify-between gap-3">
                  <span className="truncate">{log.payloadJson}</span>
                  <button
                    onClick={() => setActivePayload(log)}
                    className="shrink-0 px-2 py-1 bg-white hover:bg-gray-100 text-[#006C50] text-[11px] font-bold rounded-md border border-gray-200 flex items-center gap-1"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>فحص JSON</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payload JSON Inspector Modal */}
      {activePayload && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 text-right">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              فحص حمولة البيانات (Cloud Sync Payload)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              الكيان: {activePayload.entityType} | معرف: {activePayload.entityId}
            </p>

            <pre className="bg-gray-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-80 dir-ltr text-left">
              {JSON.stringify(JSON.parse(activePayload.payloadJson), null, 2)}
            </pre>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setActivePayload(null)}
                className="py-2 px-5 bg-[#006C50] text-white text-xs font-bold rounded-xl hover:bg-[#00543e] cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
