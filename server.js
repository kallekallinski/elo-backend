const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
app.use(cors());


const app = express();
app.use(cors());

const API_KEY = process.env.RIOT_API_KEY;

app.get("/api/summoner", async (req, res) => {
  const name = req.query.name;
  const tag = req.query.tag;

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

    res.json({
      name: `${name}#${tag}`,
      lp: soloQ?.leaguePoints ?? 0,
      tier: soloQ?.tier ?? "UNRANKED",
      rank: soloQ?.rank ?? ""
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Fehler beim Abrufen von Riot-Daten." });
  }
});

app.listen(3001, () => {
  console.log("✅ Server läuft auf http://localhost:3001");
});
