
import { toast } from "@/hooks/use-toast";

// Types for our agents
export interface DivisionResult {
  subtopics: string[];
}

export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface SubtopicQuestions {
  subtopic: string;
  questions: Question[];
}

export interface RefinedQuestions {
  subtopic: string;
  questions: Question[];
  feedback: string;
}

// Main service to interact with Llama API via OpenRouter
class LlamaService {
  private apiKey: string | null = null;
  private modelId = "meta-llama/llama-4-maverick:free";
  private baseUrl = "https://openrouter.ai/api/v1/chat/completions";

  setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('llamaApiKey', key);
  }

  getApiKey(): string | null {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('llamaApiKey');
    }
    return this.apiKey;
  }

  // Changed from private to public to allow access from SubtopicList
  async callLlamaAPI(prompt: string): Promise<any> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error("API key not set");
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "MedQuest Alchemy"
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500 // Increased from 1024 to 1500 to ensure complete responses
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to call API");
      }

      const result = await response.json();
      
      // Check if result has expected structure before accessing properties
      if (!result || !result.choices || !result.choices[0] || !result.choices[0].message) {
        console.error("Unexpected API response structure:", result);
        throw new Error("Received invalid response format from API");
      }
      
      return result.choices[0].message.content;
    } catch (error) {
      console.error("API call failed:", error);
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Failed to call Llama API",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Enhanced parsing logic for more reliable JSON extraction
  private extractJSON(text: string): any {
    try {
      // Try parsing directly first
      return JSON.parse(text);
    } catch (e) {
      // Look for JSON in markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1].trim());
        } catch (e) {
          // If that fails, try to find any JSON-like structure
          const possibleJSON = text.match(/{[\s\S]*}/);
          if (possibleJSON) {
            try {
              return JSON.parse(possibleJSON[0]);
            } catch (e) {
              throw new Error("Could not parse JSON from response");
            }
          }
        }
      }
      throw new Error("Could not extract JSON from API response");
    }
  }

  // Create a method for generating fallback content for subtopics
  createFallbackSubtopicContent(subtopic: string): SubtopicQuestions {
    return {
      subtopic: subtopic,
      questions: [
        {
          question: `What is a key concept in ${subtopic}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A",
          explanation: "This is a fallback question generated due to an API response issue."
        },
        {
          question: `Which of the following is associated with ${subtopic}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option B",
          explanation: "This is a fallback question generated due to an API response issue."
        }
      ]
    };
  }

  // AGENT 1: Topic Divider
  async divideTopicIntoSubtopics(topic: string): Promise<DivisionResult> {
    try {
      const prompt = `You are a medical education expert. Divide the following MBBS topic into 5-8 logical subtopics for creating MCQs:
      
Topic: ${topic}

Format your response as a valid JSON object with only a "subtopics" field containing an array of strings, each representing a subtopic. Make sure the subtopics are comprehensive and cover important aspects of the main topic that would be tested in medical exams.

Example format:
{
  "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4", "Subtopic 5"]
}`;

      const result = await this.callLlamaAPI(prompt);
      
      try {
        const parsedResult = this.extractJSON(result);
        
        // Validate format
        if (!parsedResult.subtopics || !Array.isArray(parsedResult.subtopics)) {
          throw new Error("Invalid response format");
        }
        
        return parsedResult;
      } catch (e) {
        console.error("Failed to parse subtopics:", e, "Raw result:", result);
        // Provide fallback subtopics based on the topic
        return {
          subtopics: [
            `${topic} - Basic Concepts`,
            `${topic} - Clinical Applications`,
            `${topic} - Pathophysiology`,
            `${topic} - Diagnosis`,
            `${topic} - Treatment`
          ]
        };
      }
    } catch (error) {
      console.error("Topic division failed:", error);
      // Fallback subtopics if the API call fails completely
      return {
        subtopics: [
          `${topic} - Basic Concepts`,
          `${topic} - Clinical Applications`,
          `${topic} - Pathophysiology`,
          `${topic} - Diagnosis`,
          `${topic} - Treatment`
        ]
      };
    }
  }

  // AGENT 2: Question Generator
  async generateQuestionsForSubtopic(subtopic: string, count: number = 5): Promise<SubtopicQuestions> {
    try {
      const prompt = `You are a medical professor creating high-quality MCQs for MBBS students. Generate ${count} multiple-choice questions for the following subtopic:

Subtopic: ${subtopic}

Each question should:
1. Test important clinical concepts or facts
2. Have one clearly correct answer and 3 plausible distractors
3. Include a brief explanation of why the correct answer is right

Format your response STRICTLY as a valid JSON object with the following structure:
{
  "subtopic": "${subtopic}",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "The correct option text",
      "explanation": "Explanation of why this answer is correct"
    }
    // more questions...
  ]
}

Do not include any text outside of this JSON structure.`;

      const result = await this.callLlamaAPI(prompt);
      
      try {
        const parsedResult = this.extractJSON(result);
        
        // Validate format
        if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
          throw new Error("Invalid response format");
        }
        
        return parsedResult;
      } catch (e) {
        console.error("Failed to parse questions:", e, "Raw result:", result);
        return this.createFallbackSubtopicContent(subtopic);
      }
    } catch (error) {
      console.error("Question generation failed:", error);
      return this.createFallbackSubtopicContent(subtopic);
    }
  }

  // AGENT 3: Question Refiner
  async refineQuestions(subtopicQuestions: SubtopicQuestions): Promise<RefinedQuestions> {
    try {
      // Convert the subtopic questions to a string for the prompt
      const questionsStr = JSON.stringify(subtopicQuestions, null, 2);
      
      const prompt = `You are a medical education quality expert. Review and refine the following set of MBBS MCQs.
      
${questionsStr}

Your tasks:
1. Evaluate each question for clinical relevance, clarity, and educational value
2. Improve the language and formatting of questions where needed
3. Ensure explanations are accurate and educational

Return ONLY a valid JSON object in the following format:
{
  "subtopic": "The same subtopic",
  "questions": [
    {
      "question": "Refined question text",
      "options": ["Refined Option A", "Refined Option B", "Refined Option C", "Refined Option D"],
      "correctAnswer": "The correct option text",
      "explanation": "Refined explanation"
    }
    // more questions...
  ],
  "feedback": "Brief summary of your quality assessment and improvements made"
}

Do not include any text outside of this JSON structure.`;

      const result = await this.callLlamaAPI(prompt);
      
      try {
        const parsedResult = this.extractJSON(result);
        
        // Validate format
        if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
          throw new Error("Invalid response format");
        }
        
        return parsedResult;
      } catch (e) {
        console.error("Failed to parse refined questions:", e, "Raw result:", result);
        
        // Return the original questions with a feedback note
        return {
          ...subtopicQuestions,
          feedback: "Could not refine questions due to parsing error. Using original questions."
        };
      }
    } catch (error) {
      console.error("Question refinement failed:", error);
      
      // Return the original questions with a feedback note
      return {
        ...subtopicQuestions,
        feedback: "Could not refine questions due to API error. Using original questions."
      };
    }
  }
}

export const llamaService = new LlamaService();
