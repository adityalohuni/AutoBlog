import axios from 'axios';
import { AIService } from '../../services/AIService';

export class RAGPipeline {
  async searchEuropePMC(query: string): Promise<string[]> {
    try {
      console.log(`Searching Europe PMC for: ${query}`);
      const response = await axios.get(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(query)}&format=json&pageSize=2`);
      const data = response.data;
      
      if (!data.resultList || !data.resultList.result) return [];

      return data.resultList.result
        .filter((r: any) => r.abstractText)
        .map((r: any) => r.abstractText);
    } catch (error: any) {
      console.error('Europe PMC Search Error:', error.message);
      return [];
    }
  }

  async searchWikipedia(query: string): Promise<string[]> {
    try {
      console.log(`Searching Wikipedia for: ${query}`);
      const response = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=2&srsearch=${encodeURIComponent(query)}`);
      const data = response.data;
      
      if (!data.query || !data.query.search) return [];

      return data.query.search.map((r: any) => r.snippet.replace(/<[^>]*>?/gm, ''));
    } catch (error: any) {
      console.error('Wikipedia Search Error:', error.message);
      return [];
    }
  }

  async retrieveContext(query: string): Promise<string[]> {
    const [pmc, wiki] = await Promise.all([
      this.searchEuropePMC(query),
      this.searchWikipedia(query)
    ]);
    
    const rawCandidates = [...pmc, ...wiki];
    if (rawCandidates.length === 0) return [];

    // Chunk the candidates
    const candidates: string[] = [];
    for (const text of rawCandidates) {
      // Chunk into smaller segments (400 chars) for better embedding matching
      candidates.push(...this.chunkText(text, 400));
    }

    try {
      const aiService = AIService.getInstance();
      const queryEmbedding = await aiService.generateEmbedding(query);

      const scoredResults = await Promise.all(candidates.map(async (text) => {
        const embedding = await aiService.generateEmbedding(text);
        const score = this.cosineSimilarity(queryEmbedding, embedding);
        return { text, score };
      }));

      // Sort by similarity score descending
      scoredResults.sort((a, b) => b.score - a.score);

      console.log('RAG Re-ranking scores:', scoredResults.map(r => r.score));

      // Return top chunks (e.g., top 5 or all sorted)
      return scoredResults.map(r => r.text);
    } catch (error) {
      console.error('RAG Embedding Error:', error);
      return candidates;
    }
  }

  async processRAG(query: string, model: string, contextLimit: number = 2000): Promise<string> {
    const chunks = await this.retrieveContext(query);
    
    if (chunks.length === 0) return 'No relevant information found.';

    const totalLength = chunks.reduce((sum, str) => sum + str.length, 0);
    const aiService = AIService.getInstance();

    if (totalLength <= contextLimit) {
      console.log('RAG: Context fits in limit, processing all at once.');
      const context = chunks.join('\n\n');
      const prompt = `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`;
      return aiService.generateAiText(prompt, model, 500);
    } else {
      console.log('RAG: Context too large, processing chunks separately.');
      // Process separately
      const responses = await Promise.all(chunks.map(async (chunk) => {
        const prompt = `Context:\n${chunk}\n\nQuestion: ${query}\n\nAnswer based on context:`;
        return aiService.generateAiText(prompt, model, 200);
      }));
      
      return responses.join('\n\n');
    }
  }

  private chunkText(text: string, maxLength: number = 400): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    
    // Simple sentence splitting
    const sentences = text.match(/[^.!?]+[.!?]+|\s*$/g) || [text];
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence;
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    
    return chunks.filter(c => c.length > 0);
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
