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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <form onSubmit={handleSubmit}>
                <div className="p-5 flex gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                        {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 relative">
                        <textarea
                            value={content}
                            onChange={handleTextChange}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setFocused(true)}
                            placeholder={`What's on your mind, ${user?.firstName || 'there'}?`}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all placeholder:text-slate-400"
                            rows={focused ? 4 : 2}
                        />

                        {/* Suggestion Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="p-2 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Mention Someone</span>
                                    <button onClick={() => setShowSuggestions(false)} className="text-slate-300 hover:text-slate-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={suggestion.id}
                                            type="button"
                                            onClick={() => selectUser(suggestion)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${index === selectedIndex ? 'bg-accent/5 text-accent' : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ${index === selectedIndex ? 'bg-accent' : 'bg-slate-300'
                                                }`}>
                                                {suggestion.firstName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">
                                                    {suggestion.firstName} {suggestion.lastName}
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate">{suggestion.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {(focused || content.trim()) && (
                    <div className="px-5 pb-4 flex items-center justify-between border-t border-slate-50 pt-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Share updates, announcements, or ideas with your team</span>
                        </div>
                        <Button
                            type="submit"
                            variant="accent"
                            size="sm"
                            isLoading={loading}
                            disabled={!content.trim()}
                            className="gap-1.5"
                        >
                            <Send className="w-3.5 h-3.5" />
                            Post
                        </Button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default CreatePost;
