import { http, Chain, createPublicClient, PublicClient } from 'viem'
import { sepolia, polygon, polygonMumbai, goerli } from 'viem/chains'

const goerliProvider = createPublicClient({
    chain: goerli,
    transport: http(`https://eth-goerli.g.alchemy.com/v2/${process.env.goerli_alchemy_api_key}`)
})

const sepoliaClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.sepolia_alchemy_api_key}`)
})

export function getPublicProvider(chain: Chain): PublicClient {
    switch (chain) {
        case sepolia:
            return sepoliaClient
        case goerli:
            return goerliProvider
        default:
            throw new Error('Unsupported chain ID')
    }
}
