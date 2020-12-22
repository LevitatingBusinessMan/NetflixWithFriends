//https://gist.github.com/dimapaloskin/e268e5356df160599244418d256e3f4e

console.log("netflix_player.js is here")

const videoPlayer = netflix
.appContext
.state
.playerApp
.getAPI()
.videoPlayer;

// Getting player id
const playerSessionId = videoPlayer
.getAllPlayerSessionIds()[0];

var netflix_player = videoPlayer
.getVideoPlayerBySessionId(playerSessionId)
