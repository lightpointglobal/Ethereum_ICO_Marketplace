import React, { Component } from 'react';

class Main extends Component {

  render() {
    return (
        <div className="content col-md-6 offset-md-3 pt-5">
            <p>
                Introducing "Lightpoint Token" (LPT)!
                Token price is {this.props.tokenPrice} Ether. You currently have {this.props.lptBalance.toString()}&nbsp;LPT.
            </p>
            {this.props.onSale 
            ?   <div>
                    <form onSubmit={(event) => {
                        event.preventDefault()
                        this.props.buyTokens(this.numberOfTokens.value);
                    }}>
                        <div className="form-group">
                            <div className="input-group input-group-lg">
                                <input  id="numberOfTokens" 
                                        className="form-control input-lg" 
                                        ref={(input) => { this.numberOfTokens = input }}
                                        type="number" 
                                        min="1" 
                                        pattern="[0-9]"
                                        placeholder="Number of tokens"
                                        required />
                                <span className="input-group-append">
                                    <button type="submit" className="btn btn-primary btn-lg">Buy Tokens</button>
                                </span>
                            </div>
                        </div>
                    </form>
                    <br />
                    <div className="progress">
                        <div id="progress" className="progress-bar progress-bar-striped active" aria-valuemin="0" aria-valuemax="100" style={{width: ((Math.ceil(this.props.tokensSold) / this.props.tokensAvailable) * 100).toString() + "%"}}></div>
                    </div>
                    <p><span id="tokensSold">{this.props.tokensSold.toString()}</span>&nbsp;/&nbsp;{this.props.tokensAvailable.toString()} tokens sold</p>
                    
                    {this.props.tokenSaleAdmin === this.props.account
                    ?    <div><button type="button" className="btn btn-primary mr-2" onClick={(event) => {this.props.pauseSale()}}>Pause Sale</button>
                        <button type="button" className="btn btn-primary" onClick={(event) => {this.props.endSale()}}>End Sale</button></div>
                    :    null}
                </div>
            :  (this.props.tokenSaleAdmin === this.props.account 
                ?   <button className="btn btn-primary" onClick={(event) => {this.props.startSale()}}>Start Sale</button>
                :   null)}

            <h1 className="mt-5">Add Product</h1>
            <form onSubmit={(event) => {
                event.preventDefault()
                this.props.createProduct( this.productName.value, this.productPrice.value);
            }}>
            <div className="form-group mr-sm-2">
                <input
                id="productName"
                type="text"
                ref={(input) => { this.productName = input }}
                className="form-control"
                placeholder="Product Name"
                required />
            </div>
            <div className="form-group mr-sm-2">
                <div className="input-group">
                    <input
                        id="productPrice"
                        type="number"
                        ref={(input) => { this.productPrice = input }}
                        className="form-control"
                        placeholder="Product Price"
                        min="1" 
                        pattern="[0-9]"
                        required /> 
                    <div className="input-group-append">
                    <span className="input-group-text">LPT</span>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Add Product</button>
            </form>
            <p> </p>
            <h2>Buy Product</h2>
            <table className="table">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Name</th>
                    <th scope="col">Price</th>
                    <th scope="col">Owner</th>
                    <th scope="col"></th>
                </tr>
            </thead>
            <tbody id="productList">
                {this.props.products.map((product,key)=>{
                   return (
                    <tr key={key}>
                        <th scope="row">{product.id.toString()}</th>
                        <td>{product.name}</td>
                        <td>{product.price.toString()} LPT</td>
                        <td>{product.owner}</td>
                        <td>
                            {!product.purchased && product.owner !== this.props.account
                            ? <button className="btn btn-sm btn-primary"
                                name={product.id} 
                                value={product.price}
                                onClick={(event)=>{
                                    this.props.purchaseProduct(event.target.name, event.target.value);
                                }}>Buy</button> 
                            : null}
                        </td>
                    </tr>
                   ); 
                })}
                
            </tbody>
            </table>
        </div>
    );
  }
}

export default Main;
