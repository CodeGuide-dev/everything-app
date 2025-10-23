export interface SearchResult {
    title: string;
    url: string;
    content: string;
    engine: string;
    score?: number;
}

export interface SearXNGResponse {
    query: string;
    number_of_results: number;
    results: SearchResult[];
    suggestions?: string[];
    infoboxes?: unknown[];
}

export class SearXNGError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public originalError?: unknown
    ) {
        super(message);
        this.name = "SearXNGError";
    }
}

export interface SearchOptions {
    language?: string;
    categories?: string;
    engines?: string;
    pageno?: number;
    format?: "json" | "html";
}

export class SearXNGService {
    private baseUrl: string;

    constructor(baseUrl?: string) {
        this.baseUrl = baseUrl || process.env.SEARXNG_URL || "http://localhost:8080";
    }

    async search(
        query: string,
        options: SearchOptions = {}
    ): Promise<SearXNGResponse> {
        try {
            const params = new URLSearchParams({
                q: query,
                format: options.format || "json",
            });

            if (options.language) {
                params.append("language", options.language);
            }
            if (options.categories) {
                params.append("categories", options.categories);
            }
            if (options.engines) {
                params.append("engines", options.engines);
            }
            if (options.pageno) {
                params.append("pageno", options.pageno.toString());
            }

            const url = `${this.baseUrl}/search?${params.toString()}`;

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                },
            });

            if (!response.ok) {
                throw new SearXNGError(
                    `SearXNG request failed: ${response.statusText}`,
                    response.status
                );
            }

            const data = await response.json();

            if (!data.results || !Array.isArray(data.results)) {
                throw new SearXNGError("Invalid response format from SearXNG");
            }

            return data as SearXNGResponse;
        } catch (error) {
            if (error instanceof SearXNGError) {
                throw error;
            }

            if (error instanceof Error) {
                throw new SearXNGError(
                    `Failed to perform search: ${error.message}`,
                    undefined,
                    error
                );
            }

            throw new SearXNGError(
                "Unknown error occurred during search",
                undefined,
                error
            );
        }
    }

    async searchMultiple(queries: string[]): Promise<Map<string, SearXNGResponse>> {
        const results = new Map<string, SearXNGResponse>();

        try {
            const searches = await Promise.allSettled(
                queries.map(q => this.search(q))
            );

            searches.forEach((result, index) => {
                if (result.status === "fulfilled") {
                    results.set(queries[index], result.value);
                } else {
                    console.error(`Search failed for query "${queries[index]}":`, result.reason);
                }
            });

            return results;
        } catch (error) {
            throw new SearXNGError(
                "Failed to perform multiple searches",
                undefined,
                error
            );
        }
    }

    extractSnippets(searchResponse: SearXNGResponse, maxResults: number = 5): string {
        return searchResponse.results
            .slice(0, maxResults)
            .map((result, index) => {
                return `[${index + 1}] ${result.title}\n${result.content}\nSource: ${result.url}\n`;
            })
            .join("\n");
    }

    formatSearchContext(queries: Map<string, SearXNGResponse>): string {
        let context = "# Search Results\n\n";

        queries.forEach((response, query) => {
            context += `## Query: "${query}"\n`;
            context += `Found ${response.number_of_results} results\n\n`;
            context += this.extractSnippets(response, 3);
            context += "\n---\n\n";
        });

        return context;
    }
}

export const searxngService = new SearXNGService();
