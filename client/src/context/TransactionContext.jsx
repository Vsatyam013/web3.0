import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { contractABI, contractAddress } from "../utils/constants";

export const TransactionContext = React.createContext();

const { ethereum } = window;

// ✅ Correctly create Ethereum Contract with a Signer
const createEthereumContract = async () => {
  if (!ethereum) throw new Error("No Ethereum object found");

  const provider = new ethers.BrowserProvider(ethereum);
  const signer = await provider.getSigner();  // ✅ Ensure signer is awaited
  return new ethers.Contract(contractAddress, contractABI, signer); // ✅ Contract now has a signer
};

export const TransactionsProvider = ({ children }) => {
  const [formData, setformData] = useState({ addressTo: "", amount: "", keyword: "", message: "" });
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionCount, setTransactionCount] = useState(localStorage.getItem("transactionCount") || 0);
  const [transactions, setTransactions] = useState([]);

  const handleChange = (e, name) => {
    setformData((prevState) => ({ ...prevState, [name]: e.target.value }));
  };

  const getAllTransactions = async () => {
    try {
      if (!ethereum) return console.log("Ethereum is not present");
      if (!currentAccount) return; 

      const transactionsContract = await createEthereumContract();  // ✅ Await contract instance
      const availableTransactions = await transactionsContract.getAllTransactions();

      const structuredTransactions = availableTransactions.map((transaction) => ({
        addressTo: transaction.receiver,
        addressFrom: transaction.sender,
        timestamp: new Date(Number(transaction.timestamp) * 1000).toLocaleString(),
        message: transaction.message,
        keyword: transaction.keyword,
        amount: parseInt(transaction.amount._hex) / (10 ** 18),
      }));

      setTransactions(structuredTransactions);
    } catch (error) {
      console.log(error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!ethereum) {
        console.log("Please install MetaMask.");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log("No accounts found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!ethereum) return alert("Please install MetaMask.");

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setCurrentAccount(accounts[0]);

      getAllTransactions();
    } catch (error) {
      console.log(error);
    }
  };

  const sendTransaction = async () => {
    try {
      if (!ethereum) return console.log("No ethereum object");

      const { addressTo, amount, keyword, message } = formData;
      const parsedAmount = ethers.parseEther(amount);

      const transactionsContract = await createEthereumContract();  // ✅ Await contract instance

      // ✅ Send transaction using MetaMask
      await ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentAccount,
            to: addressTo,
            gas: "0x5208", // 21000 Gwei
            value: ethers.toQuantity(parsedAmount),
          },
        ],
      });

      // ✅ Now call contract function (properly signed)
      const transaction = await transactionsContract.addToBlockchain(addressTo, parsedAmount, message, keyword);

      setIsLoading(true);
      console.log(`Loading - ${transaction.hash}`);
      await transaction.wait();
      console.log(`Success - ${transaction.hash}`);
      setIsLoading(false);

      const transactionsCount = await transactionsContract.getTransactionCount();
      setTransactionCount(Number(transactionsCount));

      getAllTransactions(); // Refresh transactions
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  return (
    <TransactionContext.Provider
      value={{
        transactionCount,
        connectWallet,
        transactions,
        currentAccount,
        isLoading,
        sendTransaction,
        handleChange,
        formData,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};
