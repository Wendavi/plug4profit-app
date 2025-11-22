import React, { useState } from 'react';
import { generateMarketingKit } from '../services/geminiService';
import type { MarketingKit, AudienceProfile } from '../types';
import { TinySpinner, TargetIcon, LightbulbIcon, CalendarIcon, SeoIcon, HashtagIcon } from './Icons';
import Loader from './Loader';

interface AiMarketingStrategistProps {
    textForAI: string;
    language: string;
}

const AiMarketingStrategist: React.FC<AiMarketingStrategistProps> = ({ textForAI, language }) => {
    const [kit, setKit] = useState<MarketingKit | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setKit(null);
        try {
            const result = await generateMarketingKit(textForAI, language);
            setKit(result);
        } catch (e) {
            const err = e as Error;
            setError(err.message || 'Kon de marketingstrategie niet genereren.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderAudience = (profile: AudienceProfile, title: string) => (
        <div className="p-4 bg-gray-700 rounded-lg space-y-3">
            <h4 className="font-bold text-lg text-amber-300">{title}</h4>
            <p><strong className="font-semibold">Beschrijving:</strong> {profile.beschrijving}</p>
            <p><strong className="font-semibold">Demografie:</strong> {profile.demografie}</p>
            <div>
                <strong className="font-semibold">Interesses:</strong>
                <ul className="list-disc list-inside pl-2">
                    {profile.interesses.map((i, idx) => <li key={idx}>{i}</li>)}
                </ul>
            </div>
        </div>
    );

    return (
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-amber-500/30">
            <h2 className="text-2xl font-bold mb-2">🚀 AI Marketing Strategist</h2>
            <p className="text-gray-400 mb-4">
                Genereer een complete marketingstrategie met één klik. Krijg inzicht in uw doelgroep,
                ontdek creatieve invalshoeken en ontvang een concrete contentkalender.
            </p>

            {!kit && !isLoading && !error && (
                 <button
                    onClick={handleGenerate}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    ✨ Genereer Volledige Strategie
                </button>
            )}

            {isLoading && <Loader message="Strategie wordt uitgewerkt..." />}
            {error && <p className="text-red-400 text-center p-4">{error}</p>}
            
            {kit && (
                <div className="mt-6 space-y-8">
                    {/* Doelgroep */}
                    <section>
                        <h3 className="flex items-center text-xl font-bold text-amber-300 mb-3"><TargetIcon className="mr-2" /> Doelgroep Analyse</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderAudience(kit.doelgroep.primair, 'Primaire Doelgroep')}
                            {renderAudience(kit.doelgroep.secundair, 'Secundaire Doelgroep')}
                        </div>
                    </section>
                    
                    {/* Marketing Invalshoeken */}
                    <section>
                        <h3 className="flex items-center text-xl font-bold text-amber-300 mb-3"><LightbulbIcon className="mr-2" /> Marketing Invalshoeken</h3>
                         <div className="space-y-3">
                            {kit.marketingInvalshoeken.map((idea, index) => (
                                <div key={index} className="p-4 bg-gray-700 rounded-lg">
                                    <h4 className="font-bold text-lg text-amber-400">{idea.invalshoek}</h4>
                                    <p className="text-gray-300">{idea.beschrijving}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Content Kalender */}
                    <section>
                         <h3 className="flex items-center text-xl font-bold text-amber-300 mb-3"><CalendarIcon className="mr-2" /> Content Kalender</h3>
                         <div className="space-y-3">
                           {kit.contentKalender.map((item, index) => (
                                <div key={index} className="p-4 bg-gray-700 rounded-lg border-l-4 border-amber-400">
                                    <h4 className="font-bold text-lg text-amber-400">{item.dag} - <span className="font-medium">{item.platform}</span></h4>
                                    <p className="mt-1">{item.idee}</p>
                                    <p className="mt-2 text-sm text-gray-400 italic"><strong>Waarom:</strong> {item.rationale}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* SEO & Hashtags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section>
                            <h3 className="flex items-center text-xl font-bold text-amber-300 mb-3"><SeoIcon className="mr-2" /> SEO Suggesties</h3>
                            <div className="p-4 bg-gray-700 rounded-lg space-y-3">
                                <h4 className="font-bold text-lg text-amber-400">Meta-omschrijving</h4>
                                <p className="italic">"{kit.seoSuggesties.metaOmschrijving}"</p>
                                <h4 className="font-bold text-lg text-amber-400 pt-2">Zoekwoorden</h4>
                                <div className="flex flex-wrap gap-2">
                                    {kit.seoSuggesties.zoekwoorden.map((kw, index) => <span key={index} className="bg-amber-800 text-amber-200 text-sm font-medium px-3 py-1 rounded-full">{kw}</span>)}
                                </div>
                            </div>
                        </section>
                        <section>
                            <h3 className="flex items-center text-xl font-bold text-amber-300 mb-3"><HashtagIcon className="mr-2" /> Hashtag Groepen</h3>
                             <div className="p-4 bg-gray-700 rounded-lg space-y-4">
                                {kit.hashtagGroepen.map((group, index) => (
                                    <div key={index}>
                                        <h4 className="font-bold text-md capitalize text-amber-400">{group.groep}</h4>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {group.hashtags.map((tag, i) => <span key={i} className="text-xs bg-gray-600 text-gray-300 px-2 py-0.5 rounded-full">{tag}</span>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="mt-4 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <TinySpinner /> : '✨'} Opnieuw Genereren
                    </button>
                </div>
            )}
        </div>
    );
};

export default AiMarketingStrategist;
