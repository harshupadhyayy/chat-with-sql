import axios from "axios"


export const BASE_URL = 'http://localhost:8000'

export const getHomePage = async () => {
    const url = BASE_URL + '/'
    const response = await axios.get(url)
    
    return response.data
}

export const postQuestion = async (questionData: string) => {
    const url = BASE_URL + "/ask"
    const requestPayload = {
        "question": questionData
    }
    
    const response = await axios.post(url, requestPayload)

    return response.data
}


export const postQuestionFunction = async (questionData: string, setState: React.Dispatch<React.SetStateAction<string>>) => {
    const url = BASE_URL + "/ask";
    const requestPayload = {
        "question": questionData
    };
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            console.error("Failed to fetch data");
            return;
        }

        if (!response.body) {
            console.error("Response body is null or undefined");
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, {stream: true});
            setState(prev => prev + text)
        }
    } catch (error) {
        console.error("Error:", error);
    }
};