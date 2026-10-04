import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";

/*
========================================================
DEPLOYED CONTRACTS
========================================================
*/

const FACTORY_ADDRESS =
  "0x90193C961A926261B756D1E5bb255e67ff9498A1";

const ROUTER_ADDRESS =
  "0xA8452Ec99ce0C64f20701dB7dD3abDb607c00496";

/*
========================================================
TOKENS
========================================================
*/

const TOKENS = [
  {
    symbol: "TKA",
    address:
      "0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496",
    decimals: 18,
  },
  {
    symbol: "TKB",
    address:
      "0x34A1D3fff3958843C43aD80F30b94c510645C316",
    decimals: 18,
  },
];

/*
========================================================
ABIs
========================================================
*/

const TOKEN_ABI = [
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function allowance(address owner,address spender) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function balanceOf(address account) external view returns (uint256)",
];

const FACTORY_ABI = [
  "function getPair(address tokenA,address tokenB) external view returns (address)",
];

const PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0,uint112 reserve1,uint32 blockTimestampLast)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];

const ROUTER_ABI = [
  "function swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] calldata path,address to,uint256 deadline) external returns (uint256[] memory amounts)",
];

/*
========================================================
APP
========================================================
*/

function App() {
  const [account, setAccount] = useState("");

  const [tokenA, setTokenA] = useState(TOKENS[0]);
  const [tokenB, setTokenB] = useState(TOKENS[1]);

  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");

  const [reserveA, setReserveA] = useState("0");
  const [reserveB, setReserveB] = useState("0");

  const [balanceA, setBalanceA] = useState("0");
  const [balanceB, setBalanceB] = useState("0");

  const [pairAddress, setPairAddress] = useState("");

  const [lpTotalSupply, setLpTotalSupply] =
    useState("0");

  const [userLPBalance, setUserLPBalance] =
    useState("0");

  const [activeTab, setActiveTab] =
    useState("swap");

  /*
  ======================================================
  CONNECT WALLET
  ======================================================
  */

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    try {
      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const accounts =
        await provider.send(
          "eth_requestAccounts",
          []
        );

      setAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  /*
  ======================================================
  DISCONNECT
  ======================================================
  */

  const disconnectWallet = () => {
    setAccount("");
    setBalanceA("0");
    setBalanceB("0");
    setUserLPBalance("0");
  };

  /*
  ======================================================
  SWITCH TOKENS
  ======================================================
  */

  const switchTokens = () => {
    const oldA = tokenA;

    setTokenA(tokenB);
    setTokenB(oldA);

    const oldAmount = amountA;

    setAmountA(amountB);
    setAmountB(oldAmount);
  };

  /*
  ======================================================
  TOKEN A SELECTOR
  ======================================================
  */

  const changeTokenA = (e) => {
    const selected =
      TOKENS.find(
        (token) =>
          token.address.toLowerCase() ===
          e.target.value.toLowerCase()
      );

    if (!selected) return;

    /*
    Prevent same token on both sides
    */

    if (
      selected.address.toLowerCase() ===
      tokenB.address.toLowerCase()
    ) {
      setTokenB(tokenA);
    }

    setTokenA(selected);

    setAmountA("");
    setAmountB("");
  };

  /*
  ======================================================
  TOKEN B SELECTOR
  ======================================================
  */

  const changeTokenB = (e) => {
    const selected =
      TOKENS.find(
        (token) =>
          token.address.toLowerCase() ===
          e.target.value.toLowerCase()
      );

    if (!selected) return;

    /*
    Prevent same token on both sides
    */

    if (
      selected.address.toLowerCase() ===
      tokenA.address.toLowerCase()
    ) {
      setTokenA(tokenB);
    }

    setTokenB(selected);

    setAmountA("");
    setAmountB("");
  };

  /*
  ======================================================
  GET PAIR
  ======================================================
  */

  const loadPair = async () => {
    try {
      if (!window.ethereum) return;

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const factory =
        new ethers.Contract(
          FACTORY_ADDRESS,
          FACTORY_ABI,
          provider
        );

      const pair =
        await factory.getPair(
          tokenA.address,
          tokenB.address
        );

      setPairAddress(pair);

      if (
        pair === ethers.ZeroAddress
      ) {
        setReserveA("0");
        setReserveB("0");
        setLpTotalSupply("0");
        setUserLPBalance("0");

        return;
      }

      await loadPairData(pair);
    } catch (error) {
      console.error(
        "Pair loading failed:",
        error
      );
    }
  };

  /*
  ======================================================
  LOAD PAIR DATA
  ======================================================
  */

  const loadPairData = async (pair) => {
    try {
      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const pairContract =
        new ethers.Contract(
          pair,
          PAIR_ABI,
          provider
        );

      const [
        token0,
        token1,
        reserves,
        totalSupply,
      ] = await Promise.all([
        pairContract.token0(),
        pairContract.token1(),
        pairContract.getReserves(),
        pairContract.totalSupply(),
      ]);

      let reserve0 =
        ethers.formatUnits(
          reserves[0],
          tokenA.decimals
        );

      let reserve1 =
        ethers.formatUnits(
          reserves[1],
          tokenB.decimals
        );

      /*
      Pair stores token0/token1.

      We need to make sure reserveA
      belongs to the currently selected
      tokenA.
      */

      if (
        token0.toLowerCase() ===
        tokenA.address.toLowerCase()
      ) {
        setReserveA(reserve0);
        setReserveB(reserve1);
      } else {
        setReserveA(reserve1);
        setReserveB(reserve0);
      }

      setLpTotalSupply(
        ethers.formatUnits(
          totalSupply,
          18
        )
      );

      /*
      User LP balance
      */

      if (account) {
        const lpBalance =
          await pairContract.balanceOf(
            account
          );

        setUserLPBalance(
          ethers.formatUnits(
            lpBalance,
            18
          )
        );
      }
    } catch (error) {
      console.error(
        "Pair data failed:",
        error
      );
    }
  };

  /*
  ======================================================
  LOAD TOKEN BALANCES
  ======================================================
  */

  const loadBalances = async () => {
    if (!account) return;

    try {
      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const tokenAContract =
        new ethers.Contract(
          tokenA.address,
          TOKEN_ABI,
          provider
        );

      const tokenBContract =
        new ethers.Contract(
          tokenB.address,
          TOKEN_ABI,
          provider
        );

      const [
        rawBalanceA,
        rawBalanceB,
      ] = await Promise.all([
        tokenAContract.balanceOf(
          account
        ),

        tokenBContract.balanceOf(
          account
        ),
      ]);

      setBalanceA(
        ethers.formatUnits(
          rawBalanceA,
          tokenA.decimals
        )
      );

      setBalanceB(
        ethers.formatUnits(
          rawBalanceB,
          tokenB.decimals
        )
      );
    } catch (error) {
      console.error(
        "Balance error:",
        error
      );
    }
  };

  /*
  ======================================================
  CALCULATE SWAP OUTPUT
  ======================================================
  */

  const calculateOutput = (value) => {
    if (!value) {
      setAmountB("");
      return;
    }

    const reserveIn =
      Number(reserveA);

    const reserveOut =
      Number(reserveB);

    const input =
      Number(value);

    if (
      reserveIn <= 0 ||
      reserveOut <= 0 ||
      input <= 0
    ) {
      setAmountB("");
      return;
    }

    /*
    AMM:

    amountInWithFee = amountIn * 997

    amountOut =
      amountInWithFee * reserveOut
      /
      reserveIn * 1000 + amountInWithFee
    */

    const amountInWithFee =
      input * 997;

    const numerator =
      amountInWithFee *
      reserveOut;

    const denominator =
      reserveIn * 1000 +
      amountInWithFee;

    const output =
      numerator /
      denominator;

    setAmountB(
      output.toFixed(6)
    );
  };

  /*
  ======================================================
  AMOUNT A
  ======================================================
  */

  const handleAmountA = (
    value
  ) => {
    setAmountA(value);

    calculateOutput(value);
  };

  /*
  ======================================================
  SWAP
  ======================================================
  */

  const swapTokens = async () => {
    try {
      if (!account) {
        alert(
          "Connect your wallet first"
        );
        return;
      }

      if (
        !amountA ||
        Number(amountA) <= 0
      ) {
        alert(
          "Enter a valid amount"
        );
        return;
      }

      if (
        !amountB ||
        Number(amountB) <= 0
      ) {
        alert(
          "Insufficient liquidity"
        );
        return;
      }

      if (!window.ethereum) {
        alert(
          "MetaMask is not installed"
        );
        return;
      }

      const provider =
        new ethers.BrowserProvider(
          window.ethereum
        );

      const signer =
        await provider.getSigner();

      const userAddress =
        await signer.getAddress();

      /*
      ==================================================
      TOKEN CONTRACT
      ==================================================
      */

      const tokenContract =
        new ethers.Contract(
          tokenA.address,
          TOKEN_ABI,
          signer
        );

      /*
      ==================================================
      ROUTER
      ==================================================
      */

      const router =
        new ethers.Contract(
          ROUTER_ADDRESS,
          ROUTER_ABI,
          signer
        );

      /*
      ==================================================
      DECIMALS
      ==================================================
      */

      const decimals =
        await tokenContract.decimals();

      /*
      ==================================================
      AMOUNT IN
      ==================================================
      */

      const amountIn =
        ethers.parseUnits(
          amountA.toString(),
          decimals
        );

      /*
      ==================================================
      BALANCE CHECK
      ==================================================
      */

      const balance =
        await tokenContract.balanceOf(
          userAddress
        );

      if (balance < amountIn) {
        alert(
          `Insufficient ${tokenA.symbol} balance`
        );

        return;
      }

      /*
      ==================================================
      APPROVAL
      ==================================================
      */

      const allowance =
        await tokenContract.allowance(
          userAddress,
          ROUTER_ADDRESS
        );

      if (allowance < amountIn) {
        console.log(
          `Approving ${tokenA.symbol}...`
        );

        const approveTx =
          await tokenContract.approve(
            ROUTER_ADDRESS,
            amountIn
          );

        await approveTx.wait();

        console.log(
          "Approval successful"
        );
      }

      /*
      ==================================================
      EXPECTED OUTPUT
      ==================================================
      */

      const expectedOutput =
        ethers.parseUnits(
          amountB.toString(),
          tokenB.decimals
        );

      /*
      0.5% slippage
      */

      const amountOutMin =
        expectedOutput *
        995n /
        1000n;

      /*
      ==================================================
      PATH
      ==================================================
      */

      const path = [
        tokenA.address,
        tokenB.address,
      ];

      /*
      ==================================================
      DEADLINE
      ==================================================
      */

      const deadline =
        Math.floor(
          Date.now() / 1000
        ) + 1200;

      console.log(
        "Sending swap..."
      );

      /*
      ==================================================
      TRANSACTION
      ==================================================
      */

      const tx =
        await router.swapExactTokensForTokens(
          amountIn,
          amountOutMin,
          path,
          userAddress,
          deadline
        );

      console.log(
        "Transaction:",
        tx.hash
      );

      alert(
        "Swap transaction submitted!"
      );

      await tx.wait();

      alert(
        "Swap successful!"
      );

      /*
      Refresh data
      */

      setAmountA("");
      setAmountB("");

      await loadBalances();
      await loadPair();
    } catch (error) {
      console.error(
        "Swap failed:",
        error
      );

      if (
        error.code ===
        "ACTION_REJECTED"
      ) {
        alert(
          "Transaction rejected in MetaMask"
        );
      } else {
        alert(
          error.shortMessage ||
          error.reason ||
          "Swap failed. Check console."
        );
      }
    }
  };



  /*
  ======================================================
  ADD LIQUIDITY
  ======================================================
  */

  const ROUTER_ADDRESS =
  "0xA8452Ec99ce0C64f20701dB7dD3abDb607c00496";

const TOKEN_A_ADDRESS =
  "0x7FA9385bE102ac3EAc297483Dd6233D62b3e1496";

const TOKEN_B_ADDRESS =
  "0x34A1D3fff3958843C43aD80F30b94c510645C316";

const routerABI = [
  "function addLiquidity(address tokenA,address tokenB,uint256 amountADesired,uint256 amountBDesired,uint256 amountAMin,uint256 amountBMin,address to,uint256 deadline) external returns (uint256 amountA,uint256 amountB,uint256 liquidity)"
];

const erc20ABI = [
  "function approve(address spender,uint256 amount) external returns (bool)",
  "function allowance(address owner,address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];



const addLiquidity = async () => {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    if (!account) {
      alert("Connect your wallet first");
      return;
    }

    if (!amountA || !amountB) {
      alert("Enter both token amounts");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const userAddress = await signer.getAddress();

    // Create token contracts
    const tokenA = new ethers.Contract(
      TOKEN_A_ADDRESS,
      erc20ABI,
      signer
    );

    const tokenB = new ethers.Contract(
      TOKEN_B_ADDRESS,
      erc20ABI,
      signer
    );

    // Get decimals
    const decimalsA = await tokenA.decimals();
    const decimalsB = await tokenB.decimals();

    // Convert user input to uint256
    const amountADesired = ethers.parseUnits(
      amountA.toString(),
      decimalsA
    );

    const amountBDesired = ethers.parseUnits(
      amountB.toString(),
      decimalsB
    );

    // Check balances
    const balanceA = await tokenA.balanceOf(userAddress);
    const balanceB = await tokenB.balanceOf(userAddress);

    if (balanceA < amountADesired) {
      alert("Insufficient Token A balance");
      return;
    }

    if (balanceB < amountBDesired) {
      alert("Insufficient Token B balance");
      return;
    }

    // ------------------------------------------------
    // APPROVE TOKEN A
    // ------------------------------------------------

    const allowanceA = await tokenA.allowance(
      userAddress,
      ROUTER_ADDRESS
    );

    if (allowanceA < amountADesired) {
      console.log("Approving Token A...");

      const txA = await tokenA.approve(
        ROUTER_ADDRESS,
        amountADesired
      );

      await txA.wait();

      console.log("Token A approved");
    }

    // ------------------------------------------------
    // APPROVE TOKEN B
    // ------------------------------------------------

    const allowanceB = await tokenB.allowance(
      userAddress,
      ROUTER_ADDRESS
    );

    if (allowanceB < amountBDesired) {
      console.log("Approving Token B...");

      const txB = await tokenB.approve(
        ROUTER_ADDRESS,
        amountBDesired
      );

      await txB.wait();

      console.log("Token B approved");
    }

    // ------------------------------------------------
    // CREATE ROUTER
    // ------------------------------------------------

    const router = new ethers.Contract(
      ROUTER_ADDRESS,
      routerABI,
      signer
    );

    // 0.5% slippage
    const amountAMin =
      (amountADesired * 995n) / 1000n;

    const amountBMin =
      (amountBDesired * 995n) / 1000n;

    // 20 minute deadline
    const deadline =
      Math.floor(Date.now() / 1000) + 20 * 60;

    console.log("Adding liquidity...");

    const tx = await router.addLiquidity(
      TOKEN_A_ADDRESS,
      TOKEN_B_ADDRESS,
      amountADesired,
      amountBDesired,
      amountAMin,
      amountBMin,
      userAddress,
      deadline
    );

    console.log("Transaction:", tx.hash);

    await tx.wait();

    alert("Liquidity added successfully!");

  } catch (error) {
    console.error(error);

    if (error.reason) {
      alert(error.reason);
    } else if (error.shortMessage) {
      alert(error.shortMessage);
    } else {
      alert("Failed to add liquidity");
    }
  }
};

  /*
  ======================================================
  REMOVE LIQUIDITY
  ======================================================
  */

  const removeLiquidity = async () => {
    alert(
      "Your AMMRouter removeLiquidity function needs to be connected here."
    );
  };

  /*
  ======================================================
  EFFECTS
  ======================================================
  */

  useEffect(() => {
    if (account) {
      loadBalances();
    }
  }, [
    account,
    tokenA.address,
    tokenB.address,
  ]);

  useEffect(() => {
    loadPair();
  }, [
    tokenA.address,
    tokenB.address,
    account,
  ]);

  /*
  ======================================================
  UI
  ======================================================
  */

  return (
    <div className="app">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">

        <div className="logo">

          <span className="logo-icon">
            ◆
          </span>

          <span>
            AMM
            <span className="logo-highlight">
              Fi
            </span>
          </span>

        </div>


        <div className="nav-links">

          <button
            className={
              activeTab === "swap"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("swap")
            }
          >
            Swap
          </button>


          <button
            className={
              activeTab === "liquidity"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab(
                "liquidity"
              )
            }
          >
            Liquidity
          </button>


          <button
            className={
              activeTab === "pool"
                ? "active"
                : ""
            }
            onClick={() =>
              setActiveTab("pool")
            }
          >
            Pool
          </button>

        </div>


        {!account ? (

          <button
            className="connect-btn"
            onClick={connectWallet}
          >
            Connect Wallet
          </button>

        ) : (

          <button
            className="wallet-btn"
            onClick={
              disconnectWallet
            }
          >
            {account.slice(0, 6)}
            ...
            {account.slice(-4)}
          </button>

        )}

      </nav>


      {/* ================= MAIN ================= */}

      <main className="main">


        {/* ================= LEFT ================= */}

        <section className="left-section">

          <div className="heading">

            <h1>
              Decentralized Exchange
            </h1>

            <p>
              Swap tokens instantly
              using your AMM.
            </p>

          </div>


          {/* ================= SWAP ================= */}

          {activeTab === "swap" && (

            <div className="card">

              <div className="card-header">

                <div>

                  <h2>
                    Swap
                  </h2>

                  <p>
                    Trade tokens with
                    low fees
                  </p>

                </div>

                <button className="settings">
                  ⚙
                </button>

              </div>


              {/* TOKEN A */}

              <div className="input-box">

                <div className="input-top">

                  <span>
                    You pay
                  </span>

                  <span>
                    Balance:{" "}
                    {Number(
                      balanceA
                    ).toFixed(4)}
                  </span>

                </div>


                <div className="input-row">

                  <input
                    type="number"
                    placeholder="0.0"
                    value={amountA}
                    onChange={(e) =>
                      handleAmountA(
                        e.target.value
                      )
                    }
                  />


                  <select
                    className="token-select"
                    value={
                      tokenA.address
                    }
                    onChange={
                      changeTokenA
                    }
                  >

                    {TOKENS.map(
                      (token) => (

                        <option
                          key={
                            token.address
                          }
                          value={
                            token.address
                          }
                        >
                          {token.symbol}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* SWITCH */}

              <button
                className="switch-btn"
                onClick={
                  switchTokens
                }
              >
                ↓↑
              </button>


              {/* TOKEN B */}

              <div className="input-box">

                <div className="input-top">

                  <span>
                    You receive
                  </span>

                  <span>
                    Balance:{" "}
                    {Number(
                      balanceB
                    ).toFixed(4)}
                  </span>

                </div>


                <div className="input-row">

                  <input
                    type="number"
                    placeholder="0.0"
                    value={amountB}
                    readOnly
                  />


                  <select
                    className="token-select"
                    value={
                      tokenB.address
                    }
                    onChange={
                      changeTokenB
                    }
                  >

                    {TOKENS.map(
                      (token) => (

                        <option
                          key={
                            token.address
                          }
                          value={
                            token.address
                          }
                        >
                          {token.symbol}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              {/* INFO */}

              <div className="swap-info">

                <div>

                  <span>
                    Rate
                  </span>

                  <span>

                    1 {tokenA.symbol}
                    {" = "}

                    {reserveA &&
                    reserveB &&
                    Number(
                      reserveA
                    ) > 0
                      ? (
                          Number(
                            reserveB
                          ) /
                          Number(
                            reserveA
                          )
                        ).toFixed(4)
                      : "0"}

                    {" "}
                    {tokenB.symbol}

                  </span>

                </div>


                <div>

                  <span>
                    Liquidity Fee
                  </span>

                  <span>
                    0.3%
                  </span>

                </div>


                <div>

                  <span>
                    Slippage tolerance
                  </span>

                  <span>
                    0.5%
                  </span>

                </div>

              </div>


              {/* SWAP */}

              <button
                className="main-action"
                onClick={
                  account
                    ? swapTokens
                    : connectWallet
                }
              >

                {account
                  ? "Swap"
                  : "Connect Wallet"}

              </button>

            </div>

          )}


          {/* ================= LIQUIDITY ================= */}

          {activeTab ===
            "liquidity" && (

            <div className="card">

              <div className="card-header">

                <div>

                  <h2>
                    Add Liquidity
                  </h2>

                  <p>
                    Provide liquidity
                    and earn fees
                  </p>

                </div>

              </div>


              <div className="liquidity-input">

                <label>
                  {tokenA.symbol}
                </label>

                <input
                  type="number"
                  placeholder="0.0"
                />

              </div>


              <div className="plus">
                +
              </div>


              <div className="liquidity-input">

                <label>
                  {tokenB.symbol}
                </label>

                <input
                  type="number"
                  placeholder="0.0"
                />

              </div>


              <button
                className="main-action"
                onClick={
                  addLiquidity
                }
              >
                Add Liquidity
              </button>


              <button
                className="secondary-action"
                onClick={
                  removeLiquidity
                }
              >
                Remove Liquidity
              </button>

            </div>

          )}


          {/* ================= POOL ================= */}

          {activeTab === "pool" && (

            <div className="card">

              <div className="card-header">

                <div>

                  <h2>
                    Pool
                  </h2>

                  <p>
                    Current AMM
                    reserves
                  </p>

                </div>

              </div>


              <div className="pool-stat">

                <span>
                  {tokenA.symbol}
                  {" "}Reserve
                </span>

                <strong>
                  {Number(
                    reserveA
                  ).toFixed(4)}
                </strong>

              </div>


              <div className="pool-stat">

                <span>
                  {tokenB.symbol}
                  {" "}Reserve
                </span>

                <strong>
                  {Number(
                    reserveB
                  ).toFixed(4)}
                </strong>

              </div>


              <div className="pool-stat">

                <span>
                  Pool Ratio
                </span>

                <strong>

                  {Number(
                    reserveA
                  ) > 0
                    ? (
                        Number(
                          reserveB
                        ) /
                        Number(
                          reserveA
                        )
                      ).toFixed(4)
                    : "0"}

                </strong>

              </div>


              <div className="pool-stat">

                <span>
                  Pair Address
                </span>

                <strong>

                  {pairAddress &&
                  pairAddress !==
                    ethers.ZeroAddress
                    ? `${pairAddress.slice(
                        0,
                        6
                      )}...${pairAddress.slice(
                        -4
                      )}`
                    : "Not created"}

                </strong>

              </div>


              <div className="pool-stat">

                <span>
                  LP Total Supply
                </span>

                <strong>
                  {Number(
                    lpTotalSupply
                  ).toFixed(4)}
                </strong>

              </div>


              <div className="pool-stat">

                <span>
                  Your LP Tokens
                </span>

                <strong>
                  {Number(
                    userLPBalance
                  ).toFixed(4)}
                </strong>

              </div>

            </div>

          )}

        </section>


        {/* ================= RIGHT ================= */}

        <section className="right-section">


          {/* ================= CHART ================= */}

          <div className="chart-card">

            <div className="chart-header">

              <div>

                <span className="small-title">

                  {tokenA.symbol}
                  /
                  {tokenB.symbol}

                </span>


                <h2>

                  {Number(
                    reserveA
                  ) > 0
                    ? (
                        Number(
                          reserveB
                        ) /
                        Number(
                          reserveA
                        )
                      ).toFixed(4)
                    : "0.0000"}

                </h2>


                <span className="positive">
                  Pool Price
                </span>

              </div>


              <div className="time-buttons">

                <button>
                  1H
                </button>

                <button className="selected">
                  1D
                </button>

                <button>
                  1W
                </button>

                <button>
                  1M
                </button>

              </div>

            </div>


            <div className="chart">

              <div className="grid-line line1"></div>
              <div className="grid-line line2"></div>
              <div className="grid-line line3"></div>
              <div className="grid-line line4"></div>


              <svg
                viewBox="0 0 700 300"
                preserveAspectRatio="none"
              >

                <defs>

                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopOpacity="0.35"
                    />

                    <stop
                      offset="100%"
                      stopOpacity="0"
                    />

                  </linearGradient>

                </defs>


                <path
                  className="chart-area"
                  d="
                    M0 240
                    L40 225
                    L80 230
                    L120 190
                    L160 200
                    L200 165
                    L240 175
                    L280 140
                    L320 155
                    L360 120
                    L400 135
                    L440 95
                    L480 110
                    L520 80
                    L560 100
                    L600 65
                    L640 80
                    L700 40
                    L700 300
                    L0 300
                    Z
                  "
                />


                <path
                  className="chart-line"
                  d="
                    M0 240
                    L40 225
                    L80 230
                    L120 190
                    L160 200
                    L200 165
                    L240 175
                    L280 140
                    L320 155
                    L360 120
                    L400 135
                    L440 95
                    L480 110
                    L520 80
                    L560 100
                    L600 65
                    L640 80
                    L700 40
                  "
                />

              </svg>

            </div>


            <div className="chart-footer">

              <span>
                10:00
              </span>

              <span>
                14:00
              </span>

              <span>
                18:00
              </span>

              <span>
                22:00
              </span>

            </div>

          </div>


          {/* ================= POOL INFORMATION ================= */}

          <div className="info-card">

            <h3>
              Pool Information
            </h3>


            <div className="info-row">

              <span>
                {tokenA.symbol}
                {" "}Reserve
              </span>

              <strong>
                {Number(
                  reserveA
                ).toFixed(4)}
              </strong>

            </div>


            <div className="info-row">

              <span>
                {tokenB.symbol}
                {" "}Reserve
              </span>

              <strong>
                {Number(
                  reserveB
                ).toFixed(4)}
              </strong>

            </div>


            <div className="info-row">

              <span>
                Fee
              </span>

              <strong>
                0.30%
              </strong>

            </div>


            <div className="info-row">

              <span>
                LP Tokens
              </span>

              <strong>
                {Number(
                  userLPBalance
                ).toFixed(4)}
              </strong>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;