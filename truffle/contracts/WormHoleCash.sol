// SPDX-License-Identifier: MIT
//import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

pragma solidity 0.8.18;
    //------------------------------------------------------------------ INTERFACES
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    //function totalSupply() external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    //function allowance(address owner, address spender) external view returns (uint256);
}

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

contract WormHoleCash { // is ReentrancyGuard {
    ISwapRouter public immutable swapRouter;
    AggregatorV3Interface internal priceFeed;

    //------------------------------------------------------------------ STRUCTURES
    struct UserData {
        TokenList[] tokenList;
        address outputAddress;
        uint depositStartTime;
        Steps step;
    }

    struct TokenList {
        //address From; address To;
        address Token;
        uint8 State; //1=selected 2=Swaped 3=BackSwaped 4=Error je pourais améliorer ça en array ou struct ou enum
        uint256 ethAmount; //Quantité d'ETH obtenue
}
    }

    mapping(address => UserData) private usersData;
    mapping(address => Steps) private userSteps;

    address public constant SwapRouterV3 = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant WETH9 = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    address public constant DAI = 0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844;
    address public constant LINK = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;

    address public OuputAddress;
    uint public mixingDuration = 1 minutes; // Only for Demo
    uint256 public depositStartTime;
    uint24 public constant poolFee = 3000; // frais de pool standard Uniswap à 0.3%
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
    event StepChanged( address indexed user, Steps previousStatus, Steps newStatus );
    event TokenListed( address indexed user,TokenList tokenSelected);
    event OutputAddressSet( address indexed user, address outputAddress ); //event OutputAddressSeted(address OuputAddress);
    event Received(address, uint); // Event émis lorsque des ETH sont reçus
    event Swaped( address indexed user,uint256 amountIn, address _token);
 
    constructor() {
        swapRouter = ISwapRouter(SwapRouterV3);
        priceFeed = AggregatorV3Interface(  0xb4c4a493AB6356497713A78FFA6c60FB53517c63 );
    }

    //------------------------------------------------------------------ USER DATA
    function getUserData(address userAddress) public view returns (TokenList[] memory tokenList, address outputAddress, uint depositStartTime, Steps step) {
        UserData storage userData = usersData[userAddress];
        tokenList = userData.tokenList;
        outputAddress = userData.outputAddress;
        depositStartTime = userData.depositStartTime;
        step = userData.step;
    }

    //------------------------------------------------------------------ SETTING
    function setOutputAddress(address _outputAddress) private {
        //UserData storage userData = usersData[msg.sender];
        usersData[msg.sender].outputAddress = _outputAddress;
        emit OutputAddressSet(msg.sender, _outputAddress);
    }

    function addToken(address _token) private {
        //UserData storage userData = usersData[msg.sender];
        TokenList memory newToken = TokenList(_token, 1);
        usersData[msg.sender].tokenList.push(newToken);
        emit TokenListed(msg.sender, newToken);
    }
    
    //A revoir
    function getTokenState(uint256 _index) private view returns (uint8) {
        require(_index < tokenList.length, "Token index out of bounds");
        return tokenList[_index].State;
    }
    
    function setTokenState(uint256 _index, uint8 _newState) private {
        require(_index < tokenList.length, "Token index out of bounds");
        tokenList[_index].State = _newState;
    }

    //------------------------------------------------------------------ UNISWAP
    function swapExactInputSingle(uint256 amountIn, address _tokenIn, address _tokenOut, address outputAddress) public {
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), amountIn);// Transfert des tokens en question au smart contract ! Il faut penser à approve ce transfert avant l’utilisation de cette fonction 
        IERC20(_tokenIn).approve(address(swapRouter), amountIn);  // autoriser uniswap à utiliser nos tokens
        
        ISwapRouter.ExactInputSingleParams memory params = //Creation des paramètres pour l'appel du swap
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _tokenIn,
                tokenOut: _tokenOut,
                fee: poolFee,
                recipient: outputAddress,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0, // amountOutMinimum: _amountOutMinimum; pour eviter les frontrun  se lie a chainlink pour ça
                sqrtPriceLimitX96: 0
            });
        swapRouter.exactInputSingle(params);// Swap, ETH sera transférer directement au msg.sender
    }

    /*function swapTokensForETH(uint256 amountIn, address _token) public { // version sans le stockage des WETH Obtenu
        swapExactInputSingle(amountIn, _token, WETH9, msg.sender);
        uint256 wethBalance = IERC20(WETH9).balanceOf(address(this)); 
        unwrapETH(wethBalance); // WETH en ETH
        emit Swaped(msg.sender, amountIn, _token);
    }*/
    
    function swapTokensForETH(uint256 amountIn, address _token) public {
        uint256 initialWethBalance = IERC20(WETH9).balanceOf(address(this));
        swapExactInputSingle(amountIn, _token, WETH9, msg.sender);
        uint256 wethBalanceAfterSwap = IERC20(WETH9).balanceOf(address(this));
        uint256 ethReceived = wethBalanceAfterSwap - initialWethBalance; // Qte d'ETH obtenue

        // MAJ le token correspondant dans la structure TokenList pour stocker la Qte d'ETH obtenue
        UserData storage user = users[msg.sender];
        for (uint256 i = 0; i < user.tokenList.length; i++) {
            if (user.tokenList[i].Token == _token) {
                user.tokenList[i].ethAmount = ethReceived;
                break;
            }
        }
        unwrapETH(wethBalanceAfterSwap);
        emit Swaped(msg.sender, amountIn, _token);
    }

    function swapTokensForETH(uint256 amountIn, address _token) public {
        uint256 initialWethBalance = IERC20(WETH9).balanceOf(address(this));
        IERC20(_token).transferFrom(msg.sender, address(swapRouter), amountIn); // Transférer les tokens directement au swapRouter
        IERC20(_token).approve(address(swapRouter), amountIn);  // autoriser uniswap à utiliser nos tokens

        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _token,
                tokenOut: WETH9,
                fee: poolFee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
        swapRouter.exactInputSingle(params);
        uint256 wethBalanceAfterSwap = IERC20(WETH9).balanceOf(address(this));
        uint256 ethReceived = wethBalanceAfterSwap - initialWethBalance; // Qte d'ETH obtenue

        // MAJ le token correspondant dans la structure TokenList pour stocker la Qte d'ETH obtenue
        UserData storage user = users[msg.sender];
        for (uint256 i = 0; i < user.tokenList.length; i++) {
            if (user.tokenList[i].Token == _token) {
                user.tokenList[i].ethAmount = ethReceived;
                break;
            }
        }
        unwrapETH(wethBalanceAfterSwap);
        emit Swaped(msg.sender, amountIn, _token);
    }



    function swapETHForTokens(uint256 amountIn, address _token) public payable {
        uint256 WHCfees = amountIn / 1000;
        uint256 amountAfterFees = amountIn - WHCfees;

        wrapETH(amountAfterFees);
        address outputAddress = usersData[msg.sender].outputAddress;
        swapExactInputSingle(amountAfterFees, WETH9, _token, outputAddress);

        //if the user sends too much Ether to perform the swap, the excess Ether will be returned.
        if (msg.value > amountAfterFees) {
            payable(msg.sender).transfer(msg.value - amountAfterFees);
        }
        emit Swaped(msg.sender, amountIn, _token);
    }

    function wrapETH(uint256 amountIn) public payable {
        //require(msg.value >= amountIn, "Not enough ETH sent");
        IWETH(WETH9).deposit{value: amountIn}();// Convertir ETH en WETH
        IERC20(WETH9).transfer(msg.sender, amountIn);// Transférer les WETH convertis au msg.sender

        if (msg.value > amountIn) {// Renvoyer les ETH restants (si msg.value > amountIn)
            payable(msg.sender).transfer(msg.value - amountIn);
        }
    }

    function unwrapETH(uint256 amountIn) public payable{
        //require(IERC20(WETH9).balanceOf(msg.sender) >= amountIn, "Not enough WETH balance");
        IERC20(WETH9).transferFrom(msg.sender, address(this), amountIn);// Transférer les WETH du msg.sender au contrat
        IWETH(WETH9).withdraw(amountIn);// Convertir les WETH en ETH
        payable(msg.sender).transfer(amountIn);// Envoyer les ETH convertis au msg.sender
    }

    //------------------------------------------------------------------ CHAIN LINK
    function getLatestPrice() public view returns (int) {
        (,int price,,,) = priceFeed.latestRoundData();
        return price;
    }

    //------------------------------------------------------------------ WORKFLOW
    function changeStep(Steps _from, Steps _to) private {
        require(userSteps[msg.sender] == _from, "changeStep() not possible");
        userSteps[msg.sender] = _to;
        emit StepChanged(msg.sender, _from, _to);
    }

    function reset() public {
        userSteps[msg.sender] = Steps.TokenSelection; 
        delete usersData[msg.sender].tokenList;
        OuputAddress = address(0);
    }

    function getCurrentStep() public view returns (Steps) {
        return userSteps[msg.sender];
    }

    function Selection(address _selectedAddress) public {
        changeStep(Steps.TokenSelection, Steps.Settings);
        addToken(_selectedAddress);
    }

    function Settings(address _outputAddress) public {
        changeStep(Steps.Settings, Steps.Swap);
        setOutputAddress(_outputAddress);
    }

    function Swap(uint256 amountIn, address _token) public {
        changeStep(Steps.Swap, Steps.DepositMixer);
        swapTokensForETH(amountIn, _token);
    }

    function DepositMixer() public {
        changeStep(Steps.DepositMixer, Steps.WithdrawMixer);
        depositStartTime = block.timestamp;
    }

    function WithdrawMixer() public {
        require(block.timestamp >= usersData[msg.sender].depositStartTime + mixingDuration, "You must wait 24h at least");
        changeStep(Steps.WithdrawMixer, Steps.SwapBack);
    }
        
    function SwapBack(uint256 amountIn, address _token) public {
        changeStep(Steps.SwapBack, Steps.Done);
        swapETHForTokens(amountIn, _token);
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    
}