/* eslint-disable no-undef */
const { expect } = require('chai');

describe('Calculator', () => {
  let dev, ownerToken, ownerCalculator, alice, Token, token, Calculator, calculator, Test, test;

  beforeEach(async () => {
    [dev, ownerToken, ownerCalculator, alice] = await ethers.getSigners();
    Token = await ethers.getContractFactory('Token');
    token = await Token.connect(dev).deploy(ownerToken.address);
    await token.deployed();
    Calculator = await ethers.getContractFactory('Calculator');
    calculator = await Calculator.deploy(token.address, ownerCalculator.address);
    await calculator.deployed();
    await token.connect(ownerToken).transfer(dev.address, ethers.utils.parseEther('4'));
    await token.approve(calculator.address, ethers.utils.parseEther('4'));
  });

  describe('Deployment', function () {
    it('Should return owner address', async function () {
      expect(await calculator.owner()).to.equal(ownerCalculator.address);
    });
    it('Should return the price to use calculator function', async function () {
      expect(await calculator.price()).to.equal(ethers.utils.parseEther('1'));
    });
  });

  describe('Payment method', function () {
    beforeEach(async function () {
      await token.connect(ownerToken).transfer(alice.address, ethers.utils.parseEther('1'));
      await token.connect(alice).approve(calculator.address, ethers.utils.parseEther('1000'));
    });

    it('Should transfer 1 token from alice to ownerCalculator', async function () {
      await calculator.connect(alice).add(3, 7);
      expect(await token.balanceOf(alice.address)).to.equal(0);
      expect(await token.allowance(alice.address, calculator.address)).to.equal(ethers.utils.parseEther('999'));
      expect(await token.balanceOf(ownerCalculator.address)).to.equal(ethers.utils.parseEther('1'));
    });
    it('Should revert if not enough token', async function () {
      await calculator.connect(alice).add(3, 7);
      await expect(calculator.connect(alice).mul(6, 2)).to.be.revertedWith(
        'Calculator: you do not have enough token to use this function'
      );
    });
    it('Should revert if not approve for at least 1 token', async function () {
      await expect(calculator.connect(ownerToken).sub(5, 12)).to.be.revertedWith(
        'Calculator: you need to approve this smart contract for at least 1 token before using it'
      );
    });
  });

  describe('Addition', function () {
    it('Should addition 2 numbers correctly', async function () {
      await expect(calculator.add(2, 3)).to.emit(calculator, 'Calculated').withArgs('Addition', dev.address, 2, 3, 5);
      await expect(calculator.add(-2, 3)).to.emit(calculator, 'Calculated').withArgs('Addition', dev.address, -2, 3, 1);
      await expect(calculator.add(2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Addition', dev.address, 2, -3, -1);
      await expect(calculator.add(-2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Addition', dev.address, -2, -3, -5);
    });
  });
  describe('Subtraction', () => {
    it('Should subtract 2 numbers correctly', async () => {
      await expect(calculator.sub(2, 3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Substraction', dev.address, 2, 3, -1);
      await expect(calculator.sub(-2, 3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Substraction', dev.address, -2, 3, -5);
      await expect(calculator.sub(2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Substraction', dev.address, 2, -3, 5);
      await expect(calculator.sub(-2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Substraction', dev.address, -2, -3, 1);
    });
  });

  describe('Multiplication', () => {
    it('Should multiply 2 numbers correctly', async () => {
      await expect(calculator.mul(2, 0))
        .to.emit(calculator, 'Calculated')
        .withArgs('Multiplication', dev.address, 2, 0, 0);
      await expect(calculator.mul(2, 3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Multiplication', dev.address, 2, 3, 6);
      await expect(calculator.mul(2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Multiplication', dev.address, 2, -3, -6);
      await expect(calculator.mul(-2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Multiplication', dev.address, -2, -3, 6);
    });
  });

  describe('Division', () => {
    it('Should revert: can not divide by zero', async () => {
      await expect(calculator.div(2, 0)).to.be.revertedWith('Calculator: can not divide by zero');
    });

    it('Should divide 2 numbers correctly', async () => {
      await expect(calculator.div(2, 3)).to.emit(calculator, 'Calculated').withArgs('Division', dev.address, 2, 3, 0);
      await expect(calculator.div(3, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Division', dev.address, 3, -3, -1);
      await expect(calculator.div(-3, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Division', dev.address, -3, -3, 1);
      await expect(calculator.div(0, -3)).to.emit(calculator, 'Calculated').withArgs('Division', dev.address, 0, -3, 0);
    });
  });

  describe('Modulus', () => {
    it('Should revert: can not modulus by zero', async () => {
      await expect(calculator.mod(2, 0)).to.be.revertedWith('Calculator: can not modulus by zero');
    });

    it('Should modulus 2 numbers correctly', async () => {
      await expect(calculator.mod(2, 3)).to.emit(calculator, 'Calculated').withArgs('Modulus', dev.address, 2, 3, 2);
      await expect(calculator.mod(2, -3)).to.emit(calculator, 'Calculated').withArgs('Modulus', dev.address, 2, -3, 2);
      await expect(calculator.mod(-2, 3)).to.emit(calculator, 'Calculated').withArgs('Modulus', dev.address, -2, 3, -2);
    });
  });
  // how to get return value from transaction hash
  describe('Test', function () {
    it('TEST ADD', async function () {
      Test = await ethers.getContractFactory('Test');
      test = await Test.deploy(calculator.address, token.address);
      await test.deployed();
      await token.connect(ownerToken).transfer(test.address, ethers.utils.parseEther('4'));
      await test.approveCalc(calculator.address, ethers.utils.parseEther('4'));
      await test.test(3, 4);
      // await ethers.provider.send('evm_mine');
      expect(await test.result()).to.equal(7);
    });
    // test for changeTokenBalance
    it('changeTokenBalance', async function () {
      const tx = token.connect(ownerToken).transfer(alice.address, 200);
      expect(() => tx).to.changeTokenBalance(token, alice, 200);
    });
    // changeTokenBalance with calculator function
    it('Calc: changeTokenBalance', async function () {
      await token.connect(ownerToken).transfer(alice.address, ethers.utils.parseEther('1'));
      await token.connect(alice).approve(calculator.address, ethers.utils.parseEther('1'));
      const tx2 = calculator.connect(alice).add(3, 5);
      await expect(() => tx2).to.changeTokenBalance(token, alice, ethers.utils.parseEther('-1'));
      expect(tx2).to.emit(calculator, 'Calculated').withArgs('Addition', alice.address, 3, 5, 8);
    });
  });/* eslint-disable no-undef */
const { expect } = require('chai');

describe('Calculator', () => {
  let dev, ownerToken, ownerCalculator, alice, Token, token, Calculator, calculator, Test, test;

  beforeEach(async () => {
    [dev, ownerToken, ownerCalculator, alice] = await ethers.getSigners();
    Token = await ethers.getContractFactory('Token');
    token = await Token.connect(dev).deploy(ownerToken.address);
    await token.deployed();
    Calculator = await ethers.getContractFactory('Calculator');
    calculator = await Calculator.deploy(token.address, ownerCalculator.address);
    await calculator.deployed();
    await token.connect(ownerToken).transfer(dev.address, ethers.utils.parseEther('4'));
    await token.approve(calculator.address, ethers.utils.parseEther('4'));
  });

  describe('Deployment', function () {
    it('Should return owner address', async function () {
      expect(await calculator.owner()).to.equal(ownerCalculator.address);
    });
    it('Should return the price to use calculator function', async function () {
      expect(await calculator.price()).to.equal(ethers.utils.parseEther('1'));
    });
  });

  describe('Payment method', function () {
    beforeEach(async function () {
      await token.connect(ownerToken).transfer(alice.address, ethers.utils.parseEther('1'));
      await token.connect(alice).approve(calculator.address, ethers.utils.parseEther('1000'));
    });

    it('Should transfer 1 token from alice to ownerCalculator', async function () {
      await calculator.connect(alice).add(3, 7);
      expect(await token.balanceOf(alice.address)).to.equal(0);
      expect(await token.allowance(alice.address, calculator.address)).to.equal(ethers.utils.parseEther('999'));
      expect(await token.balanceOf(ownerCalculator.address)).to.equal(ethers.utils.parseEther('1'));
    });
    it('Should revert if not enough token', async function () {
      await calculator.connect(alice).add(3, 7);
      await expect(calculator.connect(alice).mul(6, 2)).to.be.revertedWith(
        'Calculator: you do not have enough token to use this function'
      );
    });
    it('Should revert if not approve for at least 1 token', async function () {
      await expect(calculator.connect(ownerToken).sub(5, 12)).to.be.revertedWith(
        'Calculator: you need to approve this smart contract for at least 1 token before using it'
      );
    });
  });

  describe('Addition', function () {
    it('Should addition 2 numbers correctly', async function () {
      await expect(calculator.add(2, 3)).to.emit(calculator, 'Calculated').withArgs('Addition', dev.address, 2, 3, 5);
      await expect(calculator.add(-2, 3)).to.emit(calculator, 'Calculated').withArgs('Addition', dev.address, -2, 3, 1);
      await expect(calculator.add(2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Addition', dev.address, 2, -3, -1);
      await expect(calculator.add(-2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Addition', dev.address, -2, -3, -5);
    });
  });
  describe('Subtraction', () => {
    it('Should subtract 2 numbers correctly', async () => {
      await expect(calculator.sub(2, 3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Substraction', dev.address, 2, 3, -1);
      await expect(calculator.sub(-2, 3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Substraction', dev.address, -2, 3, -5);
      await expect(calculator.sub(2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Substraction', dev.address, 2, -3, 5);
      await expect(calculator.sub(-2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Substraction', dev.address, -2, -3, 1);
    });
  });

  describe('Multiplication', () => {
    it('Should multiply 2 numbers correctly', async () => {
      await expect(calculator.mul(2, 0))
        .to.emit(calculator, 'Calculated')
        .withArgs('Multiplication', dev.address, 2, 0, 0);
      await expect(calculator.mul(2, 3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Multiplication', dev.address, 2, 3, 6);
      await expect(calculator.mul(2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Multiplication', dev.address, 2, -3, -6);
      await expect(calculator.mul(-2, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Multiplication', dev.address, -2, -3, 6);
    });
  });

  describe('Division', () => {
    it('Should revert: can not divide by zero', async () => {
      await expect(calculator.div(2, 0)).to.be.revertedWith('Calculator: can not divide by zero');
    });

    it('Should divide 2 numbers correctly', async () => {
      await expect(calculator.div(2, 3)).to.emit(calculator, 'Calculated').withArgs('Division', dev.address, 2, 3, 0);
      await expect(calculator.div(3, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Division', dev.address, 3, -3, -1);
      await expect(calculator.div(-3, -3))
        .to.emit(calculator, 'Calculated')
        .withArgs('Division', dev.address, -3, -3, 1);
      await expect(calculator.div(0, -3)).to.emit(calculator, 'Calculated').withArgs('Division', dev.address, 0, -3, 0);
    });
  });

  describe('Modulus', () => {
    it('Should revert: can not modulus by zero', async () => {
      await expect(calculator.mod(2, 0)).to.be.revertedWith('Calculator: can not modulus by zero');
    });

    it('Should modulus 2 numbers correctly', async () => {
      await expect(calculator.mod(2, 3)).to.emit(calculator, 'Calculated').withArgs('Modulus', dev.address, 2, 3, 2);
      await expect(calculator.mod(2, -3)).to.emit(calculator, 'Calculated').withArgs('Modulus', dev.address, 2, -3, 2);
      await expect(calculator.mod(-2, 3)).to.emit(calculator, 'Calculated').withArgs('Modulus', dev.address, -2, 3, -2);
    });
  });
  // how to get return value from transaction hash
  describe('Test', function () {
    it('TEST ADD', async function () {
      Test = await ethers.getContractFactory('Test');
      test = await Test.deploy(calculator.address, token.address);
      await test.deployed();
      await token.connect(ownerToken).transfer(test.address, ethers.utils.parseEther('4'));
      await test.approveCalc(calculator.address, ethers.utils.parseEther('4'));
      await test.test(3, 4);
      // await ethers.provider.send('evm_mine');
      expect(await test.result()).to.equal(7);
    });
    // test for changeTokenBalance
    it('changeTokenBalance', async function () {
      const tx = token.connect(ownerToken).transfer(alice.address, 200);
      expect(() => tx).to.changeTokenBalance(token, alice, 200);
    });
    // changeTokenBalance with calculator function
    it('Calc: changeTokenBalance', async function () {
      await token.connect(ownerToken).transfer(alice.address, ethers.utils.parseEther('1'));
      await token.connect(alice).approve(calculator.address, ethers.utils.parseEther('1'));
      const tx2 = calculator.connect(alice).add(3, 5);
      await expect(() => tx2).to.changeTokenBalance(token, alice, ethers.utils.parseEther('-1'));
      expect(tx2).to.emit(calculator, 'Calculated').withArgs('Addition', alice.address, 3, 5, 8);
    });
  });
});
});
