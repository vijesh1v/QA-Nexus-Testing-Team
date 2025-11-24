import React, { useState } from 'react';
import { Message, User, UserRole } from '../types';
import { Trash2, Bot, Cpu, FileText, Download } from 'lucide-react';
import { analyzeBugReport } from '../services/geminiService';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  author?: User;
  currentUser: User;
  onDelete: (id: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  author,
  currentUser,
  onDelete
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const canDelete = isOwn || currentUser.role === UserRole.ADMIN;
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleAnalyze = async () => {
    setAnalyzing(true);
    // If message has image, use first image, else just text
    const image = message.attachments?.find(a => a.type === 'image')?.url || null;
    const analysis = await analyzeBugReport(image, message.content);
    setAiAnalysis(analysis);
    setAnalyzing(false);
  };

  return (
    <div className={`group flex gap-3 max-w-3xl ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {message.isAiGenerated ? (
          <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
            <Bot size={18} />
          </div>
        ) : (
          <img
            src={author?.avatar || `https://ui-avatars.com/api/?name=${author?.username || 'User'}`}
            alt="Avatar"
            className="w-8 h-8 rounded-full bg-slate-200"
          />
        )}
      </div>

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-1 px-1">
          <span className="text-xs font-medium text-slate-700">
            {message.isAiGenerated ? 'QA Bot' : author?.username || 'Unknown'}
          </span>
          <span className="text-[10px] text-slate-400">{time}</span>
        </div>

        <div
          className={`relative px-4 py-2 rounded-2xl text-sm shadow-sm ${
            message.isAiGenerated 
                ? 'bg-purple-50 border border-purple-100 text-slate-800 rounded-tl-none'
                : isOwn
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
          }`}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 space-y-2">
              {message.attachments.map((att) => (
                <div key={att.id} className="overflow-hidden rounded-lg border border-black/10">
                  {att.type === 'image' ? (
                    <img src={att.url} alt="Attachment" className="max-w-xs max-h-60 object-cover" />
                  ) : (
                    <div className="flex items-center gap-2 p-3 bg-black/5">
                        <FileText size={20} />
                        <span className="text-xs truncate max-w-[150px]">{att.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>

          {/* Actions */}
          <div className={`absolute top-0 ${isOwn ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 p-1`}>
            {canDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50 transition-colors border border-slate-200"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
            
            {!isOwn && !message.isAiGenerated && (
               <button
               onClick={handleAnalyze}
               disabled={analyzing}
               className="p-1.5 bg-white rounded-full shadow-sm text-indigo-600 hover:bg-indigo-50 transition-colors border border-slate-200"
               title="Analyze Bug with AI"
             >
               <Cpu size={14} className={analyzing ? 'animate-pulse' : ''} />
             </button>
            )}
          </div>
        </div>
        
        {/* AI Analysis Result */}
        {aiAnalysis && (
            <div className="mt-2 max-w-md bg-indigo-50 rounded-lg p-3 border border-indigo-100 text-xs text-indigo-900">
                <div className="flex justify-between items-center mb-2 border-b border-indigo-200 pb-1">
                    <strong className="flex items-center gap-1"><Bot size={12}/> AI Analysis</strong>
                    <button onClick={() => setAiAnalysis(null)} className="text-indigo-400 hover:text-indigo-700">Close</button>
                </div>
                <div className="whitespace-pre-wrap">{aiAnalysis}</div>
            </div>
        )}
      </div>
    </div>
  );
};
