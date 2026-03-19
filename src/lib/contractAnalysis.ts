import { OpenAI } from 'openai';

function getOpenAIClient() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }

  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
}

async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;

  if (fileType === 'text/plain') {
    return await file.text();
  }

  if (fileType === 'application/pdf') {
    return 'PDF text extraction would require a PDF parsing library. For now, using file name and type for analysis.';
  }

  if (fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'Word document text extraction would require a DOCX parsing library. For now, using file name and type for analysis.';
  }

  throw new Error('Unsupported file type');
}

export async function analyzeContract(file: File) {
  try {
    console.log('Starting contract analysis for file:', file.name);

    const openai = getOpenAIClient();
    console.log('OpenAI client initialized');

    const extractedText = await extractTextFromFile(file);
    console.log('Text extracted, length:', extractedText.length);

    const systemPrompt = `You are a legal contract analyst specializing in music industry agreements. Analyze contracts and provide structured, actionable insights.

Your analysis should be:
- Specific to the actual content of the contract
- Based on music industry standards and best practices
- Focused on protecting the artist's interests
- Clear and actionable

IMPORTANT: Only provide analysis based on the actual contract content. Do not hallucinate or make up details that aren't in the contract. If you cannot extract text from the document, acknowledge this and provide general guidance.`;

    const userPrompt = `Please analyze this contract file: "${file.name}" (${file.size} bytes, type: ${file.type})

${extractedText.length > 100 ? `Contract text:\n${extractedText}` : 'Note: Unable to extract full text from this document type. Please provide a general analysis based on the file name and common contract types in the music industry.'}

Provide your analysis in the following JSON format:
{
  "title": "Brief descriptive title for this contract",
  "summary": "2-3 paragraph summary of the contract's purpose, main terms, and structure",
  "keyTerms": [
    "**Term 1**: Description",
    "**Term 2**: Description",
    "**Term 3**: Description"
  ],
  "risks": [
    "**Risk 1**: Specific concern and why it matters",
    "**Risk 2**: Specific concern and why it matters"
  ],
  "recommendations": [
    "**Recommendation 1**: Specific actionable advice",
    "**Recommendation 2**: Specific actionable advice"
  ]
}

Important guidelines:
- Each keyTerm should start with bold text (using **) for the term name, followed by a colon and description
- List at least 5-7 key terms from the actual contract
- Identify 3-5 specific risks based on the actual content
- Provide 4-6 actionable recommendations
- If you cannot read the actual contract text, acknowledge this and provide general guidance for this type of contract based on the filename
- Do not invent specific dollar amounts, dates, or party names unless they are in the actual contract`;

    console.log('Calling OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    console.log('Received response from OpenAI');

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('Parsing response...');
    const analysis = JSON.parse(content);
    console.log('Analysis complete:', analysis.title);

    return {
      title: analysis.title || 'Contract Analysis',
      summary: analysis.summary || 'Unable to generate summary',
      keyTerms: Array.isArray(analysis.keyTerms) ? analysis.keyTerms : [],
      risks: Array.isArray(analysis.risks) ? analysis.risks : [],
      recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : []
    };

  } catch (error) {
    console.error('Error analyzing contract:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
      }

      if (error.message.includes('401')) {
        throw new Error('Invalid OpenAI API key. Please check your VITE_OPENAI_API_KEY in .env file.');
      }

      throw error;
    }

    throw new Error('Failed to analyze contract. Please check the console for details.');
  }
}
