const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ICO', async function () {
  let ERC20, erc20, ICO, ico, owner, alice, bob;
  const INITIAL_SUPPLY = ethers.utils.parseEther('100');
  const OFFER_SUPPLY = ethers.utils.parseEther('20');
  const BUY_AMOUNT = ethers.utils.parseEther('1');
  const PRICE = 100;
  const TOKEN_AMOUNT = BUY_AMOUNT.div(PRICE);
  const TIME = 3600;
  const LOCKED = true;
  beforeEach(async function () {
    ;[owner, alice, bob] = await ethers.getSigners();
    ERC20 = await ethers.getContractFactory('Dev');
    erc20 = await ERC20.connect(owner).deploy(INITIAL_SUPPLY);
    await erc20.deployed();
    ICO = await ethers.getContractFactory('ICO');
    ico = await ICO.connect(owner).deploy(erc20.address, OFFER_SUPPLY, PRICE, TIME, LOCKED);
    await ico.deployed();
    await erc20.approve(ico.address, OFFER_SUPPLY);
  });
  describe('Deployment', async function () {
    it('Should be the good erc20 address', async function () {
      expect(await ico.erc20()).to.equal(erc20.address);
    });
    it('Should be the good owner address', async function () {
      expect(await ico.erc20Owner()).to.equal(owner.address);
    });
    it('Should be the good offer', async function () {
      expect(await ico.offer()).to.equal(OFFER_SUPPLY);
    });
    it('Should be the good price', async function () {
      expect(await ico.price()).to.equal(PRICE);
    });
    it('Should be the good end time', async function () {
      expect(await ico.endTime()).to.above(TIME);
    });
  });
  describe('Buy', async function () {
    let BUY;
    beforeEach(async function () {
      BUY = await ico.connect(alice).buy({ value: BUY_AMOUNT });
    });
    it(`Should increase balance of ${LOCKED ? 'ico' : 'user'}`, async function () {
      expect(await erc20.balanceOf(LOCKED ? ico.address : alice.address)).to.equal(TOKEN_AMOUNT);
    });
    it('Should decrease balance of owner', async function () {
      expect(await erc20.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY.sub(TOKEN_AMOUNT));
    });
    it('Should descrease allowance of ico', async function () {
      expect(await erc20.allowance(owner.address, ico.address)).to.equal(OFFER_SUPPLY.sub(TOKEN_AMOUNT));
    });
    it('Should increase eth balance of ico', async function () {
      expect(await ico.balance()).to.equal(BUY_AMOUNT);
    });
    it('Should emits event Transfer', async function () {
      expect(BUY)
        .to.emit(erc20, 'Transfer')
        .withArgs(owner.address, LOCKED ? ico.address : alice.address, TOKEN_AMOUNT);
    });
    it('Should emits event Approval', async function () {
      expect(BUY)
        .to.emit(erc20, 'Approval')
        .withArgs(owner.address, ico.address, OFFER_SUPPLY.sub(TOKEN_AMOUNT));
    });
    it('Should emits event Bought', async function () {
      expect(BUY)
        .to.emit(ico, 'Bought')
        .withArgs(alice.address, BUY_AMOUNT);
    });
    it('Should revert function if value is higher than offer', async function () {
      await expect(ico.connect(bob).buy({ value: OFFER_SUPPLY.mul(PRICE) }))
        .to.be.revertedWith('ICO: offer less than amount sent');
    });
    it('Should revert function if end time reach', async function () {
      await ethers.provider.send('evm_increaseTime', [TIME]);
      await ethers.provider.send('evm_mine');
      await expect(ico.connect(bob).buy({ value: BUY_AMOUNT }))
        .to.be.revertedWith('ICO: cannot buy after end of ico');
    });
    it('Should revert function if sender is owner', async function () {
      await expect(ico.connect(owner).buy({ value: BUY_AMOUNT }))
        .to.be.revertedWith('ICO: owner cannot buy his token');
    });
  });
  describe('Withdraw', async function () {
    let WITHDRAW;
    beforeEach(async function () {
      await ico.connect(alice).buy({ value: BUY_AMOUNT });
      await ethers.provider.send('evm_increaseTime', [TIME]);
      await ethers.provider.send('evm_mine');
      WITHDRAW = await ico.connect(owner).withdraw();
    });
    it('Should withdraw ico eth balance to owner', async function () {
      expect(WITHDRAW).to.changeEtherBalance(owner, BUY_AMOUNT);
    });
    it('Should set balance of ico to 0', async function () {
      expect(await ico.balance()).to.equal(0);
    });
    it('Should emits event Withdrew with good args', async function () {
      expect(WITHDRAW)
        .to.emit(ico, 'Withdrew')
        .withArgs(owner.address, BUY_AMOUNT);
    });
    it('Should revert function if sender is not owner', async function () {
      await expect(ico.connect(bob).withdraw())
        .to.be.revertedWith('ICO: reserved too owner of erc20');
    });
    it('Should revert function if end time not reach', async function () {
      ico = await ICO.connect(owner).deploy(erc20.address, OFFER_SUPPLY, PRICE, TIME, LOCKED);
      await ico.deployed();
      await expect(ico.connect(owner).withdraw())
        .to.be.revertedWith('ICO: cannot withdraw before end of ico');
    });
  });
  if (LOCKED) {
    describe('Claim', async function () {
      let CLAIM;
      beforeEach(async function () {
        await ico.connect(alice).buy({ value: BUY_AMOUNT });
        await ethers.provider.send('evm_increaseTime', [TIME]);
        await ethers.provider.send('evm_mine');
        CLAIM = await ico.connect(alice).claim();
      });
      it('Should increse balance of user', async function () {
        expect(await erc20.balanceOf(alice.address)).to.equal(TOKEN_AMOUNT);
      });
      it('Should decrease balance of ico', async function () {
        expect(await erc20.balanceOf(ico.address)).to.equal(0);
      });
      it('Should emits event Transfer', async function () {
        expect(CLAIM)
          .to.emit(erc20, 'Transfer')
          .withArgs(ico.address, alice.address, TOKEN_AMOUNT);
      });
      it('Should emits event Claimed', async function () {
        expect(CLAIM)
          .to.emit(ico, 'Claimed')
          .withArgs(alice.address, TOKEN_AMOUNT);
      });
      it('Should reverts function if end time is not reach', async function () {
        await ethers.provider.send('evm_increaseTime', [-TIME]);
        await ethers.provider.send('evm_mine');
        await expect(ico.connect(alice).claim())
          .to.be.revertedWith('ICO: cannot claim before end of ico');
      });
    });
  }
});
