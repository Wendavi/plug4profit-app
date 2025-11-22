
// FIX: Implemented a proxy fallback system to handle 429 (Too Many Requests) errors and improve reliability.
// The app will now cycle through multiple proxies if one fails.

/**
 * Fetches the raw HTML content of a URL using a series of CORS proxies to bypass browser restrictions.
 * @param url The URL to fetch.
 * @returns A promise that resolves to the HTML content as a string.
 */
async function fetchWithProxy(url: string): Promise<string> {
    // A list of public CORS proxies. If one fails, the next one is tried.
    const proxies = [
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}` // Fallback proxy
    ];

    let lastError: Error | null = null;

    for (const proxyUrl of proxies) {
        try {
            const response = await fetch(proxyUrl);

            if (response.ok) {
                // Success! Return the response text.
                return await response.text();
            }

            const status = response.status;
            const proxyHost = new URL(proxyUrl).hostname;

            // If the target site blocks us (403) or is not found (404), another proxy won't help. Fail fast.
            if (status === 403) {
                throw new Error(`De website blokkeert geautomatiseerde toegang (Error 403). **Oplossing:** Probeer een andere pagina of website die minder streng beveiligd is.`);
            }
             if (status === 404) {
                throw new Error(`De pagina kon niet gevonden worden (Error 404). **Oplossing:** Controleer of de URL correct is en of de pagina nog bestaat.`);
            }

            // If the proxy is rate-limiting us (429) or has a server error (5xx), it's a proxy issue.
            // Log it and try the next proxy in the list.
            if (status === 429 || status >= 500) {
                console.warn(`Proxy ${proxyHost} failed with status ${status}. Trying next proxy.`);
                lastError = new Error(`De analyseservice is tijdelijk overbelast. We proberen een alternatieve route...`);
                continue; // Move to the next proxy
            }

            // For other client errors, it's probably not worth retrying.
            lastError = new Error(`Kon de URL niet ophalen (Status: ${status}). **Oplossing:** Controleer uw internetverbinding en de URL.`);
            break; // Stop trying other proxies

        } catch (error: any) {
            console.error("Network error when fetching through proxy:", error);
            // If it's already our custom error, rethrow it
            if (error.message.includes('**Oplossing:**')) throw error;
            
            lastError = new Error("Kon geen verbinding maken met de website. **Oplossing:** Controleer uw internetverbinding of probeer het later opnieuw.");
            // Continue to the next proxy in case it's a specific issue with the current proxy's network
        }
    }

    // If the loop finishes without a successful return, all proxies have failed.
    throw lastError || new Error("Het is niet gelukt om de website te analyseren. **Oplossing:** De website is mogelijk offline of blokkeert onze scanners.");
}


/**
 * Scrapes a website URL to extract its main text content and image URLs.
 * This version includes a fallback to meta tags for pages with little body content (like SPAs).
 * @param url The URL of the website to scrape.
 * @returns A promise that resolves to an object containing the extracted text and image URLs.
 */
export async function scrapeAndParseUrl(url:string): Promise<{ textForAI: string, images: string[] }> {
    const html = await fetchWithProxy(url);
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove irrelevant elements to clean up the text content
    doc.querySelectorAll('script, style, noscript, svg, header, footer, nav, aside, form, [role="navigation"], [role="banner"], [role="contentinfo"], [aria-hidden="true"]').forEach(el => el.remove());

    // Extract all image sources and convert them to absolute URLs
    const images: string[] = Array.from(doc.querySelectorAll('img'))
        .map(img => img.getAttribute('src'))
        .filter((src): src is string => !!src)
        .map(src => {
            try {
                // Resolve relative URLs to absolute ones
                return new URL(src, url).href;
            } catch (e) {
                // Ignore invalid image URLs
                return null;
            }
        })
        .filter((src): src is string => !!src);

    // Attempt to find the main content area of the page for better text extraction
    const mainContent = doc.querySelector('article, main, [role="main"], #main-content, #main, .main, #content, .content');
    const textElement = mainContent || doc.body;
    
    // Extract text content from the body
    const bodyText = textElement.textContent || '';
    
    // Extract content from important meta tags as a supplementary source.
    // This is crucial for SPAs where the initial HTML body might be sparse.
    const pageTitle = doc.querySelector('title')?.textContent;
    const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content');
    
    // Open Graph Tags
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
    const ogDescription = doc.querySelector('meta[property="og:description"]')?.getAttribute('content');

    // Twitter Card Tags
    const twitterTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
    const twitterDescription = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content');
    
    // Prioritize specific tags (Open Graph, Twitter) over generic ones for higher quality context.
    const bestTitle = ogTitle || twitterTitle || pageTitle;
    const bestDescription = ogDescription || twitterDescription || metaDescription;

    const metaContent = [bestTitle, bestDescription]
        .filter(Boolean) // Remove any null/undefined entries
        .join(' - ');

    // Combine meta content and body text for a comprehensive input to the AI.
    let text = `${metaContent}\n\n${bodyText}`;
    
    // Clean up the combined text
    text = text
        .replace(/\s\s+/g, ' ') // Collapse multiple whitespace characters
        .replace(/\n\s*\n/g, '\n') // Collapse multiple newlines
        .trim();

    // Truncate the text to a reasonable length for the AI prompt
    const MAX_TEXT_LENGTH = 15000;
    if (text.length > MAX_TEXT_LENGTH) {
        text = text.substring(0, MAX_TEXT_LENGTH) + '... [Content Truncated]';
    }
    
    // Check if we actually got content
    if (text.length < 50) {
        throw new Error("Er is niet genoeg tekst gevonden op deze pagina om te analyseren. **Oplossing:** Probeer een pagina met meer geschreven content, zoals een artikel of blogpost.");
    }
    
    // Also limit the number of images returned
    const MAX_IMAGES = 20;

    return { textForAI: text, images: images.slice(0, MAX_IMAGES) };
}
