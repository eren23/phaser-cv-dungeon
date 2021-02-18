/**
 * Author: Michael Hadley, mikewesthad.com
 * Asset Credits:
 *  - Tileset, Michele "Buch" Bucelli (tileset artist) & Abram Connelly (tileset sponsor):
 *     https://opengameart.org/content/top-down-dungeon-tileset
 *  - Character, Michele "Buch" Bucelli:
 *      https://opengameart.org/content/a-platformer-in-the-forest
 */

// import MenuScene from "./scenes/MenuScene";
import DungeonScene from "./dungeon-scene.js";
// import PreloadScene from "./scenes/PreloadScene";

const MAP_WIDTH = 1600;

const WIDTH = document.body.offsetWidth;
const HEIGHT = 600;
const ZOOM_FACTOR = 1.5;

const SHARED_CONFIG = {
  mapOffset: MAP_WIDTH > WIDTH ? MAP_WIDTH - WIDTH : 0,
  width: WIDTH,
  height: HEIGHT,
  zoomFactor: ZOOM_FACTOR,
  debug: false,
  leftTopCorner: {
    x: (WIDTH - WIDTH / ZOOM_FACTOR) / 2,
    y: (HEIGHT - HEIGHT / ZOOM_FACTOR) / 2,
  },
  rightTopCorner: {
    x: WIDTH / ZOOM_FACTOR + (WIDTH - WIDTH / ZOOM_FACTOR) / 2,
    y: (HEIGHT - HEIGHT / ZOOM_FACTOR) / 2,
  },
  rightBottomCorner: {
    x: WIDTH / ZOOM_FACTOR + (WIDTH - WIDTH / ZOOM_FACTOR) / 2,
    y: HEIGHT / ZOOM_FACTOR + (HEIGHT - HEIGHT / ZOOM_FACTOR) / 2,
  },
};

const Scenes = [DungeonScene];
const createScene = (Scene) => new Scene(SHARED_CONFIG);

const initScenes = () => Scenes.map(createScene);

const config = {
  type: Phaser.AUTO,
  ...SHARED_CONFIG,
  pixelArt: true,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      debug: SHARED_CONFIG.debug,
    },
  },
  scene: initScenes(),
};

const game = new Phaser.Game(config);
