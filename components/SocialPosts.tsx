import React, { useState, Suspense, lazy } from 'react';
import type { SocialPosts, SocialPlatform, BrandVoice } from '../types';
import PostPane from './PostPane';
import { ShareIcon } from './Icons';

const ShareAllDialog = lazy(() => import('./ShareAllDialog'));

interface SocialPostsProps {
    posts: SocialPosts;
    url: string;
    language: string;
    brandVoice?: BrandVoice;
    onContentSaved: () => void;
}

const SocialPosts: React.FC<SocialPostsProps> = ({ posts, url, language, brandVoice, onContentSaved }) => {
    const [activeTab, setActiveTab] = useState<SocialPlatform>('twitter');
    const [isShareAllOpen, setIsShareAllOpen] = useState(false);

    const tabs: { id: SocialPlatform; name: string }[] = [
        { id: 'twitter', name: 'Twitter' },
        { id: 'facebook', name: 'Facebook' },
        { id: 'linkedin', name: 'LinkedIn' },
        { id: 'instagram', name: 'Instagram' },
        { id: 'tiktok', name: 'TikTok' },
        { id: 'pinterest', name: 'Pinterest' },
    ];

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">✍️ Gegenereerde Social Posts</h2>
                <button
                    onClick={() => setIsShareAllOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center"
                    aria-label="Deel alle posts"
                >
                    <ShareIcon />
                    <span>Deel Alles</span>
                </button>
            </div>
            <div className="border-b border-gray-700">
                <nav className="flex space-x-4 -mb-px overflow-x-auto pb-2 scrollbar-hide" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 font-medium py-2 px-4 border-b-2 transition ${
                                activeTab === tab.id
                                    ? 'border-amber-500 text-amber-400'
                                    : 'border-transparent text-gray-400 hover:text-amber-400'
                            }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="pt-6">
                <PostPane
                    platform="twitter"
                    initialText={posts.twitterPost}
                    url={url}
                    isActive={activeTab === 'twitter'}
                    language={language}
                    brandVoice={brandVoice}
                    onContentSaved={onContentSaved}
                />
                <PostPane
                    platform="facebook"
                    initialText={posts.facebookPost}
                    url={url}
                    isActive={activeTab === 'facebook'}
                    language={language}
                    brandVoice={brandVoice}
                    onContentSaved={onContentSaved}
                />
                <PostPane
                    platform="linkedin"
                    initialText={posts.linkedinPost}
                    url={url}
                    isActive={activeTab === 'linkedin'}
                    language={language}
                    brandVoice={brandVoice}
                    onContentSaved={onContentSaved}
                />
                <PostPane
                    platform="instagram"
                    initialText={posts.instagramPost}
                    url={url}
                    isActive={activeTab === 'instagram'}
                    language={language}
                    brandVoice={brandVoice}
                    onContentSaved={onContentSaved}
                />
                <PostPane
                    platform="tiktok"
                    initialText={posts.tiktokPost}
                    url={url}
                    isActive={activeTab === 'tiktok'}
                    language={language}
                    brandVoice={brandVoice}
                    onContentSaved={onContentSaved}
                />
                 <PostPane
                    platform="pinterest"
                    initialText={posts.pinterestPost}
                    url={url}
                    isActive={activeTab === 'pinterest'}
                    language={language}
                    brandVoice={brandVoice}
                    onContentSaved={onContentSaved}
                />
            </div>
            <Suspense fallback={null}>
                <ShareAllDialog 
                    isOpen={isShareAllOpen}
                    onClose={() => setIsShareAllOpen(false)}
                    posts={posts}
                    url={url}
                />
            </Suspense>
        </div>
    );
};

export default SocialPosts;