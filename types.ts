
export interface SocialPosts {
    twitterPost: string;
    facebookPost: string;
    linkedinPost: string;
    instagramPost: string;
    tiktokPost: string;
    pinterestPost: string;
}

export type Tone = 'default' | 'professioneel' | 'enthousiast' | 'geestig' | 'informeel' | 'overtuigend';

export interface BrandVoice {
    tone: Tone;
    style: string;
    keyPhrases: string;
    audience: string;
    logo?: string;
    watermarkUrl?: string;
}

export interface AnalysisResult {
    textForAI: string;
    images: string[];
    posts: SocialPosts;
    url: string;
    language: string;
    keywords?: string;
    brandVoice?: BrandVoice;
}

export interface HistoryItem extends AnalysisResult {
    id: number;
}


export type SocialPlatform = 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'tiktok' | 'pinterest';

export interface CampaignIdea {
    titel: string;
    beschrijving: string;
}

export interface AudienceProfile {
    beschrijving: string;
    demografie: string;
    interesses: string[];
}
export interface TargetAudience {
    primair: AudienceProfile;
    secundair: AudienceProfile;
}

export interface VideoScene {
    visueel: string;
    voiceover: string;
}

export interface VideoScript {
    hook: string;
    scenes: VideoScene[];
    cta: string;
}

export interface CalendarItem {
    dag: string;
    platform: string;
    idee: string;
    rationale: string;
}

export interface RepurposeIdea {
    format: string;
    beschrijving: string;
}

export interface SeoSuggestions {
    metaOmschrijving: string;
    zoekwoorden: string[];
}

export interface DetailedImagePrompts {
    twitter: string;
    facebook: string;
    linkedin: string;
    instagram: string;
    tiktok: string;
    pinterest: string;
}

export interface FaqItem {
    question: string;
    answer: string;
}

// New types for the Marketing Kit
export interface MarketingAngle {
    invalshoek: string;
    beschrijving: string;
}

export interface HashtagGroup {
    groep: string;
    hashtags: string[];
}

export interface MarketingKit {
    doelgroep: TargetAudience;
    marketingInvalshoeken: MarketingAngle[];
    contentKalender: CalendarItem[];
    seoSuggesties: SeoSuggestions;
    hashtagGroepen: HashtagGroup[];
}

// Type for locally saved content
export interface SavedItem {
    id?: number;
    type: 'post' | 'image' | 'video' | 'audio';
    content: string | Blob;
    platform?: SocialPlatform;
    sourceUrl: string;
    timestamp: number;
    filename?: string;
}
