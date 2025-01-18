import { defineChain } from "viem";

// Define the Fuse Network using viem's defineChain
export const fuseChain = defineChain({
    id: 122,  // Fuse Mainnet Chain ID
    name: "Fuse",
    network: "fuse",
    nativeCurrency: {
        name: "Fuse Token",
        symbol: "FUSE",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://rpc.fuse.io"],
        },
        public: {
            http: ["https://rpc.fuse.io"],
        },
    },
    blockExplorers: {
        default: {
            name: "Fuse Explorer",
            url: "https://explorer.fuse.io",
        },
    },
    testnet: false,
});

// Exporting for use across the plugin
export const SUPPORTED_CHAINS = [fuseChain];
