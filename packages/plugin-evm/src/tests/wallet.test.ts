import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { mainnet, arthera, arbitrum, Chain } from "viem/chains";
import { getEnvVariable } from "@elizaos/core";

import { WalletProvider } from "../providers/wallet";

const customRpcUrls = {
    mainnet: "https://eth.drpc.org",
};

describe("Wallet provider", () => {
    let walletProvider: WalletProvider;
    let walletProvider1: WalletProvider;
    let pk: `0x${string}`;
    let pk1: `0x${string}`;
    const customChains: Record<string, Chain> = {};

    beforeAll(() => {
        pk = generatePrivateKey();
        pk1 = getEnvVariable("EVM_PRIVATE_KEY") as `0x${string}`;

        const chainNames = ["arthera", "arbitrum"];
        chainNames.forEach(
            (chain) =>
                (customChains[chain] = WalletProvider.genChainFromName(chain))
        );
    });

    describe("Constructor", () => {
        it("sets address", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;
            const expectedAddress1 = "0xe7e0E57AdE88226aC041Eba33D8dBaF2f351AEC0";

            walletProvider = new WalletProvider(pk);
            walletProvider1 = new WalletProvider(pk1);

            expect(walletProvider.getAddress()).toEqual(expectedAddress);
            expect(walletProvider1.getAddress()).toEqual(expectedAddress1);
        });
        it("sets default chain to ethereum mainnet", () => {
            walletProvider = new WalletProvider(pk);

            expect(walletProvider.chains.mainnet.id).toEqual(mainnet.id);
            expect(walletProvider.getCurrentChain().id).toEqual(mainnet.id);
        });
        it("sets custom chains", () => {
            walletProvider = new WalletProvider(pk, customChains);

            expect(walletProvider.chains.arthera.id).toEqual(arthera.id);
            expect(walletProvider.chains.arbitrum.id).toEqual(arbitrum.id);
        });
        it("sets the first provided custom chain as current chain", () => {
            walletProvider = new WalletProvider(pk, customChains);

            expect(walletProvider.getCurrentChain().id).toEqual(arthera.id);
        });
    });
    describe("Clients", () => {
        beforeEach(() => {
            walletProvider = new WalletProvider(pk);
        });
        it("generates public client", () => {
            const client = walletProvider.getPublicClient("mainnet");
            expect(client.chain.id).toEqual(mainnet.id);
            expect(client.transport.url).toEqual(
                mainnet.rpcUrls.default.http[0]
            );
        });
        it("generates public client with custom rpcurl", () => {
            const chain = WalletProvider.genChainFromName(
                "mainnet",
                customRpcUrls.mainnet
            );
            const wp = new WalletProvider(pk, { ["mainnet"]: chain });

            const client = wp.getPublicClient("mainnet");
            expect(client.chain.id).toEqual(mainnet.id);
            expect(client.chain.rpcUrls.default.http[0]).toEqual(
                mainnet.rpcUrls.default.http[0]
            );
            expect(client.chain.rpcUrls.custom.http[0]).toEqual(
                customRpcUrls.mainnet
            );
            expect(client.transport.url).toEqual(customRpcUrls.mainnet);
        });
        it("generates wallet client", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;

            const client = walletProvider.getWalletClient("mainnet");

            expect(client.account.address).toEqual(expectedAddress);
            expect(client.transport.url).toEqual(
                mainnet.rpcUrls.default.http[0]
            );
        });
        it("generates wallet client with custom rpcurl", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;
            const chain = WalletProvider.genChainFromName(
                "mainnet",
                customRpcUrls.mainnet
            );
            const wp = new WalletProvider(pk, { ["mainnet"]: chain });

            const client = wp.getWalletClient("mainnet");

            expect(client.account.address).toEqual(expectedAddress);
            expect(client.chain.id).toEqual(mainnet.id);
            expect(client.chain.rpcUrls.default.http[0]).toEqual(
                mainnet.rpcUrls.default.http[0]
            );
            expect(client.chain.rpcUrls.custom.http[0]).toEqual(
                customRpcUrls.mainnet
            );
            expect(client.transport.url).toEqual(customRpcUrls.mainnet);
        });
    });
    describe("Balance", () => {
        beforeEach(() => {
            walletProvider = new WalletProvider(pk, customChains);
        });
        it("should fetch balance", async () => {
            const bal = await walletProvider.getWalletBalance();

            expect(bal).toEqual("0");
        });
        it("should fetch balance for a specific added chain", async () => {
            const bal = await walletProvider.getWalletBalanceForChain("arthera");

            expect(bal).toEqual("0");
        });
        it("should return null if chain is not added", async () => {
            const bal = await walletProvider.getWalletBalanceForChain("base");
            expect(bal).toBeNull();
        });
    });
    describe("Chain", () => {
        beforeEach(() => {
            walletProvider = new WalletProvider(pk, customChains);
        });
        it("generates chains from chain name", () => {
            const chainName = "arthera";
            const chain: Chain = WalletProvider.genChainFromName(chainName);

            expect(chain.rpcUrls.default.http[0]).toEqual(
                arthera.rpcUrls.default.http[0]
            );
        });
        it("generates chains from chain name with custom rpc url", () => {
            const chainName = "arthera";
            const customRpcUrl = "custom.url.io";
            const chain: Chain = WalletProvider.genChainFromName(
                chainName,
                customRpcUrl
            );

            expect(chain.rpcUrls.default.http[0]).toEqual(
                arthera.rpcUrls.default.http[0]
            );
            expect(chain.rpcUrls.custom.http[0]).toEqual(customRpcUrl);
        });
        it("switches chain", () => {
            const initialChain = walletProvider.getCurrentChain().id;
            expect(initialChain).toEqual(arthera.id);

            walletProvider.switchChain("mainnet");

            const newChain = walletProvider.getCurrentChain().id;
            expect(newChain).toEqual(mainnet.id);
        });
        it("switches chain (by adding new chain)", () => {
            const initialChain = walletProvider.getCurrentChain().id;
            expect(initialChain).toEqual(arthera.id);

            walletProvider.switchChain("arthera");

            const newChain = walletProvider.getCurrentChain().id;
            expect(newChain).toEqual(arthera.id);
        });
        it("adds chain", () => {
            const initialChains = walletProvider.chains;
            expect(initialChains.base).toBeUndefined();

            const base = WalletProvider.genChainFromName("base");
            walletProvider.addChain({ base });
            const newChains = walletProvider.chains;
            expect(newChains.base.id).toEqual(base.id);
        });
        it("gets chain configs", () => {
            const chain = walletProvider.getChainConfigs("arthera");

            expect(chain.id).toEqual(arthera.id);
        });
        it("throws if tries to switch to an invalid chain", () => {
            const initialChain = walletProvider.getCurrentChain().id;
            expect(initialChain).toEqual(arthera.id);

            // intentionally set incorrect chain, ts will complain
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(() => walletProvider.switchChain("eth")).toThrow();
        });
        it("throws if unsupported chain name", () => {
            // intentionally set incorrect chain, ts will complain
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(() => WalletProvider.genChainFromName("ethereum")).toThrow();
        });
        it("throws if invalid chain name", () => {
            // intentionally set incorrect chain, ts will complain
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            expect(() => WalletProvider.genChainFromName("eth")).toThrow();
        });
    });
});
