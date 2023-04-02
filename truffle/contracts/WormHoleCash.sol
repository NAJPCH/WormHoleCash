// SPDX-License-Identifier: MIT
//import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

pragma solidity 0.8.18;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IWETH {
    function deposit() external payable;
    function withdraw(uint wad) external;
}

interface ISwapRouter {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
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
 
    address public constant SwapRouterV3 = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address public constant WETH9 = 0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6;
    address public constant DAI = 0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844;
    address public constant LINK = 0x326C977E6efc84E512bB9C30f76E30c160eD06FB;

    address public OuputAddress;
    uint public mixingDuration = 1 minutes;
    uint public entropy = 0;
    uint256 public depositStartTime;


    struct TokenList {
        //address From; address To;
        address Token;
        uint8 State; //1=selected 2=Swaped 3=BackSwaped 4=Error je pourais améliorer ça en array outruct ou enum
    }

    TokenList[] public tokenList;

    enum Steps {
        TokenSelection, // sélection des token que l'on souhaite utiliser   
        Settings,        // Address Output, choix ETH ou StableCOins, Duration, Antropie, nombre de adresse de sortie
        Swap,           // Swap sur Uni
        DepositMixer,   // Tornado Cash dépo
        //Waiting,        // Mixage Automation via Gelato
        WithdrawMixer,  // Tornado Cash sortie
        FeesServices,   // Frais d'utilisation
        SwapBack,       // Swap vers Tokens
        Done            // Enjoy
    }

    Steps public step;

    event StepChanged(
        Steps previousStatus,
        Steps newStatus
    );

    event TokenListed(TokenList tokenSelected);
    event OutputAddressSeted(address OuputAddress);
 
    // Pour cet exemple, on va prendre des frais de pool à 0.3%
    uint24 public constant poolFee = 3000;
 
    /*constructor(ISwapRouter _swapRouter) {
        swapRouter = _swapRouter;
    }*/
    constructor() {
        swapRouter = ISwapRouter(SwapRouterV3);
    }
    //------------------------------------------------------------------ SETTING
    /*function getOuputAddress() public view returns (address) { return OuputAddress; }
    function setMixingDuration(uint _mixingDuration) private { mixingDuration = _mixingDuration; }
    function setEntropy(uint _entropy) private { entropy = _entropy; }   */ 

    function setOuputAddress(address _OuputAddress) private {
        OuputAddress = _OuputAddress;
    }

    function addToken(address _token) private {
        TokenList memory newToken = TokenList(_token, 1);
        tokenList.push(newToken);
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
        // rajoute un bool SwapBack pour savoir si c'est un swap ou un swapback pour utiliser cette fontion dans les deux sens
        // Transfert des tokens en question au smart contract ! Il faut penser à approve ce transfert avant l’utilisation de cette fonction 
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), amountIn);
        // autoriser uniswap à utiliser nos tokens
        IERC20(_tokenIn).approve(address(swapRouter), amountIn);  
        //Creation des paramètres pour l'appel du swap
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _tokenIn,
                tokenOut: _tokenOut,
                fee: poolFee,
                recipient: msg.sender,
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                // amountOutMinimum: _amountOutMinimum; pour eviter les frontrun  se lie a chainlink pour ça
                sqrtPriceLimitX96: 0
            });
        // effectuer le swap, ETH sera transférer directement au msg.sender
        swapRouter.exactInputSingle(params);


    }

    function swapOrSwapBack(bool _SwapBack, uint256 _amountIn, address _tokenIn, address _tokenOut) public {
        
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
            }*/
        }
    }

    function swapExactTokensForETH(uint256 amountIn, address _token) external {
        // Transfert des tokens en question au smart contract ! Il faut penser à approve ce transfert avant l’utilisation de cette fonction 
        IERC20(_token).transferFrom(msg.sender, address(this), amountIn);

        // autoriser uniswap à utiliser nos tokens
        IERC20(_token).approve(address(swapRouter), amountIn);
        
        // Creation des paramètres pour l'appel du swap
        ISwapRouter.ExactInputSingleParams memory params =
            ISwapRouter.ExactInputSingleParams({
                tokenIn: _token,
                tokenOut: WETH9,
                fee: poolFee,
                recipient: address(this), // Change recipient to the contract address itself
                deadline: block.timestamp + 15 minutes, // Add a 15 minutes buffer
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        // effectuer le swap, WETH sera transféré au contrat
        swapRouter.exactInputSingle(params);

        // Convertir WETH en ETH et transférer à msg.sender
        //uint256 wethBalance = IERC20(WETH9).balanceOf(address(this));
        //IWETH(WETH9).withdraw(wethBalance);
        //payable(msg.sender).transfer(wethBalance);
    }


    //------------------------------------------------------------------ TORNADO CASH
    //------------------------------------------------------------------ WORKFLOW
    //visibilité internal plutôt que private. Cela permettra aux contrats dérivés ou aux contrats de Gelato Network de pouvoir interagir avec ces fonctions.

    function changeStep(Steps _from, Steps _to) private{
        require(step == _from, "changeStep Invalid");
        step = _to;
        emit StepChanged(_from, _to);
    }
    function RESET() public { step = Steps.TokenSelection; }

    function getCurrentStep() public view returns (Steps) { return step; }

    function Selection(address _selectedAddress) public {
        changeStep( Steps.TokenSelection, Steps.Settings );
        addToken(_selectedAddress);
    }

    function Settings(address _OuputAddress) public {
        changeStep( Steps.Settings, Steps.Swap );
        setOuputAddress(_OuputAddress);
    }

    function Swap() public {
        changeStep( Steps.Swap, Steps.DepositMixer );
        //swapOrSwapBack(false, 10000000000000000000, DAI, WETH9);
        DepositMixer();
    }
    
    function DepositMixer() private {
        changeStep( Steps.DepositMixer, Steps.WithdrawMixer );
        depositStartTime = block.timestamp;
        //step5WithdrawMixer();
    }
        
    // je crois que cette étape est inutile car le star() est dasn la step avant et le require est dans la step d'après
    /*function Waiting() public {
        require( step == Steps.DepositMixer, "Wrong step" );
        step = Steps.Waiting;
        emit StepChange( Steps.DepositMixer, Steps.Waiting );
        //stepWithdrawMixer();
    }*/

    function WithdrawMixer() public {  //en internal pour l'implementation de Gelato
        require(block.timestamp >= depositStartTime + mixingDuration, "You must wait 24h at least");
        changeStep( Steps.WithdrawMixer, Steps.FeesServices );
        FeesServices(); 
    }
    
    function FeesServices() private {
        changeStep( Steps.FeesServices, Steps.SwapBack );
        SwapBack();
    }
    
    function SwapBack() private {
        changeStep( Steps.SwapBack, Steps.Done );
        swapOrSwapBack(true, 10000000000000000000, WETH9, DAI);
        Done();
    }
    
    function Done() private { }


}