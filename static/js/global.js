import Game from './scenes.js'

export function startGame({ playerId, buildings, socket }) {
    new Phaser.Game({
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: '#1a1a2e',
        pixelArt: true,
        parent: 'canvas',
        scene: [Game],
        callbacks: {
            preBoot: (game) => {
                game.registry.set('playerId', playerId);
                game.registry.set('buildings', buildings);
                game.registry.set('socket', socket);
            }
        }
    });
}