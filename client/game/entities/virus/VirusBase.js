import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.88.2/dist/phaser.esm.js';
import { Categories } from '../constants/CollisionCategories.js';
import QuantumCash from '../QuantumCash.js';

/**
 * Classe de base représentant un virus dans le jeu.
 */
export default class VirusBase extends Phaser.Physics.Matter.Sprite {
    constructor(scene, options = {}) {
        const defaults = {
            sprite: 'entity',
            speed: 0.0001,
            scale: 0.4,
            maxHP: 100,
            frictionAir: 0.05,
            friction: 0.02,
            restitution: 0.5,
            collisionCategory: Categories.FOLDER,
            radius: null
        };

        const config = { ...defaults, ...options };

        super(scene.matter.world, 0, 0, config.sprite);
        scene.add.existing(this);

        this.setScale(config.scale);

        const radius = config.radius || (this.displayWidth / 2);

        const body = Phaser.Physics.Matter.Matter.Bodies.circle(0, 0, radius, {
            frictionAir: config.frictionAir,
            friction: config.friction,
            restitution: config.restitution,
            inertia: Infinity,
            isStatic: false,
            label: config.sprite,
            collisionFilter: {
                category: config.collisionCategory,
                mask: 0xFFFF
            }
        });

        this.setExistingBody(body);
        this.setFixedRotation(true);

        const { width, height } = scene.scale;
        const corners = [
            [0, 0], [width, 0], [0, height], [width, height]
        ];
        const [spawnX, spawnY] = corners[Math.floor(Math.random() * corners.length)];
        this.setPosition(spawnX, spawnY);

        this.visual = this.scene.add.sprite(this.x, this.y, config.sprite);
        this.visual.setScale(config.scale);
        this.setVisible(false);

        this.type = config.type ?? 'unknown';
        this.spriteKey = config.sprite;
        this.speed = config.speed;
        this.maxHP = config.maxHP;
        this.hp = this.maxHP;
        this.isEnemy = true;
        this.target = null;
        this.id = config.id || Phaser.Utils.String.UUID();

        this.createHealthBar();

        if (this.scene && this.scene.events) {
            this.scene.events.on('update', this.updateHealthBar, this);
        }

        this.setDepth(5);
    }

    createHealthBar() {
        const barWidth = this.displayWidth * 0.8;
        const barHeight = 6;

        this.healthBarBackground = this.scene.add.rectangle(0, 0, barWidth, barHeight, 0x555555).setOrigin(0, 0.5);
        this.healthBarFill = this.scene.add.rectangle(0, 0, barWidth, barHeight, 0xff0000).setOrigin(0, 0.5);

        this.healthBarContainer = this.scene.add.container(
            this.x - barWidth / 2,
            this.y - this.displayHeight / 2 - 10,
            [this.healthBarBackground, this.healthBarFill]
        );
    }

    updateHealthBar() {
        if (!this.healthBarFill || !this.healthBarBackground || !this.active) return;

        const barWidth = this.healthBarBackground.width;
        this.healthBarContainer.setPosition(this.x - barWidth / 2, this.y - this.displayHeight / 2 - 10);

        const ratio = Phaser.Math.Clamp(this.hp / this.maxHP, 0, 1);
        this.healthBarFill.width = barWidth * ratio;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.destroyHealthBar();
            this.destroy();
        }
    }

    destroyHealthBar() {
        this.healthBarFill?.destroy();
        this.healthBarBackground?.destroy();
        this.healthBarContainer?.destroy();
    }

    destroy() {
        this.destroyHealthBar();
        this.visual?.destroy();

        if (this.scene?.events) {
            this.scene.events.off('update', this.updateHealthBar, this);
        }

        // --- DROP DE MONNAIE ---
        const config = this.scene.virusConfig?.[this.texture.key];
        if (config && Math.random() < (config.dropChance ?? 1)) {
            let amount = 1;

            if (Array.isArray(config.cashAmount)) {
                const [min, max] = config.cashAmount;
                amount = Phaser.Math.Between(min, max);
            } else if (typeof config.cashAmount === 'number') {
                amount = config.cashAmount;
            }

            const dropX = this.body?.position?.x ?? this.x ?? 0;
            const dropY = this.body?.position?.y ?? this.y ?? 0;

            for (let i = 0; i < amount; ++i) {
                new QuantumCash(this.scene, dropX, dropY);
            }
        }

        if (this.scene?.virusManager?.viruses && this.id) {
            this.scene.virusManager.viruses.delete(this.id);
        }

        super.destroy();
    }
}
