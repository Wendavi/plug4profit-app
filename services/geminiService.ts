
// FIX: Implemented the full geminiService to handle all AI interactions.
// FIX: Import correct response types from @google/genai.
import { GoogleGenAI, Type, GenerateContentResponse, GenerateImagesResponse, Operation, Modality } from "@google/genai";
import type {
    Tone, SocialPosts, SocialPlatform, TargetAudience, CampaignIdea, VideoScript,
    CalendarItem, RepurposeIdea, SeoSuggestions, DetailedImagePrompts, BrandVoice, FaqItem,
    MarketingKit
} from '../types';
import { apiQueue } from './apiQueue';
import { pcmToWav } from '../utils/audioUtils';

// FIX: Initialize the GoogleGenAI client on-demand to ensure the latest API key is used.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY! });

const textModel = 'gemini-2.5-flash';
// Switched to 2.5 Flash for complex tasks as well to ensure stability and reduce 500 errors
const complexModel = 'gemini-2.5-flash'; 
const imageModel = 'gemini-2.5-flash-image'; // Switched to Flash Image to avoid billing restrictions
const videoModel = 'veo-3.1-fast-generate-preview';
const ttsModel = 'gemini-2.5-flash-preview-tts';

// Helper function to handle generic AI errors and make them user friendly
function handleAiError(e: any, context: string): never {
    console.error(`Error in ${context}:`, e);
    const msg = e.message || e.toString();
    
    if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        throw new Error("De AI-service is momenteel overbelast (Quota overschreden). **Oplossing:** Probeer het over een minuutje nog eens.");
    }
    if (msg.includes('SAFETY') || msg.includes('blocked')) {
        throw new Error("De AI kon de tekst niet verwerken vanwege veiligheidsfilters. **Oplossing:** De tekst bevat mogelijk onderwerpen die als onveilig zijn gemarkeerd. Probeer een andere tekst.");
    }
    if (msg.includes('400') || msg.includes('INVALID_ARGUMENT')) {
        throw new Error("Er is een probleem met het verzoek aan de AI. **Oplossing:** Mogelijk is de input te lang of ongeldig. Probeer een kortere tekst.");
    }
    if (msg.includes('500') || msg.includes('INTERNAL') || msg.includes('Internal Server Error')) {
        throw new Error("Er is een interne fout opgetreden bij de AI-provider. **Oplossing:** Dit is meestal tijdelijk. We hebben het een paar keer geprobeerd, maar het lukte niet. Probeer het over enkele ogenblikken opnieuw.");
    }
    
    throw new Error(`Er is een onverwachte fout opgetreden: ${msg}`);
}

// Helper function to call the Gemini API with JSON parsing
async function generateJson<T>(prompt: string, schema: any, model: string = textModel): Promise<T> {
    const ai = getAiClient();
    try {
        // FIX: Add generic type to apiQueue.add to correctly type the response.
        const response = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        }));

        // FIX: Extract text directly from the response object as per guidelines.
        const text = response.text;
        if (!text) {
             throw new Error("De AI gaf een leeg antwoord terug.");
        }
        return JSON.parse(text) as T;
    } catch (e) {
        if (e instanceof SyntaxError) {
            console.error("JSON Parse Error:", e);
            throw new Error("De AI heeft geen geldig formaat gegenereerd. **Oplossing:** Probeer het opnieuw, dit gebeurt soms bij complexe taken.");
        }
        return handleAiError(e, 'generateJson');
    }
}

export async function detectLanguage(textForAI: string): Promise<string> {
    const ai = getAiClient();
    const prompt = `Identify the primary language of the following text. Respond with only the name of the language (e.g., 'Nederlands', 'English', 'Français'). Text: "${textForAI.substring(0, 500)}"`;

    try {
        // FIX: Add generic type to apiQueue.add to correctly type the response.
        const response = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: textModel,
            contents: prompt,
        }));
        
        const language = response.text?.trim().replace(/[^a-zA-Z\s-]/g, '');

        if (!language) {
            return 'Nederlands'; // Default to Dutch if detection fails
        }
        
        return language;
    } catch (e) {
        // Non-critical, fallback to Dutch silentl
        console.warn("Language detection failed, defaulting to Dutch", e);
        return 'Nederlands';
    }
}


