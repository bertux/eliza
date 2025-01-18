import {
    createPublicClient,
    createWalletClient,
    formatUnits,
    http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { IAgentRuntime, Provider, Memory, State } from "@elizaos/core";
import type {
    Address,
    WalletClient,
    PublicClient,
    Chain,
    HttpTransport,
    Account,
    PrivateKeyAccount,
} from "viem";
import * as viemChains from "viem/chains";
import { fuseChain } from "../constants/chains";  // ✅ Imported custom Fuse chain

import type { SupportedChain } from "../types";

export class WalletProvider {
    private currentChain: SupportedChain = "fuse";
    chains: Record<string, Chain> = { fuse: fuseChain };  // ✅ Replaced viemChains.fuse
    account: PrivateKeyAccount;

    constructor(privateKey: `0x${string}`, chains?: Record<string, Chain>) {
        this.setAccount(privateKey);
        this.setChains(chains);

        if (chains && Object.keys(chains).length > 0) {
            this.setCurrentChain(Object.keys(chains)[0] as SupportedChain);
        }
    }

    getAddress(): Address {
        return this.account.address;
    }

    getCurrentChain(): Chain {
        return this.chains[this.currentChain];
    }

    getPublicClient(
        chainName: SupportedChain
    ): PublicClient<HttpTransport, Chain, Account | undefined> {
        const transport = this.createHttpTransport(chainName);
        return createPublicClient({
            chain: this.chains[chainName],
            transport,
        });
    }

    getWalletClient(chainName: SupportedChain): WalletClient {
        const transport = this.createHttpTransport(chainName);
        return createWalletClient({
            chain: this.chains[chainName],
            transport,
            account: this.account,
        });
    }

    getChainConfigs(chainName: SupportedChain): Chain {
        const chain = this.chains[chainName] || viemChains[chainName];  // ✅ Checks custom chains first

        if (!chain?.id) {
            throw new Error(`Invalid chain name: ${chainName}`);
        }

        return chain;
    }

    async getWalletBalance(): Promise<string | null> {
        try {
            const client = this.getPublicClient(this.currentChain);
            const balance = await client.getBalance({
                address: this.account.address,
            });
            return formatUnits(balance, 18);
        } catch (error) {
            console.error("Error getting wallet balance:", error);
            return null;
        }
    }

    async getWalletBalanceForChain(
        chainName: SupportedChain
    ): Promise<string | null> {
        try {
            const client = this.getPublicClient(chainName);
            const balance = await client.getBalance({
                address: this.account.address,
            });
            return formatUnits(balance, 18);
        } catch (error) {
            console.error(`Error getting wallet balance for ${chainName}:`, error);
            return null;
        }
    }

    private setAccount = (pk: `0x${string}`) => {
        this.account = privateKeyToAccount(pk);
    };

    private setChains = (chains?: Record<string, Chain>) => {
        if (!chains) return;
        Object.keys(chains).forEach((chain: string) => {
            this.chains[chain] = chains[chain];
        });
    };

    private setCurrentChain = (chain: SupportedChain) => {
        this.currentChain = chain;
    };

    private createHttpTransport = (chainName: SupportedChain) => {
        const chain = this.chains[chainName];

        if (chain.rpcUrls.custom) {
            return http(chain.rpcUrls.custom.http[0]);
        }
        return http(chain.rpcUrls.default.http[0]);
    };

    static genChainFromName(
        chainName: string,
        customRpcUrl?: string | null
    ): Chain {
        const baseChain = viemChains[chainName] || fuseChain;  // ✅ Fuse as fallback

        if (!baseChain?.id) {
            throw new Error(`Invalid chain name: ${chainName}`);
        }

        return customRpcUrl
            ? {
                  ...baseChain,
                  rpcUrls: {
                      ...baseChain.rpcUrls,
                      custom: {
                          http: [customRpcUrl],
                      },
                  },
              }
            : baseChain;
    }
}

const genChainsFromRuntime = (runtime: IAgentRuntime): Record<string, Chain> => {
    const chainNames = ["fuse"];
    const chains: Record<string, Chain> = {};

    chainNames.forEach((chainName) => {
        const rpcUrl = runtime.getSetting("ETHEREUM_PROVIDER_" + chainName.toUpperCase());
        chains[chainName] = WalletProvider.genChainFromName(chainName, rpcUrl);
    });

    return chains;
};

export const initWalletProvider = (runtime: IAgentRuntime) => {
    const privateKey = runtime.getSetting("FUSE_PRIVATE_KEY");
    if (!privateKey) {
        throw new Error("FUSE_PRIVATE_KEY is missing");
    }

    const chains = genChainsFromRuntime(runtime);
    return new WalletProvider(privateKey as `0x${string}`, chains);
};

export const fuseWalletProvider: Provider = {
    async get(runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<string | null> {
        try {
            const walletProvider = initWalletProvider(runtime);
            const address = walletProvider.getAddress();
            const balance = await walletProvider.getWalletBalance();
            const chain = walletProvider.getCurrentChain();
            return `Fuse Wallet Address: ${address}\nBalance: ${balance} ${chain.nativeCurrency.symbol}\nChain ID: ${chain.id}, Name: ${chain.name}`;
        } catch (error) {
            console.error("Error in Fuse wallet provider:", error);
            return null;
        }
    },
};
