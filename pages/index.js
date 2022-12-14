import styles from '../styles/Home.module.css'
import Nft from '../components/Nft';
import Tech from '../components/Tech';
import About from '../components/About';
import Timeline from '../components/Timeline';
import Generate from '../components/Generate'

import fs from 'fs'
import path from 'path'
import { ethers } from 'ethers';


export default function Home({ imageURLs, abi, contractAddress }) {
  console.log(Object.keys(imageURLs).length);
  return (
    <div className={styles.container}>
      {Object.keys(imageURLs).length > 0?
        <Nft imageURLs={imageURLs} abi={abi} contractAddress={contractAddress} />
        :
        <>No NFTs have been minted, be the first to generate!</>
      }
      <Tech />
      <About />
      <Timeline />
      <Generate abi={abi} contractAddress={contractAddress} />
    </div>
  )
}

export async function getServerSideProps() {
  // Get list of burned IDs from contract
  // Load their metadata from google storage
  // return list of image URLS (load the images on the client side since ipfs can take a while)
  const abi = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'json', `${process.env.CONTRACT_ADDRESS}.json`), 'utf8')).abi;
  const provider = new ethers.providers.AlchemyProvider("goerli", process.env.ALCHEMY_API_KEY);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
  const burnedIds = await contract.getBurntTokenIds();
  const contractAddress = process.env.CONTRACT_ADDRESS;
  let burnedTokenMetadataURLs = {};
  burnedIds.map((id) => {
    burnedTokenMetadataURLs[id] = `https://storage.googleapis.com/scaipes-metadata/${id}.json`;
  });

  let imageURLs = {};
  for (const [id, url] of Object.entries(burnedTokenMetadataURLs)) {
    let metadata = await fetch(url);
    metadata = await metadata.json();
    imageURLs[id] = metadata.image;
  }

  for (const [id, url] of Object.entries(imageURLs)) {
    imageURLs[id] = url.replace('ipfs://', 'https://nftstorage.link/ipfs/');
  }

  return {
    props: {
      imageURLs,
      // contract
      abi,
      contractAddress

    }
  }
}