/*****************************************************************************
 * Copyright (c) 2024 Sadret
 *
 * The OpenRCT2 plugin "RCTris" is licensed
 * under the GNU General Public License version 3.
 *****************************************************************************/

/// <reference path="./../../openrct2.d.ts" />

import { Colour, ElementVisibility, WritableStore, absolute, button, colourPicker, compute, groupbox, horizontal, label, store, vertical, window } from "openrct2-flexui";

/*
 * UI
 */
type Pixel = [WritableStore<Colour>, WritableStore<ElementVisibility>];
type Canvas = Pixel[][];
function createPixel(visibility: ElementVisibility = "hidden"): Pixel {
    return [store(Colour.Black), store(visibility)];
}
function createCanvas(w: number, h: number): Canvas {
    return array(w, () => array(h, () => createPixel()));
}
function createPicker(pixel: Pixel) {
    return colourPicker({
        colour: pixel[0],
        visibility: pixel[1],
    });
}
function createCanvasWidget(canvas: Canvas) {
    return absolute({
        width: 4 * 12,
        height: 3 * 12,
        padding: { left: "1w", right: "1w" },
        content: [
            horizontal({
                x: 0,
                y: 0,
                width: "100%",
                height: "100%",
                spacing: 0,
                content: canvas.map(column => vertical({
                    spacing: 0,
                    content: column.map(pixel => colourPicker({
                        colour: pixel[0],
                        visibility: pixel[1],
                    })).reverse(),
                })),
            }),
            label({
                x: 0,
                y: 0,
                width: "100%",
                height: "100%",
                text: "",
            }),
        ],
    });
}
const mainCanvas = createCanvas(10, 20);
const previewCanvas = array(3, () => createCanvas(4, 2));
const holdCanvas = createCanvas(4, 2);
function setPixel(canvas: Canvas, cell: Cell, c: Colour = Colour.Grey) {
    const pixel = canvas[cell[0]] ?.[cell[1]];
    if (!pixel) return;
    if (c === Colour.Grey)
        pixel[1].set("hidden");
    else {
        pixel[0].set(c);
        pixel[1].set("visible");
    }
}
function clearAllPixels(canvas: Canvas) {
    canvas.forEach(col => col.forEach(cell => cell[1].set("hidden")));
}

const mode = store<undefined | "sprint" | "marathon">();
const score = store(0);
const level = store(0);
const lines = store(0);
const highscore = store(0);
const labels = array(5, () => store(""));
const showControls = store<ElementVisibility>("visible");

