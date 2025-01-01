export * from "./actions/transfer";
export * from "./providers/wallet";
export * from "./types";

import type { Plugin } from "@elizaos/core";
import { transferAction } from "./actions/transfer";
import { evmWalletProvider } from "./providers/wallet";

export const artheraPlugin: Plugin = {
    name: "arthera",
    description: "Arthera blockchain integration plugin",
    providers: [evmWalletProvider],
    evaluators: [],
    services: [],
    actions: [transferAction],
};

export default artheraPlugin;
