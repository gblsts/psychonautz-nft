// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Psychonautz is ERC721Enumerable, Pausable, Ownable, PaymentSplitter {
    using Strings for uint256;

    string public constant TOKEN_NAME = "Psychonautz";
    string public constant TOKEN_SYMBOL = "PSYCHO";

    string public PSYCHONAUTZ_PROVENANCE = "";

    string private tokenBaseUri;

    uint256 public constant MAX_NAUTZ = 10000;
    uint256 public maxPurchasePerMint = 5;
    uint256 public mintPrice = 0.0666 ether;

    bool public metadataIsFrozen = false;

    mapping(NautzSalePhase => PresaleParams) public presaleParams;
    mapping(address => mapping(NautzSalePhase => uint256))
        public addressToMints;

    NautzSalePhase public currentPhase = NautzSalePhase.Locked;

    enum NautzSalePhase {
        Locked,
        Free,
        TeamSale,
        EarlySale,
        OgSale,
        PublicSale
    }

    struct PresaleParams {
        string name;
        uint256 mintPrice;
        uint256 limitPerAddress;
        bytes32 merkleRoot;
    }

    constructor(address[] memory payees, uint256[] memory shares)
        ERC721(TOKEN_NAME, TOKEN_SYMBOL)
        PaymentSplitter(payees, shares)
    {
        presaleParams[NautzSalePhase.Free] = PresaleParams({
            name: "Free",
            mintPrice: 0 ether,
            limitPerAddress: 1,
            merkleRoot: ""
        });

        presaleParams[NautzSalePhase.TeamSale] = PresaleParams({
            name: "Team sale",
            mintPrice: 0 ether,
            limitPerAddress: 20,
            merkleRoot: ""
        });

        presaleParams[NautzSalePhase.EarlySale] = PresaleParams({
            name: "Early sale",
            mintPrice: 0.0333 ether,
            limitPerAddress: 5,
            merkleRoot: ""
        });

        presaleParams[NautzSalePhase.OgSale] = PresaleParams({
            name: "OG sale",
            mintPrice: 0.0333 ether,
            limitPerAddress: 10,
            merkleRoot: ""
        });
    }

    modifier atPhase(NautzSalePhase _phase, string memory _phaseName) {
        require(
            currentPhase == _phase,
            string(abi.encodePacked(_phaseName, " is not active"))
        );
        _;
    }

    modifier validateNumberOfTokens(uint256 _numberOfTokens) {
        require(
            _numberOfTokens > 0 && _numberOfTokens <= maxPurchasePerMint,
            "Requested number of tokens is incorrect"
        );
        _;
    }

    modifier validatePresaleMintsAllowed(uint256 _numberOfTokens) {
        require(
            _numberOfTokens + addressToMints[msg.sender][currentPhase] <=
                presaleParams[currentPhase].limitPerAddress,
            "Exceeds number of presale mints allowed for current phase"
        );
        _;
    }

    modifier ensureAvailabilityFor(uint256 _numberOfTokens) {
        require(
            totalSupply() + _numberOfTokens <= MAX_NAUTZ,
            "Requested number of tokens not available"
        );
        _;
    }

    modifier validateEthPayment(uint256 _numberOfTokens, uint256 _mintPrice) {
        require(_mintPrice * _numberOfTokens == msg.value, "Inefficient ether");
        _;
    }

    function setProvenanceHash(string calldata provenanceHash)
        external
        onlyOwner
    {
        PSYCHONAUTZ_PROVENANCE = provenanceHash;
    }

    function setTokenBaseUri(string calldata _tokenBaseUri) external onlyOwner {
        require(!metadataIsFrozen, "Metadata is permanently frozen");
        tokenBaseUri = _tokenBaseUri;
    }

    function setMaxPurchasePerMint(uint256 _maxPurchasePerMint)
        external
        onlyOwner
    {
        maxPurchasePerMint = _maxPurchasePerMint;
    }

    function setPhaseParams(
        uint256 _phase,
        uint256 _mintPrice,
        uint256 _limitPerAddress
    ) external onlyOwner {
        NautzSalePhase phaseToUpdate = NautzSalePhase(_phase);
        presaleParams[phaseToUpdate].mintPrice = _mintPrice;
        presaleParams[phaseToUpdate].limitPerAddress = _limitPerAddress;
    }

    function setPhaseMerkleRoot(uint256 _phase, bytes32 _merkleRoot)
        external
        onlyOwner
    {
        NautzSalePhase phaseToUpdate = NautzSalePhase(_phase);
        presaleParams[phaseToUpdate].merkleRoot = _merkleRoot;
    }

    function setCurrentPhase(uint256 _phase) external onlyOwner {
        currentPhase = NautzSalePhase(_phase);
    }

    function freezeMetadata() external onlyOwner {
        require(!metadataIsFrozen, "Metadata is already frozen");
        require(bytes(tokenBaseUri).length > 0, "Token base URI is not setted");
        metadataIsFrozen = true;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function isAllowListEligible(
        uint256 _phase,
        address _addr,
        bytes32[] calldata _merkleProof
    ) external view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(_addr));
        bytes32 merkleRoot = presaleParams[NautzSalePhase(_phase)].merkleRoot;
        return MerkleProof.verify(_merkleProof, merkleRoot, leaf);
    }

    function mintPresale(
        uint256 _phase,
        bytes32[] calldata _merkleProof,
        uint256 _numberOfTokens
    )
        external
        payable
        whenNotPaused
        atPhase(
            NautzSalePhase(_phase),
            presaleParams[NautzSalePhase(_phase)].name
        )
        validateNumberOfTokens(_numberOfTokens)
        validatePresaleMintsAllowed(_numberOfTokens)
        ensureAvailabilityFor(_numberOfTokens)
        validateEthPayment(
            _numberOfTokens,
            presaleParams[currentPhase].mintPrice
        )
    {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        bytes32 merkleRoot = presaleParams[currentPhase].merkleRoot;
        require(
            MerkleProof.verify(_merkleProof, merkleRoot, leaf),
            "Invalid proof"
        );
        addressToMints[msg.sender][currentPhase] += _numberOfTokens;
        for (uint256 i; i < _numberOfTokens; i++) {
            _safeMint(msg.sender, totalSupply() + 1);
        }
    }

    function mint(uint256 _numberOfTokens)
        external
        payable
        whenNotPaused
        atPhase(NautzSalePhase.PublicSale, "Public phase ")
        validateNumberOfTokens(_numberOfTokens)
        ensureAvailabilityFor(_numberOfTokens)
        validateEthPayment(_numberOfTokens, mintPrice)
    {
        addressToMints[msg.sender][
            NautzSalePhase.PublicSale
        ] += _numberOfTokens;
        for (uint256 i; i < _numberOfTokens; i++) {
            _safeMint(msg.sender, totalSupply() + 1);
        }
    }

    function ownerTokens(address _owner)
        public
        view
        returns (uint256[] memory)
    {
        uint256 ownerTokenCount = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](ownerTokenCount);
        for (uint256 i; i < ownerTokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
        }
        return tokenIds;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(tokenId), "Invalid Token ID");
        return
            bytes(tokenBaseUri).length > 0
                ? string(
                    abi.encodePacked(tokenBaseUri, tokenId.toString(), ".json")
                )
                : "";
    }
}