export async function generateSocialPosts(
    textForAI: string,
    url: string,
    keywords: string,
    brandVoice: BrandVoice,
    language: string
): Promise<SocialPosts> {
    const toneInstruction = brandVoice.tone === 'default' ? 'een neutrale en informatieve toon' : `een ${brandVoice.tone} toon`;
    const styleInstruction = brandVoice.style ? `Schrijfstijl: ${brandVoice.style}.` : '';
    const audienceInstruction = brandVoice.audience ? `Doelgroep: ${brandVoice.audience}.` : '';
    const phrasesInstruction = brandVoice.keyPhrases ? `Belangrijke zinnen/woorden om te gebruiken: ${brandVoice.keyPhrases}.` : '';

    const brandVoicePrompt = `
        Houd je strikt aan de volgende merkstem:
        - Toon: ${toneInstruction}
        ${styleInstruction ? `- ${styleInstruction}` : ''}
        ${audienceInstruction ? `- ${audienceInstruction}` : ''}
        ${phrasesInstruction ? `- ${phrasesInstruction}` : ''}
    `.trim().replace(/^\s*\n/gm, '');

    const keywordInstruction = keywords ? `Focus op de volgende trefwoorden: ${keywords}.` : '';

    const prompt = `
        ${brandVoicePrompt}
        ---
        Analyseer de volgende tekst van de webpagina ${url}:
        ---
        ${textForAI}
        ---
        Genereer 6 social media posts op basis van deze tekst.
        - ${keywordInstruction}
        - Maak elke post uniek en geschikt voor het specifieke platform.
        - Voeg relevante hashtags toe.
        - De posts moeten in het ${language} zijn.
        - Zorg ervoor dat de output een geldig JSON-object is dat overeenkomt met het opgegeven schema.

        Twitter: Een korte, pakkende post (max 280 tekens).
        Facebook: Een iets langere, boeiende post die discussie aanmoedigt.
        LinkedIn: Een professionele post gericht op een zakelijk publiek.
        Instagram: Een visueel georiënteerde caption die goed past bij een afbeelding.
        TikTok: Een script-idee of een pakkende tekst voor een korte video.
        Pinterest: Een beschrijvende pin-tekst die inspireert en aanzet tot klikken of bewaren, geoptimaliseerd voor een visueel medium.
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            twitterPost: { type: Type.STRING },
            facebookPost: { type: Type.STRING },
            linkedinPost: { type: Type.STRING },
            instagramPost: { type: Type.STRING },
            tiktokPost: { type: Type.STRING },
            pinterestPost: { type: Type.STRING },
        },
        required: ["twitterPost", "facebookPost", "linkedinPost", "instagramPost", "tiktokPost", "pinterestPost"]
    };

    return generateJson<SocialPosts>(prompt, schema);
}

export async function generateImage(
    textForAI: string,
    keywords: string,
    language: string,
    aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4',
    style: string = 'Photorealistic'
): Promise<string> {
    const ai = getAiClient();
    
    let styleDesc = '';
    switch(style.toLowerCase()) {
        case 'photorealistic': styleDesc = 'photorealistic, high quality, 4k, highly detailed, professional photography'; break;
        case 'illustration': styleDesc = 'digital illustration, vibrant colors, vector art style, clean lines, flat design'; break;
        case 'concept art': styleDesc = 'concept art, cinematic lighting, detailed background, fantasy or sci-fi aesthetic, epic scale'; break;
        case 'watercolor': styleDesc = 'watercolor painting, soft edges, artistic, pastel colors, paper texture, wet-on-wet technique'; break;
        case 'oil painting': styleDesc = 'oil painting, textured brushstrokes, classical art style, rich colors, canvas texture'; break;
        case 'cyberpunk': styleDesc = 'cyberpunk, neon lights, futuristic, high tech, dark atmosphere, urban sci-fi'; break;
        case 'minimalist': styleDesc = 'minimalist, clean lines, simple composition, negative space, flat colors, modern art'; break;
        case 'sketch': styleDesc = 'pencil sketch, black and white, rough lines, artistic, hand-drawn style, charcoal shading'; break;
        case 'pop art': styleDesc = 'pop art style, bold colors, comic book aesthetic, dot patterns, retro 60s vibe'; break;
        case 'anime': styleDesc = 'anime style, cel shaded, vibrant colors, expressive characters, japanese animation style'; break;
        default: styleDesc = style; 
    }

    try {
        // First, generate a high-quality, language-specific prompt for the image model.
        const promptInstruction = `
            Based on the following text, create a concise, visually descriptive prompt in '${language}' for an AI image generator. 
            The image style must be: ${styleDesc}.
            Capture the essence of the text. Focus on these keywords: ${keywords || 'none'}. 
            Text: "${textForAI}" 
            Return only the prompt itself, without any preamble.
        `;

        const promptResponse = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: textModel,
            contents: promptInstruction,
        }));

        const imagePrompt = promptResponse.text?.trim();

        if (!imagePrompt) {
            throw new Error("Kon geen beschrijving voor de afbeelding genereren.");
        }

        // Use gemini-2.5-flash-image via generateContent with Modality.IMAGE
        // Note: Flash Image doesn't use the same config object for aspect ratio as Imagen, so we prompt for it.
        const enhancedPrompt = `${imagePrompt}. Style: ${style}. Aspect ratio: ${aspectRatio}.`;

        const response = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: imageModel,
            contents: { parts: [{ text: enhancedPrompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        }));

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (!imagePart || !imagePart.inlineData) {
            throw new Error("Afbeelding generatie mislukt: geen data ontvangen.");
        }
        return imagePart.inlineData.data;
    } catch (e) {
        return handleAiError(e, 'generateImage');
    }
}

export async function generateImageForPost(
    postText: string,
    platform: SocialPlatform,
    language: string,
    keywords: string,
    numberOfImages: number, // Ignored for Flash Image model which generates 1 image
): Promise<string[]> {
    const ai = getAiClient();
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
    const keywordInstruction = keywords ? `Focus on these extra keywords: ${keywords}.` : '';

    try {
        const promptInstruction = `
            Based on the following social media post for '${platformName}', create a concise, visually descriptive prompt in '${language}' for an AI image generator. The image should be photorealistic, modern, sleek, and professional, capturing the essence of the post.
            ${keywordInstruction}
            Post: "${postText}"
            Return only the prompt itself, without any preamble.
        `;

        const promptResponse = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: textModel,
            contents: promptInstruction,
        }));

        const imagePrompt = promptResponse.text?.trim();

        if (!imagePrompt) {
            throw new Error("Kon geen afbeeldingsprompt genereren.");
        }

        let aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' = '16:9';
        switch (platform) {
            case 'instagram':
                aspectRatio = '1:1';
                break;
            case 'tiktok':
                aspectRatio = '9:16';
                break;
            case 'pinterest':
                aspectRatio = '3:4';
                break;
            case 'twitter':
            case 'facebook':
            case 'linkedin':
            default:
                aspectRatio = '16:9';
                break;
        }

        // Use gemini-2.5-flash-image via generateContent with Modality.IMAGE
        const enhancedPrompt = `${imagePrompt}. Aspect ratio: ${aspectRatio}.`;

        const response = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: imageModel,
            contents: { parts: [{ text: enhancedPrompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        }));

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (!imagePart || !imagePart.inlineData) {
            throw new Error("Afbeelding generatie mislukt.");
        }
        return [imagePart.inlineData.data];
    } catch (e) {
        return handleAiError(e, 'generateImageForPost');
    }
}


export async function rewritePost(
    postText: string,
    platform: SocialPlatform,
    language: string
): Promise<{ newPost: string }> {
    const prompt = `
        Herschrijf de volgende social media post voor het platform '${platform}' in het ${language}.
        Maak het frisser, boeiender en mogelijk vanuit een ander perspectief, maar behoud de kernboodschap.
        Originele post:
        ---
        ${postText}
        ---
        Geef alleen de nieuwe post terug als een JSON object met de key "newPost".
    `;

    const schema = {
        type: Type.OBJECT,
        properties: {
            newPost: { type: Type.STRING }
        },
        required: ["newPost"]
    };

    return generateJson<{ newPost: string }>(prompt, schema);
}


// Implementations for FeatureCards
export async function generateTargetAudience(textForAI: string, language: string): Promise<TargetAudience> {
    const prompt = `Analyseer de volgende tekst en definieer de primaire en secundaire doelgroep. Geef een beschrijving, demografische gegevens en interesses voor beide groepen. De output moet in het ${language} zijn. Tekst: "${textForAI}"`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            primair: {
                type: Type.OBJECT,
                properties: {
                    beschrijving: { type: Type.STRING },
                    demografie: { type: Type.STRING },
                    interesses: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["beschrijving", "demografie", "interesses"]
            },
            secundair: {
                type: Type.OBJECT,
                properties: {
                    beschrijving: { type: Type.STRING },
                    demografie: { type: Type.STRING },
                    interesses: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                 required: ["beschrijving", "demografie", "interesses"]
            }
        },
        required: ["primair", "secundair"]
    };
    return generateJson<TargetAudience>(prompt, schema);
}

export async function generateCampaignIdeas(textForAI: string, language: string): Promise<CampaignIdea[]> {
    const prompt = `Genereer 3 creatieve campagne-ideeën op basis van de volgende tekst. Elk idee moet een titel en een korte beschrijving hebben. De output moet in het ${language} zijn. Tekst: "${textForAI}"`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                titel: { type: Type.STRING },
                beschrijving: { type: Type.STRING }
            },
            required: ["titel", "beschrijving"]
        }
    };
    return generateJson<CampaignIdea[]>(prompt, schema);
}

export async function generateVideoScript(textForAI: string, language: string): Promise<VideoScript> {
    const prompt = `Creëer een kort videoscript (voor TikTok/Reels) gebaseerd op de volgende tekst. Het script moet een hook (eerste 3 seconden), 3-4 korte scènes (elk met een visuele beschrijving en een voice-over tekst), en een call-to-action bevatten. De output moet in het ${language} zijn. Tekst: "${textForAI}"`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            hook: { type: Type.STRING },
            scenes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        visueel: { type: Type.STRING },
                        voiceover: { type: Type.STRING }
                    },
                    required: ["visueel", "voiceover"]
                }
            },
            cta: { type: Type.STRING }
        },
        required: ["hook", "scenes", "cta"]
    };
    return generateJson<VideoScript>(prompt, schema);
}

export async function generateCalendar(textForAI: string, language: string): Promise<CalendarItem[]> {
    const prompt = `Genereer een 5-daagse content kalender suggestie gebaseerd op de volgende tekst. Voor elke dag, geef het platform, een post-idee, en een korte rationale. De output moet in het ${language} zijn. Tekst: "${textForAI}"`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                dag: { type: Type.STRING },
                platform: { type: Type.STRING },
                idee: { type: Type.STRING },
                rationale: { type: Type.STRING }
            },
            required: ["dag", "platform", "idee", "rationale"]
        }
    };
    return generateJson<CalendarItem[]>(prompt, schema);
}

export async function generateRepurposingIdeas(textForAI: string, language: string): Promise<RepurposeIdea[]> {
    const prompt = `Genereer 3 ideeën om de content van de volgende tekst te hergebruiken in verschillende formats (bv. blog, infographic, podcast-aflevering). Geef voor elk idee het format en een korte beschrijving. De output moet in het ${language} zijn. Tekst: "${textForAI}"`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                format: { type: Type.STRING },
                beschrijving: { type: Type.STRING }
            },
            required: ["format", "beschrijving"]
        }
    };
    return generateJson<RepurposeIdea[]>(prompt, schema);
}

export async function generateEngagingQuestions(textForAI: string, language: string): Promise<string[]> {
    const prompt = `Genereer 3 prikkelende en open vragen op basis van de volgende tekst, bedoeld om interactie uit te lokken op social media. De output moet in het ${language} zijn. Geef alleen een array van strings terug. Tekst: "${textForAI}"`;
    const schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };
    return generateJson<string[]>(prompt, schema);
}

export async function generateSeoSuggestions(textForAI: string, language: string): Promise<SeoSuggestions> {
    const prompt = `Genereer SEO suggesties voor een webpagina met de volgende tekst. Geef een pakkende meta-omschrijving (max 160 tekens) en een lijst van 5-7 relevante zoekwoorden. De output moet in het ${language} zijn. Tekst: "${textForAI}"`;
    const schema = {
        type: Type.OBJECT,
        properties: {
            metaOmschrijving: { type: Type.STRING },
            zoekwoorden: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["metaOmschrijving", "zoekwoorden"]
    };
    return generateJson<SeoSuggestions>(prompt, schema);
}

export async function generateHashtags(textForAI: string, language: string): Promise<string[]> {
    const prompt = `Genereer een lijst van 10-15 relevante en populaire hashtags gebaseerd op de volgende tekst. Mix brede en niche hashtags. De output moet in het ${language} zijn. Geef alleen een array van strings terug, zonder het '#' symbool. Tekst: "${textForAI}"`;
    const schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };
    return generateJson<string[]>(prompt, schema);
}

export async function generateDetailedImagePrompts(posts: SocialPosts, language: string): Promise<DetailedImagePrompts> {
    const prompt = `
        Gebaseerd op de volgende social media posts, genereer een gedetailleerde, visuele prompt voor een AI-beeldgenerator voor elk platform. De output moet in het ${language} zijn. Houd rekening met de unieke visuele stijl en typische afmetingen van elk platform.

        Richtlijnen per platform:
        - Twitter: Genereer een prompt voor een opvallend, duidelijk beeld (16:9 ratio). Moet snel de aandacht trekken in een drukke feed. Denk aan dynamische composities of heldere graphics.
        - Facebook: Genereer een prompt voor een boeiend en deelbaar beeld (1.91:1 of 1:1 ratio). Kan een lifestyle-foto, een informatieve graphic of een productfoto zijn die emotie oproept.
        - LinkedIn: Genereer een prompt voor een professioneel en strak beeld (1.91:1 ratio). Denk aan een zakelijke sfeer, cleane esthetiek, en metaforische concepten die passen bij de professionele context.
        - Instagram: Genereer een prompt voor een esthetisch hoogwaardig beeld (1:1 of 4:5 ratio). Focus op sfeer, prachtige belichting en een aantrekkelijke compositie. Kan levendig, minimalistisch of sfeervol zijn.
        - TikTok: Genereer een prompt voor een verticaal (9:16 ratio) en zeer aandachttrekkend beeld, alsof het een stilstaand beeld uit een boeiende video is. Energie, beweging en authenticiteit zijn belangrijk.
        - Pinterest: Genereer een prompt voor een inspirerend, verticaal beeld (2:3 ratio) van hoge kwaliteit. De compositie moet aantrekkelijk zijn en idealiter ruimte laten voor eventuele tekst-overlays.

        Posts: ${JSON.stringify(posts)}
    `;
    const schema = {
        type: Type.OBJECT,
        properties: {
            twitter: { type: Type.STRING },
            facebook: { type: Type.STRING },
            linkedin: { type: Type.STRING },
            instagram: { type: Type.STRING },
            tiktok: { type: Type.STRING },
            pinterest: { type: Type.STRING },
        },
        required: ["twitter", "facebook", "linkedin", "instagram", "tiktok", "pinterest"]
    };
    return generateJson<DetailedImagePrompts>(prompt, schema);
}

export async function generateFaq(textForAI: string, language: string): Promise<FaqItem[]> {
    const prompt = `Analyseer de volgende tekst en genereer 5-7 veelgestelde vragen (FAQ) met beknopte antwoorden op basis van de content. De output moet in het ${language} zijn. Tekst: "${textForAI}"`;
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
            },
            required: ["question", "answer"]
        }
    };
    return generateJson<FaqItem[]>(prompt, schema);
}

export async function generateVideo(
    textForAI: string,
    keywords: string,
    language: string,
    aspectRatio: '16:9' | '9:16',
    onProgress: (message: string) => void
): Promise<string> {
    const ai = getAiClient();
    try {
        // First, generate a high-quality, language-specific prompt for the video model.
        const promptInstruction = `Based on the following text, create a concise, visually descriptive prompt in '${language}' for an AI video generator. The video should be short, cinematic, modern, and professional, with a positive and energetic atmosphere, capturing the essence of the text. Focus on these keywords: ${keywords || 'none'}. Text: "${textForAI}" Return only the prompt itself, without any preamble.`;
        
        const promptResponse = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: textModel,
            contents: promptInstruction,
        }));

        const videoPrompt = promptResponse.text?.trim();

        if (!videoPrompt) {
            throw new Error("Kon geen videoscript genereren.");
        }

        const isDutch = language.toLowerCase().includes('nederlands') || language.toLowerCase().includes('dutch');

        onProgress(isDutch ? "De AI-regisseur is het script aan het lezen..." : "The AI director is reading the script...");
        
        let operation = await apiQueue.add<Operation>(() => ai.models.generateVideos({
            model: videoModel,
            prompt: videoPrompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio,
            }
        }));

        const creativeMessages = isDutch ? [
            "De digitale filmset wordt opgebouwd...",
            "Camera's draaien... Actie!",
            "De AI is de pixels aan het polijsten.",
            "Magie wordt gecreëerd, een moment geduld.",
            "Beelden renderen... dit is het meest intensieve deel.",
            "De video wordt nu gemonteerd."
        ] : [
            "Building the digital film set...",
            "Cameras rolling... Action!",
            "The AI is polishing the pixels.",
            "Magic is being created, one moment please.",
            "Rendering frames... this is the most intensive part.",
            "The video is now being edited."
        ];
        let checks = 0;

        while (!operation.done) {
            onProgress(creativeMessages[checks % creativeMessages.length]);
            await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
            checks++;
            operation = await apiQueue.add<Operation>(() => ai.operations.getVideosOperation({ operation: operation }));
        }

        onProgress(isDutch ? "Video is klaar! Nu downloaden en voorbereiden..." : "Video is ready! Downloading and preparing...");

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (!downloadLink) {
             throw new Error("Video generatie is gelukt, maar de downloadlink ontbreekt. **Oplossing:** Probeer het opnieuw.");
        }

        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Kon de video niet downloaden (Status: ${response.status}).`);
        }

        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    } catch (e) {
        return handleAiError(e, 'generateVideo');
    }
}

