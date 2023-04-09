/*
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const compiledContract = require('./build/MyContract.json');

const provider = new HDWalletProvider(
  'seed mnemonic',
  'https://rinkeby.infura.io/v3/your-project-id'
);

const web3 = new Web3(provider);

const deploy = async () => {

  const accounts = await web3.eth.getAccounts();
  console.log('Déploiement du contrat à partir du compte', accounts[0]);
    const result = await new web3.eth.Contract(
    JSON.parse(compiledContract.interface)
  )
    .deploy({ data: '0x' + compiledContract.bytecode })
    .send({ gas: '1000000', from: accounts[0] });

  console.log('Adresse du contrat déployé :', result.options.address);
};

deploy();*/

const WormHoleCash = artifacts.require("WormHoleCash");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const constants = require('@openzeppelin/test-helpers/src/constants'); 
//const ERC20 = artifacts.require("node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol");
const ERC20 = artifacts.require("IERC20");

contract("WormHoleCash", accounts => {
  const user1 = accounts[0];
  const user2 = accounts[1];
  const LINK = "0x326C977E6efc84E512bB9C30f76E30c160eD06FB";
  const nullAddress = "0x0000000000000000000000000000000000000000";
  
  let WHCInstance;
  context('// ::::::::::::: WORM HOLE CACH TESTS ::::::::::::: //', function() {
    describe('Change step Revert Wrong step', function() {

      beforeEach(async function () {
        WHCInstance = await WormHoleCash.new({from: user1});
      })

      it('Should fail change step to SwapBack', async () => {
        await expectRevert(WHCInstance.SwapBack(1,user2, {from: user1}), "Wrong step");
      });

      it('Should fail change step to WithdrawMixer', async () => {
        await expectRevert(WHCInstance.WithdrawMixer({from: user1}), "Wrong step");
      });

      it('Should fail change step to DepositMixer', async () => {
        await expectRevert(WHCInstance.DepositMixer({from: user1}), "Wrong step");
      });

      it('Should fail change step to Swap', async () => {
        await expectRevert(WHCInstance.Swap(1,user2, {from: user1}), "Wrong step");
      });
      
      it('Should fail change step to Settings', async () => {
        await expectRevert(WHCInstance.Settings(user2, {from: user1}), "Wrong step");
      });
      
      it('Should fail change step to Selection', async () => {
        await WHCInstance.Selection(LINK, {from: user1});
        await expectRevert(WHCInstance.Selection(LINK, {from: user1}), "Wrong step");
      });
  
    });


    describe('Selection tests', function() {
      
      beforeEach(async function () {
        WHCInstance = await WormHoleCash.new({from: user1});
      })

      it('getCurrentStep =0', async () => {
        let tx = await WHCInstance.getCurrentStep.call({from: user1});
        expect(tx).to.be.bignumber.equal(new BN(0));
      });

      it('Should fail to set a null address', async () => {
        await expectRevert(WHCInstance.Selection(nullAddress, {from: user1}), "The selected address cannot be null");
      });

      it('Should event StepChanged', async () => {
        const tx = await WHCInstance.Selection(LINK, {from: user1});
        expectEvent(tx, 'StepChanged', { user: user1, previousStatus: new BN(0) ,  newStatus: new BN(1) });
      });

      it('Should event TokenListed', async () => {
        const tx = await WHCInstance.Selection(LINK, {from: user1});
        expectEvent(tx, 'TokenListed', { user: user1 ,
          tokenSelected: [
              LINK,
              "1",
              "0"
          ] 
         });
      });

    });

    describe('Settings tests', function() {
      
      beforeEach(async function () {
        WHCInstance = await WormHoleCash.new({from: user1});
        await WHCInstance.Selection(LINK, {from: user1});
      })

      it('getCurrentStep =2', async () => {
        await WHCInstance.Settings(user2, {from: user1});
        let tx = await WHCInstance.getCurrentStep.call({from: user1});
        expect(tx).to.be.bignumber.equal(new BN(2));
      });

      it('Should fail to set a null address', async () => {
        await expectRevert(WHCInstance.Settings(nullAddress, {from: user1}), "The output address cannot be null");
      });

      it('Should event StepChanged', async () => {
        const tx = await WHCInstance.Settings(user2, {from: user1});
        expectEvent(tx, 'StepChanged', { user: user1, previousStatus: new BN(1) ,  newStatus: new BN(2) });
      });

      it('Should event OutputAddressSet', async () => {
        const tx = await WHCInstance.Settings(user2, {from: user1});
        expectEvent(tx, 'OutputAddressSet', { user: user1 , outputAddress: user2 }); 
      });
    });

    describe('Swap tests', function() {
      
      beforeEach(async function () {
        WHCInstance = await WormHoleCash.new({from: user1});
        await WHCInstance.Selection(LINK, {from: user1});
        await WHCInstance.Settings(user2, {from: user1});
      })  

      it('Should fail to set a null address', async () => {
        await expectRevert(WHCInstance.Swap(1,nullAddress, {from: user1}), "The token address cannot be null");
      });

      it('Should fail to set a null amount', async () => {
        await expectRevert(WHCInstance.Swap(0,LINK, {from: user1}), "amountIn param must be greater than 0");
      });

      it('Should event StepChanged', async () => {
        LINKapproved = await ERC20.at(LINK);
        await LINKapproved.approve(WHCInstance.address, 99999999, { from: user1 });
        const tx = await WHCInstance.Swap(99999999, LINK, {from: user1});
        expectEvent(tx, 'StepChanged', { user: user1, previousStatus: new BN(2) ,  newStatus: new BN(3) });
      });

      
      it.skip('getUserData', async () => {
        let tx = await WHCInstance.getUserData.call({from: user1});
        expect(tx).to.be.bignumber.equal(new BN(3));
      });  


    });

  });

});