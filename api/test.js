export default function handler(req, res) {
    res.status(200).json({ 
        message: "API is working!",
        timestamp: new Date().toISOString(),
        environment: {
            hasXToken: !!process.env.X_BEARER_TOKEN,
            hasXAIToken: !!process.env.XAI_API_KEY,
            tokenLengths: {
                x: process.env.X_BEARER_TOKEN ? process.env.X_BEARER_TOKEN.length : 0,
                xai: process.env.XAI_API_KEY ? process.env.XAI_API_KEY.length : 0
            }
        },
        headers: req.headers,
        method: req.method
    });
}
