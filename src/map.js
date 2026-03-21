export const TILE_SIZE = 40;

export const Tile = {
    FLOOR: 0,
    WALL: 1,
    DOOR_CLOSED: 2,
    DOOR_OPEN: 3
};

export const map = [
    [1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,2,0,0,0,0,1],
    [1,0,1,0,1,0,1,1,0,1],
    [1,0,1,0,0,0,0,0,0,1],
    [1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1],
];

export function getTileAt(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    return map[ty]?.[tx];
}

export function openDoorAt(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    if (map[ty][tx] === Tile.DOOR_CLOSED) {
        map[ty][tx] = Tile.DOOR_OPEN;
    }
}

export function drawMap(ctx) {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const tile = map[y][x];

            if (tile === Tile.WALL) ctx.fillStyle = "#555";
            else if (tile === Tile.DOOR_CLOSED) ctx.fillStyle = "brown";
            else if (tile === Tile.DOOR_OPEN) ctx.fillStyle = "#c2a679";
            else ctx.fillStyle = "#222";

            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);

            ctx.strokeStyle = "#333";
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }
}