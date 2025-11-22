import React from 'react';
import FeatureCard from './FeatureCard';
import * as geminiService from '../services/geminiService';
import type { CampaignIdea, TargetAudience, AudienceProfile, VideoScript, CalendarItem, RepurposeIdea, SeoSuggestions, SocialPosts, DetailedImagePrompts, FaqItem } from '../types';

interface FeatureCardsProps {
    textForAI: string;
    posts: SocialPosts;
    language: string;
}

const FeatureCards: React.FC<FeatureCardsProps> = ({ textForAI, posts, language }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard<TargetAudience>
                title="🎯 Doelgroep Suggestie"
                description="Ontdek wie uw ideale doelgroep is voor deze content."
                buttonText="Analyseer Doelgroep"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateTargetAudience(textForAI, language)}
                renderContent={(data) => (
                    <div className="space-y-4">
                        {(['primair', 'secundair'] as const).map(key => {
                            const profile: AudienceProfile = data[key];
                            return (
                                <div key={key} className="p-4 bg-gray-700 rounded-lg space-y-3">
                                    <h4 className="font-bold text-lg text-amber-300">{key === 'primair' ? 'Primaire' : 'Secundaire'} Doelgroep</h4>
                                    <p><strong className="font-semibold">Beschrijving:</strong> {profile.beschrijving}</p>
                                    <p><strong className="font-semibold">Demografie:</strong> {profile.demografie}</p>
                                    <div><strong className="font-semibold">Interesses:</strong>
                                        <ul className="list-disc list-inside pl-2">{profile.interesses.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            />
            <FeatureCard<CampaignIdea[]>
                title="💡 Campagne Ideeën"
                description="Genereer een mini-campagne met meerdere post-ideeën op basis van dit artikel."
                buttonText="Genereer Campagne Ideeën"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateCampaignIdeas(textForAI, language)}
                renderContent={(data) => (
                    <div className="space-y-3">
                        {data.map((idea, index) => (
                            <div key={index} className="p-4 bg-gray-700 rounded-lg">
                                <h4 className="font-bold text-lg text-amber-300">Idee {index + 1}: {idea.titel}</h4>
                                <p className="text-gray-300">{idea.beschrijving}</p>
                            </div>
                        ))}
                    </div>
                )}
            />
             <FeatureCard<VideoScript>
                title="🎬 Korte Video Script Idee"
                description="Transformeer uw content in een script voor een korte video (Reel/TikTok)."
                buttonText="Genereer Video Script"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateVideoScript(textForAI, language)}
                renderContent={(data) => (
                     <div className="p-4 bg-gray-700 rounded-lg space-y-4">
                        <div>
                            <h4 className="font-bold text-lg text-amber-300">Hook (eerste 3 sec)</h4>
                            <p>{data.hook}</p>
                        </div>
                        <div className="space-y-3">
                            {data.scenes.map((scene, index) => (
                                <div key={index} className="border-l-2 border-amber-400 pl-3">
                                    <p><strong className="font-semibold text-amber-300">Scène {index + 1}:</strong> {scene.visueel}</p>
                                    <p className="italic text-gray-300">"{scene.voiceover}"</p>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg text-amber-300">Call-to-Action</h4>
                            <p>{data.cta}</p>
                        </div>
                    </div>
                )}
            />
            <FeatureCard<CalendarItem[]>
                title="📅 Content Kalender Suggestie"
                description="Genereer een voorstel voor een 5-daagse content kalender."
                buttonText="Genereer Kalender"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateCalendar(textForAI, language)}
                renderContent={(data) => (
                    <div className="space-y-3">
                       {data.map((item, index) => (
                            <div key={index} className="p-4 bg-gray-700 rounded-lg border-l-4 border-amber-400">
                                <h4 className="font-bold text-lg text-amber-300">{item.dag} - <span className="font-medium">{item.platform}</span></h4>
                                <p className="mt-1">{item.idee}</p>
                                <p className="mt-2 text-sm text-gray-400 italic"><strong>Waarom:</strong> {item.rationale}</p>
                            </div>
                        ))}
                    </div>
                )}
            />
            <FeatureCard<RepurposeIdea[]>
                title="♻️ Content Hergebruik Ideeën"
                description="Ontvang ideeën om deze content in andere formats te hergebruiken."
                buttonText="Genereer Hergebruik Ideeën"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateRepurposingIdeas(textForAI, language)}
                renderContent={(data) => (
                     <div className="space-y-3">
                        {data.map((idea, index) => (
                            <div key={index} className="p-4 bg-gray-700 rounded-lg">
                                <h4 className="font-bold text-lg text-amber-300">{idea.format}</h4>
                                <p className="text-gray-300">{idea.beschrijving}</p>
                            </div>
                        ))}
                    </div>
                )}
            />
            <FeatureCard<string[]>
                title="🤔 Prikkelende Vragen"
                description="Genereer vragen om de interactie met uw publiek aan te gaan."
                buttonText="Genereer Vragen"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateEngagingQuestions(textForAI, language)}
                renderContent={(data) => (
                    <ol className="list-decimal list-inside space-y-2 text-amber-200 bg-gray-700 p-4 rounded-lg">
                        {data.map((q, index) => <li key={index}>{q}</li>)}
                    </ol>
                )}
            />
            <FeatureCard<SeoSuggestions>
                title="🔍 SEO Suggesties"
                description="Genereer een meta-omschrijving en zoekwoorden voor uw webpagina."
                buttonText="Genereer SEO Suggesties"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateSeoSuggestions(textForAI, language)}
                renderContent={(data) => (
                    <div className="p-4 bg-gray-700 rounded-lg space-y-3">
                        <h4 className="font-bold text-lg text-amber-300">Meta-omschrijving</h4>
                        <p className="italic">"{data.metaOmschrijving}"</p>
                        <h4 className="font-bold text-lg text-amber-300 pt-2">Zoekwoorden</h4>
                        <div className="flex flex-wrap gap-2">
                            {data.zoekwoorden.map((kw, index) => <span key={index} className="bg-amber-800 text-amber-200 text-sm font-medium px-3 py-1 rounded-full">{kw}</span>)}
                        </div>
                    </div>
                )}
            />
             <FeatureCard<string[]>
                title="🏷️ Hashtag Brainstormer"
                description="Genereer een lijst met relevante hashtags voor je content."
                buttonText="Genereer Hashtags"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateHashtags(textForAI, language)}
                renderContent={(data) => (
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-700 rounded-lg">
                        {data.map((tag, index) => (
                            <span key={index} className="bg-amber-800 text-amber-200 text-sm font-medium px-3 py-1 rounded-full">{tag}</span>
                        ))}
                    </div>
                )}
            />
            <FeatureCard<DetailedImagePrompts>
                title="🖼️ Gedetailleerde Afbeelding Prompts"
                description="Genereer uitgebreide, visuele prompts voor elke social media post, perfect voor AI-beeldgeneratoren."
                buttonText="Genereer Prompts"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateDetailedImagePrompts(posts, language)}
                renderContent={(data) => (
                    <div className="space-y-3">
                        {(Object.keys(data) as Array<keyof DetailedImagePrompts>).map((platform) => (
                            <div key={platform} className="p-3 bg-gray-700 rounded-lg">
                                <h4 className="font-bold text-md capitalize text-amber-300">{platform}</h4>
                                <p className="text-gray-300 text-sm italic mt-1">"{data[platform]}"</p>
                            </div>
                        ))}
                    </div>
                )}
            />
             <FeatureCard<FaqItem[]>
                title="❓ FAQ Sectie Ideeën"
                description="Genereer potentiële vragen en antwoorden voor een FAQ-sectie op basis van de tekst."
                buttonText="Genereer FAQ"
                buttonClass="bg-amber-600 hover:bg-amber-700"
                generationFn={() => geminiService.generateFaq(textForAI, language)}
                renderContent={(data) => (
                    <div className="space-y-3">
                        {data.map((item, index) => (
                            <div key={index} className="p-4 bg-gray-700 rounded-lg">
                                <h4 className="font-bold text-lg text-amber-300">{item.question}</h4>
                                <p className="text-gray-300 mt-1">{item.answer}</p>
                            </div>
                        ))}
                    </div>
                )}
            />
        </div>
    );
};

export default FeatureCards;
