export function emitNoise(world, x, y, radius, type) {
    world.events.noise.push({
        x,
        y,
        radius,
        type,
        ttl: 1
    });
}