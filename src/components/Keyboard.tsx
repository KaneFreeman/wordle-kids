import { Box } from "@mui/material";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import KeyboardReturnOutlinedIcon from "@mui/icons-material/KeyboardReturnOutlined";
import KeyboardButton from "./KeyboardButton";
import { useMemo } from "react";

interface KeyboardProps {
  keyboardRef: React.RefObject<HTMLDivElement>;
  guesses: string[];
  target: string;
  keyboardStyle: "qwerty" | "abc";
  onGuess: () => void;
  onLetterEntered: (letter: string) => void;
  onLetterDeleted: () => void;
}

const abcKeyboard = [
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
  ["K", "L", "M", "N", "O", "P", "Q", "R", "S"],
  ["T", "U", "V", "W", "X", "Y", "Z"],
];

const qwertyKeyboard = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

function Keyboard({
  keyboardRef,
  guesses,
  target,
  keyboardStyle,
  onGuess,
  onLetterEntered,
  onLetterDeleted,
}: KeyboardProps) {
  const keyboardRows = useMemo(() => {
    const keyboard = keyboardStyle === "abc" ? abcKeyboard : qwertyKeyboard;

    return keyboard.map((keyboardRow) =>
      keyboardRow.map((key) => (
        <KeyboardButton
          key={`keyboard-key-${key}`}
          letter={key}
          guesses={guesses}
          target={target}
          onClick={onLetterEntered}
        />
      ))
    );
  }, [guesses, keyboardStyle, onLetterEntered, target]);

  return (
    <Box
      ref={keyboardRef}
      key="abc-keyboard"
      sx={{
        display: "grid",
        gridTemplateRows: `repeat(3, 1fr)`,
        mt: "10px",
        ml: 1,
        mr: 1,
        width: "calc(100% - 16px)",
        maxWidth: "484px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          width: "100%",
          margin: "0 auto 8px",
        }}
      >
        {keyboardRows[0]}
      </Box>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          margin: "0 auto 8px",
        }}
      >
        <Box sx={{ flexGrow: 1, flex: 0.5 }} />
        {keyboardRows[1]}
        <Box sx={{ flexGrow: 1, flex: 0.5 }} />
      </Box>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          margin: "0 auto 8px",
        }}
      >
        <KeyboardButton
          label={<KeyboardReturnOutlinedIcon />}
          guesses={guesses}
          target={target}
          onClick={onGuess}
          sx={{ flex: 1.5 }}
        />
        {keyboardRows[2]}
        <KeyboardButton
          label={<BackspaceOutlinedIcon />}
          guesses={guesses}
          target={target}
          onClick={onLetterDeleted}
          sx={{ flex: 1.5 }}
        />
      </Box>
    </Box>
  );
}

export default Keyboard;
