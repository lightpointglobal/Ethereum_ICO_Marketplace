const LightpointMarketplace = artifacts.require('LightpointMarketplace');
const LightpointToken = artifacts.require('LightpointToken');

require('chai')
.use(require('chai-as-promised'))
.should();

contract('LightpointMarketplace', ([deployer, seller, buyer]) => {
    let marketplace;
    let tokenInstance;

    before(async()=>{
        tokenInstance = await LightpointToken.deployed();
        marketplace = await LightpointMarketplace.deployed();
    })

    describe('deployment', async() => {
        it('deploys successfully', async()=>{
            const address = await marketplace.address;
            assert.notEqual(address, 0x0);
            assert.notEqual(address, '');
            assert.notEqual(address, null);
            assert.notEqual(address, undefined);
        })

        it('has a name', async ()=> {
            const name = await marketplace.name();
            assert.equal(name, 'Lightpoint Marketplace');
        })
    })

    describe('products', async() => {
        let result, productCount;
        before(async()=>{
            result = await marketplace.createProduct('iPhone X', 1000, {from:seller});
            productCount = await marketplace.productCount();
        })

        it('creates products', async ()=> {
            // SUCCESS
            assert.equal(productCount, 1);
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct');
            assert.equal(event.name, 'iPhone X', 'name is correct');
            assert.equal(event.price, '1000', 'price is correct');
            assert.equal(event.owner, seller, 'owner is correct');
            assert.equal(event.purchased, false, 'purchased is correct');

            //FAILURE: Product must have a name
            marketplace.createProduct('', 1000, {from:seller}).should.be.rejected;

            
            //FAILURE: Product must have a price
            marketplace.createProduct('iPhone X', 0, {from:seller}).should.be.rejected;
        })

        it('lists products', async ()=> {
            // SUCCESS
            const product = await marketplace.products(productCount);
            assert.equal(product.id.toNumber(), productCount.toNumber(), 'id is correct');
            assert.equal(product.name, 'iPhone X', 'name is correct');
            assert.equal(product.price, '1000', 'price is correct');
            assert.equal(product.owner, seller, 'owner is correct');
            assert.equal(product.purchased, false, 'purchased is correct');
        })

        it('sells products', async ()=> {
            await tokenInstance.transfer(buyer, 10000, {from:deployer})
            // Track the seller balance before purchase
            let oldSellerBalance = await tokenInstance.balanceOf(seller);
            await tokenInstance.approve(marketplace.address, 1000, {from:buyer});
            const result = await marketplace.purchaseProduct(productCount,{from:buyer, value: 1000})

            //Check logs
            const event = result.logs[0].args;
            assert.equal(event.id.toNumber(), productCount.toNumber(), 'id is correct');
            assert.equal(event.name, 'iPhone X', 'name is correct');
            assert.equal(event.price, '1000', 'price is correct');
            assert.equal(event.owner, buyer, 'owner is correct');
            assert.equal(event.purchased, true, 'purchased is correct');

            // Check that seller received funds
            let newSellerBalance = await tokenInstance.balanceOf(seller);

            const expectedBalance = oldSellerBalance.toNumber() + 1000;

            assert.equal(newSellerBalance.toNumber(), expectedBalance);

            
            // FAILURE: Tries to but product that does not exists, i.e., product must have valid id
            marketplace.purchaseProduct(99, {from:buyer, value: 1000}).should.be.rejected;

            // FAILURE: Buyer tries to buy without enought LPT
            marketplace.purchaseProduct(productCount, {from:buyer, value: 500}).should.be.rejected;

            // FAILURE: Deployer tries to but the product, i.e., product can't be purchased twice
            marketplace.purchaseProduct(productCount, {from:deployer, value: 1000}).should.be.rejected;

            // FAILURE: Buyer tries to buy again, i.e., buyer can't be the seller
            marketplace.purchaseProduct(productCount, {from:buyer, value: 1000}).should.be.rejected;
        })
    })
})