import Phaser from "phaser";

class BaseScene extends Phaser.Scene {
  constructor(key, config) {
    super(key);
    this.config = config;
    this.screenCenter = [config.width / 2, config.height / 2];
    this.fontSize = 75;
    this.lineHeight = 80;
    this.fontOptions = { fontSize: `${this.fontSize}px`, fill: "#7a3201" };
  }

  create() {
    this.add.image(0, 0, "menu-bg").setOrigin(0, 0).setScale(3.2);
    if (this.config.canGoBack) {
      const backButton = this.add
        .image(this.config.width - 10, this.config.height - 10, "back")
        .setInteractive()
        .setScale(2)
        .setOrigin(1, 1);

      backButton.on("pointerup", () => {
        this.scene.start("MenuScene");
      });
    }
  }

  createMenu(menu, setupMenuEvents) {
    let lastMenuPositionY = 0;
    menu.forEach((item) => {
      const menuPosition = [this.screenCenter[0], this.screenCenter[1] + lastMenuPositionY];
      item.textGO = this.add.text(...menuPosition, item.text, this.fontOptions).setOrigin(0.5, 1);
      lastMenuPositionY += this.lineHeight;
      setupMenuEvents(item);
    });
  }
}

export default BaseScene;
