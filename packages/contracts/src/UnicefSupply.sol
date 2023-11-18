// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMerkleProof {
    function verifyMerkleProof(bytes32 root, bytes32 leaf, bytes32[] memory proof) external pure returns (bool);
}

interface IEAS {
    struct Attestation {
        bytes32 uid; // A unique identifier of the attestation.
        bytes32 schema; // The unique identifier of the schema.
        uint64 time; // The time when the attestation was created (Unix timestamp).
        uint64 expirationTime; // The time when the attestation expires (Unix timestamp).
        uint64 revocationTime; // The time when the attestation was revoked (Unix timestamp).
        bytes32 refUID; // The UID of the related attestation.
        address recipient; // The recipient of the attestation.
        address attester; // The attester/sender of the attestation.
        bool revocable; // Whether the attestation is revocable.
        bytes data; // Custom attestation data.
    }
    function getAttestation(bytes32 uid) external view returns (Attestation memory);
}

contract UnicefSupply {

    struct UnicefFund {
        uint256 id;
        uint256 fundAmount;
        uint256 requirementLength;
        mapping(uint256 => bytes32) requirements;
    }

    address public unicefAddress;
    address public govAddress;
    uint256 public unicefFundsIndex;
    mapping(uint256 => UnicefFund) public unicefFunds;
    IEAS public eas;
    IMerkleProof public merkleProof;

    constructor(address _unicefAddress, address _govAddress, address _easAddress, address _merkleProofAddress) {
        unicefAddress = _unicefAddress;
        govAddress = _govAddress;
        eas = IEAS(_easAddress);
        merkleProof = IMerkleProof(_merkleProofAddress);
    }

    receive() external payable {}

    ////////////////////////
    // external function //
    ///////////////////////
    function createFund(uint256 _fundAmount, uint256 _requirementLength, uint256[] memory _dataIndices, bytes32[] memory _requiredData) public {
        require(msg.sender == unicefAddress, "Only Unicef!");
        require(_dataIndices.length == _requirementLength, "Invalid inputs!");
        require(_requiredData.length == _requirementLength, "Invalid inputs!");
        UnicefFund storage fund = unicefFunds[unicefFundsIndex];
        fund.id = unicefFundsIndex;
        fund.fundAmount = _fundAmount;
        fund.requirementLength = _requirementLength;
        for (uint256 i = 0; i < _requirementLength; i++) {
            fund.requirements[_dataIndices[i]] = _requiredData[i];
        }
        unicefFundsIndex++;
    }

    function verify(uint256 _fundId, bytes32 _uid, uint256[] memory _dataIndices, bytes32[] memory _leaves, bytes32[][] memory _proofs) public {
        require(eas.getAttestation(_uid).revocationTime == 0, "Already revoked!");
        require(eas.getAttestation(_uid).attester == govAddress, "Wrong Attester!");
        require(eas.getAttestation(_uid).recipient == msg.sender, "Wrong uid!");
        UnicefFund storage fund = unicefFunds[_fundId];
        require(_leaves.length == fund.requirementLength, "Wrong Input!");
        require(_dataIndices.length == fund.requirementLength, "Wrong Input!");
        bytes memory root = eas.getAttestation(_uid).data;
        for (uint i = 0; i < _leaves.length; i++) {
            bool merkleRes = merkleProof.verifyMerkleProof(bytes32(root), _leaves[i], _proofs[i]);
            require(merkleRes, "Wrong input!");
        }
        uint256 cnt;
        for (uint256 i = 0; i < _leaves.length; i++) {
            if (fund.requirements[_dataIndices[i]] == _leaves[i]) {
                cnt++;
            }
        }
        require(cnt == fund.requirementLength, "Wrong Inputs!");
        // // TODO: Add Axiom to verify this user already claimed before
        safeTransferETH(msg.sender, fund.fundAmount);
    }

    ////////////////////////
    // internal function //
    ///////////////////////
    function safeTransferETH(address to, uint256 amount) internal {
        bool success;

        assembly {
            success := call(gas(), to, amount, 0, 0, 0, 0)
        }

        require(success, "ETH_TRANSFER_FAILED");
    }

    ////////////////////
    // view function //
    ///////////////////
    function getETHBalance() public view returns(uint256) {
        return address(this).balance;
    }
}