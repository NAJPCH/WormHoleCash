/// @notice SPDX-License-Identifier: MIT
/// @title WORM HOLE CASH
/// @author Peytavin Nicolas 
/// @notice Dapp for the final project of the ALYRA Blockchain Developer training
/// @dev Use of OpenZe ppelin, CHainLink libraries
/// @dev Interfaces Uniswap V3 SwapRouter, CHainLink AggregatorV3Interface, ERC20, WETH
/// @custom:experimental This smart contract is experimental.


import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

pragma solidity 0.8.18;
    //------------------------------------------------------------------ INTERFACES
// impporté via SafeERC20 de openzeppelin
/*interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    //function totalSupply() external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}*/

interface IWETH {
    function deposit() external payable;
    function withdraw(uint wad) external;
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24  fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    /// @notice Swaps `amountIn` of one token for as much as possible of another token
    /// @param params The parameters necessary for the swap, encoded as `ExactInputSingleParams` in calldata
    /// @return amountOut The amount of the received token
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

contract WormHoleCash is ReentrancyGuard {
    ISwapRouter public immutable swapRouter;
    //AggregatorV3Interface internal priceFeed;
    /// @dev bollean against the reentrancy attack
    bool private isInProgress;

    //------------------------------------------------------------------ STRUCTURES
    struct UserData {
        TokenList[] tokenList;
        address outputAddress;
        uint depositStartTime;
        Steps step;
    }

    struct TokenList {
        address Token;
        uint8 State; //1=selected 2=Swaped 3=BackSwaped 4=Error je pourais améliorer ça en array ou struct ou enum
        uint256 ethAmount; //Quantité d'ETH obtenue
    }
    
    
    mapping(address => UserData) private usersData;
    mapping(address => Steps) private userSteps;

    /*address public constant SwapRouterV3 = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant WETH9 = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    address public constant DAI = 0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844;
    address public constant LINK = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;*/
    address public immutable SwapRouterV3;
    address public immutable WETH9;
    address public immutable DAI;
    address public immutable LINK;
    AggregatorV3Interface public priceFeed;

    address public OuputAddress;
    uint public mixingDuration = 1 minutes; // Only for Demo
    uint256 public depositStartTime;
    uint16 public constant poolFee = 3000; // frais de pool standard Uniswap à 0.3%
    TokenList[] public tokenList;
    Steps public step;

    enum Steps {
        TokenSelection, // sélection des token que l'on souhaite utiliser   
        Settings,       // Address Output, choix ETH ou StableCOins, Duration, Antropie, nombre de adresse de sortie
        Swap,           // Swap sur Uni
        DepositMixer,   // Tornado Cash dépot
        WithdrawMixer,  // Tornado Cash sortie
        SwapBack,       // Swap vers Tokens
        Done            // Enjoy
    }

    //------------------------------------------------------------------ EVENTS
    /// @dev Event emitted when a step is changed for the user
    event StepChanged( address indexed user, Steps previousStatus, Steps newStatus );

    /// @dev Event emitted when a token is listed for the user
    event TokenListed( address indexed user,TokenList tokenSelected);

    /// @dev Event emitted when the output address is set for the user
    event OutputAddressSet( address indexed user, address outputAddress );

    /// @dev Event emitted when a token is swapped
    event Swaped( address indexed user,uint256 amountIn, address _token);

    /// @dev Event emitted when a token is deposited
    event Deposited(address indexed user, uint256 amount, address _token);

    /// @dev Event Emitted whe this Smart Contract reveive ETH
    event Received(address, uint);
 
    /*constructor() {
        swapRouter = ISwapRouter(SwapRouterV3);
        priceFeed = AggregatorV3Interface(  0xb4c4a493AB6356497713A78FFA6c60FB53517c63 );
    }*/
    constructor(address _swapRouterV3, address _weth9, address _dai, address _link, address _priceFeed) {
    require(_swapRouterV3 != address(0), "SwapRouterV3 address cannot be null");
    require(_weth9 != address(0), "WETH9 address cannot be null");
    require(_dai != address(0), "DAI address cannot be null");
    require(_link != address(0), "LINK address cannot be null");
    require(_priceFeed != address(0), "PriceFeed address cannot be null");


    SwapRouterV3 = _swapRouterV3;
    swapRouter = ISwapRouter(SwapRouterV3);
    WETH9 = _weth9;
    DAI = _dai;
    LINK = _link;
    priceFeed = AggregatorV3Interface(_priceFeed);
}

    //------------------------------------------------------------------ MODIFIERS
    /// @dev Modifier to check to protect against reentrancy attacks
    modifier WHC_ReentranceGuard {
        require(!isInProgress, "The function is already in progress");
        isInProgress = true;
        _;
        isInProgress = false;
    }

    //------------------------------------------------------------------ USER DATA
    /// @notice Returns an array of informations for the given user
    /// @return userTokenList The array of token information
    /// @return userOutputAddress The address to send the tokens after mixing
    /// @return userDepositStartTime The time at which the user started the deposit
    /// @return userStep The current step of the user
    function getUserData(address userAddress) public view returns (TokenList[] memory userTokenList, address userOutputAddress, uint userDepositStartTime, Steps userStep) {
        UserData storage userData = usersData[userAddress];
        userTokenList = userData.tokenList;
        userOutputAddress = userData.outputAddress;
        userDepositStartTime = userData.depositStartTime;
        userStep = userData.step;
    }

    //------------------------------------------------------------------ SETTING
    /// @notice Sets the output address for the given user
    /// @param _outputAddress The address to send the tokens after mixing
    function setOutputAddress(address _outputAddress) private WHC_ReentranceGuard{
        require(_outputAddress != address(0), "The recipient address cannot be null");
        usersData[msg.sender].outputAddress = _outputAddress;
        emit OutputAddressSet(msg.sender, _outputAddress);
    }

    /// @notice Adds a token for the given user
    /// @param _token The token address to add
    function addToken(address _token) private WHC_ReentranceGuard {
        require(_token != address(0), "The token address cannot be null");
        TokenList memory newToken = TokenList(_token, 1,0);
        usersData[msg.sender].tokenList.push(newToken);
        emit TokenListed(msg.sender, newToken);
    }

    //------------------------------------------------------------------ UNISWAP
    /// @notice Performs a swap between 2 tokens for the exact input single for the given user
    /// @param _tokenIn The token to swap from
    /// @param _tokenOut The token to swap to
    /// @param amountIn The amount of the input token to swap
    function swapExactInputSingle(uint256 amountIn, address _tokenIn, address _tokenOut) private WHC_ReentranceGuard{
        require(amountIn > 0, "amountIn param must be greater than 0");
        require(_tokenIn != address(0), "The tokenIn address cannot be null");
        require(_tokenOut != address(0), "The tokenOut address cannot be null");
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), amountIn);// Transfert des tokens en question au smart contract ! Il faut penser à approve ce transfert avant l’utilisation de cette fonction 
        IERC20(_tokenIn).approve(address(swapRouter), amountIn);  // autoriser uniswap à utiliser nos tokens
        
