import WebSocket from "ws";
import axios from "axios";

// Define base URLs
const BASE_URL = "https://api.pumpmore.fun/v1";
const WEBSOCKET_URL = "wss://api.pumpmore.fun/ws";

// Define types for the PMFSniper action
interface TokenMetadata {
    name: string;
    symbol: string;
    description: string;
    priceNative: string;
    marketCap: string;
    liquidity: string;
    createdAt: string;
}

interface TradeData {
    trader: string;
    tokenAmount: number;
    price: number;
    timestamp: string;
}

interface PMFSniperConfig {
    apiKey?: string; // Optional API key for authenticated requests
}

// PMFSniper class definition
export class PMFSniper {
    private apiKey: string | undefined;
    private websocket: WebSocket | null = null;

    constructor(config: PMFSniperConfig) {
        this.apiKey = config.apiKey;
    }

    private getHeaders() {
        return this.apiKey ? { "X-API-Key": this.apiKey } : {};
    }

    // Retrieve data for a specific token
    async getTokenData(chainId: string, tokenAddress: string): Promise<TokenMetadata | null> {
        try {
            const response = await axios.get(`${BASE_URL}/tokens/${chainId}/address/${tokenAddress}`, {
                headers: this.getHeaders(),
            });
            return response.data;
        } catch (error: any) {
            console.error("Error fetching token data:", error.message);
            return null;
        }
    }

    // Retrieve tokens by view (e.g., new, trending)
    async getTokensByView(chainId: string, viewId: string, page = 1, pageSize = 10): Promise<any[]> {
        try {
            const response = await axios.get(
                `${BASE_URL}/tokens/${chainId}/${viewId}?page=${page}&pageSize=${pageSize}`,
                { headers: this.getHeaders() }
            );
            return response.data;
        } catch (error: any) {
            console.error("Error fetching tokens by view:", error.message);
            return [];
        }
    }

    // Retrieve the latest trades for a specific token or globally
    async getLatestTrades(chainId: string, tokenAddress?: string, page = 1, pageSize = 50): Promise<TradeData[]> {
        try {
            const endpoint = tokenAddress
                ? `${BASE_URL}/trades/${chainId}/${tokenAddress}`
                : `${BASE_URL}/trades/${chainId}`;
            const response = await axios.get(`${endpoint}?page=${page}&pageSize=${pageSize}`, {
                headers: this.getHeaders(),
            });
            return response.data;
        } catch (error: any) {
            console.error("Error fetching latest trades:", error.message);
            return [];
        }
    }

    // Subscribe to updates for a specific token
    subscribeToTokenUpdates(chainId: string, tokenAddress: string, onUpdate: (data: any) => void): void {
        if (!this.websocket) {
            this.websocket = new WebSocket(WEBSOCKET_URL);

            this.websocket.on("open", () => {
                console.log("WebSocket connected.");
                if (this.apiKey) {
                    this.websocket?.send(JSON.stringify({ type: "auth", apiKey: this.apiKey }));
                }
                this.websocket?.send(JSON.stringify({ type: "subscribe", chainId, tokenAddress }));
            });

            this.websocket.on("message", (data) => {
                const message = JSON.parse(data.toString());
                if (message.type === "update") {
                    console.log("Token update received:", message);
                    onUpdate(message);
                }
            });

            this.websocket.on("close", () => {
                console.log("WebSocket disconnected.");
                this.websocket = null;
            });

            this.websocket.on("error", (error) => {
                console.error("WebSocket error:", error.message);
            });
        }
    }

    // Unsubscribe from updates for a specific token
    unsubscribeFromTokenUpdates(chainId: string, tokenAddress: string): void {
        if (this.websocket) {
            this.websocket.send(
                JSON.stringify({ type: "unsubscribe", chainId, tokenAddress })
            );
            console.log(`Unsubscribed from updates for token: ${tokenAddress}`);
        }
    }

    // Close WebSocket connection
    closeWebSocket(): void {
        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
            console.log("WebSocket connection closed.");
        }
    }
}

// Example usage of PMFSniper
(async () => {
    const sniper = new PMFSniper({ apiKey: "your-api-key" }); // Replace with your API key

    // Fetch token data
    const tokenData = await sniper.getTokenData("10243", "0x1234567890abcdef1234567890abcdef12345678");
    console.log("Token Data:", tokenData);

    // Fetch tokens by view (e.g., "new", "trending")
    const newTokens = await sniper.getTokensByView("10243", "new");
    console.log("New Tokens:", newTokens);

    // Fetch the latest trades
    const trades = await sniper.getLatestTrades("10243");
    console.log("Latest Trades:", trades);

    // Subscribe to updates for a specific token
    sniper.subscribeToTokenUpdates("10243", "0x1234567890abcdef1234567890abcdef12345678", (update) => {
        console.log("Real-time update:", update);
    });

    // Unsubscribe after 10 seconds
    setTimeout(() => {
        sniper.unsubscribeFromTokenUpdates("10243", "0x1234567890abcdef1234567890abcdef12345678");
        sniper.closeWebSocket();
    }, 10000);
})();
