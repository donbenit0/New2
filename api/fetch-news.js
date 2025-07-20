// api/fetch-news.js
import fetch from 'node-fetch';

// Cache to avoid hitting rate limits
let cache = {
    data: null,
    timestamp: null,
    ttl: 600000 // 10 minutes
};

function isCacheValid() {
    return cache.data && cache.timestamp && (Date.now() - cache.timestamp < cache.ttl);
}

// Fetch sci-fi-like headlines from X
async function fetchXHeadlines() {
    const bearerToken = process.env.X_BEARER_TOKEN;
    
    if (!bearerToken) {
        throw new Error('X API Bearer Token not configured');
    }

    // Search query based on AGI thesis - finding news that sounds like SF
    const searchQuery = 'AGI OR "artificial intelligence" OR singularity OR superintelligence OR "AI breakthrough" OR "quantum computer" OR "brain interface" -is:retweet -is:reply lang:en';

    const params = new URLSearchParams({
        'query': searchQuery,
        'max_results': '10',
        'tweet.fields': 'created_at,public_metrics,author_id'
    });

    const response = await fetch(
        `https://api.x.com/2/tweets/search/recent?${params}`,
        {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${bearerToken}`
            }
        }
    );

    if (!response.ok) {
        const error = await response.text();
        console.error('Twitter API Error:', error);
        throw new Error(`X API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
        throw new Error('No tweets found');
    }

    // Process tweets
    const tweets = data.data || [];
    const users = data.includes?.users || [];
    
    // Filter and format the most sci-fi sounding headlines
    const headlines = tweets
        .map(tweet => {
            const author = users.find(u => u.id === tweet.author_id);
            return {
                id: tweet.id,
                text: tweet.text.replace(/https:\/\/t\.co\/\w+/g, '').trim(),
                username: author?.username || 'unknown',
                timestamp: tweet.created_at,
                likes: tweet.public_metrics?.like_count || 0,
                retweets: tweet.public_metrics?.retweet_count || 0
            };
        })
        .filter(tweet => {
            // Filter for headlines that really sound like SF tropes
            const text = tweet.text.toLowerCase();
            
            // Skip purely technical posts without SF vibe
            if (text.includes('tutorial') || 
                text.includes('course') || 
                text.includes('workshop') ||
                text.includes('conference') ||
                text.includes('webinar')) {
                return false;
            }
            
            // Look for SF trope indicators
            const sfTropes = [
                'surpass', 'exceed', 'outperform', 'replace',
                'singularity', 'exponential', 'accelerat',
                'dystop', 'apocalyp', 'extinct', 'doom', 'threat', 'danger',
                'utopi', 'post-scarcity', 'abundance', 'paradise',
                'obsolete', 'unemploy', 'useless', 'redundant',
                'conscious', 'sentien', 'aware', 'alive', 'feel',
                'breakthrough', 'revolution', 'transform', 'first time',
                'immortal', 'eternal', 'upload', 'transcend'
            ];
            
            return sfTropes.some(trope => text.includes(trope));
        })
        .slice(0, 8);

    return headlines;
}

// Get book match from Grok
async function getGrokMatch(headline) {
    const apiKey = process.env.XAI_API_KEY;
    
    if (!apiKey) {
        throw new Error('xAI API Key not configured');
    }

    const prompt = `Analyze this real news headline that sounds like science fiction. Match it with the MOST RELEVANT classic SF book/story that explored this exact theme.

Headline: "${headline}"

This headline evokes classic SF tropes. Consider these categories:
- AI surpassing humans (HAL 9000, Skynet)
- Singularity/acceleration (Vinge, Kurzweil)
- Dystopian AI takeover (Terminator, Matrix)
- Utopian post-scarcity (Culture series, Star Trek)
- Human obsolescence (Player Piano, Brave New World)
- Consciousness/sentience (Do Androids Dream, Ex Machina)
- Simulated reality (Matrix, Simulacron-3)
- Immortality via tech (Altered Carbon, Download)

Match with the MOST THEMATICALLY RELEVANT book. The connection should be obvious.

Respond with ONLY a JSON object (no markdown):
{
    "title": "Book/Story Title",
    "author": "Author Name",
    "year": 1984,
    "summary": "2-3 sentences explaining how this book's core theme directly relates to the headline",
    "quote": "A thematically relevant quote from the book",
    "sf_trope": "The specific SF trope (e.g., 'AI Rebellion', 'Singularity', 'Post-Scarcity')"
}

Focus on classics by: Asimov, Clarke, Dick, Gibson, Le Guin, Herbert, Bradbury, Wells, Vinge, Stephenson, Banks, Huxley, Orwell, Vonnegut`;

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'grok-beta',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert in science fiction literature, especially works dealing with AGI, singularity, and technological transformation. Always respond with valid JSON only.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 400
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Grok API Error:', error);
            throw new Error(`xAI API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse JSON response
        const bookMatch = JSON.parse(content);
        
        return {
            title: bookMatch.title,
            author: bookMatch.author,
            summary: bookMatch.summary,
            quote: bookMatch.quote || null,
            connection: `SF Trope: ${bookMatch.sf_trope || 'Technological Transformation'}`
        };
        
    } catch (error) {
        console.error('Error with Grok match:', error);
        // Fallback book match
        return {
            title: "Neuromancer",
            author: "William Gibson",
            summary: "A groundbreaking cyberpunk novel about hackers and AI in cyberspace. Gibson's vision of the digital future has proven remarkably prescient.",
            quote: "The sky above the port was the color of television, tuned to a dead channel.",
            connection: "This headline represents the kind of technological breakthrough Gibson envisioned."
        };
    }
}

// Add some demo preview images based on keywords
function getPreviewImage(headline) {
    const text = headline.toLowerCase();
    if (text.includes('quantum')) return 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80';
    if (text.includes('ai') || text.includes('artificial')) return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&q=80';
    if (text.includes('brain') || text.includes('neural')) return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80';
    if (text.includes('robot')) return 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80';
    if (text.includes('gene') || text.includes('dna')) return 'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=600&q=80';
    if (text.includes('space') || text.includes('mars')) return 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&q=80';
    return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&q=80';
}

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Check cache first
        if (isCacheValid()) {
            console.log('Returning cached data');
            return res.status(200).json(cache.data);
        }

        console.log('Fetching fresh data...');
        
        // Fetch headlines from X
        const headlines = await fetchXHeadlines();
        
        if (!headlines || headlines.length === 0) {
            throw new Error('No suitable headlines found');
        }

        console.log(`Found ${headlines.length} sci-fi-like headlines`);

        // Get book matches for each headline
        const matches = await Promise.all(
            headlines.map(async (headline) => {
                try {
                    const book = await getGrokMatch(headline.text);
                    
                    return {
                        headline: headline.text,
                        username: headline.username,
                        timestamp: headline.timestamp,
                        likes: headline.likes,
                        retweets: headline.retweets,
                        preview_image: getPreviewImage(headline.text),
                        book: book
                    };
                } catch (error) {
                    console.error('Error processing headline:', error);
                    return null;
                }
            })
        );

        // Filter out any failed matches
        const validMatches = matches.filter(m => m !== null);

        if (validMatches.length === 0) {
            throw new Error('No valid matches generated');
        }

        // Update cache
        const responseData = { 
            matches: validMatches,
            generated_at: new Date().toISOString(),
            count: validMatches.length
        };
        
        cache = {
            data: responseData,
            timestamp: Date.now()
        };

        console.log(`Returning ${validMatches.length} matches`);
        res.status(200).json(responseData);

    } catch (error) {
        console.error('API Error:', error.message);
        
        // Return error with helpful message
        res.status(500).json({ 
            error: 'Unable to fetch headlines',
            message: error.message,
            hint: 'Make sure you have Basic or Pro tier X API access'
        });
    }
}
