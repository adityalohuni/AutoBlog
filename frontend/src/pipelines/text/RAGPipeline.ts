import axios from 'axios';

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

  async retrieveContext(query: string): Promise<string> {
    const [pmc, wiki] = await Promise.all([
      this.searchEuropePMC(query),
      this.searchWikipedia(query)
    ]);
    return [...pmc, ...wiki].join('\n\n');
  }
}
