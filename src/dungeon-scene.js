import Player from "./player.js";
import TILES from "./tile-mapping.js";
import TilemapVisibility from "./tilemap-visibility.js";
import Phaser from "Phaser";
import Dungeon from "@mikewesthad/dungeon";
// import BaseScene from "./scenes/BaseScene.js";

/**
 * Scene that generates a new dungeon
 */
export default class DungeonScene extends Phaser.Scene {
  constructor(config) {
    super("DungeonScene", config);
    this.config = config;
    this.assignedAlpha = 0.5;

    this.level = 0;
  }

  preload() {
    this.load.image("tiles", "../assets/tilesets/buch-tileset-48px-extruded.png");
    this.load.spritesheet("characters", "../assets/spritesheets/buch-characters-64px-extruded.png", {
      frameWidth: 64,
      frameHeight: 64,
      margin: 1,
      spacing: 2,
    });
  }

  create() {
    this.level++;
    this.hasPlayerReachedStairs = false;

    // Generate a random world with a few extra options:
    //  - Rooms should only have odd number dimensions so that they have a center tile.
    //  - Doors should be at least 2 tiles away from corners, so that we can place a corner tile on
    //    either side of the door location
    this.dungeon = new Dungeon({
      width: 30,
      height: 30,
      doorPadding: 2,
      rooms: {
        width: { min: 8, max: 10, onlyOdd: true },
        height: { min: 8, max: 10, onlyOdd: true },
      },
    });

    // this.dungeon.drawToConsole();

    // Creating a blank tilemap with dimensions matching the dungeon
    const map = this.make.tilemap({
      tileWidth: 48,
      tileHeight: 48,
      width: this.dungeon.width,
      height: this.dungeon.height,
    });
    const tileset = map.addTilesetImage("tiles", null, 48, 48, 1, 2); // 1px margin, 2px spacing
    this.groundLayer = map.createBlankDynamicLayer("Ground", tileset).fill(TILES.BLANK);
    this.stuffLayer = map.createBlankDynamicLayer("Stuff", tileset);
    const shadowLayer = map.createBlankDynamicLayer("Shadow", tileset).fill(TILES.BLANK);

    this.tilemapVisibility = new TilemapVisibility(shadowLayer);

    // Use the array of rooms generated to place tiles in the map
    // Note: using an arrow function here so that "this" still refers to our scene
    this.dungeon.rooms.forEach((room) => {
      const { x, y, width, height, left, right, top, bottom } = room;

      // Fill the floor with mostly clean tiles, but occasionally place a dirty tile
      // See "Weighted Randomize" example for more information on how to use weightedRandomize.
      this.groundLayer.weightedRandomize(x + 1, y + 1, width - 2, height - 2, TILES.FLOOR);

      // Place the room corners tiles
      this.groundLayer.putTileAt(TILES.WALL.TOP_LEFT, left, top);
      this.groundLayer.putTileAt(TILES.WALL.TOP_RIGHT, right, top);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_RIGHT, right, bottom);
      this.groundLayer.putTileAt(TILES.WALL.BOTTOM_LEFT, left, bottom);

      // Fill the walls with mostly clean tiles, but occasionally place a dirty tile
      this.groundLayer.weightedRandomize(left + 1, top, width - 2, 1, TILES.WALL.TOP);
      this.groundLayer.weightedRandomize(left + 1, bottom, width - 2, 1, TILES.WALL.BOTTOM);
      this.groundLayer.weightedRandomize(left, top + 1, 1, height - 2, TILES.WALL.LEFT);
      this.groundLayer.weightedRandomize(right, top + 1, 1, height - 2, TILES.WALL.RIGHT);

      // Dungeons have rooms that are connected with doors. Each door has an x & y relative to the
      // room's location. Each direction has a different door to tile mapping.
      var doors = room.getDoorLocations(); // → Returns an array of {x, y} objects
      for (var i = 0; i < doors.length; i++) {
        if (doors[i].y === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.TOP, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].y === room.height - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.BOTTOM, x + doors[i].x - 1, y + doors[i].y);
        } else if (doors[i].x === 0) {
          this.groundLayer.putTilesAt(TILES.DOOR.LEFT, x + doors[i].x, y + doors[i].y - 1);
        } else if (doors[i].x === room.width - 1) {
          this.groundLayer.putTilesAt(TILES.DOOR.RIGHT, x + doors[i].x, y + doors[i].y - 1);
        }
      }
    });

    // Separate out the rooms into:
    //  - The starting room (index = 0)
    //  - A random room to be designated as the end room (with stairs and nothing else)
    //  - An array of 90% of the remaining rooms, for placing random stuff (leaving 10% empty)
    const rooms = this.dungeon.rooms.slice();
    const startRoom = rooms.shift();
    const endRoom = Phaser.Utils.Array.RemoveRandomElement(rooms);
    const otherRooms = Phaser.Utils.Array.Shuffle(rooms).slice(0, rooms.length * 0.9);

    // Place the stairs
    this.stuffLayer.putTileAt(TILES.STAIRS, endRoom.centerX, endRoom.centerY);

    // Place stuff in the 90% "otherRooms"
    otherRooms.forEach((room) => {
      var rand = Math.random();
      if (rand <= 0.25) {
        // 25% chance of chest
        this.stuffLayer.putTileAt(TILES.CHEST, room.centerX, room.centerY);
      } else if (rand <= 0.5) {
        // 50% chance of a pot anywhere in the room... except don't block a door!
        const x = Phaser.Math.Between(room.left + 2, room.right - 2);
        const y = Phaser.Math.Between(room.top + 2, room.bottom - 2);
        this.stuffLayer.weightedRandomize(x, y, 1, 1, TILES.POT);
      } else {
        // 25% of either 2 or 4 towers, depending on the room size
        if (room.height >= 9) {
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY + 1);
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY + 1);
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 2);
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 2);
        } else {
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX - 1, room.centerY - 1);
          this.stuffLayer.putTilesAt(TILES.TOWER, room.centerX + 1, room.centerY - 1);
        }
      }
    });

    // Not exactly correct for the tileset since there are more possible floor tiles, but this will
    // do for the example.
    this.groundLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);
    this.stuffLayer.setCollisionByExclusion([-1, 6, 7, 8, 26]);

    this.stuffLayer.setTileIndexCallback(TILES.STAIRS, () => {
      this.stuffLayer.setTileIndexCallback(TILES.STAIRS, null);
      this.hasPlayerReachedStairs = true;
      this.player.freeze();
      const cam = this.cameras.main;
      cam.fade(250, 0, 0, 0);
      cam.once("camerafadeoutcomplete", () => {
        this.player.destroy();
        this.scene.restart();
      });
    });

    // Place the player in the first room
    const playerRoom = startRoom;
    const x = map.tileToWorldX(playerRoom.centerX);
    const y = map.tileToWorldY(playerRoom.centerY);
    this.player = new Player(this, x, y);

    // Watch the player and tilemap layers for collisions, for the duration of the scene:
    this.physics.add.collider(this.player.sprite, this.groundLayer);
    this.physics.add.collider(this.player.sprite, this.stuffLayer);

    // Phaser supports multiple cameras, but you can access the default camera like this:
    const camera = this.cameras.main;

    // Constrain the camera so that it isn't allowed to move outside the width/height of tilemap
    camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    camera.startFollow(this.player.sprite);

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, `Find the stairs. Go deeper.\nCurrent level: ${this.level}`, {
        font: "18px monospace",
        fill: "#000000",
        padding: { x: 20, y: 10 },
        backgroundColor: "#ffffff",
      })
      .setScrollFactor(0);

    if (this.level === 1) {
      this.myRect1 = this.rounded(
        this.config.width / 7,
        this.config.height / 6,
        400,
        200,
        20,
        0xffffff
      ).setScrollFactor(0);

      this.text1 = this.add
        .text(
          this.config.width / 2,
          this.config.height / 2,
          "Text1 Text1 Text1 Text1 \nText1 Text1 Text1 Text1 \n Text1 Text1 Text1 Text1 \n Text1 Text1 Text1 Text1",
          {
            font: "18px monospace",
            fill: "#000000",
            padding: { x: 10, y: 5 },
            backgroundColor: "#ffffff",
          }
        )
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);

      // this.myRect1.setInteractive();
      this.myRect1.setInteractive();

      this.text1.setInteractive();
      this.myRect1.on("onclick", this.onGraphicDestroy.bind(this));
      this.input.on("gameobjectdown", this.onClicked.bind(this));
    } else if (this.level === 2) {
      this.text1 = this.add
        .text(
          this.config.width / 2,
          this.config.height / 2,
          "Text2 Text2 Text2 Text2 \nText2 Text2 Text2 Text2 \n Text2 Text2 Text2 Text2",
          {
            font: "18px monospace",
            fill: "#000000",
            padding: { x: 10, y: 5 },
            backgroundColor: "#ffffff",
          }
        )
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);

      this.text1.setInteractive();
      this.input.on("gameobjectdown", this.onClicked.bind(this));
    } else if (this.level === 3) {
      this.text1 = this.add
        .text(
          this.config.width / 2,
          this.config.height / 2,
          "Text3 Text3 Text3 Text3 \nText3 Text3 Text3 Text3 \n Text3 Text3 Text3 Text3",
          {
            font: "18px monospace",
            fill: "#000000",
            padding: { x: 10, y: 5 },
            backgroundColor: "#ffffff",
          }
        )
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);

      this.text1.setInteractive();
      this.input.on("gameobjectdown", this.onClicked.bind(this));
    } else if (this.level === 4) {
      this.text1 = this.add
        .text(
          this.config.width / 2,
          this.config.height / 2,
          "Text4 Text4 Text4 Text4 \nText4 Text4 Text4 Text4 \n Text4 Text4 Text4 Text4",
          {
            font: "18px monospace",
            fill: "#000000",
            padding: { x: 10, y: 5 },
            backgroundColor: "#ffffff",
          }
        )
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);

      this.text1.setInteractive();
      this.input.on("gameobjectdown", this.onClicked.bind(this));
    } else if (this.level >= 5) {
      this.text1 = this.add
        .text(
          this.config.width / 2,
          this.config.height / 2,
          "Text5 Text5 Text5 Text5 \nText5 Text5 Text5 Text5 \n Text5 Text5 Text5 Text5",
          {
            font: "18px monospace",
            fill: "#000000",
            padding: { x: 10, y: 5 },
            backgroundColor: "#ffffff",
          }
        )
        .setOrigin(0.5, 0.5)
        .setScrollFactor(0);

      this.text1.setInteractive();
      this.input.on("gameobjectdown", this.onClicked.bind(this));
    }

    // this.scene.start("MenuScene");
  }

  rounded(x, y, width, height, radius, color) {
    if (+width < radius * 2 || +height < radius * 2)
      return this.add.graphics({ fillStyle: { color: color, alpha: this.assignedAlpha }, x: +x, y: +y });
    let options = Array.from({ length: 4 }, (_, index) => ({
      radians: ((index * Math.PI) / 2 + Math.PI) % (2 * Math.PI),
      x: +x + (((index + 1) & 2) >> 1) * +width,
      y: +y + ~~(index > 1) * +height,
      lx: radius * ~~((index - 2) * ((index - 2) & 1)),
      ly: radius * ~~-((index + 1) & 1),
      ax: radius * (~((index + 1) & 2) + 2),
      ay: radius * (~~(index < 2) || -1),
    }));

    let shape = this.add
      .graphics({ fillStyle: { color: color, alpha: this.assignedAlpha }, x: +x, y: +y })
      .beginPath()
      .moveTo(+x, (+y + height) >> 1);

    options.forEach((current, index, arr) => {
      shape
        .lineTo(current.x + current.lx, current.y + current.ly)
        .arc(
          current.x + current.ax,
          current.y + current.ay,
          +radius,
          current.radians,
          arr[index < arr.length - 1 ? index + 1 : 0].radians
        );
    });

    shape.setInteractive();
    shape.on("onclick", () => {
      console.log("wtf");
    });

    return shape.closePath().fillPath();
  }

  onClicked(pointer, objectClicked) {
    objectClicked.destroy();
  }

  onGraphicDestroy(pointer, objectClicked) {
    objectClicked.destroy();
  }

  update(time, delta) {
    if (this.hasPlayerReachedStairs) return;

    this.player.update();

    // Find the player's room using another helper method from the dungeon that converts from
    // dungeon XY (in grid units) to the corresponding room object
    const playerTileX = this.groundLayer.worldToTileX(this.player.sprite.x);
    const playerTileY = this.groundLayer.worldToTileY(this.player.sprite.y);
    const playerRoom = this.dungeon.getRoomAt(playerTileX, playerTileY);

    this.tilemapVisibility.setActiveRoom(playerRoom);
  }
}
