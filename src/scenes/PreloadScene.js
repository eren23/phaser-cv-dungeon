import Phaser from "phaser";

class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    this.load.image("menu-bg", "../../assets/background01.png");
  }

  // create() {
  //   this.scene.start("PlayScene");
  // }
}

export default PreloadScene;