export async function generateMarketingKit(textForAI: string, language: string): Promise<MarketingKit> {
    // Uses gemini-2.5-flash for stability with large JSON schemas
    const prompt = `
        Voer als marketingstrateeg een diepgaande analyse uit van de volgende tekst en genereer een complete marketing kit in het ${language}.
        De output moet een enkel JSON-object zijn dat voldoet aan het opgegeven schema.

        De tekst om te analyseren is:
        ---
        ${textForAI}
        ---

        Genereer de volgende onderdelen in je analyse:
        1.  **doelgroep**: Definieer een primaire en secundaire doelgroep. Geef voor elk een beschrijving, demografie en interesses.
        2.  **marketingInvalshoeken**: Genereer 3 unieke en creatieve marketinginvalshoeken. Geef elke invalshoek een pakkende naam ('invalshoek') en een korte beschrijving.
        3.  **contentKalender**: Maak een contentkalender voor 5 dagen. Specificeer voor elke dag het platform, een concreet post-idee en de rationale erachter.
        4.  **seoSuggesties**: Geef een SEO-vriendelijke meta-omschrijving (max 160 tekens) en een lijst van 5-7 relevante zoekwoorden.
        5.  **hashtagGroepen**: Creëer 3 groepen van hashtags. Elke groep moet een thema hebben ('groep') en een lijst van 5-8 relevante hashtags bevatten.
    `;

    const audienceProfileSchema = {
        type: Type.OBJECT,
        properties: {
            beschrijving: { type: Type.STRING },
            demografie: { type: Type.STRING },
            interesses: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["beschrijving", "demografie", "interesses"]
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            doelgroep: {
                type: Type.OBJECT,
                properties: {
                    primair: audienceProfileSchema,
                    secundair: audienceProfileSchema
                },
                required: ["primair", "secundair"]
            },
            marketingInvalshoeken: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        invalshoek: { type: Type.STRING },
                        beschrijving: { type: Type.STRING }
                    },
                    required: ["invalshoek", "beschrijving"]
                }
            },
            contentKalender: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        dag: { type: Type.STRING },
                        platform: { type: Type.STRING },
                        idee: { type: Type.STRING },
                        rationale: { type: Type.STRING }
                    },
                    required: ["dag", "platform", "idee", "rationale"]
                }
            },
            seoSuggesties: {
                type: Type.OBJECT,
                properties: {
                    metaOmschrijving: { type: Type.STRING },
                    zoekwoorden: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["metaOmschrijving", "zoekwoorden"]
            },
            hashtagGroepen: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        groep: { type: Type.STRING },
                        hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["groep", "hashtags"]
                }
            }
        },
        required: ["doelgroep", "marketingInvalshoeken", "contentKalender", "seoSuggesties", "hashtagGroepen"]
    };

    // Use complexModel (switched to 2.5 Flash for stability)
    return generateJson<MarketingKit>(prompt, schema, complexModel);
}

