// client/game/interfaces/IDamageable.js

export const IDamageable = Base => class extends Base {
    takeDamage(amount) {
      this.hp -= amount;
      if (this.hp <= 0) {
        this.hp = 0;
        this.destroy();
      }
    }
  
    heal(amount) {
      this.hp += amount;
      if (this.hp > this.maxHP) {
        this.hp = this.maxHP;
      }
    }
  };
  