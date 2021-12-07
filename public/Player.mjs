class Player {
  constructor({x, y, score, id}) {
    this.x = x;
    this.y = y;
    this.score = score;
    this.id = id;
  }

  // Set x, y position due to direction and speed
  movePlayer(dir, speed) {
    if (dir == 'left') {
      // Check first so player don't goes out of play area
      if (this.x - speed >= 0) {
        this.x -= speed;
      }
    }
    else if (dir == 'right') {
      if (this.x + speed <= 600) {
        this.x += speed;
      }
    }
    else if (dir == 'up') {
      if (this.y - speed >= 0) {
        this.y -= speed;
      }
    }
    else if (dir == 'down') {
      if (this.y + speed <= 390) {
        this.y += speed;
      }
    }
  }

  // Check if player intersects with item (coin)
  collision(item) {
    if ((this.x < item.x + 15) && (this.x + 30 > item.x) && (this.y < item.y + 15) && (this.y + 30 > item.y)) {
      return true;
    }
    else {
      return false;
    }
  }

  // Calculate player rank / total players
  calculateRank(arr) {
    arr.sort((a, b) => b.score - a.score);
    return `Rank: ${arr.findIndex(x => x.id == this.id) + 1}/${arr.length}`;
  }
}

export default Player;