export async function generatePodcastAudio(textForAI: string, language: string): Promise<Blob> {
    const ai = getAiClient();
    try {
        // 1. Generate a script first
        const scriptPrompt = `
            Based on the text below, write a short, engaging intro script for a podcast episode about this topic.
            The script should be in ${language}, about 40-60 seconds long when spoken, and sound natural and conversational.
            Do not include sound effects or speaker labels, just the raw text to be spoken.
            Text: "${textForAI.substring(0, 5000)}"
        `;

        const scriptResponse = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: textModel,
            contents: scriptPrompt,
        }));
        
        const script = scriptResponse.text;
        if (!script) throw new Error("Kon geen podcast script genereren.");

        // 2. TTS
        const response = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: ttsModel,
            contents: { parts: [{ text: script }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        }));

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("Audio generatie mislukt.");
        }

        // Convert base64 PCM to Uint8Array
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert PCM to WAV blob
        return pcmToWav(bytes, 24000, 1);
    } catch (e) {
        return handleAiError(e, 'generatePodcastAudio');
    }
}

export async function generateCompetitorAnalysis(keywords: string, language: string): Promise<{text: string, sources: {title: string, uri: string}[]}> {
    const ai = getAiClient();
    const prompt = `
        Perform a market research analysis for the topic: "${keywords}".
        Find 3 potential competitors or similar entities.
        For each, list their key strengths and weaknesses.
        Finally, suggest a unique angle to stand out.
        Write the response in ${language} using Markdown formatting.
    `;

    try {
        // Grounding is complex, using complexModel (now set to 2.5 Flash for stability, although 3-pro is ideal if stable)
        const response = await apiQueue.add<GenerateContentResponse>(() => ai.models.generateContent({
            model: complexModel,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        }));

        const text = response.text;
        if(!text) throw new Error("Geen analyse ontvangen.");

        // Extract grounding metadata
        const sources: {title: string, uri: string}[] = [];
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        if (chunks) {
            chunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({ title: chunk.web.title, uri: chunk.web.uri });
                }
            });
        }

        return { text, sources };
    } catch (e) {
        return handleAiError(e, 'generateCompetitorAnalysis');
    }
}
