import React, { useState, useRef } from 'react';
import { Send, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import userService from '../../api/services/userService';
import { MentionsInput, Mention } from 'react-mentions';

const CreatePost = ({ onSubmit }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    // The fetchUsers callback for react-mentions
    const fetchUsers = async (query, callback) => {
        if (!query) return;
        try {
            const results = await userService.search(query);
            // react-mentions requires { id, display } objects
            const formatted = results.map(u => ({
                id: u.id,
                display: `${u.firstName} ${u.lastName || ''}`.trim(),
                email: u.email
            }));
            
            // Add everyone option
            const everyone = { id: 'all', display: 'Everyone', email: 'Notify all active users' };
            callback([everyone, ...formatted]);
        } catch (err) {
            console.error('Mention search failed', err);
            callback([{ id: 'all', display: 'Everyone', email: 'Notify all active users' }]);
        }
    };

    const handleTextChange = (e, newValue, newPlainTextValue, mentions) => {
        setContent(newValue);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
                setFocused(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && !image) return;

        setLoading(true);
        try {
            await onSubmit(content, image);
            setContent('');
            setImage(null);
            setImagePreview(null);
            setFocused(false);
        } finally {
            setLoading(false);
        }
    };

    const renderSuggestion = (suggestion, search, highlightedDisplay, index, focused) => (
        <div className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${focused ? 'bg-accent/5' : 'hover:bg-slate-50'}`}>
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0 ${focused ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'}`}>
                {suggestion.display.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${focused ? 'text-accent' : 'text-slate-700'}`}>
                    {suggestion.display}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{suggestion.email}</p>
            </div>
        </div>
    );

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
                        <MentionsInput
                            value={content}
                            onChange={handleTextChange}
                            onFocus={() => setFocused(true)}
                            placeholder={`What's on your mind, ${user?.firstName || 'there'}?`}
                            className="mentions-wrapper"
                            style={{
                                control: { fontSize: '1.125rem', lineHeight: '1.5', minHeight: focused ? '120px' : '60px', transition: 'min-height 0.3s' },
                                input: { padding: 0, border: 'none', outline: 'none', color: '#1e293b' },
                                highlighter: { padding: 0 },
                                suggestions: {
                                    list: {
                                        backgroundColor: 'white',
                                        border: '1px solid #f1f5f9',
                                        borderRadius: '1rem',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                                        overflow: 'hidden',
                                        marginTop: '4px'
                                    },
                                    item: {
                                        padding: 0,
                                        borderBottom: '1px solid #f8fafc'
                                    }
                                }
                            }}
                        >
                            <Mention
                                trigger="@"
                                data={fetchUsers}
                                renderSuggestion={renderSuggestion}
                                displayTransform={(id, display) => `@${display}`}
                                style={{
                                    backgroundColor: '#eff6ff', // blue-50
                                    color: '#2563eb', // blue-600
                                    borderRadius: '0.25rem',
                                    fontWeight: '500'
                                }}
                            />
                        </MentionsInput>

                        {/* Animated Underline Effect on Focus */}
                        <div className={`absolute bottom-0 left-0 h-0.5 bg-accent/20 rounded-full transition-all duration-500 ease-out ${focused ? 'w-full' : 'w-0'}`}></div>

                        {/* Image Preview Area */}
                        {imagePreview && (
                            <div className="relative mt-3 mb-2 animate-in fade-in zoom-in-95 duration-300">
                                <img src={imagePreview} alt="Upload preview" className="rounded-2xl max-h-80 object-cover w-full shadow-sm border border-slate-100" />
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md transition-all duration-200"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Hidden File Input */}
                <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/gif,image/webp" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                />

                {/* Footer Actions */}
                <div className={`px-5 sm:px-6 pb-5 flex items-center justify-between transition-all duration-300 ${focused || content.trim() || image ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none absolute bottom-0 left-0 w-full'}`}>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center w-9 h-9 rounded-full text-slate-400 hover:text-accent hover:bg-accent/10 transition-colors"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">Share updates or ideas</span>
                            <span className="sm:hidden">Share an update</span>
                        </div>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={(!content.trim() && !image) || loading}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm
                            ${(!content.trim() && !image) || loading 
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
