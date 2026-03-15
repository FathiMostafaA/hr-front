import React, { useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import userService from '../../api/services/userService';
import { User, X } from 'lucide-react';

const CreatePost = ({ onSubmit }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);

    // Mention state
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStartPos, setMentionStartPos] = useState(-1);

    const handleTextChange = async (e) => {
        const value = e.target.value;
        const selectionStart = e.target.selectionStart;
        setContent(value);

        // Check for @ trigger
        const lastAtIndex = value.lastIndexOf('@', selectionStart - 1);
        if (lastAtIndex !== -1) {
            const textAfterAt = value.substring(lastAtIndex + 1, selectionStart);
            // Only trigger if @ is at start of line or after space
            const charBeforeAt = lastAtIndex > 0 ? value[lastAtIndex - 1] : ' ';

            if (charBeforeAt === ' ' || charBeforeAt === '\n') {
                if (!textAfterAt.includes(' ')) {
                    setMentionQuery(textAfterAt);
                    setMentionStartPos(lastAtIndex);
                    setShowSuggestions(true);

                    // Always show @Everyone as first option
                    const everyone = { id: 'all', firstName: 'Everyone', lastName: '', email: 'Notify all active users' };

                    if (textAfterAt.length >= 2) {
                        try {
                            const results = await userService.search(textAfterAt);
                            setSuggestions([everyone, ...results]);
                            setSelectedIndex(0);
                        } catch (err) {
                            console.error('Mention search failed', err);
                            setSuggestions([everyone]);
                        }
                    } else {
                        setSuggestions([everyone]);
                        setSelectedIndex(0);
                    }
                    return;
                }
            }
        }

        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleKeyDown = (e) => {
        if (showSuggestions && suggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % suggestions.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                selectUser(suggestions[selectedIndex]);
            } else if (e.key === 'Escape') {
                setShowSuggestions(false);
            }
        }
    };

    const selectUser = (selectedUser) => {
        const beforeMention = content.substring(0, mentionStartPos);
        const afterMention = content.substring(content.indexOf(mentionQuery, mentionStartPos) + mentionQuery.length);

        // Structured format: @[id:name]
        const structuredMention = `@[${selectedUser.id}:${selectedUser.firstName}${selectedUser.lastName ? ' ' + selectedUser.lastName : ''}] `;
        const newContent = beforeMention + structuredMention + afterMention;

        setContent(newContent);
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            await onSubmit(content);
            setContent('');
            setFocused(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
            <form onSubmit={handleSubmit} className="relative">
                <div className="p-5 sm:p-6 flex gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent/90 to-blue-600/90 flex items-center justify-center text-white font-bold text-lg shadow-sm ring-4 ring-slate-50 flex-shrink-0 mt-0.5">
                        {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    
                    {/* Input Area */}
                    <div className="flex-1 relative group">
                        <textarea
                            value={content}
                            onChange={handleTextChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setFocused(true)}
                            placeholder={`What's on your mind, ${user?.firstName || 'there'}?`}
                            className={`w-full bg-transparent border-none rounded-xl px-0 py-2 text-slate-800 text-lg sm:text-[17px] leading-relaxed outline-none resize-none placeholder:text-slate-400 placeholder:font-light transition-all duration-300 ${focused ? 'min-h-[120px]' : 'min-h-[60px]'}`}
                            rows={focused ? 4 : 2}
                        />

                        {/* Animated Underline Effect on Focus */}
                        <div className={`absolute bottom-0 left-0 h-0.5 bg-accent/20 rounded-full transition-all duration-500 ease-out ${focused ? 'w-full' : 'w-0'}`}></div>

                        {/* Suggestion Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2.5 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mention Someone</span>
                                    <button onClick={() => setShowSuggestions(false)} className="text-slate-300 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={suggestion.id}
                                            type="button"
                                            onClick={() => selectUser(suggestion)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${index === selectedIndex ? 'bg-accent/5' : 'hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${index === selectedIndex ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {suggestion.firstName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${index === selectedIndex ? 'text-accent' : 'text-slate-700'}`}>
                                                    {suggestion.firstName} {suggestion.lastName}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate mt-0.5">{suggestion.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className={`px-5 sm:px-6 pb-5 flex items-center justify-between transition-all duration-300 ${focused || content.trim() ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none absolute bottom-0 left-0 w-full'}`}>
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Share updates or ideas</span>
                        <span className="sm:hidden">Share an update</span>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={!content.trim() || loading}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm
                            ${!content.trim() || loading 
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
                                : 'bg-accent text-white hover:bg-accent/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
                            }`}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        <span>Post</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
