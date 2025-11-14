import clickSound from "../assets/sound effect/Click.wav";
import errorSound from "../assets/sound effect/Error.wav";
import connectSuccess from "../assets/sound effect/ConnectionSuccess.wav";
import Perfect from "../assets/sound effect/100Perfect.wav";

export function useAudio() {
  const clickAudio = new Audio(clickSound);
  const errorAudio = new Audio(errorSound);
  const connectsuccess = new Audio(connectSuccess);
  const perfectAudio = new Audio(Perfect);

  return { clickAudio, errorAudio, connectsuccess, perfectAudio };
}