const win = window({
    width: "auto",
    height: "auto",
    position: "center",
    title: compute(mode, m => "RCTRIS" + (m ? `  -  ${m.toUpperCase()}` : "")),
    onClose: close,
    content: [
        horizontal({
            height: 22 * 12,
            content: [
                vertical({
                    width: 100,
                    spacing: "1w",
                    content: [
                        groupbox({
                            text: "HOLD",
                            content: [
                                createCanvasWidget(holdCanvas),
                            ],
                        }),
                        vertical({
                            spacing: 16,
                            content: [
                                vertical({
                                    content: [
                                        label({
                                            text: "SCORE",
                                            alignment: "centred",
                                        }),
                                        label({
                                            text: compute(score, String),
                                            alignment: "centred",
                                        }),
                                    ],
                                }),
                                vertical({
                                    content: [
                                        label({
                                            text: "LEVEL",
                                            alignment: "centred",
                                        }),
                                        label({
                                            text: compute(level, String),
                                            alignment: "centred",
                                        }),
                                    ],
                                }),
                                vertical({
                                    content: [
                                        label({
                                            text: "LINES",
                                            alignment: "centred",
                                        }),
                                        label({
                                            text: compute(lines, String),
                                            alignment: "centred",
                                        }),
                                    ],
                                }),
                                vertical({
                                    content: [
                                        label({
                                            text: "HIGHSCORE",
                                            alignment: "centred",
                                        }),
                                        label({
                                            text: compute(highscore, String),
                                            alignment: "centred",
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                absolute({
                    width: 12 * 12,
                    height: 22 * 12,
                    content: [
                        horizontal({
                            x: 0,
                            y: 0,
                            width: "100%",
                            height: "100%",
                            spacing: 0,
                            content: array(12, x => vertical({
                                spacing: 0,
                                content: array(22, y =>
                                    (x === 0 || x === 11 || y === 0 || y === 21)
                                        ? colourPicker({})
                                        : createPicker(mainCanvas[x - 1][20 - y])
                                ),
                            })),
                        }),
                        label({
                            x: 0,
                            y: 0,
                            width: "100%",
                            height: "100%",
                            text: "",
                        }),
                        vertical({
                            x: 0,
                            y: 0,
                            width: "100%",
                            height: "100%",
                            content: [
                                vertical({
                                    width: "100%",
                                    padding: ["1w", 32, "1w", 32],
                                    spacing: 16,
                                    content: [
                                        button({
                                            text: "SPRINT",
                                            height: 32,
                                            visibility: showControls,
                                            onClick: sprint,
                                        }),
                                        button({
                                            text: "MARATHON",
                                            height: 32,
                                            visibility: showControls,
                                            onClick: marathon,
                                        }),
                                        label({ text: "" }),
                                        button({
                                            text: "HELP",
                                            height: 32,
                                            visibility: showControls,
                                            onClick: help,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                vertical({
                    width: 100,
                    spacing: "1w",
                    content: [
                        groupbox({
                            text: "NEXT",
                            content: previewCanvas.map(createCanvasWidget),
                        }),
                        vertical({
                            content: labels.map(text =>
                                label({
                                    text: text,
                                    alignment: "centred",
                                })
                            ),
                        }),
                    ],
                }),
            ],
        }),
    ],
});

/*
 * REGISTRATION
 */
registerPlugin({
    name: "rctris",
    version: "1.0.1",
    authors: ["Sadret"],
    type: "local",
    licence: "GPL-3.0",
    minApiVersion: 72,
    targetApiVersion: 81,
    main: () => {
        if (typeof ui === "undefined")
            return console.log("[rctris] Loading cancelled: game runs in headless mode.");

        ui.registerMenuItem("RCTris", () => win.open());
        ui.registerShortcut({
            id: "rctris.left",
            text: "[RCTris] Move left",
            bindings: ["Keypad 4"],
            callback: moveLeft,
        });
        ui.registerShortcut({
            id: "rctris.right",
            text: "[RCTris] Move right",
            bindings: ["Keypad 6"],
            callback: moveRight,
        });
        ui.registerShortcut({
            id: "rctris.soft-drop",
            text: "[RCTris] Soft drop",
            bindings: ["Keypad 5"],
            callback: dropSoft,
        });
        ui.registerShortcut({
            id: "rctris.hard-drop",
            text: "[RCTris] Hard drop",
            bindings: ["Space"],
            callback: dropHard,
        });
        ui.registerShortcut({
            id: "rctris.clockwise",
            text: "[RCTris] Rotate clockwise",
            bindings: ["Keypad 8"],
            callback: rotateClockwise,
        });
        ui.registerShortcut({
            id: "rctris.counterclockwise",
            text: "[RCTris] Rotate counterclockwise",
            bindings: ["Keypad 7"],
            callback: rotateCounterClockwise,
        });
        ui.registerShortcut({
            id: "rctris.hold",
            text: "[RCTris] Hold",
            bindings: ["Keypad 9"],
            callback: hold,
        });
    },
});

function help() {
    window({
        title: "RCTRIS  -  HELP",
        width: 384,
        height: "auto",
        position: "center",
        content: [
            groupbox({
                text: "GAMEPLAY",
                content: [
                    label({ text: "Fill the game arena with blocks." }),
                    label({ text: "Completely filled lines disappear and increase the score." }),
                    label({ text: "More difficult moves and line clears reward more points." }),
                ],
            }),
            groupbox({
                text: "GAME MODES",
                content: [
                    label({ text: "Sprint: clear 2 lines to level up" }),
                    label({ text: "Marathon: clear 10 lines to level up" }),
                ],
            }),
            groupbox({
                text: "CONTROLS",
                content: [
                    label({ text: "The controls can be changed in OpenRCT2's shortcut settings." }),
                    label({ text: "The default keys are:" }),
                    horizontal({
                        content: [
                            vertical({
                                width: "2w",
                                content: [
                                    label({ text: "Move left:" }),
                                    label({ text: "Move right:" }),
                                    label({ text: "Soft drop:" }),
                                    label({ text: "Hard drop:" }),
                                    label({ text: "Rotate clockwise:" }),
                                    label({ text: "Rotate counterclockwise:" }),
                                    label({ text: "Hold:" }),
                                ],
                            }),
                            vertical({
                                content: [
                                    label({ text: "Numpad 4" }),
                                    label({ text: "Numpad 6" }),
                                    label({ text: "Numpad 5" }),
                                    label({ text: "Space" }),
                                    label({ text: "Numpad 8" }),
                                    label({ text: "Numpad 7" }),
                                    label({ text: "Numpad 9" }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
            label({
                text: "v1.0.1  -  Copyright (c) 2024 Sadret",
                alignment: "centred",
                disabled: true,
            }),
        ],
    }).open();
}

/*
 * TYPES
 */
type Cell = [number, number];
type TetrominoType = {
    letter: "I" | "J" | "L" | "O" | "S" | "Z" | "T";
    rotations: Cell[][];
    colour: Colour;
    secondaryColour: Colour;
};
type Tetromino = {
    readonly type: TetrominoType;
    rotation: number;
    position: Cell;
};

/*
 * TETROMINO DATA
 */
const bag: TetrominoType[] = [{
    letter: "I",
    rotations: generateRotations([[0, 0], [1, 0], [2, 0], [3, 0]], 2),
    colour: Colour.AquaDark,
    secondaryColour: Colour.Aquamarine,
}, {
    letter: "J",
    rotations: generateRotations([[0, 0], [1, 0], [2, 0], [0, 1]], 1),
    colour: Colour.DarkBlue,
    secondaryColour: Colour.LightBlue,
}, {
    letter: "L",
    rotations: generateRotations([[0, 0], [1, 0], [2, 0], [2, 1]], 1),
    colour: Colour.DarkOrange,
    secondaryColour: Colour.LightOrange,
}, {
    letter: "O",
    rotations: array(4, () => [[1, 0], [2, 0], [1, 1], [2, 1]]),
    colour: Colour.Yellow,
    secondaryColour: Colour.BrightYellow,
}, {
    letter: "S",
    rotations: generateRotations([[0, 0], [1, 0], [1, 1], [2, 1]], 1),
    colour: Colour.GrassGreenDark,
    secondaryColour: Colour.GrassGreenDark,
}, {
    letter: "T",
    rotations: generateRotations([[0, 0], [1, 0], [2, 0], [1, 1]], 1),
    colour: Colour.DarkPurple,
    secondaryColour: Colour.LightPurple,
}, {
    letter: "Z",
    rotations: generateRotations([[1, 0], [2, 0], [0, 1], [1, 1]], 1),
    colour: Colour.BrightRed,
    secondaryColour: Colour.SalmonPink,
}];

/*
 * ARENA
 */
let arena: (TetrominoType | undefined)[][];
let minoCount: number;
function get(cell: Cell): TetrominoType | undefined {
    return arena[cell[0]][cell[1]];
}
function set(cell: Cell, value: TetrominoType | undefined): void {
    if (arena[cell[0]][cell[1]]) minoCount--;
    arena[cell[0]][cell[1]] = value;
    if (value) minoCount++;
}

/*
 * GAME LOGIC
 */

let bagIdx: number;
let active: Tetromino;
let held: TetrominoType | undefined;
let holdAllowed: boolean;
let preview: Tetromino[];
let inputAllowed = false;
let dropTimeout: undefined | number = undefined;
let lockTimeout: undefined | number = undefined;
let labelTimeout: undefined | number = undefined;
let lockMoveResetCounter = 0;

// scoring
let isRotationLast: boolean;
let backToBack: boolean;
let combo: number;

/** starts a new game of rctris in sprint mode */
function sprint() {
    start("sprint");
}

/** starts a new game of rctris in marathon mode */
function marathon() {
    start("marathon");
}

/** starts a new game of rctris */
function start(gameMode: "sprint" | "marathon") {
    showControls.set("hidden");

    arena = array(10, () => array(24, () => undefined));
    minoCount = 0;

    mode.set(gameMode);
    score.set(0);
    level.set(1);
    lines.set(0);
    highscore.set(context.sharedStorage.get("rctris.highscores." + gameMode, 0));
    isRotationLast = false;
    backToBack = false;
    combo = -1;

    bagIdx = bag.length;
    held = undefined;
    clearAllPixels(holdCanvas);
    preview = [];
    for (let i = 0; i < 3; i++)
        preview.push(getNextTetromino());

    spawn();
}

/** shuffles the bag of tetrominos and reset the bag index */
function shuffleBag() {
    bagIdx = 0;
    for (let i = 1; i < bag.length; i++) {
        const j = Math.floor(Math.random() * (i + 1));
        if (i != j) {
            const temp = bag[i];
            bag[i] = bag[j];
            bag[j] = temp;
        }
    }
}

/** gets the next Tetromino from the bag */
function getNextTetromino(): Tetromino {
    if (bagIdx === bag.length)
        shuffleBag();
    return {
        type: bag[bagIdx++],
        rotation: 0,
        position: [3, 20],
    };
}

/** [game loop] spawns a new tetromino */
function spawn() {
    inputAllowed = true;
    holdAllowed = true;

    if (bagIdx === bag.length)
        shuffleBag();

    active = preview.shift() as Tetromino;
    preview.push(getNextTetromino());
    preview.forEach((tetromino, idx) => {
        const canvas = previewCanvas[idx];
        clearAllPixels(canvas);
        const type = tetromino.type;
        type.rotations[0].forEach(cell => setPixel(canvas, cell, type.colour));
    });

    if (cells().some(get))
        inputAllowed = false, endscreen();
    else
        drop();
}

/** calculates the drop delay in milliseconds */
function getDropDelay() {
    const lvl = level.get();
    if (lvl < 20)
        return Math.pow(0.8 - (lvl - 1) * 0.007, (lvl - 1)) * 1000;
    else
        return 0; // next tick
}
/** calculates how many rows the tetromino should be dropped. assumes 40 ticks per second */
function getRowsPerDrop() {
    const lvl = level.get();
    if (lvl <= 12)
        return 1;
    else if (lvl > 20)
        return 20;
    else
        return Math.round(Math.pow(Math.SQRT2, lvl - 11));
}
/** schedules `drop` if it is not already scheduled */
function scheduleDrop() {
    if (dropTimeout === undefined)
        dropTimeout = context.setTimeout(drop, getDropDelay());
}
/** unschedules `drop` if it is scheduled */
function unscheduleDrop() {
    if (dropTimeout === undefined) return;
    context.clearTimeout(dropTimeout);
    dropTimeout = undefined;
}
/** [game loop] drops the active piece */
function drop() {
    dropTimeout = undefined;
    const rows = getRowsPerDrop();
    for (let i = 0; i < rows; i++)
        if (!moveDown())
            return scheduleLock();
    scheduleDrop();
}

/** calculates the lock delay in milliseconds */
function getLockDelay() {
    const lvl = level.get();
    if (lvl < 20) return 500;
    if (lvl > 30) return 0;
    else return (30 - lvl) * 50;
}
/** schedules `lock` if it is not already scheduled */
function scheduleLock() {
    if (lockTimeout === undefined)
        lockTimeout = context.setTimeout(lock, getLockDelay());
}
/** unschedules `lock` if it is scheduled */
function unscheduleLock() {
    if (lockTimeout === undefined) return;
    context.clearTimeout(lockTimeout);
    lockTimeout = undefined;
}
/** [game loop] locks the active piece and highlights it */
function lock() {
    unscheduleDrop();
    lockTimeout = undefined;
    lockMoveResetCounter = 0;

    // last chance: drop immediately
    if (moveDown())
        return scheduleDrop();

    // finalise locking
    inputAllowed = false;
    cells().forEach(cell => setPixel(mainCanvas, cell, active.type.secondaryColour));
    context.setTimeout(lock2, 100);
}
/** [game loop] calculates the lines to be cleared and the score */
function lock2() {
    cells().forEach(cell => setPixel(mainCanvas, cell, active.type.colour));

    if (cells().every(cell => cell[1] >= 20))
        return endscreen();

    cells().forEach(cell => set(cell, active.type));

    // calculate cleared lines
    const checked: { [key: number]: boolean } = {};
    const cleared: number[] = [];
    outer: for (let cell of cells()) {
        const y = cell[1];
        if (checked[y]) continue outer;
        for (let x = 0; x < 10; x++)
            if (!get([x, y]))
                continue outer;
        checked[y] = true;
        cleared.push(y);
    }
    cleared.sort().reverse();

    // calculate score
    const lines = cleared.length;
    const b2b = backToBack;
    let [score, lbl] = calculateBaseScore(lines);
    let i = 0;
    if (minoCount === 10 * lines) {
        score += (lines + 1) * 4;
        labels[i++].set("PERFECT CLEAR");
    }
    score *= 100;
    if (lines && b2b && backToBack) {
        score *= 1.5;
        labels[i++].set("BACK TO BACK");
    }
    if (score > 0)
        labels[i++].set(lbl);
    if (lines) {
        combo++;
        if (combo > 0) {
            score += 50 * combo;
            labels[i++].set("COMBO");
        }
    } else
        combo = -1;
    score *= level.get();
    if (score > 0) {
        labels[i++].set(`+${score}`);
        if (labelTimeout)
            context.clearTimeout(labelTimeout);
        labelTimeout = context.setTimeout(() => {
            labelTimeout = undefined;
            labels.forEach(label => label.set(""));
        }, 2000);
    }
    while (i < 5)
        labels[i++].set("");

    clear(cleared, score);
}

// t-spin corners
const corners = generateRotations([[0, -1], [2, -1], [0, 1], [2, 1]], 1);
// line count names
const lineNames = ["", "SINGLE", "DOUBLE", "TRIPLE", "RCTRIS"];
/** calculates the base score (without back-to-back and combo) for the current tetromino */
function calculateBaseScore(lines: number): [number, string] {
    // t-spin detection
    if (active.type.letter === "T" && isRotationLast) {
        backToBack ||= lines > 0; // t-spin line clears are difficult, normal t-spins do not break b2b
        const c = corners[active.rotation].map(corner => collides([add(active.position, corner)]));
        const suffix = lines ? " " + lineNames[lines] : "";
        if (c[0] && c[1] && (c[2] || c[3]))
            return [1 << lines, "MINI T-SPIN" + suffix];
        if ((c[0] || c[1]) && c[2] && c[3])
            return [4 * (lines + 1), "T-SPIN" + suffix];
    }
    if (lines > 0)
        backToBack = lines === 4; // non-rctris line clears break b2b
    const points = [0, 1, 3, 5, 8][lines];
    const type = lineNames[lines];
    return [points, type];
}

/** [game loop] highlights and clears full lines */
function clear(rows: number[], points: number, counter: number = 0) {
    if (counter === 4)
        for (let x = 0; x < 10; x++)
            for (let y of rows)
                for (; y < 24; y++) {
                    const cell: Cell = [x, y];
                    const type = get(add(cell, [0, 1]));
                    set(cell, type);
                    setPixel(mainCanvas, cell, type ?.colour );
                }

    if (!rows.length || counter === 4) {
        score.set(score.get() + points);
        lines.set(lines.get() + rows.length);
        level.set(Math.floor(lines.get() / (mode.get() === "sprint" ? 2 : 10)) + 1);
        return context.setTimeout(spawn, 100);
    }

    for (let x = 0; x < 10; x++)
        for (let y of rows)
            setPixel(mainCanvas, [x, y], get([x, y]) ?.[(counter % 2) ? "colour" : "secondaryColour"]);
    context.setTimeout(() => clear(rows, points, counter + 1), 100);
}

/** [game loop] highlights all cells and clears them */
function endscreen(y: number = 0, dir: number = 1) {
    if (y < 0) {
        showControls.set("visible");
        const sc = score.get();
        const hsc = highscore.get();
        if (sc > hsc) {
            highscore.set(sc);
            context.sharedStorage.set("rctris.highscores." + mode.get(), sc);
        }
        return;
    }
    if (y === 20)
        y = 19, dir = -1;
    for (let x = 0; x < 10; x++)
        setPixel(mainCanvas, [x, y], dir === 1 ? Colour.White : undefined);
    context.setTimeout(() => endscreen(y + dir, dir), 50);
}

/** called after each move and rotation, handles move reset behaviour */
function moveReset() {
    if (!lockTimeout) return;
    scheduleDrop();

    if (lockMoveResetCounter === 15) return;
    lockMoveResetCounter++;
    unscheduleLock();
    scheduleLock();
}

/** checks if any of the cells is occupied */
function collides(cells: Cell[]) {
    return cells.some(
        cell => cell[0] < 0 || cell[0] >= 10 || cell[1] < 0 || get(cell)
    );
}

/** tries to move active piece by offset and reports success */
function move(offset: Cell): boolean {
    if (!inputAllowed) return false;

    if (collides(cells().map(cell => add(cell, offset)))) return false;

    cells().forEach(cell => setPixel(mainCanvas, cell));
    active.position = add(active.position, offset);
    cells().forEach(cell => setPixel(mainCanvas, cell, active.type.colour));
    moveReset();
    isRotationLast = false;
    return true;
}

/** tries to move active piece down */
function moveDown(): boolean {
    if (!move([0, -1])) return false;
    lockMoveResetCounter = 0;
    return true;
}

function findPosition(newRotation: number): Cell | undefined {
    const oldCells = cells();
    const newCells = cells(undefined, newRotation);

    // regular rotation
    if (!collides(newCells)) return active.position;

    const oldMinY = Math.min(...oldCells.map(cell => cell[1]));
    const newMinY = Math.min(...newCells.map(cell => cell[1]));

    // floor kick
    for (let i = 1; i === 1 || i <= oldMinY - newMinY; i++)
        if (!collides(cells(add(active.position, [0, i]), newRotation)))
            return add(active.position, [0, i]);

    // push down
    if (!collides(cells(add(active.position, [0, -1]), newRotation)))
        return add(active.position, [0, -1]);

    const oldMinX = Math.min(...oldCells.map(cell => cell[0]));
    const newMinX = Math.min(...newCells.map(cell => cell[0]));
    const oldMaxX = Math.max(...oldCells.map(cell => cell[0]));
    const newMaxX = Math.max(...newCells.map(cell => cell[0]));

    // wall kick + push down
    for (let dy of [0, -1])
        for (let i = 1; i === 1 || i <= oldMinX - newMinX || i <= newMaxX - oldMaxX; i++) {
            if ((i === 1 || i <= oldMinX - newMinX) && !collides(cells(add(active.position, [i, dy]), newRotation)))
                return add(active.position, [i, dy]);
            if ((i === 1 || i <= newMaxX - oldMaxX) && !collides(cells(add(active.position, [-i, dy]), newRotation)))
                return add(active.position, [-i, dy]);
        }
}

/** tries to rotate active piece by offset and reports success */
function rotate(offset: number): boolean {
    if (!inputAllowed) return false;

    const newRotation = (active.rotation + offset) & 3;
    const newPosition = findPosition(newRotation);

    if (!newPosition) return false;

    cells().forEach(cell => setPixel(mainCanvas, cell));
    active.rotation = newRotation;
    active.position = newPosition;
    cells().forEach(cell => setPixel(mainCanvas, cell, active.type.colour));
    moveReset();
    isRotationLast = true;
    return true;
}

/*
 * SHORTCUT CALLBACKS
 */

/** tries to move active piece to the left */
function moveLeft() {
    move([-1, 0]);
}

/** tries to move active piece to the right */
function moveRight() {
    move([1, 0]);
}


/** tries to move active piece down */
function dropSoft() {
    if (moveDown())
        score.set(score.get() + 1);
}

/** moves the active piece to the bottom and locks it */
function dropHard() {
    if (!inputAllowed) return;
    while (moveDown())
        score.set(score.get() + 2);
    unscheduleLock();
    lock();
}

/** tries to rotate active piece clockwise */
function rotateClockwise() {
    rotate(1);
}

/** tries to rotate active piece counterclockwise */
function rotateCounterClockwise() {
    rotate(-1);
}

/** exchanges current tetromino with held tetromino */
function hold() {
    if (!inputAllowed || !holdAllowed)
        return;

    cells().forEach(cell => setPixel(mainCanvas, cell));
    unscheduleDrop();
    unscheduleLock();

    if (held) {
        clearAllPixels(holdCanvas);
        const temp = held;
        held = active.type;
        active = {
            type: temp,
            rotation: 0,
            position: [3, 20],
        };
        drop();
    } else {
        held = active.type;
        spawn();
    }
    holdAllowed = false;
    cells().forEach(cell => setPixel(mainCanvas, cell, active.type.colour));
    const colour = held.colour;
    held.rotations[0].forEach(cell => setPixel(holdCanvas, cell, colour));
}

/** called when window closes */
function close() {
    inputAllowed = false;
    unscheduleDrop();
    unscheduleLock();
    clearAllPixels(mainCanvas);
    endscreen(-1);
}

/*
* HELPER FUNCTIONS
*/

/** creates array of size `n` with elements given by `fun` */
function array<T>(n: number, fun: (idx: number) => T): T[] {
    const arr = new Array(n);
    for (let idx = 0; idx < n; idx++)
        arr[idx] = fun(idx);
    return arr;
}

/** generates all rotations given by an initial rotation */
function generateRotations(initial: Cell[], mode: number): Cell[][] {
    const result = [initial];
    let prev = initial;
    for (let i = 0; i < 3; i++) {
        const current = prev.map<Cell>(cell => [mode + cell[1], 1 - cell[0]]);
        result.push(current);
        prev = current;
    }
    return result;
}

/** adds two cells */
function add(a: Cell, b: Cell): Cell {
    return [a[0] + b[0], a[1] + b[1]];
}

/** gets all cells occupied by a tetromino */
function cells(position: Cell = active.position, rotation: number = active.rotation): Cell[] {
    return active.type.rotations[rotation].map(cell => add(cell, position));
}
