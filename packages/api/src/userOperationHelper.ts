import { BundlerClient, getUserOperationHash, UserOperation, waitForUserOperationReceipt } from 'permissionless'
import { abi as PaymasterABI } from './Paymaster.json'

import { getBundlerClient } from './bundler'
import { privateKeyToAccount } from 'viem/accounts'
import { Address, Chain, concat, encodeAbiParameters, Hex, PublicClient } from 'viem'
import { getPublicProvider } from './provider.ts'

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

const paymasterAccount = privateKeyToAccount(process.env.PAYMASTER_SIGNER_PRIVATE_KEY as Hex)

console.log('Paymaster address: ', paymasterAccount.address)

async function generateDummySignature(): Promise<Hex> {
    return await paymasterAccount.signMessage({ message: '0xdeadbeef2' })
}

async function sponsorUserOperation(
    userOperation: PartialBy<UserOperation, 'callGasLimit' | 'preVerificationGas' | 'verificationGasLimit'>,
    bundler: BundlerClient,
    publicClient: PublicClient
): Promise<UserOperation> {
    // 有効期限終了(0 で指定することで validAfter 以後有効となる)
    const validUntil = 0
    // 有効期限開始
    const validAfter = Math.ceil(Date.now() / 1000)
    // exchangeRate (現状利用しないため 0 )
    const exchangeRate = 0n

    // generate paymasterAndData with dummy signature
    // assign dummy paymasterAndData
    userOperation.paymasterAndData = concat([
        process.env.PAYMASTER as Address,
        encodeAbiParameters(
            [
                { name: 'validUntil', type: 'uint48' },
                { name: 'validAfter', type: 'uint48' },
                { name: 'address', type: 'address' },
                { name: 'exchangeRate', type: 'uint256' }
            ],
            [validUntil, validAfter, '0x0000000000000000000000000000000000000000', exchangeRate]
        ),
        // dummy signature
        await paymasterAccount.signMessage({ message: '0xdeadbeef' })
    ]) as Hex

    const estimatedGas = await bundler.estimateUserOperationGas({
        userOperation,
        entryPoint: process.env.ENTRYPOINT as Address
    })

    // assign estimated gas
    // estimated gas で返される値が信頼できない場合がある
    userOperation.callGasLimit = estimatedGas.callGasLimit
    userOperation.preVerificationGas = estimatedGas.preVerificationGas
    // 4倍しておく
    userOperation.verificationGasLimit =
        estimatedGas.verificationGasLimit * 5n < 500000n ? 500000n : estimatedGas.verificationGasLimit * 5n

    // calculate paymaster hash
    const hash = (await publicClient.readContract({
        address: process.env.PAYMASTER as Address,
        abi: PaymasterABI,
        functionName: 'getHash',
        args: [userOperation, validUntil, validAfter, '0x0000000000000000000000000000000000000000', exchangeRate]
    })) as Hex

    const signature = await paymasterAccount.signMessage({
        message: { raw: hash }
    })

    // sign paymaster hash
    userOperation.paymasterAndData = concat([
        process.env.PAYMASTER as Address,
        encodeAbiParameters(
            [
                { name: 'validUntil', type: 'uint48' },
                { name: 'validAfter', type: 'uint48' },
                { name: 'address', type: 'address' },
                { name: 'exchangeRate', type: 'uint256' }
            ],
            [validUntil, validAfter, '0x0000000000000000000000000000000000000000', 0n]
        ),
        signature
    ]) as Hex

    return userOperation as UserOperation
}

export async function buildUserOperationAndHash(
    chain: Chain,
    sender: Address,
    nonce: bigint,
    callData: Hex,
    initCode: Hex
): Promise<{ userOperation: UserOperationInHex; userOpHash: Hex }> {
    const bundlerClient = getBundlerClient(chain)
    const publicClient = getPublicProvider(chain)

    const gasPrice = await bundlerClient.getUserOperationGasPrice()

    const partialUserOperation: PartialBy<
        UserOperation,
        'callGasLimit' | 'preVerificationGas' | 'verificationGasLimit'
    > = {
        sender,
        nonce,
        initCode,
        callData,
        maxFeePerGas: gasPrice.fast.maxFeePerGas * 2n,
        maxPriorityFeePerGas: gasPrice.fast.maxPriorityFeePerGas * 2n,
        // dummy signature
        signature: await generateDummySignature(),
        // dummy
        paymasterAndData: '0x'
    }

    const userOperation = await sponsorUserOperation(partialUserOperation, bundlerClient, publicClient)
    const userOpHash = getUserOperationHash({
        userOperation,
        entryPoint: process.env.ENTRYPOINT as Address,
        chainId: chain.id
    })
    return { userOperation: convertUserOperationParamsToHex(userOperation), userOpHash }
}

export async function sendUserOperationToBundler(chain: Chain, userOperation: UserOperation, async = true) {
    const bundler = getBundlerClient(chain)
    const response = await bundler.sendUserOperation({
        userOperation,
        entryPoint: process.env.ENTRYPOINT as Address
    })

    if (async) {
        return { userOpHash: response }
    }

    console.log('Waiting for transaction...')
    const receipt = await waitForUserOperationReceipt(bundler as BundlerClient, {
        hash: response
    })
    const txHash = receipt.receipt.transactionHash

    return {
        userOpHash: response,
        transactionHash: txHash
    }
}

function convertUserOperationParamsToHex(userOperation: UserOperation): UserOperationInHex {
    return {
        ...userOperation,
        nonce: `0x${userOperation.nonce.toString(16)}`,
        verificationGasLimit: `0x${userOperation.verificationGasLimit.toString(16)}`,
        callGasLimit: `0x${userOperation.callGasLimit.toString(16)}`,
        preVerificationGas: `0x${userOperation.preVerificationGas.toString(16)}`,
        maxFeePerGas: `0x${userOperation.maxFeePerGas.toString(16)}`,
        maxPriorityFeePerGas: `0x${userOperation.maxPriorityFeePerGas.toString(16)}`
    }
}

export type UserOperationInHex = {
    sender: Address
    nonce: Hex
    initCode: Hex
    callData: Hex
    callGasLimit: Hex
    verificationGasLimit: Hex
    preVerificationGas: Hex
    maxFeePerGas: Hex
    maxPriorityFeePerGas: Hex
    paymasterAndData: Hex
    signature: Hex
}
