export const generateColor = (currentColor, setCurrentColor, connectionPairs) => { 
  const colors = [
    '#e6194b', // red
    '#3cb44b', // green
    '#ffe119', // yellow
    '#f58231', // orange
    '#dcbeff', // lavender
    '#9a6324', // brown
    '#fabebe', // pink
    '#7f00ff', // violet
    '#f032e6', // magenta
    '#42d4f4', // cyan
    '#800000', // maroon
    '#469990', // teal
    '#bfef45', // lime
    '#808000', // olive
    '#ffd8b1', // apricot
    '#aaffc3', // mint
    '#c8ad7f', // beige
    '#4363d8', // blue
    '#4b0082', // indigo
    '#ffffff', // white
    '#a9a9a9', // grey
  ];

  // Extract all the colors currently used in the connections
  const usedColors = connectionPairs.flat().map((pair) => pair.color);

  // Check the colors in priority order and return the first unused one
  for (let i = 0; i < colors.length; i++) {
    if (!usedColors.includes(colors[i])) {
      // If the color is not in use, return it and set the current color index
      setCurrentColor(i);
      return colors[i];
    }
  }

  // If all colors are used, reset the current color to the first color
  setCurrentColor(0);
  return colors[0]; // default to the first color (red)
};
