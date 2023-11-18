// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract proofStorage {
    mapping(bytes32 => address) public uidOwners;
    mapping(bytes32 => mapping(uint256 => string)) public encryptedMerkleProofs;
    mapping(bytes32 => mapping(uint256 => string)) public encryptedLeaves;

    address public govAddress;

    constructor(address _govAddress) {
        govAddress = _govAddress;
    }

    function setUidOwner(bytes32 _uid, address _userAddress) public {
        require(uidOwners[_uid] == address(0), "Already registered");
        require(msg.sender == govAddress, "Only government officer");
        uidOwners[_uid] = _userAddress;
    }

    function setEncryptedMerkleProof(bytes32 _uid, uint256 _dataIndex, string memory _encryptedProof) public {
        address owner = uidOwners[_uid];
        require(msg.sender == owner, "You are not owner of this uid!");
        require(keccak256(bytes(encryptedMerkleProofs[_uid][_dataIndex])) == keccak256(bytes("")), "Already registered!");
        encryptedMerkleProofs[_uid][_dataIndex] = _encryptedProof;
    }

    function setEncryptedLeaves(bytes32 _uid, uint256 _dataIndex, string memory _encryptedLeaf) public {
        address owner = uidOwners[_uid];
        require(msg.sender == owner, "You are not owner of this uid!");
        require(keccak256(bytes(encryptedLeaves[_uid][_dataIndex])) == keccak256(bytes("")), "Already registered!");
        encryptedLeaves[_uid][_dataIndex] = _encryptedLeaf;
    }
}
