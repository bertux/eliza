import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { luksoTestnet, Chain } from "viem/chains";

import { WalletProvider } from "../providers/wallet";

const customRpcUrls = {
    luksoTestnet: "custom-rpc.luksoTestnet.io",
};

describe("Wallet provider", () => {
    let walletProvider: WalletProvider;
    let pk: `0x${string}`;
    const customChains: Record<string, Chain> = {};

    beforeAll(() => {
        pk = generatePrivateKey();

        const chainNames = ["luksoTestnet"];
        chainNames.forEach(
            (chain) =>
                (customChains[chain] = WalletProvider.genChainFromName(chain))
        );
    });

    describe("Constructor", () => {
        it("sets address", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;

            walletProvider = new WalletProvider(pk);

            expect(walletProvider.getAddress()).toEqual(expectedAddress);
        });
        it("sets default chain to luksoTestnet", () => {
            walletProvider = new WalletProvider(pk);

            expect(walletProvider.chains.luksoTestnet.id).toEqual(luksoTestnet.id);
            expect(walletProvider.getCurrentChain().id).toEqual(luksoTestnet.id);
        });
        it("sets custom chains", () => {
            walletProvider = new WalletProvider(pk, customChains);

            expect(walletProvider.chains.luksoTestnet.id).toEqual(luksoTestnet.id);
        });
        it("sets the first provided custom chain as current chain", () => {
            walletProvider = new WalletProvider(pk, customChains);

            expect(walletProvider.getCurrentChain().id).toEqual(luksoTestnet.id);
        });
    });
    describe("Clients", () => {
        beforeEach(() => {
            walletProvider = new WalletProvider(pk);
        });
        it("generates public client", () => {
            const client = walletProvider.getPublicClient("luksoTestnet");
            expect(client.chain.id).toEqual(luksoTestnet.id);
            expect(client.transport.url).toEqual(luksoTestnet.rpcUrls.default.http[0]);
        });
        it("generates public client with custom rpcurl", () => {
            const chain = WalletProvider.genChainFromName(
                "luksoTestnet",
                customRpcUrls.luksoTestnet
            );
            const wp = new WalletProvider(pk, { ["luksoTestnet"]: chain });

            const client = wp.getPublicClient("luksoTestnet");
            expect(client.chain.id).toEqual(luksoTestnet.id);
            expect(client.chain.rpcUrls.default.http[0]).toEqual(
                luksoTestnet.rpcUrls.default.http[0]
            );
            expect(client.chain.rpcUrls.custom.http[0]).toEqual(
                customRpcUrls.luksoTestnet
            );
            expect(client.transport.url).toEqual(customRpcUrls.luksoTestnet);
        });
        it("generates wallet client", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;

            const client = walletProvider.getWalletClient("luksoTestnet");

            expect(client.account.address).toEqual(expectedAddress);
            expect(client.transport.url).toEqual(luksoTestnet.rpcUrls.default.http[0]);
        });
        it("generates wallet client with custom rpcurl", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;
            const chain = WalletProvider.genChainFromName(
                "luksoTestnet",
                customRpcUrls.luksoTestnet
            );
            const wp = new WalletProvider(pk, { ["luksoTestnet"]: chain });

            const client = wp.getWalletClient("luksoTestnet");

            expect(client.account.address).toEqual(expectedAddress);
            expect(client.chain.id).toEqual(luksoTestnet.id);
            expect(client.chain.rpcUrls.default.http[0]).toEqual(
                luksoTestnet.rpcUrls.default.http[0]
            );
            expect(client.chain.rpcUrls.custom.http[0]).toEqual(
                customRpcUrls.luksoTestnet
            );
            expect(client.transport.url).toEqual(customRpcUrls.luksoTestnet);
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
            const bal = await walletProvider.getWalletBalanceForChain("luksoTestnet");

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
            const chainName = "luksoTestnet";
            const chain: Chain = WalletProvider.genChainFromName(chainName);

            expect(chain.rpcUrls.default.http[0]).toEqual(
                luksoTestnet.rpcUrls.default.http[0]
            );
        });
        it("generates chains from chain name with custom rpc url", () => {
            const chainName = "luksoTestnet";
            const customRpcUrl = customRpcUrls.luksoTestnet;
            const chain: Chain = WalletProvider.genChainFromName(
                chainName,
                customRpcUrl
            );

            expect(chain.rpcUrls.default.http[0]).toEqual(
                luksoTestnet.rpcUrls.default.http[0]
            );
            expect(chain.rpcUrls.custom.http[0]).toEqual(customRpcUrl);
        });
        it("gets chain configs", () => {
            const chain = walletProvider.getChainConfigs("luksoTestnet");

            expect(chain.id).toEqual(luksoTestnet.id);
        });
    });
});
