

//SPDX-License-Identifier: MIT



//Foo the first community member launch on the fuse and Ceus eco system those that know Foo know he is a chad
pragma solidity ^0.8.5;

library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }
    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }
    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }
}

/**
 * BEP20 standard interface.
 */
interface IBEP20 {
    function totalSupply() external view returns (uint256);
    function decimals() external view returns (uint8);
    function symbol() external view returns (string memory);
    function name() external view returns (string memory);
    function getOwner() external view returns (address);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address _owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}


/**
 * Allows for contract ownership along with multi-address authorization
 */
abstract contract Auth {
    address internal owner;
    mapping (address => bool) internal authorizations;

    constructor(address _owner) {
        owner = _owner;
        authorizations[_owner] = true;
    }

    /**
     * Function modifier to require caller to be contract owner
     */
    modifier onlyOwner() {
        require(isOwner(msg.sender), "!OWNER"); _;
    }

    /**
     * Function modifier to require caller to be authorized
     */
    modifier authorized() {
        require(isAuthorized(msg.sender), "!AUTHORIZED"); _;
    }

    /**
     * Authorize address. Owner only
     */
    function authorize(address adr) public onlyOwner {
        authorizations[adr] = true;
    }

    /**
     * Remove address' authorization. Owner only
     */
    function unauthorize(address adr) public onlyOwner {
        authorizations[adr] = false;
    }

    /**
     * Check if address is owner
     */
    function isOwner(address account) public view returns (bool) {
        return account == owner;
    }

    /**
     * Return address' authorization status
     */
    function isAuthorized(address adr) public view returns (bool) {
        return authorizations[adr];
    }

    /**
     * Transfer ownership to new address. Caller must be owner. Leaves old owner authorized
     */
    function transferOwnership(address payable adr) public onlyOwner {
        owner = adr;
        authorizations[adr] = true;
        emit OwnershipTransferred(adr);
    }

    event OwnershipTransferred(address owner);
}

interface IDEXFactory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
}

interface IDEXRouter {
    function factory() external pure returns (address);
    function WETH() external pure returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity);

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable;

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external;
}

