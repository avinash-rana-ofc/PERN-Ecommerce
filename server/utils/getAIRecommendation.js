export async function getAIRecommendation(req, res, userPrompt, products){
    const API_KEY = process.env.GEMINI_API_KEY
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    try {
        const geminiPrompt = `
        Here is a list of available products: 
        ${JSON.stringify(products, null, 2)} 
        
        Based on the following user request, filter and suggest the best matching products:
        "${userPrompt}" 
        
        Only return the matching products in JSON format.
        `;

        const response = await fetch(URL, {
            method : "POST",
            headers : {"Content-Type":"application/json"},
            body : JSON.stringify({
                contents : [{parts : {}}]
            })
        })
    } catch (error) {
        
    }
}