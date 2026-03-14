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

    const handleCreatePost = async (content) => {
        try {
            const newPost = await feedService.createPost(content);
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
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Newspaper className="w-7 h-7 text-accent" />
                        Company Feed
                    </h1>
                    <p className="text-slate-500 mt-1">Stay connected with your team</p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setPage(1); fetchPosts(1); }}
                    className="gap-1.5"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {/* Create Post */}
            <CreatePost onSubmit={handleCreatePost} />

            {/* Feed Posts */}
            <div className="space-y-4">
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

                {loading && posts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm font-medium text-slate-500">Loading feed...</p>
                    </div>
                )}

                {!loading && posts.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                        <Newspaper className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-slate-700">No posts yet</h3>
                        <p className="text-sm text-slate-400 mt-1">Be the first to share something with the team!</p>
                    </div>
                )}

                {hasMore && posts.length > 0 && !loading && (
                    <div className="text-center pt-2">
                        <Button variant="ghost" onClick={handleLoadMore}>
                            Load More
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedPage;
