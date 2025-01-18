import type { IAgentRuntime, Memory, State } from "@elizaos/core";
import { WalletProvider } from "../providers/wallet";
import { createTokenTemplate } from "../templates";
import type { SupportedChain, Transaction, TokenCreationParameters } from "../types";
import erc20FactoryArtifacts from "../contracts/artifacts/ERC20Factory.json";
import {
    encodeFunctionData,
    Hex,
} from "viem"

export class CreateTokenAction {
    constructor(private walletProvider: WalletProvider) {}

    async create(params: TokenCreationParameters): Promise<Transaction> {
        const walletClient = this.walletProvider.getWalletClient(
            params.fromChain
        );

        const txData = encodeFunctionData({
            abi: erc20FactoryArtifacts as any,
            functionName: "createToken",
            args: [
                params.name,
                params.symbol,
                params.decimals,
                params.initialSupply,
                params.tokenOwner,
            ],
        });

        try {
            const chainConfig = this.walletProvider.getChainConfigs(params.fromChain);
            const publicClient = this.walletProvider.getPublicClient(params.fromChain);

            const hash = await walletClient.sendTransaction({
                account: walletClient.account,
                to: params.factoryAddress,
                value: BigInt(0),
                data: txData as Hex,
                chain: chainConfig,
                kzg: {
                    blobToKzgCommitment: () => {
                        throw new Error("KZG commitment not implemented.");
                    },
                    computeBlobKzgProof: () => {
                        throw new Error("KZG proof not implemented.");
                    },
                },
            });

            await publicClient.waitForTransactionReceipt({ hash });

            return {
                hash,
                from: walletClient.account.address,
                to: params.factoryAddress,
                value: BigInt(0),
                data: txData as Hex,
                chainId: chainConfig.id,
            };
        } catch (error: any) {
            throw new Error(`Token creation failed: ${error.message}`);
        }
    }
}

export const createTokenAction = {
    name: "Create Token",
    description: "Deploy a new ERC20 token using the ERC20Factory.",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: any
    ) => {
        try {
            const privateKey = runtime.getSetting("EVM_PRIVATE_KEY") as `0x${string}`;
            const walletProvider = new WalletProvider(privateKey);
            const action = new CreateTokenAction(walletProvider);

            const tokenParams: TokenCreationParameters = {
                name: options.name,
                symbol: options.symbol,
                decimals: options.decimals,
                initialSupply: options.initialSupply,
                tokenOwner: options.tokenOwner as `0x${string}`,
                factoryAddress: options.factoryAddress as `0x${string}`,
                fromChain: options.fromChain,
            };

            const result = await action.create(tokenParams);

            if (callback) {
                callback({
                    text: `Token created successfully!\nTransaction Hash: ${result.hash}`,
                    content: {
                        success: true,
                        hash: result.hash,
                        tokenAddress: result.to,
                        chain: options.chain,
                    },
                });
            }
            return true;
        } catch (error: any) {
            console.error("Error in token creation handler:", error.message);
            if (callback) {
                callback({ text: `Error: ${error.message}` });
            }
            return false;
        }
    },
    template: createTokenTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Create a token named 'MyToken' with symbol 'MTK' on Fuse.",
                    action: "CREATE_TOKEN",
                },
            },
        ],
    ],
    similes: ["CREATE_TOKEN", "DEPLOY_ERC20"],
};
