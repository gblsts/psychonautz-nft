const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

let whitelistAddresses = [
    '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8',
    '0x29111c8F13d357D95eF5039b763c4BB59b4eD60D',
    '0x832F166799A407275500430b61b622F0058f15d6',
    '0x52Cbd5C420B5B1DC755e24ee33Eff376CD03f36a',
    '0x5B68B65a46F07506D1B01837D2C04F333Bf7b959',
    '0xFA0E09752067f35C0a66F37Aed7708C093f6700d',
    '0x9c478f97e791264815a8ACc9448438e4D45ef456'
]

// leaves, merkleTree and rootHash are all determinated prior to claim. The project
// would have some form of whitelist process where whitelisted addresses are collected
// and know beforehand

// Creates a new array 'leafNodes' by hashing all indexes of the 'whitelistAddresses'
// using keccak256. Then creates a new Merkle Tree object using keccak256 as the
// desire hashing algorithm.
const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

// Gets the root hash of the merkle tree in hex format.
const rootHash = merkleTree.getRoot();
console.log('Whitelist Merkle Tree\n', merkleTree.toString());
console.log('Root Hash: ', rootHash)

// Client-side, you would use the 'msg.sender' address to query and API that returns
// the merkle proof required to derive the root hash of the Merkle Tree.
const claimingAddress = leafNodes[0];

// 'getHexProof' will return the neighbour leaf and all parent node hashes that will
// be required to derive the Merkle Trees root hash.
const hexProof = merkleTree.getHexProof(claimingAddress);
console.log('Merkle Proof of Address - ', claimingAddress, '\n', hexProof);

// ✅ - ❌: Verification
console.log('Verification: ', merkleTree.verify(hexProof, claimingAddress, rootHash));
