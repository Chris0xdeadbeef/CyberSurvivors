//client/game/entities/weapons/BallisticCursor.js

import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import { Categories } from '../constants/CollisionCategories.js';


export default class BallisticCursor extends Phaser.Physics.Matter.Sprite {
    constructor(scene, x, y, target, config) {
        super(scene.matter.world, x, y, 'ballistic_cursor_sprite');
        scene.add.existing(this);

        this.damage = config.damage;
        this.speed = config.speed;
        this.piercing = config.piercing;
        this.duration = config.duration;
        this.setScale(config.scale);

        this.setIgnoreGravity(true);

        // Définir le label du corps physique pour collision
        const body = this.body;
        if (body) {
            body.label = 'ballisticCursor';
            body.collisionFilter.category = Categories.PLAYER_PROJECTILE;
        }

        // Calcul de la direction vers la cible
        const angle = Phaser.Math.Angle.Between(x, y, target.x, target.y);
        const velocity = Phaser.Math.Vector2.RIGHT.clone().rotate(angle).scale(this.speed);
        this.setVelocity(velocity.x, velocity.y);        

        // Timer de durée de vie
        scene.time.delayedCall(this.duration, () => {
            if (this.active) this.destroy();
        });
    }
}