export class PatternChecker {
    constructor() {
      this.patterns = new Map();
    }
  
    checkAndUpdatePatterns(changedConnections, getters) {
      for (let [pt1, pt2] of changedConnections) {
        if (!this.checkConnectionPatterns(pt1, getters) || !this.checkConnectionPatterns(pt2, getters)) {
          throw new Error("Pattern match found! This move isn't allowed!");
        }
      }
    }
  
    checkConnectionPatterns(point, getters) {
      const horizontalConnections = getters.getHorizontalConnections(point);
      for (let connectedPoint of horizontalConnections) {
        if (connectedPoint < point) {
          if (!this.checkTrioPattern(connectedPoint, point, getters.getNextPoint(point), getters)) {
            return false;
          }
        } else {
          if (!this.checkTrioPattern(getters.getPreviousPoint(point), point, connectedPoint, getters)) {
            return false;
          }
        }
      }
      return true;
    }
  
    checkTrioPattern(pt1, pt2, pt3, getters) {
      if (!pt1 || !pt2 || !pt3) return true;
      const pattern = {
        pt1,
        color1: getters.getConnectionColor(pt1, pt2),
        orientation1: getters.getConnectionOrientation(pt1, pt2),
        pt2,
        color2: getters.getConnectionColor(pt2, pt3),
        orientation2: getters.getConnectionOrientation(pt2, pt3),
        pt3
      };
      if (this.isPatternMatch(pattern)) {
        return false;
      }
      this.addPattern(pattern);
      return true;
    }
  
    isPatternMatch(newPattern) {
      for (let existingPattern of this.patterns.values()) {
        if (this.comparePatterns(newPattern, existingPattern)) {
          return true;
        }
      }
      return false;
    }
  
    comparePatterns(pattern1, pattern2) {
      return pattern1.color1 === pattern2.color1 &&
             pattern1.orientation1 === pattern2.orientation1 &&
             pattern1.color2 === pattern2.color2 &&
             pattern1.orientation2 === pattern2.orientation2;
    }
  
    addPattern(pattern) {
      let key = `${pattern.pt1}-${pattern.pt2}-${pattern.pt3}`;
      this.patterns.set(key, pattern);
    }
  }