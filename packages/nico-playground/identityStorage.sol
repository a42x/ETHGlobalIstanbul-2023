// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract StringStorage {
    string private storedString;
    mapping(address => bytes32) public attestations;
    mapping(bytes32 => mapping(uint256 => string)) public encryptedMerkleProofs;

    function setAttestation(string calldata _string) public {
        storedString = _string;
    }

    // 保存された文字列を取得する関数
    function getString() public view returns (string memory) {
        return storedString;
    }
}
