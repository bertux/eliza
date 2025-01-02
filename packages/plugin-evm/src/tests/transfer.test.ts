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
        const pk1 = getEnvVariable("EVM_PRIVATE_KEY") as `0x${string}`;
        const customChains = prepareChains();
        wp = new WalletProvider(pk, customChains);
        wp1 = new WalletProvider(pk1, customChains);
    });
    describe("Constructor", () => {
        it("should initialize with wallet provider", () => {
            const ta1 = new TransferAction(wp1);

            expect(ta1).toBeDefined();
        });
    });
    describe("Transfer", () => {
        let ta: TransferAction;
        let ta1: TransferAction;
        let receiverAddress: `0x${string}`;

        beforeEach(() => {
            ta = new TransferAction(wp);
            ta1 = new TransferAction(wp1);
            receiverAddress = "0x476e2651bf97de8a26e4a05a9c8e00a6efa1390c";
        });

        it("throws if not enough gas", async () => {
            await expect(
                ta.transfer({
                    fromChain: "arthera",
                    toAddress: receiverAddress,
                    amount: "1",
                })
            ).rejects.toThrow(
                "Transfer failed: The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account."
            );
        });

        it("transfers tokens", async () => {
            const tx = await ta1.transfer({
                fromChain: "arthera",
                toAddress: receiverAddress,
                amount: "0.001",
            });

            expect(tx).toBeDefined();
            expect(tx.from).toEqual(wp1.getAddress());
            expect(tx.to).toEqual(receiverAddress);
            expect(tx.value).toEqual(1000000000000000n);
        });
    });
});

const prepareChains = () => {
    const customChains: Record<string, Chain> = {};
    const chainNames = ["arthera"];
    chainNames.forEach(
        (chain) =>
            (customChains[chain] = WalletProvider.genChainFromName(chain))
    );

    return customChains;
};
