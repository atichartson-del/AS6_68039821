/* ===============================
   SELECT ELEMENTS
================================= */
const audio = document.getElementById("audio");

const playBtn = document.getElementById("playBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const progress = document.getElementById("progress");
const volume = document.getElementById("volume");

const title = document.getElementById("currentTitle");
const artist = document.getElementById("currentArtist");

const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");

const tracks = document.querySelectorAll(".track");
const equalizer = document.getElementById("equalizer");
const vinyl = document.querySelector(".vinyl");

const shuffleBtn = document.getElementById("shuffleBtn");
const repeatBtn = document.getElementById("repeatBtn");
const dynamicBg = document.getElementById("dynamicBg");
const albumCover = document.getElementById("albumCover");
const modeToggle = document.getElementById("modeToggle");

let currentIndex = -1;
let shuffle = false;
let repeat = false;


/* ===============================
   LOAD SONG
================================= */
function loadSong(index) {
    const track = tracks[index];

    audio.src = track.dataset.src;
    title.textContent = track.dataset.title;
    artist.textContent = track.dataset.artist;

    tracks.forEach(t => t.classList.remove("active"));
    track.classList.add("active");

    currentIndex = index;

    updateDynamicBackground(albumCover.src);
    localStorage.setItem("lastSongIndex", index);
}


/* ===============================
   PLAY / PAUSE
================================= */
function togglePlay() {
    audio.paused ? audio.play() : audio.pause();
}

audio.addEventListener("play", () => {
    playBtn.textContent = "⏸";
    equalizer.classList.add("playing");
    vinyl.classList.add("spin");
});

audio.addEventListener("pause", () => {
    playBtn.textContent = "▶";
    equalizer.classList.remove("playing");
    vinyl.classList.remove("spin");
});


/* ===============================
   NEXT / PREV
================================= */
function nextSong() {

    if (shuffle) {
        const randomIndex = Math.floor(Math.random() * tracks.length);
        loadSong(randomIndex);
    } else {
        currentIndex = (currentIndex + 1) % tracks.length;
        loadSong(currentIndex);
    }

    audio.play();
}

function prevSong() {
    currentIndex =
        (currentIndex - 1 + tracks.length) % tracks.length;
    loadSong(currentIndex);
    audio.play();
}


/* ===============================
   ENDED LOGIC
================================= */
audio.addEventListener("ended", () => {
    if (repeat) {
        audio.currentTime = 0;
        audio.play();
    } else {
        nextSong();
    }
});


/* ===============================
   TRACK CLICK
================================= */
tracks.forEach((track, index) => {
    track.addEventListener("click", () => {
        loadSong(index);
        audio.play();
    });
});


/* ===============================
   PROGRESS BAR
================================= */
audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
        const percent =
            (audio.currentTime / audio.duration) * 100;

        progress.value = percent;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        durationEl.textContent = formatTime(audio.duration);
    }
});

progress.addEventListener("input", () => {
    audio.currentTime =
        (progress.value / 100) * audio.duration;
});


/* ===============================
   VOLUME
================================= */
volume.addEventListener("input", () => {
    audio.volume = volume.value;
});


/* ===============================
   FORMAT TIME
================================= */
function formatTime(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
        .toString()
        .padStart(2, "0");
    return `${minutes}:${seconds}`;
}


/* ===============================
   SHUFFLE / REPEAT
================================= */
shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle("active");
});

repeatBtn.addEventListener("click", () => {
    repeat = !repeat;
    repeatBtn.classList.toggle("active");
});


/* ===============================
   DYNAMIC BACKGROUND
================================= */
function updateDynamicBackground(src){
    dynamicBg.style.backgroundImage = `url(${src})`;
}


/* ===============================
   RESTORE LAST SONG
================================= */
window.addEventListener("load", () => {
    const savedIndex = localStorage.getItem("lastSongIndex");
    if (savedIndex !== null) {
        loadSong(parseInt(savedIndex));
    }
});


/* ===============================
   LIGHT / DARK MODE
================================= */
modeToggle.addEventListener("click",()=>{
    document.body.classList.toggle("light");
});


/* ===============================
   DOMINANT COLOR EXTRACT
================================= */
function extractColor(img){
    const canvasTmp = document.createElement("canvas");
    const ctxTmp = canvasTmp.getContext("2d");

    canvasTmp.width = img.width;
    canvasTmp.height = img.height;
    ctxTmp.drawImage(img,0,0);

    const data = ctxTmp.getImageData(
        0,0,canvasTmp.width,canvasTmp.height
    ).data;

    let r=0,g=0,b=0,count=0;

    for(let i=0;i<data.length;i+=40){
        r+=data[i];
        g+=data[i+1];
        b+=data[i+2];
        count++;
    }

    r=Math.floor(r/count);
    g=Math.floor(g/count);
    b=Math.floor(b/count);

    document.documentElement
        .style
        .setProperty("--gold",`rgb(${r},${g},${b})`);
}

albumCover.onload = () => extractColor(albumCover);


/* ===============================
   SMOOTH WAVE VISUALIZER
================================= */
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = 120;

const audioCtx =
    new (window.AudioContext||window.webkitAudioContext)();

const analyser = audioCtx.createAnalyser();
const source = audioCtx.createMediaElementSource(audio);

source.connect(analyser);
analyser.connect(audioCtx.destination);

analyser.fftSize = 2048;

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

function draw(){
    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.beginPath();
    ctx.lineWidth=2;
    ctx.strokeStyle=
        getComputedStyle(document.documentElement)
        .getPropertyValue("--gold");

    const sliceWidth = canvas.width / bufferLength;
    let x=0;

    for(let i=0;i<bufferLength;i++){
        const v=dataArray[i]/128.0;
        const y=v*canvas.height/2;

        i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
        x+=sliceWidth;
    }

    ctx.lineTo(canvas.width,canvas.height/2);
    ctx.stroke();
}

draw();