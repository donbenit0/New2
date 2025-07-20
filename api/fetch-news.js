// api/fetch-news.js
import fetch from 'node-fetch';

// Mock data for development/testing (replace with real API calls)
const mockHeadlines = [
    {
        id: '1',
        text: "Scientists successfully teleport quantum information between two chips for the first time",
        username: "ScienceDaily",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        likes: 2453,
        retweets: 892,
        preview_image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80",
        article_url: "https://example.com/quantum-teleportation"
    },
    {
        id: '2',
        text: "AI system discovers new antibiotics by analyzing molecular structures in virtual reality",
        username: "TechNews",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        likes: 1876,
        retweets: 543,
        preview_image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80",
        article_url: "https://example.com/ai-antibiotics"
    },
    {
        id: '3',
        text: "First human brain organoid successfully interfaces with computer, plays Pong",
        username: "FutureHealth",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        likes: 3241,
        retweets: 1203,
        preview_image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80",
        article_url: "https://example.com/brain-computer"
    },
    {
        id: '4',
        text: "Researchers create living robots that can reproduce and evolve on their own",
        username: "BioTechWeekly",
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        likes: 4102,
        retweets: 1567,
        preview_image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&q=80",
        article_url: "https://example.com/xenobots"
    },
    {
        id: '5',
        text: "Time crystal battery prototype stores energy in fourth dimension, never loses charge",
        username: "PhysicsToday",
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        likes: 5623,
        retweets: 2341,
        preview_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=80",
        article_url: "https://example.com/time-crystal"
    }
];

// Mock book matches (would come from Grok API)
const bookMatches = {
    '1': {
        title: "The Stars My Destination",
        author: "Alfred Bester",
        summary: "A tale of revenge and transformation featuring jaunting - the ability to teleport instantly across vast distances. The protagonist discovers the power of human potential when pushed to extremes.",
        quote: "Gully Foyle is my name, and Terra is my nation. Deep space is my dwelling place, and death's my destination."
    },
    '2': {
        title: "Do Androids Dream of Electric Sheep?",
        author: "Philip K. Dick",
        summary: "In a post-apocalyptic world, bounty hunter Rick Deckard hunts down rogue androids while questioning what defines humanity and consciousness in an age of artificial beings.",
        quote: "The electric things have their life too. Paltry as those lives are."
    },
    '3': {
        title: "Neuromancer",
        author: "William Gibson",
        summary: "A burned-out computer hacker is hired for one last job: to hack an artificial intelligence. Gibson's vision of cyberspace and neural interfaces pioneered the cyberpunk genre.",
        quote: "The matrix has its roots in primitive arcade games... in early graphics programs and military experimentation with cranial jacks."
    },
    '4': {
        title: "Frankenstein",
        author: "Mary Shelley",
        summary: "Victor Frankenstein's creation of life from dead tissue explores the dangers of unchecked scientific ambition and the responsibilities we have toward our creations.",
        quote: "Life and death appeared to me ideal bounds, which I should first break through, and pour a torrent of light into our dark world."
    },
    '5': {
        title: "The Time Machine",
        author: "H.G. Wells",
        summary: "An inventor creates a machine capable of traveling through time, discovering the far future of humanity and the entropy that awaits all things.",
        quote: "There is no difference between Time and any of the three dimensions of Space except that our consciousness moves along it."
    }
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // In production, you would:
        // 1. Fetch real headlines from X API
        // 2. Send each headline to xAI Grok API for book matching
        // 3. Cache results to avoid rate limits

        // For now, using mock data
        const matches = mockHeadlines.map(headline => ({
            headline: headline.text,
            username: headline.username,
            timestamp: headline.timestamp,
            likes: headline.likes,
            retweets: headline.retweets,
            preview_image: headline.preview_image,
            article_url: headline.article_url,
            book: bookMatches[headline.id] || {
                title: "Unknown Book",
                author: "Unknown Author",
                summary: "No match found for this headline.",
                quote: null
            }
        }));

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));

        res.status(200).json({ matches });

    } catch (error) {
        console.error('Error in fetch-news API:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
}

/* 
PRODUCTION IMPLEMENTATION NOTES:

To implement with real APIs, you'll need:

1. X (Twitter) API v2 Access:
   - Apply for developer account at developer.twitter.com
   - Get API keys and bearer token
   - Use the search tweets endpoint with query like:
     "science OR technology OR future -is:retweet lang:en"
   - Filter for tweets that sound futuristic

2. xAI Grok API Access:
   - Sign up at x.ai for API access
   - Get API key
   - Use their completion endpoint with prompt engineering

Example implementation:

```javascript
// Fetch from X API
async function fetchXHeadlines() {
    const response = await fetch('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
            'Authorization': `Bearer ${process.env.X_BEARER_TOKEN}`
        },
        params: {
            query: 'science technology future -is:retweet lang:en',
            max_results: 10,
            'tweet.fields': 'created_at,public_metrics,entities',
            'expansions': 'author_id',
            'user.fields': 'username'
        }
    });
    return response.json();
}

// Get book match from Grok
async function getGrokMatch(headline) {
    const response = await fetch('https://api.x.ai/v1/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'grok-1',
            prompt: `Analyze this headline: "${headline}". 
                     Does it sound like science fiction? If yes, suggest:
                     1. A matching science fiction book
                     2. The author
                     3. A 2-4 sentence summary focusing on themes that echo the headline
                     4. A relevant quote from the book
                     Return as JSON.`,
            max_tokens: 500,
            temperature: 0.7
        })
    });
    return response.json();
}
```
*/
