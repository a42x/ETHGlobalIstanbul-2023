// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract proofStorage {
    mapping(bytes32 => address) public uuidOwners;
    mapping(bytes32 => mapping(uint256 => string)) public encryptedMerkleProofs;

    address public govAddress;

    constructor(address _govAddress) {
        govAddress = _govAddress;
    }

    function setUUIDOwner(bytes32 _uuid, address _userAddress) public {
        require(uuidOwners[_uuid] == address(0), "Already registered");
        require(msg.sender == govAddress, "Only government officer");
        uuidOwners[_uuid] = _userAddress;
    }

    function setEncryptedMerkleProof(bytes32 _uuid, uint256 _dataIndex, string memory _encryptedProof) public {
        address owner = uuidOwners[_uuid];
        require(msg.sender == owner, "You are not owner of this contract");
        encryptedMerkleProofs[_uuid][_dataIndex] = _encryptedProof;
    }
}
