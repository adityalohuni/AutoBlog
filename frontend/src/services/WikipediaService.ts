
export const getRandomWikipediaTitle = async (): Promise<string> => {
  try {
    const response = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
    if (!response.ok) {
      throw new Error('Failed to fetch random wikipedia page');
    }
    const data = await response.json();
    return data.title;
  } catch (error) {
    console.error('Error fetching random wikipedia title:', error);
    return 'Random Topic'; // Fallback
  }
};
