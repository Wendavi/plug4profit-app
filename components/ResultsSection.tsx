
// FIX: Implemented the missing ResultsSection component to display analysis results.
import React, { useState, Suspense, lazy } from 'react';
import type { AnalysisResult, BrandVoice } from '../types';
import ImageGallery from './ImageGallery';
import Loader from './Loader';

const SocialPosts = lazy(() => import('./SocialPosts'));
const AiImageGenerator = lazy(() => import('./AiImageGenerator'));
const AiVideoGenerator = lazy(() => import('./AiVideoGenerator'));
const FeatureCards = lazy(() => import('./FeatureCards'));
const AiMarketingStrategist = lazy(() => import('./AiMarketingStrategist'));
const AiPodcastGenerator = lazy(() => import('./AiPodcastGenerator'));
const AiCompetitorAnalysis = lazy(() => import('./AiCompetitorAnalysis'));

interface ResultsSectionProps {
    result: AnalysisResult;
    brandVoice: BrandVoice;
    onContentSaved: () => void;
    onApiKeyError: () => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ result, brandVoice, onContentSaved, onApiKeyError }) => {
    // FIX: Add state to manage tabs for better UX.
    const [activeTab, setActiveTab] = useState<'content' | 'media' | 'strategy' | 'tools'>('content');

    const tabClass = (tabName: string) => `flex-shrink-0 font-medium py-2 px-4 border-b-2 transition ${
        activeTab === tabName
            ? 'border-amber-500 text-amber-400'
            : 'border-transparent text-gray-400 hover:text-amber-400'
    }`;

    return (
        <div className="space-y-8 mt-8">
            <h2 className="text-3xl font-bold text-center">Analyse Resultaten</h2>
            
            <div className="border-b border-gray-700">
                <nav className="flex space-x-4 -mb-px overflow-x-auto pb-2 scrollbar-hide" aria-label="Tabs">
                    <button onClick={() => setActiveTab('content')} className={tabClass('content')}>
                        Social Content
                    </button>
                    <button onClick={() => setActiveTab('media')} className={tabClass('media')}>
                        Multimedia Studio
                    </button>
                    <button onClick={() => setActiveTab('strategy')} className={tabClass('strategy')}>
                        Strategie & Research
                    </button>
                    <button onClick={() => setActiveTab('tools')} className={tabClass('tools')}>
                        Extra Tools
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className={activeTab === 'content' ? '' : 'hidden'}>
                <Suspense fallback={<Loader message="Content laden..." />}>
                    <div className="space-y-8">
                        <SocialPosts 
                            posts={result.posts} 
                            url={result.url} 
                            language={result.language}
                            brandVoice={brandVoice}
                            onContentSaved={onContentSaved}
                        />
                        <AiImageGenerator
                            textForAI={result.textForAI}
                            sourceUrl={result.url}
                            language={result.language}
                            initialKeywords={result.keywords}
                            brandVoice={brandVoice}
                            onContentSaved={onContentSaved}
                        />
                        <ImageGallery images={result.images} />
                    </div>
                </Suspense>
            </div>
            
            <div className={activeTab === 'media' ? '' : 'hidden'}>
                <Suspense fallback={<Loader message="Media studio laden..." />}>
                    <div className="space-y-8">
                        <AiVideoGenerator 
                            textForAI={result.textForAI} 
                            initialKeywords={result.keywords} 
                            sourceUrl={result.url} 
                            language={result.language}
                            brandVoice={brandVoice}
                            onContentSaved={onContentSaved}
                            onApiKeyError={onApiKeyError}
                        />
                        <AiPodcastGenerator
                            textForAI={result.textForAI}
                            language={result.language}
                            sourceUrl={result.url}
                            onContentSaved={onContentSaved}
                        />
                    </div>
                </Suspense>
            </div>

            <div className={activeTab === 'strategy' ? '' : 'hidden'}>
                 <Suspense fallback={<Loader message="Strategie tools laden..." />}>
                    <div className="space-y-8">
                        <AiMarketingStrategist textForAI={result.textForAI} language={result.language} />
                        <AiCompetitorAnalysis initialKeywords={result.keywords || ''} language={result.language} />
                    </div>
                </Suspense>
            </div>

            <div className={activeTab === 'tools' ? '' : 'hidden'}>
                 <Suspense fallback={<Loader message="Extra tools laden..." />}>
                    <FeatureCards textForAI={result.textForAI} posts={result.posts} language={result.language} />
                </Suspense>
            </div>
        </div>
    );
};

export default ResultsSection;
