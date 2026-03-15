import { User, X, Edit2 } from 'lucide-react';
import { MentionsInput, Mention } from 'react-mentions';
import userService from '../../api/services/userService';

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

    // The fetchUsers callback for react-mentions
    const fetchUsers = async (query, callback) => {
        if (!query) return;
        try {
            const results = await userService.search(query);
            const formatted = results.map(u => ({
                id: u.id,
                display: `${u.firstName} ${u.lastName || ''}`.trim(),
                email: u.email
            }));
            const everyone = { id: 'all', display: 'Everyone', email: 'Notify all active users' };
            callback([everyone, ...formatted]);
        } catch (err) {
            console.error('Mention search failed', err);
            callback([{ id: 'all', display: 'Everyone', email: 'Notify all active users' }]);
        }
    };

    const renderSuggestion = (suggestion, search, highlightedDisplay, index, focused) => (
        <div className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${focused ? 'bg-accent/5' : 'hover:bg-slate-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0 ${focused ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'}`}>
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

    const renderContent = (content) => {
        if (!content) return null;
        // react-mentions uses @[display](id)
        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }
            
            const displayName = match[1];
            const id = match[2];

            if (id === 'all') {
                parts.push(
                    <span key={match.index} className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 shadow-sm cursor-pointer hover:bg-amber-100 transition-colors">
                        @{displayName}
                    </span>
                );
            } else {
                parts.push(
                    <span key={match.index} className="text-accent font-semibold hover:underline cursor-pointer">
                        @{displayName}
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.05)] transition-all duration-300 overflow-hidden mb-6">
            {/* Author Header */}
            <div className="p-5 sm:p-6 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm ring-4 ring-slate-50 flex-shrink-0">
                        {post.authorName?.charAt(0) || '?'}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 text-[15px] leading-tight group-hover:text-accent transition-colors">{post.authorName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[13px] font-medium text-slate-500">{post.authorRole}</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[12px] text-slate-400">{timeAgo}</span>
                        </div>
                    </div>
                </div>
                {(isOwner || isAdmin) && (
                    <div className="flex gap-1">
                        {isOwner && (
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`p-2 rounded-xl transition-all ${isEditing ? 'text-white bg-accent shadow-sm' : 'text-slate-400 hover:text-accent hover:bg-slate-50'
                                    }`}
                                title="Edit post"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onDelete(post.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete post"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-5 sm:px-6 pb-5">
                {isEditing ? (
                    <div className="space-y-4 relative animate-in fade-in zoom-in-95 duration-200">
                        <MentionsInput
                            value={editContent}
                            onChange={(e, value) => setEditContent(value)}
                            className="mentions-wrapper"
                            style={{
                                control: { fontSize: '15px', minHeight: '100px' },
                                input: { padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '0.75rem', outline: 'none', backgroundColor: '#f8fafc' },
                                suggestions: {
                                    list: { backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '1rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', overflow: 'hidden' },
                                    item: { padding: 0, borderBottom: '1px solid #f8fafc' }
                                }
                            }}
                        >
                            <Mention
                                trigger="@"
                                data={fetchUsers}
                                renderSuggestion={renderSuggestion}
                                displayTransform={(id, display) => `@${display}`}
                                style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '0.25rem', fontWeight: '500' }}
                            />
                        </MentionsInput>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => { setIsEditing(false); setEditContent(post.content); }}
                                className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={!editContent.trim() || submitting}
                                className="px-4 py-2 text-sm font-semibold bg-accent text-white rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-accent/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                            >
                                Save Changes
                            </button>
                        </div>

                        </div>
                ) : (
                    <div className="space-y-3 mt-2">
                        {post.content && (
                            <p className="text-slate-700 text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap tracking-tight">
                                {renderContent(post.content)}
                            </p>
                        )}
                        {post.imageUrl && (
                            <div className="w-full overflow-hidden rounded-2xl border border-slate-100 mt-3 shadow-sm bg-slate-50">
                                <img 
                                    src={(import.meta.env.VITE_API_BASE_URL || 'https://api.eventra.site') + post.imageUrl} 
                                    alt="Post attachment" 
                                    loading="lazy"
                                    className="w-full max-h-[600px] object-contain hover:scale-[1.02] transition-transform duration-500 ease-in-out" 
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Stats Bar */}
            {(likesCount > 0 || post.comments?.length > 0) && (
                <div className="px-5 sm:px-6 pb-3 flex items-center justify-between text-[13px] font-medium text-slate-500">
                    {likesCount > 0 ? (
                        <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer" onClick={handleLike}>
                            <span className="w-5 h-5 bg-red-500 shadow-sm shadow-red-500/20 rounded-full flex items-center justify-center">
                                <Heart className="w-3 h-3 text-white fill-white" />
                            </span>
                            <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                        </div>
                    ) : <div />}
                    {post.comments?.length > 0 && (
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="hover:text-accent transition-colors"
                        >
                            {post.comments.length} Comment{post.comments.length !== 1 ? 's' : ''}
                        </button>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="px-3 sm:px-4 py-2 mt-1 mx-2 mb-2 border-t border-slate-100 flex items-center gap-2">
                <button
                    onClick={handleLike}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-bold transition-all ${liked
                        ? 'text-red-500 bg-red-50'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                >
                    <Heart className={`w-[18px] h-[18px] ${liked ? 'fill-current' : ''}`} />
                    Like
                </button>
                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-all"
                >
                    <MessageCircle className="w-[18px] h-[18px]" />
                    Comment
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="bg-slate-50 animate-in fade-in slide-in-from-top-4 duration-300">
                    {post.comments?.length > 0 && (
                        <div className="px-5 sm:px-6 py-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {post.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 text-[11px] font-bold flex-shrink-0 mt-0.5 shadow-sm">
                                        {comment.authorName?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white rounded-[1.25rem] rounded-tl-sm px-4 py-2.5 shadow-sm border border-slate-100/50 inline-block">
                                            <p className="text-[13px] font-bold text-slate-800">{comment.authorName}</p>
                                            <p className="text-[14px] text-slate-700 mt-0.5 leading-relaxed">{renderContent(comment.content)}</p>
                                        </div>
                                        <span className="text-[11px] font-medium text-slate-400 mt-1.5 ml-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
                                            {getTimeAgo(comment.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Comment Form */}
                    <form onSubmit={handleComment} className="px-5 sm:px-6 py-4 bg-white/50 border-t border-slate-100 relative">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-blue-500 flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm">
                                {user?.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1 relative bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all overflow-hidden p-1">
                                <MentionsInput
                                    value={commentText}
                                    onChange={(e, value) => setCommentText(value)}
                                    placeholder="Write a comment..."
                                    className="comment-mentions-wrapper"
                                    style={{
                                        control: { fontSize: '14px', minHeight: '38px', padding: '8px 12px' },
                                        input: { border: 'none', outline: 'none', color: '#334155' },
                                        suggestions: {
                                            list: { backgroundColor: 'white', border: '1px solid #f1f5f9', borderRadius: '1rem', boxShadow: '0 -5px 30px -5px rgba(0,0,0,0.1)', overflow: 'hidden' },
                                            item: { padding: 0, borderBottom: '1px solid #f8fafc' }
                                        }
                                    }}
                                    singleLine={false}
                                >
                                    <Mention
                                        trigger="@"
                                        data={fetchUsers}
                                        renderSuggestion={renderSuggestion}
                                        displayTransform={(id, display) => `@${display}`}
                                        style={{ backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '0.25rem', fontWeight: '500' }}
                                    />
                                </MentionsInput>
                                <button
                                    type="submit"
                                    disabled={!commentText.trim() || submitting}
                                    className="absolute right-2 bottom-2 p-1.5 bg-accent text-white rounded-full hover:bg-accent/90 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-sm ml-2 z-10"
                                >
                                    {submitting ? (
                                        <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                                    ) : (
                                        <Send className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
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
