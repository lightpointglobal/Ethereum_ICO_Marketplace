const LightpointToken = artifacts.require('LightpointToken');

contract('LightpointToken', function(accounts){
    var tokenInstance;
    var admin = accounts[0];
    var other = accounts[1];

    before(async() => {
        tokenInstance = await LightpointToken.deployed();
    })

    it('initializes the contract with the correct values', async function(){
        var name = await tokenInstance.name();
        assert.equal(name, "LightpointToken");

        var symbol = await tokenInstance.symbol();
        assert.equal(symbol, "LPT");

        var totalSupply = await tokenInstance.totalSupply();
        assert.equal(totalSupply.toNumber(), 1000000);
    })

    it('transfers token ownership', function() {
        return tokenInstance.transfer(other, 9999999999)
        .then(assert.fail).catch(async function(error){
            assert(error.message.indexOf('revert') >= 0, 'error message must contain revert');
           
            var receipt = await tokenInstance.transfer(other, 250000, {from:admin});
            assert.equal(receipt.logs.length, 1, 'triggers one event');

            var log = receipt.logs[0];
            assert.equal(log.event, 'Transfer', 'should be the "Transfer" event');
            assert.equal(log.args.from, admin, 'logs the account the tokens are trasferred from');
            assert.equal(log.args.to, other, 'logs the account the tokens are trasferred to');
            assert.equal(log.args.value, 250000, 'logs the transfer amount');

            var otherBalance = await tokenInstance.balanceOf(other);
            assert.equal(otherBalance.toNumber(), 250000, 'adds the amount to the receiving account');
            
            var adminBalance = await tokenInstance.balanceOf(admin);
            assert.equal(adminBalance.toNumber(), 750000, 'deducts the amount from the sending account');
        });
    })

    it('approves tokens for delegated transfer', async function(){
        var receipt = await tokenInstance.approve(other, 100);
        assert.equal(receipt.logs.length, 1, 'triggers one event');

        var log = receipt.logs[0];
        assert.equal(log.event, 'Approval', 'should be the "Approval" event');
        assert.equal(log.args.owner, admin, 'logs the account the tokens are trasferred from');
        assert.equal(log.args.spender, other, 'logs the account the tokens are trasferred to');
        assert.equal(log.args.value, 100, 'logs the transfer amount');

        var allowance = await tokenInstance.allowance(admin, other);
        assert.equal(allowance, 100, 'stores the allowance for delegated transfer');
    })

    it('handles delegated token transfers', async function(){
        var fromAccount = accounts[2];
        var toAccount = accounts[3];
        var spendingAccount = accounts[4];

        return tokenInstance.transfer(fromAccount, 100, {from: admin})
        .then(function(receipt){
            return tokenInstance.approve(spendingAccount, 10, {from:fromAccount});
        })
        .then(function(receipt){
            return tokenInstance.transferFrom(fromAccount, toAccount, 9999, {from:spendingAccount});
        })
        .catch(function(error){
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than balance');
            return tokenInstance.transferFrom(fromAccount, toAccount, 20, {from:spendingAccount})
        })
        .then(assert.fail).catch(async function(error){
            assert(error.message.indexOf('revert') >= 0, 'cannot transfer value larger than approved amount');
            var receipt = await tokenInstance.transferFrom(fromAccount, toAccount, 10, {from:spendingAccount})
            assert.equal(receipt.receipt.status, true);

            var log = receipt.logs[0];
            assert.equal(log.event, 'Transfer', 'should be the "Transfer" event');
            assert.equal(log.args.from, fromAccount, 'logs the account the tokens are trasferred from');
            assert.equal(log.args.to, toAccount, 'logs the account the tokens are trasferred to');
            assert.equal(log.args.value, 10, 'logs the transfer amount');
            var fromAccountBalance = await tokenInstance.balanceOf(fromAccount);
            assert.equal(fromAccountBalance.toNumber(), 90, 'deducts the amount from the sending account');
            var toAccountBalance = await tokenInstance.balanceOf(toAccount);
            assert.equal(toAccountBalance.toNumber(), 10, 'adds the amount from the receiving account');
            var allowance = await tokenInstance.allowance(fromAccount, spendingAccount);
            assert.equal(allowance, 0, 'deducts the amount from the allowance');
        })
    })
});