import { Chain } from 'viem'
import { GOERLI_CHAIN_ID, SEPOLIA_CHAIN_ID } from './constant'
import { goerli, polygon, sepolia } from 'viem/chains'

export function getNetwork(chainId: number): Chain {
    switch (chainId) {
        case SEPOLIA_CHAIN_ID:
            return sepolia
        case GOERLI_CHAIN_ID:
            return goerli
        default:
            return polygon
    }
}
