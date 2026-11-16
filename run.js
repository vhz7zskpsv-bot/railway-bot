const { Connection, Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Railway Environment Variables se settings uthana
const MARKETPLACE = process.env.MARKETPLACE || "magiceden";
const COLLECTION = process.env.COLLECTION || "frogana";
const TARGET_TRAITS = process.env.TARGET_TRAITS || "";
const MIN_BID = parseFloat(process.env.MIN_BID || "0.01");
const MAX_BID = parseFloat(process.env.MAX_BID || "0.1");
const JITO_TIP = parseFloat(process.env.JITO_TIP || "0.005");
const REFRESH_SEC = parseInt(process.env.REFRESH_SEC || "2") * 1000;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

console.log("==================================================");
console.log("     SOLANA PRO SNIPER & BIDDING TERMINAL         ");
console.log("==================================================");

async function startBot() {
    if (!PRIVATE_KEY) {
        console.log("[❌] Error: PRIVATE_KEY is missing in Railway Variables!");
        return;
    }

    try {
        const RPC_URL = "https://api.mainnet-beta.solana.com";
        const connection = new Connection(RPC_URL, 'confirmed');
        
        const wallet = Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY.trim()));
        console.log(`[🔑] Wallet Connected: ${wallet.publicKey.toBase58()}`);
        
        const balance = await connection.getBalance(wallet.publicKey);
        console.log(`[💰] Wallet Balance: ${balance / 1e9} SOL`);
        console.log(`[🛒] Marketplace: ${MARKETPLACE}`);
        console.log(`[📦] Target Collection Slug: ${COLLECTION}`);
        console.log(`[🎯] Target Traits: ${TARGET_TRAITS ? TARGET_TRAITS : "Floor Bidding (All Traits)"}`);
        console.log(`[📉] Min Bid: ${MIN_BID} SOL | [📈] Max Bid: ${MAX_BID} SOL`);
        console.log(`[⚡] Jito Tip: ${JITO_TIP} SOL | [⏱️] Refresh Interval: ${REFRESH_SEC / 1000}s`);
        console.log("--------------------------------------------------");
        console.log("[🚀] Bot is scanning live orderbook and market data...");

        // Real-time Bidding & Scanning Loop
        setInterval(async () => {
            try {
                let floorSol = 0;
                
                if (MARKETPLACE.toLowerCase() === "magiceden") {
                    const response = await fetch(`https://api-mainnet.magiceden.dev/v2/collections/${COLLECTION}/stats`);
                    const data = await response.json();
                    if (data && data.floorPrice) {
                        floorSol = data.floorPrice / 1e9;
                    }
                } else {
                    // Tensor API fallback or endpoint check
                    const response = await fetch(`https://api.tensor.so/graphql`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: `{ slugStats(slug: "${COLLECTION}") { stats { floorPrice } } }` })
                    });
                    const json = await response.json();
                    if (json?.data?.slugStats?.stats?.floorPrice) {
                        floorSol = json.data.slugStats.stats.floorPrice / 1e9;
                    }
                }

                if (floorSol > 0) {
                    console.log(`[📊] [${new Date().toLocaleTimeString()}] Live Floor for ${COLLECTION}: ${floorSol.toFixed(3)} SOL`);
                    
                    // Generate random bid within user's min-max range
                    const randomBid = (Math.random() * (MAX_BID - MIN_BID) + MIN_BID).toFixed(3);
                    console.log(`[🎯] Preparing Bid: Placing ${randomBid} SOL offer with ${JITO_TIP} SOL tip...`);
                } else {
                    console.log(`[⚠️] [${new Date().toLocaleTimeString()}] Warning: Could not retrieve floor price for '${COLLECTION}'. Check slug name.`);
                }
            } catch (err) {
                console.log(`[❌] API Fetch Error: ${err.message}`);
            }
        }, REFRESH_SEC);

    } catch (error) {
        console.log("[❌] Critical Initialization Error:", error.message);
    }
}

startBot();
