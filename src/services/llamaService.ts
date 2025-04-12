
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

  private async callLlamaAPI(prompt: string): Promise<any> {
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
          max_tokens: 1024
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

  // AGENT 1: Topic Divider
  async divideTopicIntoSubtopics(topic: string): Promise<DivisionResult> {
    try {
      const prompt = `You are a medical education expert. Divide the following MBBS topic into 5-8 logical subtopics for creating MCQs:
      
Topic: ${topic}

Format your response as a valid JSON object with only a "subtopics" field containing an array of strings, each representing a subtopic. Make sure the subtopics are comprehensive and cover important aspects of the main topic that would be tested in medical exams.`;

      const result = await this.callLlamaAPI(prompt);
      
      // Parse the result into our expected format
      let parsedResult: DivisionResult;
      
      try {
        if (typeof result === 'string') {
          // Extract JSON if surrounded by markdown code blocks or other text
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || 
                          result.match(/{[\s\S]*}/);
                          
          const jsonStr = jsonMatch ? jsonMatch[0] : result;
          parsedResult = JSON.parse(jsonStr.replace(/```json|```/g, '').trim());
        } else {
          parsedResult = result;
        }
        
        // Validate format
        if (!parsedResult.subtopics || !Array.isArray(parsedResult.subtopics)) {
          throw new Error("Invalid response format");
        }
        
        return parsedResult;
      } catch (e) {
        console.error("Failed to parse subtopics:", e, "Raw result:", result);
        throw new Error("Failed to parse the topic division response");
      }
    } catch (error) {
      console.error("Topic division failed:", error);
      throw error;
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

Format your response as a valid JSON object with the following structure:
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
}`;

      const result = await this.callLlamaAPI(prompt);
      
      // Parse the result into our expected format
      let parsedResult: SubtopicQuestions;
      
      try {
        if (typeof result === 'string') {
          // Extract JSON if surrounded by markdown code blocks or other text
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || 
                          result.match(/{[\s\S]*}/);
                          
          const jsonStr = jsonMatch ? jsonMatch[0] : result;
          parsedResult = JSON.parse(jsonStr.replace(/```json|```/g, '').trim());
        } else {
          parsedResult = result;
        }
        
        // Validate format
        if (!parsedResult.questions || !Array.isArray(parsedResult.questions)) {
          throw new Error("Invalid response format");
        }
        
        return parsedResult;
      } catch (e) {
        console.error("Failed to parse questions:", e, "Raw result:", result);
        
        // Fallback: Create a basic response with the subtopic
        return {
          subtopic: subtopic,
          questions: [
            {
              question: `What is an important aspect of ${subtopic}?`,
              options: ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: "Option A",
              explanation: "This is a placeholder explanation due to an error in processing the model's response."
            }
          ]
        };
      }
    } catch (error) {
      console.error("Question generation failed:", error);
      // Return fallback questions
      return {
        subtopic: subtopic,
        questions: [
          {
            question: `What is an important aspect of ${subtopic}?`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctAnswer: "Option A",
            explanation: "This is a placeholder question due to an API error."
          }
        ]
      };
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
2. Remove or fix any questions that are unclear, too easy, too difficult, or have incorrect information
3. Improve the language and formatting of questions where needed
4. Ensure explanations are accurate and educational

Return only the refined set of questions in the following JSON format:
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
}`;

      const result = await this.callLlamaAPI(prompt);
      
      // Parse the result into our expected format
      let parsedResult: RefinedQuestions;
      
      try {
        if (typeof result === 'string') {
          // Extract JSON if surrounded by markdown code blocks or other text
          const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || 
                          result.match(/{[\s\S]*}/);
                          
          const jsonStr = jsonMatch ? jsonMatch[0] : result;
          parsedResult = JSON.parse(jsonStr.replace(/```json|```/g, '').trim());
        } else {
          parsedResult = result;
        }
        
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
