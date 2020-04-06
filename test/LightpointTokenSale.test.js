const LightpointToken = artifacts.require('LightpointToken');
const LightpointTokenSale = artifacts.require('LightpointTokenSale');

contract('LightpointTokenSale', function(accounts){
    var tokenInstance;
    var tokenSaleInstance;
    var _tokenPrice = 1000000000000000;
    var tokensAvailable = 750000;
    var admin = accounts[0];
    var buyer = accounts[1];

    before(async() => {
        tokenInstance = await LightpointToken.deployed();
        tokenSaleInstance = await LightpointTokenSale.deployed();
    })

    it('initializes the contract with the correct values', async function(){
        assert.notEqual(tokenSaleInstance.address, 0x0, 'has contract address');

        var tokenContract = await tokenSaleInstance.tokenContract();
        assert.notEqual(tokenContract, 0x0, 'has token contract address');

        var tokenPrice = await tokenSaleInstance.tokenPrice();
        assert.equal(tokenPrice, _tokenPrice, 'token price is correct');
    })


    it('facilitates token buying', async function (){
        
        // Provision 75% of all tokents to the token sale
        await tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, {from:admin})

        var numberOfTokens = 10;
        return tokenSaleInstance.buyTokens(numberOfTokens, { from:buyer, value: numberOfTokens*_tokenPrice })
        .then(assert.fail)
        .catch(async function(error){
            assert(error.message.indexOf('revert') >= 0, 'should be sale started');

            await tokenSaleInstance.startSale();

            var receipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from:buyer, value: numberOfTokens*_tokenPrice })
            assert.equal(receipt.logs.length, 1, 'triggers one event');

            var log = receipt.logs[0];
            assert.equal(log.event, 'Sell', 'should be the "Sell" event');
            assert.equal(log.args.buyer, buyer, 'logs the account that purchased the tokens');
            assert.equal(log.args.amount, numberOfTokens, 'logs the number of tokens purchased');
            
            var tokenSold = await tokenSaleInstance.tokensSold();
            assert.equal(tokenSold.toNumber(), numberOfTokens, 'increments the number of tokens sold');

            var buyerBalance = await tokenInstance.balanceOf(buyer);
            assert.equal(buyerBalance.toNumber(), numberOfTokens);

            var saleBalance = await tokenInstance.balanceOf(tokenSaleInstance.address);
            assert.equal(saleBalance.toNumber(), tokensAvailable - numberOfTokens);


            return  tokenSaleInstance.buyTokens(numberOfTokens, { from:buyer, value: 1 })
            .then(assert.fail).catch(async function(error){
                assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');

                return  tokenSaleInstance.buyTokens(800000, { from:buyer, value: 800000 * _tokenPrice })
                .then(assert.fail).catch(function(error){
                    assert(error.message.indexOf("sender doesn't have enough funds") >= 0, 'cannot purchase more tokens than available');
                });
            });
        })
    });

    it('ends token sale', function(){
       return tokenSaleInstance.endSale({from:buyer})
        .then(assert.fail).catch(async function(error){
            assert(error.message.indexOf('revert') >= 0, 'must be admin to end sale');

            await tokenSaleInstance.endSale({from: admin});
            
            var adminBalance = await tokenInstance.balanceOf(admin);
            assert.equal(adminBalance.toNumber(), 999990);
            
        });
    })
});