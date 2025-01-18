export const transferTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- Chain to execute on: Must be one of ["fuse"] (like in viem/chains)
- Recipient address: Must be a valid Fuse address starting with "0x"

Respond with a JSON markdown block containing only the extracted values. All fields are required:

\`\`\`json
{
    "fromChain": SUPPORTED_CHAINS,
    "toAddress": string,
}
\`\`\`
`;
