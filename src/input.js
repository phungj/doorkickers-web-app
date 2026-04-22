import {simplifyPath} from "./unit.js";
import {sim, stepSimulation} from "./sim.js";

export function setupInput(canvas, unit) {
    let dragging = false;

    canvas.addEventListener("mousedown", (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        if (
            mx > unit.x - unit.size &&
            mx < unit.x + unit.size &&
            my > unit.y - unit.size &&
            my < unit.y + unit.size
        ) {
            dragging = true;
            unit.rawPath = [];
            unit.waypoints = [];
            unit.targetIndex = 0;
        }
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!dragging) return;

        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // TODO: Refactor this to prevent invalid paths from being drawn
        unit.rawPath.push({ x: mx, y: my });
    });

    canvas.addEventListener("mouseup", () => {
        dragging = false;

        unit.waypoints = simplifyPath(unit.rawPath);
    });

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            sim.paused = !sim.paused;
        }

        if (e.code === "KeyS") {
            stepSimulation();
        }
    });
}