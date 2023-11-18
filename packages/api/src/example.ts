import { privateKeyToAccount } from 'viem/accounts'
import { getBundlerClient } from './bundler'
import { getNetwork } from './network'
import { UserOperation } from 'permissionless'
const userAccount = privateKeyToAccount('0xe31f33f8fbedff02e403f51c844de59eeaf171e762c993649a6c49e7c36df444')
// test address : 0xe46d28d10d5a534f78307d81a61C88E7D915976d

async function main() {
    let userOperation: UserOperation = toUserOperation({
        sender: '0x3907bdfC1e4093d3EC715Ac29efd23faC7791d61',
        nonce: '0x0',
        initCode:
            '0x52efed451e0313A98F913517d813b97c5368e90d5fbfb9cf000000000000000000000000e46d28d10d5a534f78307d81a61c88e7d915976d000000000000000000000000000000000000000000000000000000000000002a',
        callData:
            '0xb61d27f60000000000000000000000003907bdfc1e4093d3ec715ac29efd23fac7791d61000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000',
        maxFeePerGas: '0xdc1b47e',
        maxPriorityFeePerGas: '0xdc1b47e',
        signature:
            '0xf1f90d126db842ff5a849e6d38c98f6bbf52f060f19797873e0a7cd8a8427eb623d754a545ecafbdaeb79c10ebf28fd99c9b092fc5379f5ba5cbf0c65c489d411b',
        paymasterAndData:
            '0x4e2ac10df67f745975757d434e3cfcfbd6d54e6a000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000655919a300000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f5aedcdef6f1a624a22642592d209899be527e8ed95ce22cda3d000dc99f8fa744ecaea9db8e7e8864dd3447c14dd412ff193c711fb4424053abb6b45be37c5c1c',
        callGasLimit: '0x12043',
        preVerificationGas: '0xb74c',
        verificationGasLimit: '0x19024e'
    })

    const userOpHash = '0x171575dc53f67546809dcb67a7a65daa5dcd8e0fbccd9fe30443827242fdee41'
    const signature = await userAccount.signMessage({ message: { raw: userOpHash } })

    userOperation = {
        ...userOperation,
        signature
    }

    const chain = getNetwork(11155111)
    const bundler = getBundlerClient(chain)
    const response = await bundler.sendUserOperation({
        userOperation,
        entryPoint: '0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789'
    })
    console.lo
    console.log(response)
}

main().catch(err => {
    console.error(err)
})

function toUserOperation(uo: any): UserOperation {
    return {
        sender: uo.sender,
        nonce: BigInt(uo.nonce),
        initCode: uo.initCode,
        callData: uo.callData,
        maxFeePerGas: BigInt(uo.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(uo.maxPriorityFeePerGas),
        signature: uo.signature,
        paymasterAndData: uo.paymasterAndData,
        callGasLimit: BigInt(uo.callGasLimit),
        preVerificationGas: BigInt(uo.preVerificationGas),
        verificationGasLimit: BigInt(uo.verificationGasLimit)
    }
}
