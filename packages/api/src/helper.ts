import { Address, concat, encodeFunctionData, getContract, Hex, parseAbi, PublicClient } from 'viem'
import { abi as walletABI } from './Account.json'
import { abi as factoryABI } from './Factory.json'
import storageABI from './Storage.json'

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
        const initCode = createInitCode(process.env.FACTORY as Address, address, BigInt(42))
        return [0n, initCode]
    }
}

export async function getEncryptedProof(uid: string, index: bigint, publicClient: PublicClient): Promise<string> {
    const account = getContract({
        address: '0x22318ebcd939C3b4eCd5CA5322B3A216d47f18B5' as Address,
        abi: storageABI, // todo storage contract abi
        publicClient
    })
    return (await account.read.encryptedMerkleProofs([uid, index])) as string
}

export async function getEncryptedLeaf(uid: string, index: bigint, publicClient: PublicClient): Promise<string> {
    const account = getContract({
        address: '0x22318ebcd939C3b4eCd5CA5322B3A216d47f18B5' as Address,
        abi: storageABI, // todo storage contract abi
        publicClient
    })
    return (await account.read.encryptedLeaves([uid, index])) as string
}
