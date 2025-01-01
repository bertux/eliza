import { describe, it, expect, beforeEach } from "vitest";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Account, Chain } from "viem";

import { TransferAction } from "../actions/transfer";
import { WalletProvider } from "../providers/wallet";

describe("Transfer Action for Arthera", () => {
    let wp: WalletProvider;

    beforeEach(async () => {
        const privateKey = generatePrivateKey();
        const artheraChain = prepareArtheraChain();
        wp = new WalletProvider(privateKey, artheraChain);
    });

    describe("Constructor", () => {
        it("should initialize with wallet provider", () => {
            const transferAction = new TransferAction(wp);

            expect(transferAction).toBeDefined();
        });
    });

    describe("Transfer", () => {
        let transferAction: TransferAction;
        let receiver: Account;

        beforeEach(() => {
            transferAction = new TransferAction(wp);
            receiver = privateKeyToAccount(generatePrivateKey());
        });

        it("throws an error if there is not enough gas", async () => {
            await expect(
                transferAction.transfer({
                    fromChain: "arthera",
                    toAddress: receiver.address,
                    amount: "1", // Simulate insufficient funds
                })
            ).rejects.toThrow(
                "Transfer failed: The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account."
            );
        });

        it("throws an error for an invalid chain configuration", async () => {
            await expect(
                transferAction.transfer({
                    fromChain: "arthera", // Using a valid chain to simulate an invalid configuration
                    toAddress: receiver.address,
                    amount: "0.5",
                })
            ).rejects.toThrow(
                "The chain arthera is not configured yet."
            );
        });

        it("succeeds on Arthera with valid parameters", async () => {
            const transferResult = await transferAction.transfer({
                fromChain: "arthera",
                toAddress: receiver.address,
                amount: "0.1", // Sufficient funds for transfer
            });

            expect(transferResult).toHaveProperty("hash");
            expect(transferResult.from).toBe(wp.getAddress());
            expect(transferResult.to).toBe(receiver.address);
            expect(transferResult.value.toString()).toBe("100000000000000000"); // 0.1 AA in wei
        });
    });
});

// Helper function to prepare the Arthera chain
const prepareArtheraChain = (): Record<string, Chain> => {
    return {
        arthera: {
            id: 10242,
            name: "Arthera",
            rpcUrls: { default: { http: ["https://rpc.arthera.net"] } },
            nativeCurrency: {
                name: "Arthera",
                symbol: "AA",
                decimals: 18,
            },
        } as Chain,
    };
};