        ISwapRouter.ExactInputSingleParams memory params = //Creation des paramètres pour l'appel du swap
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _tokenIn,
                tokenOut: _tokenOut,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0, // amountOutMinimum: _amountOutMinimum; getLatestPrice() de Chainlink pour eviter les frontruns
                sqrtPriceLimitX96: 0
            });
        swapRouter.exactInputSingle(params);// Swap
    }

    // version sans le stockage des WETH Obtenu et Unwrap interne
    /// @notice Swaps tokens for ETH for the given user
    /// @param amountIn The amount of tokens to swap
    /// @param _token The token to swap
    function swapTokensForETH(uint256 amountIn, address _token) public { 
        require(amountIn > 0, "amountIn param must be greater than 0");
        require(_token != address(0), "The token address cannot be null");
        swapExactInputSingle(amountIn, _token, WETH9);
        uint256 wethBalance = IERC20(WETH9).balanceOf(address(this)); 

        uint256 fees = wethBalance / 1000;
        uint256 wethBalanceAfterfees = amountIn - fees;   // Fees for WHC 0.1% but unexploitable for the moment 

        //IERC20(WETH9).transferFrom(msg.sender, address(this), wethBalance);// Transférer les WETH du msg.sender au contrat
        IWETH(WETH9).withdraw(wethBalanceAfterfees);// Unwrap WETH du contrat
        payable(msg.sender).transfer(wethBalanceAfterfees);// Renvoie les ETH unwraped au msg.sender
        emit Swaped(msg.sender, amountIn, _token);
    }

    function swapTokenToWethToEthToWalletForDemo(uint256 amountIn, address _tokenIn) public { 
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), amountIn);// Transfert des tokens en question au smart contract ! Il faut penser à approve ce transfert avant l’utilisation de cette fonction 
        IERC20(_tokenIn).approve(address(swapRouter), amountIn);  // autoriser uniswap à utiliser nos tokens
        ISwapRouter.ExactInputSingleParams memory params = //Creation des paramètres pour l'appel du swap
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _tokenIn,
                tokenOut: WETH9,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0, 
                sqrtPriceLimitX96: 0
            });
        swapRouter.exactInputSingle(params);// Swap 
        uint256 wethBalance = IERC20(WETH9).balanceOf(address(this)); 
        IWETH(WETH9).withdraw(wethBalance);// Unwrap WETH du contrat
        payable(msg.sender).transfer(wethBalance);// Renvoie les ETH unwraped au msg.sender
    }


    /// @notice Swaps ETH for tokens for the given user
    /// @param amountIn The amount of ETH to swap
    /// @param _token The token to swap 
    function swapETHForTokens(uint256 amountIn, address _token) public payable {
        require(amountIn > 0, "amountIn param must be greater than 0");
        require(_token != address(0), "The token address cannot be null");
        uint256 WHCfees = amountIn / 1000;
        uint256 amountAfterFees = amountIn - WHCfees; // 0.1% Fees for Worm Hole Cash, Non valable pour la Demo car les fond sont hors de ce contrat pour l'instant

        //wrapETH(amountAfterFees);
        IWETH(WETH9).deposit{value: amountAfterFees}();// Wrap ETH
        //IERC20(WETH9).transfer(msg.sender, amountAfterFees);// Transférer les WETH convertis au msg.sender
        IERC20(WETH9).approve(address(swapRouter), amountIn); // Autoriser uniswap à utiliser nos tokens
    
        
        swapExactInputSingle(amountAfterFees, WETH9, _token);

        //if the user sends too much Ether to perform the swap, the excess Ether will be returned.
        if (msg.value > amountAfterFees) {
            payable(msg.sender).transfer(msg.value - amountAfterFees);
        }
        emit Swaped(msg.sender, amountIn, _token);
    }

    /**    function swapETHForTokens(uint256 amountIn, address _token) public payable {
        require(amountIn > 0, "amountIn param must be greater than 0");
        require(_token != address(0), "The token address cannot be null");
        uint256 WHCfees = amountIn / 1000;
        uint256 amountAfterFees = amountIn - WHCfees; // 0.1% Fees for Worm Hole Cash

        //wrapETH(amountAfterFees);
        IWETH(WETH9).deposit{value: amountAfterFees}();// Wrap ETH
        IERC20(WETH9).transfer(msg.sender, amountAfterFees);// Transférer les WETH convertis au msg.sender

        address outputAddress = usersData[msg.sender].outputAddress;
        swapExactInputSingle(amountAfterFees, WETH9, _token);

        //if the user sends too much Ether to perform the swap, the excess Ether will be returned.
        if (msg.value > amountAfterFees) {
            payable(msg.sender).transfer(msg.value - amountAfterFees);
        }
        emit Swaped(msg.sender, amountIn, _token);
    } */


    //------------------------------------------------------------------ CHAIN LINK
    /// @notice Returns the latest price of LINK/ETH
    function getLatestPrice() public view returns (int) {
        (,int price,,,) = priceFeed.latestRoundData();
        return price;
    }

    //------------------------------------------------------------------ MIXER (This Smart contract for the Demo)
    /// @notice Deposits converted tokens for the given user
    /// @param amount The amount of tokens to deposit
    /// @param _token The token to deposit
    function depositConvertedTokens(uint256 amount, address _token) public WHC_ReentranceGuard{
        require(amount > 0, "amount param must be greater than 0");
        require(_token != address(0), "The token address cannot be null");
        IERC20(_token).transferFrom(msg.sender, address(this), amount);

        // MAJ TokenList pour stocker la quantité de tokens déposés
        UserData storage user = usersData[msg.sender];
        for (uint256 i = 0; i < user.tokenList.length; i++) {
            if (user.tokenList[i].Token == _token) {
                user.tokenList[i].ethAmount = amount;
                user.tokenList[i].State = 2; // 2 = Swaped
                break;
            }
        }
        emit Deposited(msg.sender, amount, _token);
    }

    //------------------------------------------------------------------ WORKFLOW
    /// @notice Changes the step for the given user
    /// @param _from The current step
    /// @param _to The next step
    function changeStep(Steps _from, Steps _to) private {
        require(userSteps[msg.sender] == _from, "changeStep() not possible");
        userSteps[msg.sender] = _to;
        emit StepChanged(msg.sender, _from, _to);
    }

    /// @notice Resets the data for the given user
    /// @dev No restriction for Demo and Debug
    function reset() public {
        userSteps[msg.sender] = Steps.TokenSelection; 
        delete usersData[msg.sender].tokenList;
        usersData[msg.sender].outputAddress = address(0);
    }

    /// @notice Returns the current step for the given user
    function getCurrentStep() public view returns (Steps) {
        return userSteps[msg.sender];
    }

    /// @notice Changes the step to token selection for the given user
    /// @param _selectedAddress The address of the token to convert
    function Selection(address _selectedAddress) public {
        require( userSteps[msg.sender] == Steps.TokenSelection, "Wrong step" );
        require(_selectedAddress != address(0), "The selected address cannot be null");
        changeStep(Steps.TokenSelection, Steps.Settings);
        addToken(_selectedAddress);
    }

    /// @notice Changes the step to settings for the given user
    /// @param _outputAddress The address to send the converted tokens
    function Settings(address _outputAddress) public {
        require( userSteps[msg.sender] == Steps.Settings, "Wrong step" );
        require(_outputAddress != address(0), "The output address cannot be null");
        changeStep(Steps.Settings, Steps.Swap);
        setOutputAddress(_outputAddress);
    }

    /// @notice Changes the step to swap for the given user
    /// @param amountIn The amount of tokens to swap
    /// @param _token The token to swap
    function Swap(uint256 amountIn, address _token) public {
        require( userSteps[msg.sender] == Steps.Swap, "Wrong step" );
        require(_token != address(0), "The token address cannot be null");
        require(amountIn > 0, "amountIn param must be greater than 0");
        changeStep(Steps.Swap, Steps.DepositMixer);
        swapTokensForETH(amountIn, _token);
        emit Swaped( msg.sender, amountIn, _token);
    }

    function SwapDemo(uint256 amountIn, address _token) public {
        require( userSteps[msg.sender] == Steps.Swap, "Wrong step" );
        require(_token != address(0), "The token address cannot be null");
        require(amountIn > 0, "amountIn param must be greater than 0");
        changeStep(Steps.Swap, Steps.DepositMixer);
        swapTokenToWethToEthToWalletForDemo(amountIn, _token);
        emit Swaped( msg.sender, amountIn, _token);
    }


    /// @notice Changes the step to deposit mixer for the given user
    function DepositMixer() public {
        require( userSteps[msg.sender] == Steps.DepositMixer, "Wrong step" );
        changeStep(Steps.DepositMixer, Steps.WithdrawMixer);
        depositStartTime = block.timestamp;
    }

    /// @notice Changes the step to withdraw mixer for the given user
    function WithdrawMixer() public {
        require( userSteps[msg.sender] == Steps.WithdrawMixer, "Wrong step" );
        require(block.timestamp >= usersData[msg.sender].depositStartTime + mixingDuration, "You must wait the minimum mixing duration setted");
        address outputAddress = usersData[msg.sender].outputAddress; // not used for the moment 
        changeStep(Steps.WithdrawMixer, Steps.SwapBack);
    }
    
    /// @notice Changes the step to swap back for the given user
    /// @param amountIn The amount of tokens to swap back
    /// @param _token The token to swap back
    function SwapBack(uint256 amountIn, address _token) public {
        require( userSteps[msg.sender] == Steps.SwapBack, "Wrong step" );
        require(_token != address(0), "The token address cannot be null");
        require(amountIn > 0, "amountIn param must be greater than 0");    
        changeStep(Steps.SwapBack, Steps.Done);
        swapETHForTokens(amountIn, _token);
    }

    /// @notice For Donation <3
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    
}