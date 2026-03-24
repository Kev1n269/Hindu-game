export default class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    preload() {
        this.load.tilemapTiledJSON('map', 'static/assets/map_assets/map.json');
        this.load.image('tileset1', 'static/assets/map_assets/tileset1.png');
        this.load.image('water', 'static/assets/map_assets/water.png');
        this.load.image('treeset', 'static/assets/map_assets/treeset.png');
        this.load.image('grassset', 'static/assets/map_assets/grassset.png'); 

        // assets do jogo — adiciona conforme os designers entregarem
        // this.load.image('mandir',   'static/assets/buildings/mandir.png')
        // this.load.image('quartel',  'static/assets/buildings/quartel.png')
        // this.load.image('worker',   'static/assets/units/worker.png')
    }

    create(data) {
    this.playerId = data?.playerId ?? 0;

    this.map = this.make.tilemap({ key: 'map' });
    const tilesetWater = this.map.addTilesetImage('water', 'water');
    const treeset = this.map.addTilesetImage('treeset', 'treeset');
    const grassset = this.map.addTilesetImage('grassset', 'grassset');
    this.floorLayer=this.map.createLayer('floor', [tilesetWater,grassset],  0, 0);
    this.decorationLayer=this.map.createLayer('decoration', treeset, 0, 0);    
    this.floorLayer.setDepth(0);
    this.decorationLayer.setDepth(1);
    this.decorationLayer.setCollisionByExclusion([-1]); 
    this.floorLayer.setPipeline('Graphics');
    this.decorationLayer.setAlpha(0.6);

    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels)

    this.buildingSprites  = {}
    this.selectedBuilding = null
    this.isDragging       = false
    this.dragThreshold = this.sys.game.device.input.touch ? 20 : 10

    this.input.on('pointerup', (pointer) => {
    const wasDragging = this.isDragging
    this.isDragging = false

    if (wasDragging) return 
    if (!this.selectedBuilding) return
    if (this._lastButtonDown === 2) return  // ✅ botão direito correto

    const tx = this.map.worldToTileX(pointer.worldX)
    const ty = this.map.worldToTileY(pointer.worldY)
    console.log(`construir ${this.selectedBuilding} em tile ${tx},${ty}`)
    })

    this.input.on('wheel', (pointer, objects, deltaX, deltaY) => {
        this.cameras.main.zoom = Phaser.Math.Clamp(
            this.cameras.main.zoom - deltaY * 0.001, 0.5, 1.5
        )
    })

this.input.on('pointermove', (pointer) => {
    // --- pinch zoom (dois dedos) ---
    const pointers = this.input.manager.pointers.filter(
        p => p.isDown && p.wasTouch
    )
    if (pointers.length === 2) {
        const [p1, p2] = pointers
        const curDist  = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y)
        const prevDist = Phaser.Math.Distance.Between(
            p1.prevPosition.x, p1.prevPosition.y,
            p2.prevPosition.x, p2.prevPosition.y
        )
        if (prevDist > 0) {
            const zoom = this.cameras.main.zoom * (curDist / prevDist)
            this.cameras.main.zoom = Phaser.Math.Clamp(zoom, 0.5, 1.5)
        }
        return  // pinch ativo — ignora drag
    }

    // --- drag da câmera (um dedo ou mouse) ---
    if (!pointer.isDown) return
    const dist = Phaser.Math.Distance.Between(
        pointer.downX, pointer.downY, pointer.x, pointer.y
    )
    if (dist > this.dragThreshold) {
        this.isDragging = true
        this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x)
        this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y)
    }
})
    this._onSelectBuild = (e) => { this.selectedBuilding = e.detail.tipo }
    this._onCancelBuild = ()  => { this.selectedBuilding = null }
    window.addEventListener('game:select-build',  this._onSelectBuild)
    window.addEventListener('game:cancel-build',  this._onCancelBuild)

        this.events.on('shutdown', () => {
        window.removeEventListener('game:select-build',  this._onSelectBuild)
        window.removeEventListener('game:cancel-build',  this._onCancelBuild)
    })

    }

    // --- métodos auxiliares ---

    makeBuilding(b) {
        if (this.buildingSprites[b.id]) return  // já existe

        const worldX = this.map.tileToWorldX(b.tx) + this.map.tileWidth  / 2
        const worldY = this.map.tileToWorldY(b.ty) + this.map.tileHeight / 2

        const sprite = this.add.image(worldX, worldY, b.type)
            sprite.setInteractive()
            
        sprite.setDepth(2);

        // tint para identificar dono
        if (b.owner !== this.playerId) {
            sprite.setTint(0xff8888)  // vermelho = inimigo
        }

        sprite.on('pointerdown', () => {
            this._lastButtonDown = pointer.button
    if (this.isDragging) return
    window.dispatchEvent(new CustomEvent('game:build-selected', {
        detail: { id: b.id, tipo: b.type, owner: b.owner }
    }))
        })

        this.buildingSprites[b.id] = sprite
    }

    updateBuildings(buildings) {
        buildings.forEach(b => this.makeBuilding(b))
    }

    update() {
    if (this.sys.game.device.input.touch) return

    const cam    = this.cameras.main
    const mouse  = this.input.mousePointer
    const w      = this.scale.width
    const h      = this.scale.height
    const margin = w * 0.04
    const speed  = 6

    if (mouse.x < margin)     cam.scrollX -= speed
    if (mouse.x > w - margin) cam.scrollX += speed
    if (mouse.y < margin)     cam.scrollY -= speed
    if (mouse.y > h - margin) cam.scrollY += speed
    }
}