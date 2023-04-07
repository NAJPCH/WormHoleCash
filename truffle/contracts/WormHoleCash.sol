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
        uint8 State; //1=selected 2=Swaped 3=BackSwaped 4=Error je pourais améliorer ça en array outruct ou enum
    }

    mapping(address => UserData) private usersData;
    mapping(address => Steps) private userSteps;

    address public constant SwapRouterV3 = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant WETH9 = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    address public constant DAI = 0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844;
    address public constant LINK = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;

    address public OuputAddress;
    uint public mixingDuration = 1 minutes; // Only for Demo
    //uint public entropy = 0;
    uint256 public depositStartTime;
    uint24 public constant poolFee = 3000;    // frais de pool standard Uniswap à 0.3%
    TokenList[] public tokenList;
    Steps public step;

    enum Steps {
        TokenSelection, // sélection des token que l'on souhaite utiliser   
        Settings,        // Address Output, choix ETH ou StableCOins, Duration, Antropie, nombre de adresse de sortie
        Swap,           // Swap sur Uni
        DepositMixer,   // Tornado Cash dépo
        //Waiting,        // Mixage Automation via Gelato
        WithdrawMixer,  // Tornado Cash sortie
        //FeesServices,   // Frais d'utilisation
        SwapBack,       // Swap vers Tokens
        Done            // Enjoy
    }

    //------------------------------------------------------------------ EVENTS
    /*event StepChanged(
        Steps previousStatus,
        Steps newStatus
    );*/
    event StepChanged( address indexed user, Steps previousStatus, Steps newStatus );
    event TokenListed( address indexed user,TokenList tokenSelected);
    event OutputAddressSet( address indexed user, address outputAddress ); //event OutputAddressSeted(address OuputAddress);
    event Received(address, uint); // Event émis lorsque des ETH sont reçus
    event Swaped( address indexed user,uint256 amountIn, address _token);
 
    /*constructor(ISwapRouter _swapRouter) { swapRouter = _swapRouter; }*/
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
    /*function getOuputAddress() public view returns (address) { return OuputAddress; }
    function setMixingDuration(uint _mixingDuration) private { mixingDuration = _mixingDuration; }
    function setEntropy(uint _entropy) private { entropy = _entropy; }   */ 

    /*function setOuputAddress(address _OuputAddress) private {
        OuputAddress = _OuputAddress;
        emit OutputAddressSeted(_OuputAddress);
    }*/
    function setOutputAddress(address _outputAddress) private {
        //UserData storage userData = usersData[msg.sender];
        usersData[msg.sender].outputAddress = _outputAddress;
        emit OutputAddressSet(msg.sender, _outputAddress);
    }


    /*function addToken(address _token) private {
        TokenList memory newToken = TokenList(_token, 1);
        tokenList.push(newToken);
        emit TokenListed(newToken);
    }*/
    function addToken(address _token) private {
        //UserData storage userData = usersData[msg.sender];
        TokenList memory newToken = TokenList(_token, 1);
        usersData[msg.sender].tokenList.push(newToken);
        emit TokenListed(msg.sender, newToken);
    }
    
    function getTokenState(uint256 _index) private view returns (uint8) {
        require(_index < tokenList.length, "Token index out of bounds");
        return tokenList[_index].State;
    }
    
    function setTokenState(uint256 _index, uint8 _newState) private {
        require(_index < tokenList.length, "Token index out of bounds");
        tokenList[_index].State = _newState;
    }


    //------------------------------------------------------------------ UNISWAP
   
    function swapExactInputSingle(uint256 amountIn, address _tokenIn, address _tokenOut) public {
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), amountIn);// Transfert des tokens en question au smart contract ! Il faut penser à approve ce transfert avant l’utilisation de cette fonction 
        IERC20(_tokenIn).approve(address(swapRouter), amountIn);  // autoriser uniswap à utiliser nos tokens
        
        ISwapRouter.ExactInputSingleParams memory params = //Creation des paramètres pour l'appel du swap
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _tokenIn,
                tokenOut: _tokenOut,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0, // amountOutMinimum: _amountOutMinimum; pour eviter les frontrun  se lie a chainlink pour ça
                sqrtPriceLimitX96: 0
            });
        
        swapRouter.exactInputSingle(params);// effectuer le swap, ETH sera transférer directement au msg.sender

    }

    function swapTokensForETH(uint256 amountIn, address _token) public {
        swapExactInputSingle(amountIn, _token, WETH9);
        uint256 wethBalance = IERC20(WETH9).balanceOf(address(this));// WETH en ETH
        unwrapETH(wethBalance);
        emit Swaped(msg.sender, amountIn, _token);
    }

    function swapETHForTokens(uint256 amountIn, address _token) public payable {
        uint256 WHCfees = amountIn / 1000;
        uint256 amountAfterFees = amountIn - WHCfees; // 0.1% fees for the service we provide <3 
        
        wrapETH(amountAfterFees);// Appel de wrapETH() pour convertir ETH en WETH
        swapExactInputSingle(amountAfterFees, WETH9, _token);// Appel de swapExactInputSingle() pour effectuer le swap en tokens

        if (msg.value > amountAfterFees) {// Renvoyer les ETH restants  // revoir cette sécurité
            payable(msg.sender).transfer(msg.value - amountAfterFees);
        }
    }

    function wrapETH(uint256 amountIn) public payable {
        //require(msg.value >= amountIn, "Not enough ETH sent");
        IWETH(WETH9).deposit{value: amountIn}();// Convertir ETH en WETH
        IERC20(WETH9).transfer(msg.sender, amountIn);// Transférer les WETH convertis au msg.sender

        if (msg.value > amountIn) {// Renvoyer les ETH restants (si msg.value > amountIn)
            payable(msg.sender).transfer(msg.value - amountIn);
        }
    }

    function wrapETH2(uint256 amountIn, address recipient) public payable {
        require(msg.value >= amountIn, "Not enough ETH sent");
        IERC20(WETH9).approve(address(this), amountIn); // Utiliser IERC20 pour appeler la fonction approve
        IWETH(WETH9).deposit{value: amountIn}(); // Convertir ETH en WETH
        IERC20(WETH9).transfer(recipient, amountIn); // Transférer les WETH convertis au destinataire

        if (msg.value > amountIn) { // Renvoyer les ETH restants (si msg.value > amountIn)
            payable(msg.sender).transfer(msg.value - amountIn);
        }
    }

    function unwrapETH(uint256 amountIn) public payable{
        //require(IERC20(WETH9).balanceOf(msg.sender) >= amountIn, "Not enough WETH balance");
        IERC20(WETH9).transferFrom(msg.sender, address(this), amountIn);// Transférer les WETH du msg.sender au contrat
        IWETH(WETH9).withdraw(amountIn);// Convertir les WETH en ETH
        payable(msg.sender).transfer(amountIn);// Envoyer les ETH convertis au msg.sender
    }

    /*function swapOrSwapBack(bool _SwapBack, uint256 _amountIn, address _tokenIn, address _tokenOut) public {
        
        if (!_SwapBack) {
            swapExactInputSingle(_amountIn, _tokenIn, _tokenOut);
            //TokenList memory newSwap = TokenList(_tokenIn, WETH9,2); // passe le token a l'état swaped
            //tokenList.push(newSwap);
        }
        else {
            require(tokenList.length > 0, "Le tableau est vide");
            swapExactInputSingle(_amountIn, _tokenOut, _tokenIn); // inversion in et out pour faire machine arrière
            /*for (uint i = 0; i < tokenList.length; i++) {
                tokenList[i].State = 3;     // recherche le token correspondant dans le tableau et le passe a l'état backSwaped
            }*//*
        }
    }*/

    //------------------------------------------------------------------ TORNADO CASH
    //------------------------------------------------------------------ CHAIN LINK
    
    function getLatestPrice() public view returns (int) {
        (,int price,,,) = priceFeed.latestRoundData();
        return price;
    }

    //------------------------------------------------------------------ WORKFLOW
    //visibilité internal plutôt que private. Cela permettra aux contrats dérivés ou aux contrats de Gelato Network de pouvoir interagir avec ces fonctions.

    /*function changeStep(Steps _from, Steps _to) private{
        require(step == _from, "changeStep Invalid");
        step = _to;
        emit StepChanged(_from, _to);
    }*/
    function changeStep(Steps _from, Steps _to) private {
        require(userSteps[msg.sender] == _from, "changeStep() not possible");
        userSteps[msg.sender] = _to;
        emit StepChanged(msg.sender, _from, _to);
    }

    //function RESET() public { step = Steps.TokenSelection; }
    function reset() public {
        userSteps[msg.sender] = Steps.TokenSelection; // Réinitialisez l'étape pour l'utilisateur
        //UserData storage userData = usersData[msg.sender]; // Réinitialisez les tokens sélectionnés pour l'utilisateur
        delete usersData[msg.sender].tokenList;
    }

    //function getCurrentStep() public view returns (Steps) { return step; }
    function getCurrentStep() public view returns (Steps) {
        return userSteps[msg.sender];
    }

    /*function Selection(address _selectedAddress) public {
        changeStep( Steps.TokenSelection, Steps.Settings );
        addToken(_selectedAddress);
    }*/
    /*function Selection(address _selectedAddress) public {
        UserData storage userData = usersData[msg.sender];
        require(userData.step == Steps.TokenSelection, "Invalid step");
        userData.step = Steps.Settings;
        emit StepChanged(msg.sender, Steps.TokenSelection, Steps.Settings);
        addToken(_selectedAddress, userData);
    }*/
    function Selection(address _selectedAddress) public {
        changeStep(Steps.TokenSelection, Steps.Settings);
        addToken(_selectedAddress);
    }

    /*function Settings(address _OuputAddress) public {
        changeStep( Steps.Settings, Steps.Swap );
        setOuputAddress(_OuputAddress);
    }*/
    /*function Settings(address _outputAddress) public {
        UserData storage userData = usersData[msg.sender];
        require(userData.step == Steps.Settings, "Invalid step");
        userData.step = Steps.Swap;
        emit StepChanged(msg.sender, Steps.Settings, Steps.Swap);
        setOutputAddress(_outputAddress, userData);
    }*/
    function Settings(address _outputAddress) public {
        changeStep(Steps.Settings, Steps.Swap);
        setOutputAddress(_outputAddress);
    }


    /*function Swap(uint256 amountIn, address _token) public {
        changeStep( Steps.Swap, Steps.DepositMixer );
        swapTokensForETH( amountIn, _token);
        DepositMixer();
    }*/
    function Swap(uint256 amountIn, address _token) public {
        changeStep(Steps.Swap, Steps.DepositMixer);
        swapTokensForETH(amountIn, _token);
        DepositMixer();
    }

    /*function DepositMixer() public {
        changeStep( Steps.DepositMixer, Steps.WithdrawMixer );
        depositStartTime = block.timestamp;
        WithdrawMixer();
    }*/
    function DepositMixer() public {
        changeStep(Steps.DepositMixer, Steps.WithdrawMixer);
        depositStartTime = block.timestamp;
        WithdrawMixer();
    }
        
    // je crois que cette étape est inutile car le star() est dasn la step avant et le require est dans la step d'après
    /*function Waiting() public {
        require( step == Steps.DepositMixer, "Wrong step" );
        step = Steps.Waiting;
        emit StepChange( Steps.DepositMixer, Steps.Waiting );
        //stepWithdrawMixer();
    }*/

    /*function WithdrawMixer() public {  //en internal pour l'implementation de Gelato
        require(block.timestamp >= depositStartTime + mixingDuration, "You must wait 24h at least");
        changeStep( Steps.WithdrawMixer, Steps.SwapBack );
        SwapBack(); 
    }*/
    function WithdrawMixer() public {
        //UserData storage userData = usersData[msg.sender];
        require(block.timestamp >= usersData[msg.sender].depositStartTime + mixingDuration, "You must wait 24h at least");
        changeStep(Steps.WithdrawMixer, Steps.SwapBack);
        SwapBack();
    }
        
    //function FeesServices() public { SwapBack(); }
    
    /*function SwapBack() private {
        changeStep( Steps.SwapBack, Steps.Done );
        //swapOrSwapBack(true, 10000000000000000000, WETH9, DAI);
        Done();
    }*/
    function SwapBack() private {
        changeStep(Steps.SwapBack, Steps.Done);
        //UserData storage userData = usersData[user]; si pas Done(user);
        // swapOrSwapBack(true, 10000000000000000000, WETH9, DAI);
        Done(); //Done(user);
    }

    function Done() private { }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }
    

}