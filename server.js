const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const API_KEY = process.env.RIOT_API_KEY;

app.get("/api/summoner", async (req, res) => {
  const name = req.query.name;
  const tag = req.query.tag;
  const startTier = req.query.startTier;
  const startDivision = req.query.startDivision;
  const startLP = parseInt(req.query.startLP, 10);

  const tierValue = {
    IRON: 0,
    BRONZE: 400,
    SILVER: 800,
    GOLD: 1200,
    PLATINUM: 1600,
    EMERALD: 2000,
    DIAMOND: 2400,
    MASTER: 2800,
    GRANDMASTER: 3000,
    CHALLENGER: 3200
  };

  const divisionValue = {
    IV: 0,
    III: 100,
    II: 200,
    I: 300
  };

  try {
    const accountRes = await axios.get(
      `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${name}/${tag}`,
      { headers: { "X-Riot-Token": API_KEY } }
    );

    const summonerRes = await axios.get(
      `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountRes.data.puuid}`,
      { headers: { "X-Riot-Token": API_KEY } }
    );

    const rankedRes = await axios.get(
      `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerRes.data.id}`,
      { headers: { "X-Riot-Token": API_KEY } }
    );

    const soloQ = rankedRes.data.find(q => q.queueType === "RANKED_SOLO_5x5");

    const currentScore = (tierValue[soloQ?.tier] ?? 0) + (divisionValue[soloQ?.rank] ?? 0) + (soloQ?.leaguePoints ?? 0);
    const startScore = (tierValue[startTier] ?? 0) + (divisionValue[startDivision] ?? 0) + (startLP ?? 0);
    const netGain = currentScore - startScore;
    const totalGames = (soloQ?.wins ?? 0) + (soloQ?.losses ?? 0);

    res.json({
      name: `${name}#${tag}`,
      lp: soloQ?.leaguePoints ?? 0,
      tier: soloQ?.tier ?? "UNRANKED",
      rank: soloQ?.rank ?? "",
      netGain,
      gamesPlayed: totalGames
    });

  } catch (err) {
    console.error("Fehler in API:", err.response?.data || err.message);
    res.status(500).json({ error: "Fehler beim Abrufen von Riot-Daten." });
  }
});

app.listen(3001, () => {
  console.log("✅ Backend läuft auf http://localhost:3001");
});
