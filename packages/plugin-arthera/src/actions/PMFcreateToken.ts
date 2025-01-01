import { ethers } from "ethers";

// Define metadata structure for token creation
interface TokenMetadata {
    name: string;
    symbol: string;
    description: string;
    image: string;
    twitter: string;
    telegram: string;
    youtube: string;
    website: string;
}

// Parameters required for the PMFcreateToken action
interface CreateTokenParams {
    privateKey: string; // Wallet private key
    metadata: TokenMetadata; // Token metadata
    contractAddress: string; // PumpMoreFunMain contract address
    rpcUrl: string; // RPC URL of the Arthera network
}

export async function PMFcreateToken({
    privateKey,
    metadata,
    contractAddress,
    rpcUrl,
}: CreateTokenParams): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    // Connect to the Arthera Mainnet RPC
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);

    // Initialize the wallet
    const wallet = new ethers.Wallet(privateKey, provider);

    // Define PumpMoreFunMain contract ABI
    const PumpMoreFunMainABI = [
        {
            inputs: [
                { internalType: "string", name: "name", type: "string" },
                { internalType: "string", name: "symbol", type: "string" },
                { internalType: "string", name: "description", type: "string" },
                { internalType: "string", name: "image", type: "string" },
                { internalType: "string", name: "twitter", type: "string" },
                { internalType: "string", name: "telegram", type: "string" },
                { internalType: "string", name: "youtube", type: "string" },
                { internalType: "string", name: "website", type: "string" },
            ],
            name: "createLaunch",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function",
        },
    ];

    // Create an instance of the PumpMoreFunMain contract
    const contract = new ethers.Contract(contractAddress, PumpMoreFunMainABI, wallet);

    try {
        console.log("Initiating token creation with metadata:", metadata);

        // Call the `createLaunch` function
        const tx = await contract.createLaunch(
            metadata.name,
            metadata.symbol,
            metadata.description,
            metadata.image,
            metadata.twitter,
            metadata.telegram,
            metadata.youtube,
            metadata.website,
            { gasLimit: 300000 } // Adjust gas limit if necessary
        );

        console.log("Transaction sent. Waiting for confirmation...");

        // Wait for the transaction to be mined
        const receipt = await tx.wait();

        console.log("Token successfully created!");
        console.log("Transaction Hash:", receipt.transactionHash);

        return {
            success: true,
            transactionHash: receipt.transactionHash,
        };
    } catch (error: any) {
        console.error("Error during token creation:", error);
        return {
            success: false,
            error: error.message,
        };
    }
}

// Example Usage
(async () => {
    const tokenMetadata: TokenMetadata = {
        name: "MyToken",
        symbol: "MTK",
        description: "A token created using PMFcreateToken.",
        image: "https://example.com/image.png",
        twitter: "https://twitter.com/mytoken",
        telegram: "https://t.me/mytoken",
        youtube: "https://youtube.com/mytoken",
        website: "https://mytoken.com",
    };

    const result = await PMFcreateToken({
        privateKey: "your-private-key", // Replace with your wallet private key
        metadata: tokenMetadata,
        contractAddress: "0xf4544DDD263EDc38Ab3cE789B92410Acd0685Ef6", // PumpMoreFunMain contract address
        rpcUrl: "https://rpc.arthera.net", // Arthera Mainnet RPC URL
    });

    if (result.success) {
        console.log("Token created successfully! Transaction Hash:", result.transactionHash);
    } else {
        console.error("Failed to create token:", result.error);
    }
})();
