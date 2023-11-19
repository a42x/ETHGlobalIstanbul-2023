import { http, Chain, createPublicClient, PublicClient } from 'viem'
import { sepolia, polygon, polygonMumbai, goerli } from 'viem/chains'

const goerliProvider = createPublicClient({
    chain: goerli,
    transport: http(`https://eth-goerli.g.alchemy.com/v2/${process.env.GOERLI_ALCHEMY_API_KEY}`)
})

const sepoliaClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.SEPOLIA_ALCHEMY_API_KEY}`)
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
