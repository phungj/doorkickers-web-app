import { TILE_SIZE } from "./map.js";

export const FOG = {
    UNSEEN: 0,
    SEEN: 1,
    VISIBLE: 2
};

export function createFog(width, height) {
    return {
        width,
        height,
        cells: new Uint8Array(width * height)
    };
}

export function idx(fog, x, y) {
    return y * fog.width + x;
}

export function drawFog(ctx, fog) {
    for (let y = 0; y < fog.height; y++) {
        for (let x = 0; x < fog.width; x++) {
            const state = fog.cells[idx(fog, x, y)];

            if (state === FOG.VISIBLE) continue;

            if (state === FOG.SEEN) {
                ctx.fillStyle = "rgba(0,0,0,0.3)";
            } else {
                ctx.fillStyle = "rgba(0,0,0,0.4)";
            }

            ctx.fillRect(
                x * TILE_SIZE,
                y * TILE_SIZE,
                TILE_SIZE,
                TILE_SIZE
            );
        }
    }
}

export function isVisibleToPlayer(unit, fog) {
    const tx = Math.floor(unit.x / TILE_SIZE);
    const ty = Math.floor(unit.y / TILE_SIZE);

    if (tx < 0 || ty < 0 || tx >= fog.width || ty >= fog.height) {
        return false;
    }

    return fog.cells[idx(fog, tx, ty)] === FOG.VISIBLE;
}

export function getFogState(unit, fog) {
    const tx = Math.floor(unit.x / TILE_SIZE);
    const ty = Math.floor(unit.y / TILE_SIZE);

    if (tx < 0 || ty < 0 || tx >= fog.width || ty >= fog.height) {
        return FOG.UNSEEN;
    }

    return fog.cells[idx(fog, tx, ty)];
}