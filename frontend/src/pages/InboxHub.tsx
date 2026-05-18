import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Mail, RefreshCw, Paperclip, Calendar, User, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface IncomingMessage {
  id: string;
  subject: string;
  senderEmail: string;
  receivedAt: string;
  status: string;
  resumeOriginalFilename: string | null;
  resumeFileSizeBytes: number | null;
  rawBody: string | null;
}

export default function InboxHub() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Fetch all incoming email ingestion messages
  const { data: messages = [], isLoading, isError } = useQuery<IncomingMessage[]>({
    queryKey: ['incomingMessages'],
    queryFn: async () => {
      const response = await api.get('/submissions/incoming-messages');
      return response.data;
    },
    refetchInterval: 30000, // Autorefresh every 30 seconds
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/submissions/incoming-messages/sync');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomingMessages'] });
    },
  });

  const selectedMessage = messages.find(m => m.id === selectedId) || messages[0] || null;

  // Sync handler
  const handleSync = () => {
    syncMutation.mutate();
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Premium Apple Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-slate-800" />
            Inbox Hub
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor real-time candidate emails, resume parsing activity, and IMAP synchronization logs.
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncMutation.isPending}
          className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-5 py-2 font-medium flex items-center gap-2 transition-all shadow-sm shrink-0 self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
          {syncMutation.isPending ? 'Syncing Inbox...' : 'Sync Inbox'}
        </Button>
      </div>

      {syncMutation.isSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          {syncMutation.data?.message || 'Inbox synchronization completed successfully!'}
        </div>
      )}

      {syncMutation.isError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          Inbox sync failed. Make sure IMAP environment variables are configured correctly.
        </div>
      )}

      {/* Main Mail Hub Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left Column: Email List */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl overflow-hidden flex flex-col shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Activity Log</span>
            <span className="text-xs text-slate-500 font-medium">{messages.length} messages</span>
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-300" />
              <span className="text-sm font-medium">Loading pulled emails...</span>
            </div>
          ) : isError ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <AlertCircle className="h-8 w-8 text-rose-400" />
              <span className="text-sm font-medium text-rose-700">Failed to load email activity feed</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 px-6 text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                <Mail className="h-6 w-6 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">No email records found</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">
                  Click the **Sync Inbox** button to check for new candidate resumes in your HR mailbox.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[560px]">
              {messages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedId(msg.id)}
                    className={`w-full text-left p-4 transition-all flex flex-col gap-1.5 border-l-4 ${
                      isSelected
                        ? 'bg-slate-50 border-slate-900'
                        : 'border-transparent hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-mono text-[10px] text-slate-400 truncate tracking-tight uppercase">
                        ID: {msg.id.substring(0, 8)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        {new Date(msg.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm text-slate-800 truncate leading-snug">
                      {msg.subject}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">{msg.senderEmail || 'unknown@inbox.com'}</span>
                    </div>

                    <div className="flex justify-between items-center mt-1">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        {msg.resumeOriginalFilename ? (
                          <>
                            <Paperclip className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[120px]">{msg.resumeOriginalFilename}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 font-normal">No attachments</span>
                        )}
                      </div>

                      <Badge
                        variant="outline"
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border-0 ${
                          msg.status === 'PROCESSED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : msg.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {msg.status}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Ingestion Detail Viewer */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs flex flex-col">
          {selectedMessage ? (
            <div className="flex-1 flex flex-col divide-y divide-slate-100">
              {/* Card Header details */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-3 py-1 text-xs font-semibold border shadow-xs ${
                      selectedMessage.status === 'PROCESSED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedMessage.status === 'FAILED'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    Ingestion {selectedMessage.status}
                  </Badge>
                  <div className="flex items-center text-xs text-slate-400 gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(selectedMessage.receivedAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
                    {selectedMessage.subject}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 text-slate-600 text-sm">
                    <span className="font-medium text-slate-400">From:</span>
                    <span className="font-mono text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md text-xs font-medium border border-slate-100">
                      {selectedMessage.senderEmail || 'unknown@inbox.com'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parsing and Extraction logs */}
              <div className="p-6 space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ingested Resume Attachment</h4>
                {selectedMessage.resumeOriginalFilename ? (
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[280px]">
                          {selectedMessage.resumeOriginalFilename}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatBytes(selectedMessage.resumeFileSizeBytes)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 rounded-full font-medium">
                      PDF / DOCX
                    </Badge>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500 italic p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
                    No attachments parsed from this email message.
                  </div>
                )}
              </div>

              {/* Raw Ingestion Logs / Body Content */}
              <div className="p-6 space-y-3 flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ingested Payload Content</h4>
                <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs overflow-auto max-h-[220px] leading-relaxed shadow-sm">
                  {selectedMessage.rawBody && selectedMessage.rawBody !== '[SCRUBBED]' ? (
                    <pre className="whitespace-pre-wrap">{selectedMessage.rawBody}</pre>
                  ) : selectedMessage.rawBody === '[SCRUBBED]' ? (
                    <div className="text-slate-400 flex items-center gap-2 py-4">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>
                        [COMPLIANCE REDACTED] - Email body data scrubbed post-extraction to guarantee strict candidate PII privacy compliance.
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">No body content captured.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center gap-3">
              <Mail className="h-10 w-10 text-slate-200" />
              <p className="text-sm">Select an activity item to view ingestion metadata log.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
