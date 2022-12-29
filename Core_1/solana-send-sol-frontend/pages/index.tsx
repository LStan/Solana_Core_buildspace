import { NextPage } from "next";
import styles from "../styles/Home.module.css";
import { AppBar } from "../components/AppBar";
import { SendSolForm } from "../components/SendSolForm";
import Head from "next/head";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import * as web3 from "@solana/web3.js";

const Home: NextPage = (props) => {
  const [balance, setBalance] = useState(0);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  if (connection && publicKey) {
    connection.getBalance(publicKey).then((balance) => {
      setBalance(balance / web3.LAMPORTS_PER_SOL);
    });
  }

  return (
    <div className={styles.App}>
      <Head>
        <title>Wallet-Adapter Example</title>
        <meta name="description" content="Wallet-Adapter Example" />
      </Head>
      <AppBar />
      <div className={styles.AppBody}>
        <p>{`Balance: ${balance} SOL`}</p>
        <SendSolForm />
      </div>
    </div>
  );
};

export default Home;
