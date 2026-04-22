export const sim = {
    paused: false,
    stepOnce: false,
};

export function stepSimulation() {
    sim.stepOnce = true;
}