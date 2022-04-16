// const context = require('./context.js');
const { ethers } = require("hardhat");
const chai = require('chai');
const { solidity } = require('ethereum-waffle');
const { expect } = require("chai");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

chai.use(solidity);

describe('Psychonautz NFT contract', () => {
	before(async () => {
		[owner, artist, notOwner, buyer] = await ethers.getSigners();
		
		const Psychonautz = await ethers.getContractFactory("Psychonautz");
		psychonautz = await Psychonautz.deploy();

		asNotOwner = psychonautz.connect(notOwner);
		asBuyer = psychonautz.connect(buyer);
		
		whitelistAddresses = [
			'0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8',
			'0x29111c8F13d357D95eF5039b763c4BB59b4eD60D',
			'0x832F166799A407275500430b61b622F0058f15d6',
			'0x52Cbd5C420B5B1DC755e24ee33Eff376CD03f36a',
			'0x5B68B65a46F07506D1B01837D2C04F333Bf7b959',
			'0xFA0E09752067f35C0a66F37Aed7708C093f6700d',
			'0x9c478f97e791264815a8ACc9448438e4D45ef456',
			buyer.address
		]
		leafNodes = whitelistAddresses.map(addr => keccak256(addr));
		merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
	});

	describe('Initialization', async () => {
		it('Should be successfully deployed', async () => {
			expect(psychonautz).to.exist;
		});

		it('Check ownership', async () => {
			expect(await psychonautz.owner()).to.eq(owner.address);
		});

		it('It is not paused', async () => {
			expect(await psychonautz.paused()).to.false;
		});
	});

	describe('Protected methods called by not owner address', async () => {
		it('setProvenanceHash', async () => {
			await expect(asNotOwner.setProvenanceHash('PROVENANCE-HASH')).to.be.revertedWith(
				'Ownable: caller is not the owner'
			);
		});

		it('setTokenBaseUri', async () => {
			await expect(asNotOwner.setTokenBaseUri('TOKEN-BASE-URI')).to.be.revertedWith(
				'Ownable: caller is not the owner'
			);
		});

		it('setMaxPurchasePerMint', async () => {
			await expect(asNotOwner.setMaxPurchasePerMint(5)).to.be.revertedWith(
				'Ownable: caller is not the owner'
			);
		});

		it('setPhaseParams', async () => {
			await expect(asNotOwner.setPhaseParams(1, ethers.utils.parseEther('0.0333'), 10)).to.be.revertedWith(
				'Ownable: caller is not the owner'
			);
		});

		it('setPhaseMerkleRoot', async () => {
			await expect(asNotOwner.setPhaseMerkleRoot(1, ethers.utils.formatBytes32String("MERKLE-ROOT"))).to.be.revertedWith(
				'Ownable: caller is not the owner'
			);
		});

		it('setCurrentPhase', async () => {
			await expect(asNotOwner.setCurrentPhase(1)).to.be.revertedWith(
				'Ownable: caller is not the owner'
			);
		});

		it('freezeMetadata', async () => {
			await expect(asNotOwner.freezeMetadata()).to.be.revertedWith(
				'Ownable: caller is not the owner'
			);
		});

		it('pause', async () => {
			await expect(asNotOwner.pause()).to.be.revertedWith(
				'Ownable: caller is not the owner'
			);
		});

		it('unpause', async () => {
			await expect(asNotOwner.unpause()).to.be.revertedWith(
				'Ownable: caller is not the owner'
			);
		});
	});

	describe('Set parameters', async () => {
		it('setProvenanceHash', async () => {
			const provenanceHash = 'PROVENANCE-HASH';
			await psychonautz.setProvenanceHash(provenanceHash);
			const settedProvenanceHash = await psychonautz.PSYCHONAUTZ_PROVENANCE();
			expect(provenanceHash).to.eq(settedProvenanceHash);
		});

		it('setMaxPurchasePerMint', async () => {
			const maxPurchasePerMint = 5;
			await psychonautz.setMaxPurchasePerMint(maxPurchasePerMint);
			const settedMaxPurchasePerMint = await psychonautz.maxPurchasePerMint();
			expect(maxPurchasePerMint).to.eq(settedMaxPurchasePerMint);
		});

		it('Set phase Merkle root', async() => {
			const rootHash = '0x' + merkleTree.getRoot().toString('hex')
			await psychonautz.setPhaseMerkleRoot(1, rootHash);
			const presaleParams = await psychonautz.presaleParams(1);
			expect(rootHash).to.eq(presaleParams.merkleRoot);
		});
	});

	describe('Minting process', async () => {
		describe('Presale', async () => {
			it('setCurrentPhase', async () => {
				await psychonautz.setCurrentPhase(1);
				const settedPhase = await psychonautz.currentPhase();
				expect(1).to.eq(settedPhase);
			});

			it('Is allow list eligible', async() => {
				const claimingAddress = buyer.address;
				const hexProof = merkleTree.getHexProof(keccak256(claimingAddress));
				const allowed = await asBuyer.isAllowListEligible(1, buyer.address, hexProof);
				expect(allowed).to.be.true;
			});
			
			it('Presale mint', async() => {
				const claimingAddress = keccak256(buyer.address);
				const hexProof = merkleTree.getHexProof(claimingAddress);
				await asBuyer.mintPresale(1, hexProof, 1);
			});
		});
	});
});