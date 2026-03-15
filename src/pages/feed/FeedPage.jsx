import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, RefreshCw } from 'lucide-react';
import feedService from '../../api/services/feedService';
import { useNotification } from '../../context/NotificationContext';
import PostCard from '../../components/feed/PostCard';
import CreatePost from '../../components/feed/CreatePost';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const FeedPage = () => {
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const { connection, playNotificationSound } = useNotification();
    const { user } = useAuth();

    // Socket.io Listeners
    useEffect(() => {
        if (!connection) return;

        // Join the feed room to receive real-time updates
        connection.emit('joinRoom', 'feed');

        connection.on('NewPost', (post) => {
            setPosts(prev => {
                if (prev.find(p => p.id === post.id)) return prev;
                playNotificationSound();
                return [post, ...prev];
            });
        });

        connection.on('NewComment', (comment) => {
            setPosts(prev => {
                return prev.map(p => {
                    if (p.id === comment.postId) {
                        const exists = p.comments?.some(c => c.id === comment.id);
                        if (exists) return p;
                        playNotificationSound();
                        return { ...p, comments: [...(p.comments || []), comment] };
                    }
                    return p;
                });
            });
        });

        connection.on('PostLiked', (data) => {
            setPosts(prev => {
                return prev.map(p => {
                    if (p.id === data.postId) {
                        const isCurrentUserAction = data.userId === user?.id;
                        // Only play sound if it's NOT our action (we already know we liked it)
                        if (!isCurrentUserAction) playNotificationSound();

                        return {
                            ...p,
                            likesCount: data.likesCount,
                            isLikedByCurrentUser: isCurrentUserAction ? data.isLiked : p.isLikedByCurrentUser
                        };
                    }
                    return p;
                });
            });
        });

        return () => {
            connection.emit('leaveRoom', 'feed');
            connection.off('NewPost');
            connection.off('NewComment');
            connection.off('PostLiked');
        };
    }, [connection, playNotificationSound, user?.id]);

    const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
        setLoading(true);
        try {
            const data = await feedService.getFeed(pageNum, 10);
            if (append) {
                setPosts(prev => [...prev, ...data]);
            } else {
                setPosts(data);
            }
            setHasMore(data.length === 10);
        } catch (error) {
            console.error('Failed to load feed', error);
            toast.error('Failed to load feed');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPosts(1);
    }, [fetchPosts]);

    const handleCreatePost = async (content, image) => {
        try {
            const newPost = await feedService.createPost(content, image);
            setPosts(prev => {
                if (prev.some(p => p.id === newPost.id)) return prev;
                return [newPost, ...prev];
            });
            toast.success('Post published!');
        } catch (error) {
            toast.error('Failed to create post');
        }
    };

    const handleLike = async (postId) => {
        try {
            await feedService.toggleLike(postId);
        } catch (error) {
            toast.error('Failed to like post');
        }
    };

    const handleComment = async (postId, content) => {
        try {
            const newComment = await feedService.addComment(postId, content);
            setPosts(prev =>
                prev.map(p => {
                    if (p.id === postId) {
                        const exists = p.comments?.some(c => c.id === newComment.id);
                        if (exists) return p;
                        return { ...p, comments: [...(p.comments || []), newComment] };
                    }
                    return p;
                })
            );
        } catch (error) {
            toast.error('Failed to add comment');
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await feedService.deletePost(postId);
            setPosts(prev => prev.filter(p => p.id !== postId));
            toast.success('Post deleted');
        } catch {
            toast.error('Failed to delete post');
        }
    };

    const handleUpdate = async (postId, content) => {
        try {
            await feedService.updatePost(postId, content);
            setPosts(prev =>
                prev.map(p => p.id === postId ? { ...p, content } : p)
            );
            toast.success('Post updated');
        } catch {
            toast.error('Failed to update post');
            throw new Error('Update failed');
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPosts(nextPage, true);
    };

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
                <div>
                    <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-accent/10 rounded-xl">
                            <Newspaper className="w-6 h-6 text-accent" />
                        </div>
                        Company Feed
                    </h1>
                    <p className="text-[15px] text-slate-500 mt-2 font-medium">Stay connected, share ideas, and engage with your team.</p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setPage(1); fetchPosts(1); }}
                    className="gap-2 self-start sm:self-center bg-white border-slate-200 text-slate-600 hover:text-accent hover:border-accent hover:bg-accent/5 transition-all shadow-sm rounded-xl py-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Feed
                </Button>
            </div>

            {/* Create Post */}
            <CreatePost onSubmit={handleCreatePost} />

            {/* Feed Divider Area (Optional visual break) */}
            {posts.length > 0 && (
                <div className="flex items-center gap-4 py-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Recent Updates</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                </div>
            )}

            {/* Feed Posts */}
            <div className="space-y-6">
                {posts.map((post) => (
                    <PostCard
                        key={post.id}
                        post={post}
                        onLike={handleLike}
                        onComment={handleComment}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                    />
                ))}

                {/* Initial Loading State */}
                {loading && posts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/40 rounded-3xl border border-slate-100/50 backdrop-blur-sm">
                        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
                            <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <h3 className="text-base font-semibold text-slate-700">Loading your feed</h3>
                        <p className="text-sm font-medium text-slate-400 mt-1">Gathering the latest team updates...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && posts.length === 0 && (
                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 shadow-sm animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <Newspaper className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Your feed is empty</h3>
                        <p className="text-[15px] text-slate-500 mt-2 max-w-sm mx-auto font-medium leading-relaxed">
                            It's quiet here. Be the first to spark a conversation and share something with the team!
                        </p>
                    </div>
                )}

                {/* Load More Button */}
                {hasMore && posts.length > 0 && !loading && (
                    <div className="text-center pt-8 pb-12">
                        <Button 
                            variant="outline" 
                            onClick={handleLoadMore}
                            className="rounded-full px-8 py-2.5 text-[15px] font-semibold text-slate-600 bg-white border-slate-200 shadow-sm hover:text-accent hover:border-accent hover:shadow-md hover:bg-white transition-all duration-300"
                        >
                            Load Older Posts
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedPage;
