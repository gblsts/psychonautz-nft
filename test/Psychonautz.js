// const context = require('./context.js');
const { ethers } = require("hardhat");
const chai = require('chai');
const { solidity } = require('ethereum-waffle');
const { expect } = require("chai");

chai.use(solidity);

let psychonautz;

describe('Psychonautz NFT contract', () => {
	before(async () => {
		[owner, artist, notOwner] = await ethers.getSigners();
		const Psychonautz = await ethers.getContractFactory("Psychonautz");
		psychonautz = await Psychonautz.deploy(
			[
				owner.address,
				artist.address
			],
			[
				30,
				70
			]
		);
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

		before(async () => {
			asNotOwner = psychonautz.connect(notOwner);
		});

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

		it('setNotRevealedURI', async () => {
			await expect(asNotOwner.setNotRevealedURI('NOT-REVEALED-URI')).to.be.revertedWith(
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

		before(async () => {
			asOwner = psychonautz.connect(owner);
		});

		it('setProvenanceHash', async () => {
			const provenanceHash = 'PROVENANCE-HASH';
			await asOwner.setProvenanceHash(provenanceHash);
			const settedProvenanceHash = await asOwner.PSYCHONAUTZ_PROVENANCE();
			expect(provenanceHash).to.eq(settedProvenanceHash);
		});
	});
});