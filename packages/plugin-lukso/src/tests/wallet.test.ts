import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { lukso, Chain } from "viem/chains";

import { WalletProvider } from "../providers/wallet";

const customRpcUrls = {
    lukso: "custom-rpc.lukso.io",
};

describe("Wallet provider", () => {
    let walletProvider: WalletProvider;
    let pk: `0x${string}`;
    const customChains: Record<string, Chain> = {};

    beforeAll(() => {
        pk = generatePrivateKey();

        const chainNames = ["lukso"];
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
        it("sets default chain to lukso", () => {
            walletProvider = new WalletProvider(pk);

            expect(walletProvider.chains.lukso.id).toEqual(lukso.id);
            expect(walletProvider.getCurrentChain().id).toEqual(lukso.id);
        });
        it("sets custom chains", () => {
            walletProvider = new WalletProvider(pk, customChains);

            expect(walletProvider.chains.lukso.id).toEqual(lukso.id);
        });
        it("sets the first provided custom chain as current chain", () => {
            walletProvider = new WalletProvider(pk, customChains);

            expect(walletProvider.getCurrentChain().id).toEqual(lukso.id);
        });
    });
    describe("Clients", () => {
        beforeEach(() => {
            walletProvider = new WalletProvider(pk);
        });
        it("generates public client", () => {
            const client = walletProvider.getPublicClient("lukso");
            expect(client.chain.id).toEqual(lukso.id);
            expect(client.transport.url).toEqual(lukso.rpcUrls.default.http[0]);
        });
        it("generates public client with custom rpcurl", () => {
            const chain = WalletProvider.genChainFromName(
                "lukso",
                customRpcUrls.lukso
            );
            const wp = new WalletProvider(pk, { ["lukso"]: chain });

            const client = wp.getPublicClient("lukso");
            expect(client.chain.id).toEqual(lukso.id);
            expect(client.chain.rpcUrls.default.http[0]).toEqual(
                lukso.rpcUrls.default.http[0]
            );
            expect(client.chain.rpcUrls.custom.http[0]).toEqual(
                customRpcUrls.lukso
            );
            expect(client.transport.url).toEqual(customRpcUrls.lukso);
        });
        it("generates wallet client", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;

            const client = walletProvider.getWalletClient("lukso");

            expect(client.account.address).toEqual(expectedAddress);
            expect(client.transport.url).toEqual(lukso.rpcUrls.default.http[0]);
        });
        it("generates wallet client with custom rpcurl", () => {
            const account = privateKeyToAccount(pk);
            const expectedAddress = account.address;
            const chain = WalletProvider.genChainFromName(
                "lukso",
                customRpcUrls.lukso
            );
            const wp = new WalletProvider(pk, { ["lukso"]: chain });

            const client = wp.getWalletClient("lukso");

            expect(client.account.address).toEqual(expectedAddress);
            expect(client.chain.id).toEqual(lukso.id);
            expect(client.chain.rpcUrls.default.http[0]).toEqual(
                lukso.rpcUrls.default.http[0]
            );
            expect(client.chain.rpcUrls.custom.http[0]).toEqual(
                customRpcUrls.lukso
            );
            expect(client.transport.url).toEqual(customRpcUrls.lukso);
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
            const bal = await walletProvider.getWalletBalanceForChain("lukso");

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
            const chainName = "lukso";
            const chain: Chain = WalletProvider.genChainFromName(chainName);

            expect(chain.rpcUrls.default.http[0]).toEqual(
                lukso.rpcUrls.default.http[0]
            );
        });
        it("generates chains from chain name with custom rpc url", () => {
            const chainName = "lukso";
            const customRpcUrl = customRpcUrls.lukso;
            const chain: Chain = WalletProvider.genChainFromName(
                chainName,
                customRpcUrl
            );

            expect(chain.rpcUrls.default.http[0]).toEqual(
                lukso.rpcUrls.default.http[0]
            );
            expect(chain.rpcUrls.custom.http[0]).toEqual(customRpcUrl);
        });
        it("gets chain configs", () => {
            const chain = walletProvider.getChainConfigs("lukso");

            expect(chain.id).toEqual(lukso.id);
        });
    });
});
