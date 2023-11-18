const SchemaRegistry = require("@ethereum-attestation-service/eas-sdk");
const ethers = require("ethers");
const EAS = require("@ethereum-attestation-service/eas-sdk");
const SchemaEncoder = require("@ethereum-attestation-service/eas-sdk");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const CryptoJS = require("crypto-js");
// import { createPublicClient, http } from 'viem'
// import { mainnet } from 'viem/chains'

const SEPOLIA_API_PROVIDER = "";
const PRIVATE_KEY = ""

const SCHEMA_REGISTRY_CONTRACT_ADDRESS = "0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0";
const EAS_CONTRACT_ADDRESS = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e";

const SCHEMA_UUID = "0x20351f973fdec1478924c89dfa533d8f872defa108d9c3c6512267d7e7e5dbc2";
const ATTESTATION_UUID = "0x5d0f86f8ff099db8d05bfad387c99d9a0767dde7c53e33108e751d034c729a09";

const USER_WALLET_ADDRESS = "0x3a0F761126B034e3031d3C934eDA62251A07D7f1";
const UNICEF_WALLET_ADDRESS = "0xc0c374f049f2e0036B48D93346038f0133B8f00F";
const GOV_WALLET_ADDRESS = "0x34F31a32F100175b15A81f0d8Ab828905C61E5e9";

const ATTESTATION_DATA = ['John', '90', '34', '1', '20081031'];

async function eas_controller() {
    const provider = new ethers.JsonRpcProvider(
        SEPOLIA_API_PROVIDER
    );

    const schemaRegistry = new SchemaRegistry.SchemaRegistry(SCHEMA_REGISTRY_CONTRACT_ADDRESS);
    schemaRegistry.connect(provider);

    const schemaRecord = await schemaRegistry.getSchema({ uid: SCHEMA_UUID });

    console.log(schemaRecord);

    const eas = new EAS.EAS(EAS_CONTRACT_ADDRESS);
    eas.connect(provider);

    const attestation = await eas.getAttestation(ATTESTATION_UUID);

    console.log(attestation);
}

async function merkleTree() {
    let leaves = ATTESTATION_DATA.map(x => keccak256(x));
    let tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    let root = tree.getRoot().toString('hex');
    console.log("root: ", '0x' + root);
    const leaf = keccak256('data4');
    console.log("leaf: ", '0x' + leaf.toString('hex'));
    const proof = tree.getProof(leaf).map(x => '0x'+ x.data.toString('hex'));
    console.log("proof: ", proof);
    console.log(tree.verify(proof, leaf, root));
}

async function createOnChainAttest() {
    let leaves = ATTESTATION_DATA.map(x => keccak256(x));
    let tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    let root = tree.getRoot().toString('hex');
    console.log("root: ", '0x' + root);

    const eas = new EAS.EAS(EAS_CONTRACT_ADDRESS);
    const provider = new ethers.JsonRpcProvider(
        SEPOLIA_API_PROVIDER
    );
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(wallet.address);

    // wallet.connect(provider);
    // console.log(wallet.provider());

    eas.connect(wallet);

    // Initialize SchemaEncoder with the schema string
    const schemaEncoder = new SchemaEncoder.SchemaEncoder("bytes32 privateData");
    const encodedData = schemaEncoder.encodeData([
        { name: "privateData", value: '0x' + root, type: "bytes32" },
    ]);

    const tx = await eas.attest({
        schema: SCHEMA_UUID,
        data: {
            recipient: USER_WALLET_ADDRESS,
            expirationTime: 0,
            revocable: true, // Be aware that if your schema is not revocable, this MUST be false
            data: encodedData,
        },
    });

    const newAttestationUID = await tx.wait();

    console.log("New attestation UID:", newAttestationUID);
}

async function encryptoMerkleProof() {
    let leaves = ATTESTATION_DATA.map(x => keccak256(x));
    let tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    let root = tree.getRoot().toString('hex');
    console.log("root: ", '0x' + root);
    const leaf = keccak256('data4');
    console.log("leaf: ", '0x' + leaf.toString('hex'));
    const proof = tree.getProof(leaf).map(x => '0x'+ x.data.toString('hex'));
    console.log("proof: ", proof);
    console.log(tree.verify(proof, leaf, root));
    const input = proof[0] + proof[1] + proof[2];
    console.log("input: ", input);
    const ciphertext = CryptoJS.AES.encrypt(input, 'secret').toString();
    console.log("ciphertext: ", ciphertext);
    const bytes  = CryptoJS.AES.decrypt(ciphertext, 'secret');
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    const decrypted = [
        originalText.slice(0,66),
        originalText.slice(66,132),
        originalText.slice(132, 198)
    ];
    console.log("decrypted: ", decrypted);
}

async function main() {
    // await eas_controller();
    // const input = "C3FFFFFFFFFFFFF";
    // console.log("input: ", input);
    // const ciphertext = CryptoJS.AES.encrypt(input, 'secretskjgfhahdfkjahsoighqwkjhakh').toString();
    // console.log("ciphertext: ", ciphertext);
    // await createOnChainAttest()s;
    await encryptoMerkleProof();
}

main();