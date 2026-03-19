import Game from './scenes.js'

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#1a1a2e',
    scene: [Game]
}
new Phaser.Game(config); 