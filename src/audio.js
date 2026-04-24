const FLASHBANG_SOUND = new Audio("./public/audio/flashbang.mp3");
const GUNSHOT_SOUND = new Audio("./public/audio/gunshot.mp3");

export function playFlashbang() {
    const sfx = FLASHBANG_SOUND.cloneNode();
    sfx.play();
}

export function playGunshot() {
    GUNSHOT_SOUND.cloneNode().play();
}