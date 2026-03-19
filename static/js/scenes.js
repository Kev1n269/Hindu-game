export default class Game extends Phaser.Scene {
    constructor() {
        super('Game')
    }

    preload() {
        this.load.tilemapTiledJSON('mapa', 'static/assets/map_assets/map.json')
        this.load.image('tileset1', 'static/assets/map_assets/tileset1.png') 

        // assets do jogo — adiciona conforme os designers entregarem
        // this.load.image('mandir',   'static/assets/buildings/mandir.png')
        // this.load.image('quartel',  'static/assets/buildings/quartel.png')
        // this.load.image('worker',   'static/assets/units/worker.png')
    }

    create(data) {
        this.playerId = data?.playerId ?? 0

        // --- mapa ---
        this.map = this.make.tilemap({ key: 'mapa' })
        const tiles = this.map.addTilesetImage('tileset1', 'tileset1')
        // nomes das layers têm que bater com o que está no Tiled
        this.map.createLayer('floor', tiles, 0, 0)
        // this.map.createLayer('decoracao', tiles, 0, 0)  // adiciona se tiver

        // --- câmera ---
        this.cameras.main.setBounds(
            0, 0,
            this.map.widthInPixels,
            this.map.heightInPixels
        )

        // --- estado local (vai ser preenchido pelo servidor) ---
        this.buildingSprites  = {}   // id → sprite
        this.selectedBuilding = null
        this.isDragging       = false
        this.dragThreshold    = 10

        // --- input: arrastar câmera (funciona no iPad e desktop) ---
        this.input.on('pointermove', (pointer) => {
            if (!pointer.isDown) return

            const dist = Phaser.Math.Distance.Between(
                pointer.downX, pointer.downY,
                pointer.x,    pointer.y
            )

            if (dist > this.dragThreshold) {
                this.isDragging = true
                this.cameras.main.scrollX -= pointer.velocity.x * 0.5
                this.cameras.main.scrollY -= pointer.velocity.y * 0.5
            }
        })

        this.input.on('pointerup', () => {
            this.isDragging = false
        })

        // --- input: clique no mapa (construção) ---
        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) return  // ignora botão direito

            // espera o pointerup para confirmar que não foi drag
        })

        this.input.on('pointerup', (pointer) => {
            if (this.isDragging) return
            if (!this.selectedBuilding) return

            const tx = this.map.worldToTileX(pointer.worldX)
            const ty = this.map.worldToTileY(pointer.worldY)

            // TODO: socket.emit('build', { room, playerId, building: this.selectedBuilding, tx, ty })
            console.log(`construir ${this.selectedBuilding} em tile ${tx},${ty}`)
        })

        // --- zoom (scroll do mouse / pinça no iPad) --- 
        this.input.on('wheel', (pointer, objects, deltaX, deltaY) => {
            const zoom = this.cameras.main.zoom
            this.cameras.main.zoom = Phaser.Math.Clamp(
                zoom - deltaY * 0.001,
                0.5,
                1.5
            )
        })

        // --- escuta eventos do Vue (seleção de construção no HUD) ---
        window.addEventListener('select-build', (e) => {
            this.selectedBuilding = e.detail.tipo
            console.log('construção selecionada:', this.selectedBuilding)
        })

        window.addEventListener('cancel-build', () => {
            this.selectedBuilding = null
        })
    }

    // --- métodos auxiliares ---

    makeBuilding(b) {
        if (this.buildingSprites[b.id]) return  // já existe

        const worldX = this.map.tileToWorldX(b.tx) + this.map.tileWidth  / 2
        const worldY = this.map.tileToWorldY(b.ty) + this.map.tileHeight / 2

        const sprite = this.add.image(worldX, worldY, b.type)
            .setInteractive()

        // tint para identificar dono
        if (b.owner !== this.playerId) {
            sprite.setTint(0xff8888)  // vermelho = inimigo
        }

        sprite.on('pointerdown', () => {
            if (this.isDragging) return

            window.dispatchEvent(new CustomEvent('build-selected', {
                detail: { id: b.id, tipo: b.type, owner: b.owner }
            }))
        })

        this.buildingSprites[b.id] = sprite
    }

    updateBuildings(buildings) {
        buildings.forEach(b => this.makeBuilding(b))
    }

    update() {
        // scroll pela borda — funciona só no desktop
        // no iPad o arrastar já cuida disso
        const cam   = this.cameras.main
        const mouse = this.input.mousePointer
        const w     = this.scale.width
        const h     = this.scale.height
        const margin = w * 0.04
        const speed  = 6

        if (mouse.x < margin)      cam.scrollX -= speed
        if (mouse.x > w - margin)  cam.scrollX += speed
        if (mouse.y < margin)      cam.scrollY -= speed
        if (mouse.y > h - margin)  cam.scrollY += speed
    }
}