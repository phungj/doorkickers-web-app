import {simplifyPath} from "./unit.js";
import {sim, stepSimulation} from "./sim.js";

export function setupInput(canvas, world) {
    let selectedUnit = null;
    let dragging = false;

    canvas.addEventListener("mousedown", (e) => {
        const { x, y } = getMousePos(e);

        const unit = getUnitAt(world.units.filter(u => u.type === "player"), x, y);

        if (unit) {
            selectedUnit = unit;
            dragging = true;

            unit.rawPath = [];
            unit.waypoints = [];
            unit.targetIndex = 0;
        } else {
            selectedUnit = null;
        }
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!dragging || !selectedUnit) return;

        const { x, y } = getMousePos(e);

        // TODO: Refactor this to prevent invalid paths from being drawn
        selectedUnit.rawPath.push({ x, y });
    });

    canvas.addEventListener("mouseup", () => {
        if (dragging && selectedUnit) {
            selectedUnit.waypoints = simplifyPath(selectedUnit.rawPath);
        }

        dragging = false;
    });

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") {
            sim.paused = !sim.paused;
        }

        if (e.code === "KeyS") {
            stepSimulation();
        }
    });

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
}

function getUnitAt(units, x, y) {
    return units.find(unit =>
        x > unit.x - unit.size &&
        x < unit.x + unit.size &&
        y > unit.y - unit.size &&
        y < unit.y + unit.size
    );
}

