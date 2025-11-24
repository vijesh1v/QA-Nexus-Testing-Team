import React, { useState, useEffect, useRef } from 'react';
import { User, Message, Channel, UserRole, Attachment } from './types';
import { api } from './services/api';
import { storage } from './services/storage'; // Keeping for now if needed, but aim to remove
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { TimeTracker } from './components/TimeTracker';
import { LeavePortal } from './components/LeavePortal';
import { AdminAnalytics } from './components/AdminAnalytics';
import { Send, Paperclip, Sparkles, Bot } from 'lucide-react';
import { generateTestCase, chatWithBot } from './services/geminiService';

export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeChannel, setActiveChannel] = useState<string>('1');
    const [currentView, setCurrentView] = useState<'chat' | 'time' | 'leave' | 'analytics'>('chat');
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [showAdmin, setShowAdmin] = useState(false);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [showToolModal, setShowToolModal] = useState<'test-case' | null>(null);
    const [testCasePrompt, setTestCasePrompt] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            const storedUser = localStorage.getItem('qa_nexus_current_user');
            if (storedUser) {
                setCurrentUser(JSON.parse(storedUser));
                // Verify token in background
                try {
                    const { user } = await api.verifyToken();
                    setCurrentUser(user);
                    localStorage.setItem('qa_nexus_current_user', JSON.stringify(user));
                } catch {
                    // Token invalid
                    handleLogout();
                }
            }

            try {
                const channels = await api.getChannels();
                setChannels(channels);
            } catch (e) {
                console.error("Failed to load channels", e);
            }
        };
        init();
    }, []);

    // Polling for "Real-time" simulation (Only when in Chat view)
    useEffect(() => {
        if (!currentUser || currentView !== 'chat') return;

        const loadMessages = async () => {
            try {
                const msgs = await api.getMessages(activeChannel);
                setMessages(msgs);
            } catch (e) {
                console.error("Failed to load messages", e);
            }
        };

        loadMessages();
        const interval = setInterval(loadMessages, 2000);
        return () => clearInterval(interval);
    }, [currentUser, activeChannel, currentView]);

    // Scroll to bottom
    useEffect(() => {
        if (currentView === 'chat') {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, currentView]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        localStorage.setItem('qa_nexus_current_user', JSON.stringify(user));
    };

    const handleLogout = () => {
        setCurrentUser(null);
        localStorage.removeItem('qa_nexus_current_user');
        localStorage.removeItem('qa_nexus_token');
        setCurrentView('chat');
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!inputText.trim() && attachments.length === 0) || !currentUser) return;

        try {
            const newMessage = await api.addMessage({
                content: inputText,
                channelId: activeChannel,
                attachments: attachments,
            });

            setMessages(prev => [...prev, newMessage]);
            setInputText('');
            setAttachments([]);

            // Check for AI interaction
            if (inputText.includes('@AI')) {
                setIsAiProcessing(true);
                // Build history for Gemini
                const history = messages.slice(-10).map(m => ({
                    role: m.isAiGenerated ? 'model' : 'user' as 'model' | 'user',
                    parts: [{ text: m.content }]
                }));
                // Add current message
                history.push({ role: 'user', parts: [{ text: inputText }] });

                const response = await chatWithBot(history);

                const aiMessage = await api.addMessage({
                    content: response,
                    channelId: activeChannel,
                    isAiGenerated: true
                });

                setMessages(prev => [...prev, aiMessage]);
                setIsAiProcessing(false);
            }
        } catch (e) {
            console.error("Failed to send message", e);
        }
    };

    const handleDeleteMessage = async (id: string) => {
        try {
            await api.deleteMessage(id);
            setMessages(prev => prev.filter(m => m.id !== id));
        } catch (e) {
            console.error("Failed to delete message", e);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            if (ev.target?.result) {
                const newAttachment: Attachment = {
                    id: crypto.randomUUID(),
                    type: file.type.startsWith('image/') ? 'image' : 'file',
                    url: ev.target.result as string,
                    name: file.name,
                    mimeType: file.type,
                };
                setAttachments(prev => [...prev, newAttachment]);
            }
        };
        reader.readAsDataURL(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleGenerateTestCase = async () => {
        if (!testCasePrompt) return;
        setIsAiProcessing(true);
        setShowToolModal(null);

        try {
            const result = await generateTestCase(testCasePrompt);

            const aiMessage = await api.addMessage({
                content: `Here is the generated test case for: "${testCasePrompt}"\n\n${result}`,
                channelId: activeChannel,
                isAiGenerated: true
            });

            setMessages(prev => [...prev, aiMessage]);
            setIsAiProcessing(false);
            setTestCasePrompt('');
        } catch (e) {
            console.error("Failed to generate test case", e);
            setIsAiProcessing(false);
        }
    };

    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    const activeChannelData = channels.find(c => c.id === activeChannel);

    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-900">
            <Sidebar
                currentUser={currentUser}
                activeChannelId={activeChannel}
                onChannelSelect={setActiveChannel}
                onLogout={handleLogout}
                onAdminClick={() => setShowAdmin(true)}
                channels={channels}
                currentView={currentView}
                onViewChange={setCurrentView}
            />

            <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
                {/* View Routing */}

                {currentView === 'chat' && (
                    <>
                        {/* Header */}
                        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shadow-sm z-10">
                            <div>
                                <h2 className="font-bold text-lg flex items-center gap-2 text-slate-800">
                                    <span className="text-slate-400">#</span> {activeChannelData?.name}
                                </h2>
                                <p className="text-xs text-slate-500">{activeChannelData?.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowToolModal('test-case')}
                                    className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors"
                                >
                                    <Sparkles size={14} />
                                    Generate Test Case
                                </button>
                            </div>
                        </header>

                        {/* Chat Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                                        <Sparkles size={32} />
                                    </div>
                                    <p>No messages yet. Start the conversation!</p>
                                    <p className="text-sm mt-2">Try asking @AI for help</p>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <MessageBubble
                                    key={msg.id}
                                    message={msg}
                                    isOwn={msg.userId === currentUser.id}
                                    author={storage.getUsers().find(u => u.id === msg.userId)}
                                    currentUser={currentUser}
                                    onDelete={handleDeleteMessage}
                                />
                            ))}

                            {isAiProcessing && (
                                <div className="flex gap-2 items-center text-xs text-slate-400 ml-10 animate-pulse">
                                    <BotIcon /> QA Bot is thinking...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-200">
                            {attachments.length > 0 && (
                                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                    {attachments.map(att => (
                                        <div key={att.id} className="relative group">
                                            {att.type === 'image' ? (
                                                <img src={att.url} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-slate-200" />
                                            ) : (
                                                <div className="h-20 w-20 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-xs text-slate-500 border border-slate-200">
                                                    <FileTextIcon />
                                                    <span className="w-full text-center truncate px-1">{att.name}</span>
                                                </div>
                                            )}
                                            <button
                                                onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                            >
                                                <XIcon size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all shadow-sm">
                                <div className="flex items-center gap-1 pb-2 pl-2">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Upload file"
                                    >
                                        <Paperclip size={20} />
                                    </button>
                                </div>

                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage();
                                        }
                                    }}
                                    placeholder="Type a message or @AI for help..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 resize-none max-h-32 py-3"
                                    rows={1}
                                />

                                <button
                                    type="submit"
                                    disabled={!inputText.trim() && attachments.length === 0}
                                    className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-md shadow-blue-200"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                            <input
                                type="file"
                                multiple
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <p className="text-[10px] text-slate-400 mt-2 text-center">
                                <strong>Pro Tip:</strong> Upload a screenshot and click "Analyze Bug" on the message to get AI insights.
                            </p>
                        </div>
                    </>
                )}

                {currentView === 'time' && <div className="flex-1 overflow-y-auto"><TimeTracker currentUser={currentUser} /></div>}
                {currentView === 'leave' && <div className="flex-1 overflow-y-auto"><LeavePortal currentUser={currentUser} /></div>}
                {currentView === 'analytics' && currentUser.role === UserRole.ADMIN && <div className="flex-1 overflow-y-auto"><AdminAnalytics /></div>}
                {currentView === 'analytics' && currentUser.role !== UserRole.ADMIN && (
                    <div className="flex-1 flex items-center justify-center text-slate-400">Access Restricted</div>
                )}

            </main>

            {showAdmin && currentUser.role === UserRole.ADMIN && (
                <AdminPanel onClose={() => setShowAdmin(false)} currentUser={currentUser} />
            )}

            {/* Test Case Generator Modal */}
            {showToolModal === 'test-case' && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Sparkles className="text-indigo-500" /> AI Test Case Generator
                            </h3>
                            <button onClick={() => setShowToolModal(null)} className="text-slate-400 hover:text-slate-600"><XIcon size={20} /></button>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">Describe the requirement or user story, and the AI will generate a structured test case for you.</p>
                        <textarea
                            value={testCasePrompt}
                            onChange={(e) => setTestCasePrompt(e.target.value)}
                            placeholder="e.g. User should be able to reset their password via email link..."
                            className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowToolModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md text-sm">Cancel</button>
                            <button
                                onClick={handleGenerateTestCase}
                                disabled={!testCasePrompt.trim()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm flex items-center gap-2"
                            >
                                <Sparkles size={14} /> Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple Icon components for internal use
const BotIcon = () => <Bot size={16} />;
const FileTextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const XIcon = ({ size }: { size: number }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;