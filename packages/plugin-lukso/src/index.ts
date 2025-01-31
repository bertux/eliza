export * from "./actions/transfer";
export * from "./providers/wallet";
export * from "./types";

import type { Plugin } from "@elizaos/core";
import { createTokenAction } from "./actions/createToken";
import { transferAction } from "./actions/transfer";
import { luksoWalletProvider } from "./providers/wallet";

export const luksoPlugin: Plugin = {
    name: "lukso",
    description: "Lukso blockchain integration plugin",
    providers: [luksoWalletProvider],
    evaluators: [],
    services: [],
    actions: [createTokenAction, transferAction],
};

export default luksoPlugin;
