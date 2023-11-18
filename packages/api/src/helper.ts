import { Address, concat, encodeFunctionData, getContract, Hex, parseAbi, PublicClient } from 'viem'
import { abi as walletABI } from './Account.json'
import { abi as factoryABI } from './Factory.json'

export async function getDeposit(senderAddress: Address, publicClient: PublicClient): Promise<bigint> {
    const account = getContract({
        address: senderAddress,
        abi: walletABI,
        publicClient
    })
    return (await account.read.getDeposit()) as bigint
}

export async function getContractAddress(owner: Address, salt: bigint, publicClient: PublicClient): Promise<Address> {
    const account = getContract({
        address: process.env.FACTORY as Address,
        abi: parseAbi(['function getAddress(address owner, uint256 salt) view returns (address)']),
        publicClient
    })
    return (await account.read.getAddress([owner, salt])) as Address
}

export async function getNonce(senderAddress: Address, publicClient: PublicClient): Promise<bigint> {
    const account = getContract({
        address: senderAddress,
        abi: walletABI,
        publicClient
    })
    return (await account.read.getNonce()) as bigint
}

function createInitCode(factory: Address, owner: Address, salt: bigint): Hex {
    return concat([
        factory,
        encodeFunctionData({
            abi: factoryABI,
            functionName: 'createAccount',
            args: [owner, salt]
        })
    ])
}

/**
 * Get nonce and init code for the given address
 * @param publicClient
 * @param address  Address
 */
export async function getNonceAndInitCode(publicClient: PublicClient, address: Address): Promise<[bigint, Hex]> {
    try {
        const nonce = await getNonce(address, publicClient)
        return [nonce, '0x']
    } catch (_e) {
        const initCode = createInitCode(process.env.FACTORY as Address, address, BigInt(0))
        return [0n, initCode]
    }
}
