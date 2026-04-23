import {getTileGrid, Tile, TILE_SIZE} from "../map.js";

function isWalkable(tx, ty) {
    const tile = getTileGrid(tx, ty);

    return tile !== Tile.WALL && tile !== Tile.DOOR_CLOSED;
}

function toGrid(x, y) {
    return {
        x: Math.floor(x / TILE_SIZE),
        y: Math.floor(y / TILE_SIZE)
    };
}

function toWorld(x, y) {
    return {
        x: x * TILE_SIZE + TILE_SIZE / 2,
        y: y * TILE_SIZE + TILE_SIZE / 2
    };
}

function neighbors(node) {
    return [
        { x: node.x + 1, y: node.y },
        { x: node.x - 1, y: node.y },
        { x: node.x, y: node.y + 1 },
        { x: node.x, y: node.y - 1 }
    ];
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function reconstructPath(cameFrom, current) {
    const path = [current];
    const key = (n) => `${n.x},${n.y}`;

    while (cameFrom.has(key(current))) {
        current = cameFrom.get(key(current));
        path.push(current);
    }

    path.reverse();

    return path.map(p => toWorld(p.x, p.y));
}

export function aStar(start, end) {
    const startNode = toGrid(start.x, start.y);
    const endNode = toGrid(end.x, end.y);

    const open = [startNode];
    const cameFrom = new Map();

    const gScore = new Map();
    const fScore = new Map();

    const key = (n) => `${n.x},${n.y}`;

    gScore.set(key(startNode), 0);
    fScore.set(key(startNode), heuristic(startNode, endNode));

    while (open.length > 0) {
        open.sort((a, b) => fScore.get(key(a)) - fScore.get(key(b)));
        const current = open.shift();

        if (current.x === endNode.x && current.y === endNode.y) {
            return reconstructPath(cameFrom, current);
        }

        for (const neighbor of neighbors(current)) {
            if (!isWalkable(neighbor.x, neighbor.y)) continue;

            const tentative = gScore.get(key(current)) + 1;
            const nk = key(neighbor);

            if (!gScore.has(nk) || tentative < gScore.get(nk)) {
                cameFrom.set(nk, current);
                gScore.set(nk, tentative);
                fScore.set(nk, tentative + heuristic(neighbor, endNode));

                if (!open.find(n => n.x === neighbor.x && n.y === neighbor.y)) {
                    open.push(neighbor);
                }
            }
        }
    }

    return [];
}