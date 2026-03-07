import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Trash2, Send, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import feedService from '../../api/services/feedService';
import userService from '../../api/services/userService';
import { toast } from 'react-hot-toast';
import { User, X } from 'lucide-react';

const PostCard = ({ post, onLike, onComment, onDelete, onUpdate }) => {
    const { user } = useAuth();
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [liked, setLiked] = useState(post.isLikedByCurrentUser);
    const [likesCount, setLikesCount] = useState(post.likesCount);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);

    // Mention state for both comments and editing
    const [mentionTarget, setMentionTarget] = useState('comment'); // 'comment' or 'edit'

    // Mention state for comments
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStartPos, setMentionStartPos] = useState(-1);

    const handleTextChange = async (e, type) => {
        const value = e.target.value;
        const selectionStart = e.target.selectionStart;

        if (type === 'comment') setCommentText(value);
        else setEditContent(value);

        setMentionTarget(type);

        const lastAtIndex = value.lastIndexOf('@', selectionStart - 1);
        if (lastAtIndex !== -1) {
            const textAfterAt = value.substring(lastAtIndex + 1, selectionStart);
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
        const targetText = mentionTarget === 'comment' ? commentText : editContent;
        const beforeMention = targetText.substring(0, mentionStartPos);
        const afterMention = targetText.substring(targetText.indexOf(mentionQuery, mentionStartPos) + mentionQuery.length);
        const structuredMention = `@[${selectedUser.id}:${selectedUser.firstName}${selectedUser.lastName ? ' ' + selectedUser.lastName : ''}] `;

        const newText = beforeMention + structuredMention + afterMention;
        if (mentionTarget === 'comment') setCommentText(newText);
        else setEditContent(newText);

        setShowSuggestions(false);
        setSuggestions([]);
    };

    const renderContent = (content) => {
        if (!content) return null;
        const mentionRegex = /@\[([a-fA-F0-9-]{36}|all):([^\]]+)\]/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }
            if (match[1] === 'all') {
                parts.push(
                    <span key={match.index} className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors">
                        @{match[2]}
                    </span>
                );
            } else {
                parts.push(
                    <span key={match.index} className="text-accent font-semibold hover:underline cursor-pointer">
                        @{match[2]}
                    </span>
                );
            }
            lastIndex = mentionRegex.lastIndex;
        }
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }
        return parts.length > 0 ? parts : content;
    };

    // Sync with external updates
    useEffect(() => {
        setLiked(post.isLikedByCurrentUser);
    }, [post.isLikedByCurrentUser]);

    useEffect(() => {
        setLikesCount(post.likesCount);
    }, [post.likesCount]);

    const isOwner = user?.id === post.userId;
    const isAdmin = user?.roles?.some(r => ['Admin', 'HRManager'].includes(r));
    const timeAgo = getTimeAgo(post.createdAt);

    const handleLike = async () => {
        try {
            await onLike(post.id);
            setLiked(!liked);
            setLikesCount(prev => liked ? prev - 1 : prev + 1);
        } catch (e) {
            toast.error('Failed to update like');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        setSubmitting(true);
        try {
            await onComment(post.id, commentText);
            setCommentText('');
            setShowComments(true);
        } catch (e) {
            toast.error('Failed to add comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async () => {
        if (!editContent.trim()) return;
        setSubmitting(true);
        try {
            await onUpdate(post.id, editContent);
            setIsEditing(false);
        } catch (e) {
            // Error handled in parent
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {/* Author Header */}
            <div className="p-5 pb-3 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {post.authorName?.charAt(0) || '?'}
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{post.authorName}</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{post.authorRole}</span>
                            <span className="text-xs text-slate-300">•</span>
                            <span className="text-xs text-slate-400">{timeAgo}</span>
                        </div>
                    </div>
                </div>
                {(isOwner || isAdmin) && (
                    <div className="flex gap-1">
                        {isOwner && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`p-1.5 rounded-lg transition-all ${isEditing ? 'text-accent bg-accent/10' : 'text-slate-300 hover:text-accent hover:bg-accent/5'
                                    }`}
                                title="Edit post"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(post.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete post"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-5 pb-4">
                {isEditing ? (
                    <div className="space-y-3 relative">
                        <textarea
                            value={editContent}
                            onChange={(e) => handleTextChange(e, 'edit')}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all"
                            rows={4}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                                className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={!editContent.trim() || submitting}
                                className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg shadow-sm hover:bg-accent/90 transition-all disabled:opacity-50"
                            >
                                Save Changes
                            </button>
                        </div>

                        {/* Edit Mention Dropdown */}
                        {showSuggestions && mentionTarget === 'edit' && suggestions.length > 0 && (
                            <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                                <div className="max-h-40 overflow-y-auto">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={suggestion.id}
                                            type="button"
                                            onClick={() => selectUser(suggestion)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${index === selectedIndex ? 'bg-accent/5 text-accent' : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold text-white">
                                                {suggestion.firstName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate">{suggestion.firstName} {suggestion.lastName}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{renderContent(post.content)}</p>
                )}
            </div>

            {/* Stats Bar */}
            {(likesCount > 0 || post.comments?.length > 0) && (
                <div className="px-5 pb-2 flex items-center justify-between text-xs text-slate-400">
                    {likesCount > 0 && (
                        <span className="flex items-center gap-1">
                            <span className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <Heart className="w-2.5 h-2.5 text-white fill-white" />
                            </span>
                            {likesCount}
                        </span>
                    )}
                    {post.comments?.length > 0 && (
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="hover:text-slate-600 transition-colors"
                        >
                            {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
                        </button>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="px-5 py-2 border-t border-slate-100 flex items-center gap-1">
                <button
                    onClick={handleLike}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${liked
                        ? 'text-red-500 bg-red-50 hover:bg-red-100'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-red-500'
                        }`}
                >
                    <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                    Like
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-accent transition-all"
                >
                    <MessageCircle className="w-4 h-4" />
                    Comment
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="border-t border-slate-100 bg-slate-50/50">
                    {/* Existing Comments */}
                    {post.comments?.length > 0 && (
                        <div className="px-5 py-3 space-y-3 max-h-60 overflow-y-auto">
                            {post.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                                        {comment.authorName?.charAt(0)}
                                    </div>
                                    <div className="bg-white rounded-xl px-3 py-2 border border-slate-100 flex-1">
                                        <p className="text-xs font-semibold text-slate-800">{comment.authorName}</p>
                                        <p className="text-xs text-slate-600 mt-0.5">{renderContent(comment.content)}</p>
                                        <span className="text-[10px] text-slate-400 mt-1 block">{getTimeAgo(comment.createdAt)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Comment Form */}
                    <form onSubmit={handleComment} className="px-5 py-3 flex items-center gap-2 border-t border-slate-100 relative">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user?.fullName?.charAt(0) || 'U'}
                        </div>
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => handleTextChange(e, 'comment')}
                            onKeyDown={handleKeyDown}
                            placeholder="Write a comment..."
                            className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!commentText.trim() || submitting}
                            className="p-2 text-accent hover:bg-accent/10 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                        </button>

                        {/* Comment Mention Dropdown */}
                        {showSuggestions && mentionTarget === 'comment' && suggestions.length > 0 && (
                            <div className="absolute z-50 bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                                <div className="p-2 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Mention Someone</span>
                                    <button onClick={() => setShowSuggestions(false)} className="text-slate-300 hover:text-slate-500">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                    {suggestions.map((suggestion, index) => (
                                        <button
                                            key={suggestion.id}
                                            type="button"
                                            onClick={() => selectUser(suggestion)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${index === selectedIndex ? 'bg-accent/5 text-accent' : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${index === selectedIndex ? 'bg-accent' : 'bg-slate-300'
                                                }`}>
                                                {suggestion.firstName?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold truncate">
                                                    {suggestion.firstName} {suggestion.lastName}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            )}
        </div>
    );
};

function getTimeAgo(dateStr) {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
}

export default PostCard;
