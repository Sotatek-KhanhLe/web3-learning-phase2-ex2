import './App.css';
import { useEffect, useMemo, useState } from 'react';
import {
  NETWORK_NAME,
  ETH_HTTP_PROVIDER,
  WETH_ADDRESS,
  MaxUint,
} from './contant';
import WETH_ABI from './WETH_ABI.json';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';

function App() {
  const [accountAddress, setAccountAddress] = useState('');
  const [nativeBalance, setNativeBalance] = useState(0);
  const [wethBalance, setWETHBalance] = useState(0);

  const [depositValue, setDepositValue] = useState(0);
  const [depositError, setDepositError] = useState({
    visible: false,
    message: '',
  });
  const [withdrawValue, setWithdrawValue] = useState(0);
  const [withdrawError, setWithdrawError] = useState({
    visible: false,
    message: '',
  });
  const web3Instance = useMemo(() => {
    // const provider = new Web3.providers.HttpProvider(ETH_HTTP_PROVIDER);
    // const provider = new Web3.providers.HttpProvider(ETH_HTTP_PROVIDER);
    // return new Web3(provider);
    return new Web3(Web3.givenProvider);
  }, []);

  const wethContract = useMemo(() => {
    if (accountAddress.length && web3Instance)
      return new web3Instance.eth.Contract(WETH_ABI, WETH_ADDRESS);
  }, [web3Instance, accountAddress]);

  const connectToMetamask = async () => {
    try {
      const account = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log(account);
      if (account.length) setAccountAddress(account[0]);
    } catch (error) {
      setAccountAddress('');
    }
  };

  const getNativeBalance = async () => {
    try {
      const balance = await web3Instance.eth.getBalance(accountAddress);
      const convertBalance = Web3.utils.fromWei(balance.toString(), 'ether');
      setNativeBalance(convertBalance);
    } catch (error) {
      console.log(error);
    }
  };

  const getTokenBalance = async () => {
    try {
      const balance = await wethContract.methods
        .balanceOf(accountAddress)
        .call();
      const convertBalance = Web3.utils.fromWei(balance.toString(), 'ether');
      setWETHBalance(convertBalance);
    } catch (error) {
      console.log(error);
    }
  };

  // const checkAllowanceWETH = async ()=>{
  //   try {
  //   } catch (error) {

  //   }
  // }
  // const approveWETH = async ()=>{
  //   try {
  //   } catch (error) {

  //   }
  // }

  const depositWETH = async () => {
    if (nativeBalance - depositValue < 0) {
      setDepositError({
        visible: true,
        message: 'Insufficient token balance ',
      });
      return;
    }
    try {
      const deposit = await wethContract.methods.deposit().send({
        from: accountAddress,
        gas: 300000,
        value: Web3.utils.toWei(depositValue.toString(), 'ether'),
      });
      setDepositValue('');
      setDepositError({ visible: false, message: '' });
      console.log(deposit);
    } catch (error) {
      console.log(error);
      setDepositValue('');
      if (error.code === 4001)
        setDepositError({ visible: true, message: 'User reject transaction' });
    }
  };

  const withdrawETH = async () => {
    if (wethBalance - withdrawValue < 0) {
      setWithdrawError({
        visible: true,
        message: 'Insufficient token balance ',
      });
      return;
    }
    try {
      const checkAllow = await wethContract.methods
        .allowance(accountAddress, WETH_ADDRESS)
        .call();
      const allowValue = new BigNumber(checkAllow);
      const withdrawToWei = new BigNumber(
        Web3.utils.toWei(withdrawValue, 'ether')
      );
      const validAmount = new BigNumber(allowValue - withdrawToWei);
      if (validAmount < 0) {
        await wethContract.methods.approve(WETH_ADDRESS, MaxUint).send({
          from: accountAddress,
          gas: 300000,
        });
      }
      await wethContract.methods.withdraw(withdrawToWei.toFixed()).send({
        from: accountAddress,
        gas: 300000,
      });
      setWithdrawValue('');
      setWithdrawError({ visible: false, message: '' });
    } catch (error) {
      if (error.code === 4001)
        setWithdrawError({ visible: true, message: 'User reject transaction' });
    }
  };

  useEffect(() => {
    if (accountAddress) {
      const reset = setInterval(() => {
        getNativeBalance();
        getTokenBalance();
      }, [3000]);
      return () => clearInterval(reset);
    }
  }, [accountAddress]);

  return (
    <div className='App'>
      <div className='content'>
        {!accountAddress.length ? (
          <div className='connect-metamask'>
            <button
              className='btn connect-metamask__btn'
              onClick={connectToMetamask}
            >
              Connect with Metamask
            </button>
          </div>
        ) : (
          <div className='wallet-info'>
            <h1>
              <span>Account: </span>
              <span>{accountAddress}</span>
            </h1>
            <p className='capitalize'>
              <span>ETH balance: </span>
              <span>{nativeBalance}</span>
            </p>
            <p className='capitalize'>
              <span>WETH balance: </span>
              <span>{wethBalance}</span>
            </p>
            <p className='capitalize'>
              <span>Network: </span>
              <span>{NETWORK_NAME}</span>
            </p>
            <div className='interact'>
              <div id='deposite' className='input'>
                <div>
                  <input
                    type='number'
                    placeholder='Input amount here'
                    value={depositValue}
                    onChange={(e) => setDepositValue(e.currentTarget.value)}
                    onFocus={() => {
                      if (depositValue === 0) setDepositValue('');
                      setDepositError({ visible: false, message: '' });
                    }}
                  />
                </div>
                {depositError.visible ? (
                  <p className='error'>{depositError.message}</p>
                ) : null}
                <div>
                  <button onClick={depositWETH}>Deposit ETH</button>
                </div>
              </div>
              <div id='withdraw' className='input'>
                <div>
                  <input
                    type='number'
                    placeholder='Input amount here'
                    value={withdrawValue}
                    onChange={(e) => setWithdrawValue(e.currentTarget.value)}
                    onFocus={() => {
                      if (withdrawValue === 0) setWithdrawValue('');
                      setWithdrawError({ visible: false, message: '' });
                    }}
                  />
                </div>
                {withdrawError.visible ? (
                  <p className='error'>{withdrawError.message}</p>
                ) : null}
                <div>
                  <button onClick={withdrawETH}>Withdraw ETH</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
