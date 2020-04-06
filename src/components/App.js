import React, { Component } from 'react';
import Web3 from 'web3'
import TruffleContract from '@truffle/contract'
import './App.css';
import Navbar from './Navbar'
import Main from './Main'

import LightpointToken from '../abis/LightpointToken.json';
import LightpointTokenSale from '../abis/LightpointTokenSale.json';
import LightpointMarketplace from '../abis/LightpointMarketplace.json';
class App extends Component {

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      products: [],
      loading: true,
      tokenPrice: 1000000000000000,
      tokensSold: 0,
      tokensAvailable: 500000,
      lptBalance : 0
    }

    this.createProduct = this.createProduct.bind(this);
    this.purchaseProduct = this.purchaseProduct.bind(this);
    this.buyTokens = this.buyTokens.bind(this);
    this.startSale = this.startSale.bind(this);
    this.pauseSale = this.pauseSale.bind(this);
    this.endSale = this.endSale.bind(this);
  }

  async componentWillMount(){
    await this.loadWeb3();
  }

  async loadWeb3(){
    // Modern dapp browsers...
    if(window.ethereum) {
      this.web3Provider = window.ethereum;
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      this.web3Provider = window.web3.currentProvider;
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      this.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      window.web3 = new Web3(this.web3Provider);
    }
    await this.initContracts();
  }

  async initContracts() {
    var _this = this;
    var account = (await window.web3.eth.getAccounts())[0];
    _this.setState({ account });
    this.contracts = [];
    this.contracts.LightpointToken = TruffleContract(LightpointToken);
    this.contracts.LightpointToken.setProvider(this.web3Provider);
    this.contracts.LightpointToken.deployed().then(function(lightpointToken) {
      _this.LightpointTokenInstance = lightpointToken;
      console.log("Lightpoint Token Address:", lightpointToken.address);
  
      _this.contracts.LightpointTokenSale = TruffleContract(LightpointTokenSale);
      _this.contracts.LightpointTokenSale.setProvider(_this.web3Provider);
      _this.contracts.LightpointTokenSale.deployed().then(function(lightpointTokenSale) {
        _this.LightpointTokenSaleInstance = lightpointTokenSale;
        console.log("Lightpoint Token Sale Address:", lightpointTokenSale.address);

        _this.contracts.LightpointMarkeplace = TruffleContract(LightpointMarketplace);
        _this.contracts.LightpointMarkeplace.setProvider(_this.web3Provider);
        _this.contracts.LightpointMarkeplace.deployed().then(async function(lightpointMarkeplace) {
            _this.LightpointMarketplaceInstance = lightpointMarkeplace;
            console.log("Lightpoint Markeplace Address:", lightpointMarkeplace.address);
            await _this.listenForEvents();
            await _this.loadTokenSaleData();
            await _this.loadProductsData();
        });
      });
    });
  }

  async listenForEvents() {
    var _this = this;
    this.LightpointTokenSaleInstance.Sell({
      fromBlock: 'latest'
    }, async function(error, event) {
      console.log("event triggered", event);
      await _this.loadTokenSaleData();
    });

    this.LightpointTokenSaleInstance.SaleChanged({
      fromBlock: 'latest'
    }, async function(error, event) {
      console.log("event triggered", event);
      await _this.loadTokenSaleData();
    });

    this.LightpointMarketplaceInstance.ProductCreated({
      fromBlock: 'latest'
    }, async function(error, event) {
      console.log("event triggered", event);
      await _this.loadProductsData();
    });
    
    this.LightpointMarketplaceInstance.ProductPurchased({
      fromBlock: 'latest'
    }, async function(error, event) {
      console.log("event triggered", event);
      await _this.loadTokenSaleData();
      await _this.loadProductsData();
    });
  }

  async loadTokenSaleData(){
    
    this.setState({ loading: true });

    const onSale = await this.LightpointTokenSaleInstance.onSale();
    this.setState({ onSale });

    const admin = await this.LightpointTokenSaleInstance.admin();
    this.setState({ tokenSaleAdmin: admin });

    const tokenPrice = await this.LightpointTokenSaleInstance.tokenPrice();
    this.setState({ tokenPrice });

    const tokensSold = await this.LightpointTokenSaleInstance.tokensSold();
    this.setState({ tokensSold });

    const lptBalance = await this.LightpointTokenInstance.balanceOf(this.state.account);
    this.setState({ lptBalance });

    this.setState({ loading: false });
  }

  async loadProductsData(){
    this.setState({ loading:true, products: [] });
    var productCount = await this.LightpointMarketplaceInstance.productCount();
    for(var i = 1; i <= productCount; i++){
      const product = await this.LightpointMarketplaceInstance.products(i);
      this.setState({ products: [...this.state.products, product] });
    }
    this.setState({ loading: false });
  }

  async createProduct(name, price){
    this.setState({ loading: true });
    await this.LightpointMarketplaceInstance.createProduct(name, price, { from: this.state.account });
    this.setState({loading:false});
  }

  async purchaseProduct(id, price){
    this.setState({ loading: true });
    await this.LightpointTokenInstance.approve(this.LightpointMarketplaceInstance.address, price, { from:this.state.account });
    await this.LightpointMarketplaceInstance.purchaseProduct(id, { from: this.state.account, value: price })
    this.setState({ loading: false });
  }

  async buyTokens(numberOfTokens){
    this.setState({ loading: true });
    await this.LightpointTokenSaleInstance.buyTokens(numberOfTokens, { from: this.state.account, value: numberOfTokens * this.state.tokenPrice });
    this.setState({ loading: false });
  }

  async startSale(){
    this.setState({ loading: true });
    await this.LightpointTokenInstance.transfer(this.LightpointTokenSaleInstance.address, this.state.tokensAvailable, {from:this.state.account})
    await this.LightpointTokenSaleInstance.startSale({ from: this.state.account });
    this.setState({ loading: false });
  }

  async pauseSale(){
    this.setState({ loading: true });
    await this.LightpointTokenSaleInstance.pauseSale({ from: this.state.account });
    this.setState({ loading: false });
  }

  async endSale(){
    this.setState({ loading: true });
    await this.LightpointTokenSaleInstance.endSale({ from: this.state.account });
    this.setState({ loading: false });
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              {this.state.loading 
                ? <div id="loader" className="text-center"><p className="text-center">Loading...</p></div> 
                : <Main 
                products={this.state.products} 
                createProduct={this.createProduct} 
                purchaseProduct={this.purchaseProduct} 
                buyTokens={this.buyTokens} 
                startSale={this.startSale} 
                pauseSale={this.pauseSale} 
                endSale={this.endSale} 
                tokensSold={this.state.tokensSold} 
                tokensAvailable={this.state.tokensAvailable} 
                lptBalance={this.state.lptBalance}
                onSale={this.state.onSale}
                tokenSaleAdmin={this.state.tokenSaleAdmin}
                tokenPrice={window.web3.utils.fromWei(this.state.tokenPrice.toString(), 'Ether')} 
                account={this.state.account}
                />
              }
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