contract Foo is IBEP20, Auth {
    using SafeMath for uint256;

    address WBNB = 0x4e69Ae0CD024754655b4eF74F24A8DCB39Ba07e8;
    address DEAD = 0x000000000000000000000000000000000000dEaD;
    address ZERO = 0x0000000000000000000000000000000000000000;

    string constant _name = "Foo";
    string constant _symbol = "$Foo";
    uint8 constant _decimals = 18;

    uint256 _totalSupply = 42069 * (10 ** _decimals);  // 42,069 tokens with 18 decimals
    uint256 public _maxTxAmount = (_totalSupply * 3) / 100;  // 1% of the total supply
    uint256 public _maxWalletSize = (_totalSupply * 3) / 100;  // 2% of the total supply


    mapping (address => uint256) _balances;
    mapping (address => mapping (address => uint256)) _allowances;

    mapping (address => bool) isFeeExempt;
    mapping (address => bool) isTxLimitExempt;
    mapping (address => bool) isWalletSizeExempt;
    bool public isTradingEnabled = false;



    uint256 liquidityFee = 0;
    uint256 botloadFee = 3;
    uint256 TeamprojectFee = 2;
    uint256 totalFee = 5;
    uint256 feeDenominator = 100;

    address private botfundingReciever = 0x875A7BF4278f903165728F775f41342431b5EF07;
    address private Fooburn = 0x000000000000000000000000000000000000dEaD;

    IDEXRouter public router;
    address public pair;

    uint256 public launchedAt;

    bool public swapEnabled = false;
    uint256 public swapThreshold = _totalSupply / 1000 * 3; // 0.3%
    bool inSwap;
    modifier swapping() { inSwap = true; _; inSwap = false; }

    constructor () Auth(msg.sender) {
        router = IDEXRouter(0xE3F85aAd0c8DD7337427B9dF5d0fB741d65EEEB5);
        pair = IDEXFactory(router.factory()).createPair(WBNB, address(this));
        _allowances[address(this)][address(router)] = type(uint256).max;

        address _owner = owner;
        isFeeExempt[_owner] = true;
        isTxLimitExempt[_owner] = true;

        _balances[_owner] = _totalSupply;
        emit Transfer(address(0), _owner, _totalSupply);
    }

    receive() external payable { }

    function totalSupply() external view override returns (uint256) { return _totalSupply; }
    function decimals() external pure override returns (uint8) { return _decimals; }
    function symbol() external pure override returns (string memory) { return _symbol; }
    function name() external pure override returns (string memory) { return _name; }
    function getOwner() external view override returns (address) { return owner; }
    function balanceOf(address account) public view override returns (uint256) { return _balances[account]; }
    function allowance(address holder, address spender) external view override returns (uint256) { return _allowances[holder][spender]; }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function approveMax(address spender) external returns (bool) {
        return approve(spender, type(uint256).max);
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        return _transferFrom(msg.sender, recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        if(_allowances[sender][msg.sender] != type(uint256).max){
            _allowances[sender][msg.sender] = _allowances[sender][msg.sender].sub(amount, "Insufficient Allowance");
        }

        return _transferFrom(sender, recipient, amount);
    }

   function _transferFrom(address sender, address recipient, uint256 amount) internal returns (bool) {
    if(inSwap){ return _basicTransfer(sender, recipient, amount); }

    // Check if trading is enabled or if the sender is authorized
    require(isTradingEnabled || isAuthorized(sender), "Trading is not enabled yet");

    // Exempt the owner and other authorized addresses from the transaction limit
    if (!isAuthorized(sender)) {
        checkTxLimit(sender, amount);
    }

    if (recipient != pair && recipient != DEAD) {
        require(isWalletSizeExempt[recipient] || isTxLimitExempt[recipient] || _balances[recipient] + amount <= _maxWalletSize, "Transfer amount exceeds the bag size.");
    }

    if(shouldSwapBack()){ swapBack(); }

    if(!launched() && recipient == pair) {
        require(isAuthorized(sender) || _balances[sender] > 0, "Only authorized addresses can launch");
        launch();
    }

    _balances[sender] = _balances[sender].sub(amount, "Insufficient Balance");

    uint256 amountReceived = shouldTakeFee(sender) ? takeFee(sender, recipient, amount) : amount;
    _balances[recipient] = _balances[recipient].add(amountReceived);

    emit Transfer(sender, recipient, amountReceived);
    return true;
    }


    function _basicTransfer(address sender, address recipient, uint256 amount) internal returns (bool) {
        _balances[sender] = _balances[sender].sub(amount, "Insufficient Balance");
        _balances[recipient] = _balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
        return true;
    }

    function checkTxLimit(address sender, uint256 amount) internal view {
        require(amount <= _maxTxAmount || isTxLimitExempt[sender], "TX Limit Exceeded");
    }

    function shouldTakeFee(address sender) internal view returns (bool) {
        return !isFeeExempt[sender];
    }

    function getTotalFee(bool selling) public view returns (uint256) {
        if(launchedAt + 1 >= block.number){ return feeDenominator.sub(1); }
        if(selling) { return totalFee.add(1); }
        return totalFee;
    }

    function takeFee(address sender, address receiver, uint256 amount) internal returns (uint256) {
     uint256 feeAmount = amount.mul(getTotalFee(receiver == pair)).div(feeDenominator);

    // If swap is disabled, send fees directly to the fee wallets
    if (!swapEnabled) {
        uint256 marketingTokens = feeAmount.mul(TeamprojectFee).div(totalFee);
        uint256 buybackTokens = feeAmount.mul(botloadFee).div(totalFee);

        _balances[botfundingReciever] = _balances[botfundingReciever].add(marketingTokens);
        emit Transfer(sender, botfundingReciever, marketingTokens);

        _balances[Fooburn] = _balances[Fooburn].add(buybackTokens);
        emit Transfer(sender, Fooburn, buybackTokens);

        // If there's any residual amount after distributing fees (due to rounding), send it to the botfundingReciever
        uint256 residual = feeAmount.sub(marketingTokens).sub(buybackTokens);
        if (residual > 0) {
            _balances[botfundingReciever] = _balances[botfundingReciever].add(residual);
            emit Transfer(sender, botfundingReciever, residual);
        }

    } else {
        _balances[address(this)] = _balances[address(this)].add(feeAmount);
        emit Transfer(sender, address(this), feeAmount);
    }

    return amount.sub(feeAmount);
}


    function shouldSwapBack() internal view returns (bool) {
        return msg.sender != pair
        && !inSwap
        && swapEnabled
        && _balances[address(this)] >= swapThreshold;
    }

    function swapBack() internal swapping {
        uint256 contractTokenBalance = balanceOf(address(this));
        uint256 amountToLiquify = contractTokenBalance.mul(liquidityFee).div(totalFee).div(2);
        uint256 amountToSwap = contractTokenBalance.sub(amountToLiquify);

        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = WBNB;

        uint256 balanceBefore = address(this).balance;

        router.swapExactTokensForETHSupportingFeeOnTransferTokens(
            amountToSwap,
            0,
            path,
            address(this),
            block.timestamp
        );
        uint256 amountBNB = address(this).balance.sub(balanceBefore);
        uint256 totalBNBFee = totalFee.sub(liquidityFee.div(2));
        uint256 amountBNBLiquidity = amountBNB.mul(liquidityFee).div(totalBNBFee).div(2);
        uint256 amountBNBbuyback = amountBNB.mul(botloadFee).div(totalBNBFee);
        uint256 amountBNBMarketing = amountBNB.mul(TeamprojectFee).div(totalBNBFee);


        (bool MarketingSuccess, /* bytes memory data */) = payable(botfundingReciever).call{value: amountBNBMarketing, gas: 30000}("");
        require(MarketingSuccess, "receiver rejected ETH transfer");
        (bool buybackSuccess, /* bytes memory data */) = payable(Fooburn).call{value: amountBNBbuyback, gas: 30000}("");
        require(buybackSuccess, "receiver rejected ETH transfer");

        if(amountToLiquify > 0){
            router.addLiquidityETH{value: amountBNBLiquidity}(
                address(this),
                amountToLiquify,
                0,
                0,
                botfundingReciever,
                block.timestamp
            );
            emit AutoLiquify(amountBNBLiquidity, amountToLiquify);
        }
    }

    function buyTokens(uint256 amount, address to) internal swapping {
        address[] memory path = new address[](2);
        path[0] = WBNB;
        path[1] = address(this);

        router.swapExactETHForTokensSupportingFeeOnTransferTokens{value: amount}(
            0,
            path,
            to,
            block.timestamp
        );
    }

    function launched() internal view returns (bool) {
        return launchedAt != 0;
    }

    function launch() internal {
        launchedAt = block.number;
    }

    function setTxLimit(uint256 amount) external authorized {
        require(amount >= _totalSupply / 1000);  //Must be higher the 0.1% of supply
        _maxTxAmount = amount;
    }

   function setMaxWallet(uint256 amount) external onlyOwner() {
        require(amount >= _totalSupply / 1000 ); //Must Be Higer then 0.1% of Supply
        _maxWalletSize = amount;
    }

    function setIsFeeExempt(address holder, bool exempt) external authorized {
        isFeeExempt[holder] = exempt;
    }

    function setIsTxLimitExempt(address holder, bool exempt) external authorized {
        isTxLimitExempt[holder] = exempt;
    }

    function setIsWalletSizeExempt(address holder, bool exempt) external authorized {
        isWalletSizeExempt[holder] = exempt;
    }

    function enableTrading() external onlyOwner {
    isTradingEnabled = true;
    }

    function setFees(uint256 _liquidityFee, uint256 _botloadFee, uint256 _TeamprojectFee, uint256 _feeDenominator) external authorized {
        liquidityFee = _liquidityFee;
        botloadFee = _botloadFee;
        TeamprojectFee = _TeamprojectFee;
        totalFee = _liquidityFee.add(_botloadFee).add(_TeamprojectFee);
        feeDenominator = _feeDenominator;
    }

    function setFeeReceiver(address _botfundingReciever, address _Fooburn) external authorized {
        botfundingReciever = _botfundingReciever;
        Fooburn = _Fooburn;
    }

    function setSwapBackSettings(bool _enabled, uint256 _amount) external authorized {
        swapEnabled = _enabled;
        swapThreshold = _amount;
    }

    function manualSend() external authorized {
        uint256 contractETHBalance = address(this).balance;
        payable(botfundingReciever).transfer(contractETHBalance);
    }

    function transferForeignToken(address _token) public authorized {
        require(_token != address(this), "Can't let you take all native token");
        uint256 _contractBalance = IBEP20(_token).balanceOf(address(this));
        payable(botfundingReciever).transfer(_contractBalance);
    }

     function transferForeignToken(address _token, address _to) public onlyOwner returns(bool _sent){
        uint256 _contractBalance = IBEP20 (_token).balanceOf(address(this));
        _sent = IBEP20 (_token).transfer(_to, _contractBalance);
    }

    function getCirculatingSupply() public view returns (uint256) {
        return _totalSupply.sub(balanceOf(DEAD)).sub(balanceOf(ZERO));
    }

    function getLiquidityBacking(uint256 accuracy) public view returns (uint256) {
        return accuracy.mul(balanceOf(pair).mul(2)).div(getCirculatingSupply());
    }

    function isOverLiquified(uint256 target, uint256 accuracy) public view returns (bool) {
        return getLiquidityBacking(accuracy) > target;
    }

    event AutoLiquify(uint256 amountBNB, uint256 amountBOG);
}
