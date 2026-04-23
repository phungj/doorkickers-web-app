export function emitNoise(world, x, y, radius, type) {
    world.noiseEvents.push({
        x,
        y,
        radius,
        type,
        ttl: 1
    });
}