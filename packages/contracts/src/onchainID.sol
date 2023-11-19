//SPDX-License Identifier: MIT
pragma solidity ^0.8.0;

uint32 constant BLOCK_BATCH_DEPTH = 10;

struct BlockHashWitness {
    uint32 blockNumber;
    bytes32 claimedBlockHash;
    bytes32 prevHash;
    uint32 numFinal;
    bytes32[BLOCK_BATCH_DEPTH] merkleProof;
}

interface IAxiomV1Core {
    function isBlockHashValid(BlockHashWitness calldata witness) external view returns (bool);
}

contract OnchainID {

    address axiomV1Core;
    constructor(address _axiomAddress) {
        axiomV1Core = _axiomAddress;
    }

    function checkIsvalidBlockhash(
        uint32 _blockNumber,
        bytes32 _claimedBlockHash,
        bytes32 _prevHash,
        uint32 _numFinal,
        bytes32[BLOCK_BATCH_DEPTH] memory _merkleProof
    ) public view returns (bool) {
        bool isValid = IAxiomV1Core(axiomV1Core).isBlockHashValid(BlockHashWitness(
            _blockNumber,
            _claimedBlockHash,
            _prevHash,
            _numFinal,
            _merkleProof
        ));
        return isValid;
    }

    // TODO: Add function to check if this wallet has a tx history for 
    // function verifyPublicGoodsTxHistory() public view returns () {

    // }
}