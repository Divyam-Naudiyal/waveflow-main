let currentsong = new Audio();
let songs = [];
let currfolder = "";

// Utility to format seconds to mm:ss
function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2,'0')}:${String(remainingSeconds).padStart(2,'0')}`;
}

// Fetch songs from the album's info.json
async function getsongs(folder) {
    currfolder = folder;
    let res = await fetch(`/${folder}/info.json`);
    if (!res.ok) {
        console.error("Failed to fetch info.json for folder:", folder);
        return [];
    }
    let data = await res.json();
    songs = data.songs || [];

    // Populate song list in the sidebar
    const songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";
    songs.forEach(song => {
        songUL.innerHTML += `
        <li>
            <img class="invert" src="music.svg" alt="music">
            <div class="info">
                <div>${song}</div>
                <div>${data.artist || "Unknown"}</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="play">
            </div>
        </li>`;
    });

    // Add click event to play songs
    document.querySelectorAll(".songList li").forEach(li => {
        li.addEventListener("click", () => {
            let songName = li.querySelector(".info div").innerText;
            playmusic(songName);
        });
    });

    return songs;
}

// Play a selected song
const playmusic = (track, pause=false) => {
    currentsong.src = `/${currfolder}/${track}`;
    if (!pause) currentsong.play();
    
    document.querySelector("#play").src = currentsong.paused ? "play.svg" : "pause.svg";
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// Display all albums as cards
async function displayAlbums() {
    let res = await fetch("/songs/info.json"); // Optional: main list of albums if you have one
    // If you don't have a main JSON, you can hardcode album folders
    const albums = ["Aman","Arnav","cs","Divyam","Gappu","Jiya","ncs","Pawan","Preet"];
    const cardContainer = document.querySelector(".cardContainer");
    
    for (let folder of albums) {
        let albumRes = await fetch(`/songs/${folder}/info.json`);
        if (!albumRes.ok) continue;
        let info = await albumRes.json();
        
        cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
            <div class="play">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"
                    fill="black" style="stroke: black;">
                    <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                        stroke-width="1.5" stroke-linejoin="round" />
                </svg>
            </div>
            <img src="/songs/${folder}/cover.jpg" alt="cover">
            <h2>${info.title}</h2>
            <p>${info.description}</p>
        </div>`;
    }

    // Album click
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async e => {
            const folder = e.currentTarget.dataset.folder;
            await getsongs(`songs/${folder}`);
            playmusic(songs[0]);
        });
    });
}

// Main function
async function main() {
    // Load a default album
    await getsongs("songs/ncs");
    playmusic(songs[0], true);
    
    displayAlbums();

    // Play/Pause button
    const playBtn = document.querySelector("#play");
    playBtn.addEventListener("click", () => {
        if (currentsong.paused) currentsong.play();
        else currentsong.pause();
        playBtn.src = currentsong.paused ? "play.svg" : "pause.svg";
    });

    // Time update
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = 
            `${secondsToMinutesSeconds(currentsong.currentTime)} / ${secondsToMinutesSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    // Seek bar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = e.offsetX / e.target.getBoundingClientRect().width;
        currentsong.currentTime = percent * currentsong.duration;
    });

    // Hamburger toggle
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });
    document.querySelector(".closed").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Prev/Next buttons
    document.querySelector("#prev").addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").pop());
        if (index > 0) playmusic(songs[index - 1]);
    });
    document.querySelector("#next").addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").pop());
        if (index < songs.length - 1) playmusic(songs[index + 1]);
    });

    // Volume
    const volumeInput = document.querySelector(".range input");
    volumeInput.addEventListener("input", e => {
        currentsong.volume = e.target.value / 100;
    });
    document.querySelector(".volume > img").addEventListener("click", e => {
        if (currentsong.volume > 0) {
            currentsong.volume = 0;
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            volumeInput.value = 0;
        } else {
            currentsong.volume = 0.1;
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            volumeInput.value = 10;
        }
    });
}

main();
