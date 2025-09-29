// client/game/entities/Spyware.js

import VirusBase from './VirusBase.js';
import { IMovable } from './interfaces/IMovable.js';
import { IDamageable } from './interfaces/IDamageable.js';
import { Categories } from '../constants/CollisionCategories.js';

class Spyware extends IMovable(IDamageable(VirusBase)) {
    constructor(scene) {
        const options = {
            sprite: data.sprite,
            speed: data.speed,
            scale: data.scale,
            maxHP: data.maxHP,
            collisionCategory: Categories.VIRUS,
            radius: data.radius
        };

        super(scene, options);
        this.play(data.animation);
    }
}

export default Spyware;
