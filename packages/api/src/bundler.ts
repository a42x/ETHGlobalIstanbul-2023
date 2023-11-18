import { createClient, http, Chain } from 'viem'
import { bundlerActions } from 'permissionless'
import { pimlicoBundlerActions } from 'permissionless/actions/pimlico'
import { sepolia, goerli } from 'viem/chains'
import { PimlicoBundlerClient } from 'permissionless/clients/pimlico'

const sepoliaBundlerClient = createClient({
    chain: sepolia,
    transport: http(process.env.SEPOLIA_BUNDLER_RPC_URL_PIMLICO) // Use any bundler url
})
    .extend(bundlerActions)
    .extend(pimlicoBundlerActions)

const goerliBundlerClient = createClient({
    chain: goerli,
    transport: http(process.env.GOERLI_BUNDLER_RPC_URL_PIMLICO) // Use any bundler url
})
    .extend(bundlerActions)
    .extend(pimlicoBundlerActions)

export function getBundlerClient(chain: Chain): PimlicoBundlerClient {
    switch (chain) {
        case sepolia:
            return sepoliaBundlerClient
        case goerli:
            return goerliBundlerClient
        default:
            throw new Error('Unsupported chain ID')
    }
}
