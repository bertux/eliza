import { describe, it, expect, beforeEach } from "vitest";
import { generatePrivateKey } from "viem/accounts";
import { Chain } from "viem";
import { getEnvVariable } from "@elizaos/core";

import { TransferAction } from "../actions/transfer";
import { WalletProvider } from "../providers/wallet";

describe("Transfer Action", () => {
    let wp: WalletProvider;
    let wp1: WalletProvider;

    beforeEach(async () => {
        const pk = generatePrivateKey();
        const pk1 = getEnvVariable("FUSE_PRIVATE_KEY") as `0x${string}`;
        const customChains = prepareChains();
        wp = new WalletProvider(pk, customChains);
        if (pk1) {
            wp1 = new WalletProvider(pk1, customChains);
        }
    });
    describe("Constructor", () => {
        it("should initialize with wallet provider", () => {
            const ta = new TransferAction(wp);

            expect(ta).toBeDefined();
        });
    });
    describe("Transfer", () => {
        let ta: TransferAction;
        let ta1: TransferAction;
        let receiverAddress: `0x${string}`;

        beforeEach(() => {
            ta = new TransferAction(wp);
            if (wp1) {
                ta1 = new TransferAction(wp1);
            }
            receiverAddress = wp.getAddress();
        });

        it("throws if not enough gas", async () => {
            await expect(
                ta.transfer({
                    fromChain: "fuse",
                    toAddress: receiverAddress,
                })
            ).rejects.toThrow("Transfer failed: ");
        });

        it("transfers tokens", async () => {
            if (wp1) {
                const tx = await ta1.transfer({
                    fromChain: "fuse",
                    toAddress: receiverAddress,
                });

                expect(tx).toBeDefined();
                expect(tx.from).toEqual(wp1.getAddress());
                expect(tx.to).toEqual(receiverAddress);
            }
        });
    });
});

const prepareChains = () => {
    const customChains: Record<string, Chain> = {};
    const chainNames = ["fuse"];
    chainNames.forEach(
        (chain) =>
            (customChains[chain] = WalletProvider.genChainFromName(chain))
    );

    return customChains;
};
