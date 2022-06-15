import { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import ReactCardFlip from 'react-card-flip';
import './GameTile.css';

interface GameTileProps {
  letter: string;
  index: number;
  target: string;
  locked: boolean;
  onFlipEnd?: () => void;
}

function GameTile({ letter, index, target, locked, onFlipEnd }: GameTileProps) {
  const [isFlipped, setIsFlipped] = useState(locked);

  useEffect(() => {
    if (isFlipped !== locked) {
      setTimeout(() => setIsFlipped(locked), index * 200);
      setTimeout(() => {
        if (onFlipEnd) {
          onFlipEnd();
        }
      }, index * 200 + 250);
    }
  }, [index, isFlipped, locked, onFlipEnd]);

  const lockedSide = useMemo(() => {
    let color = '#313131';
    if (target.charAt(index) === letter) {
      color = '#408535';
    } else if (target.includes(letter)) {
      color = '#88750f';
    }

    return (
      <Box
        className="tile"
        sx={{
          display: 'flex',
          backgroundColor: color,
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: color,
          boxSizing: 'border-box',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: 32,
        }}
      >
        {letter}
      </Box>
    );
  }, [index, letter, target]);

  const unlockedSide = useMemo(
    () => (
      <Box
        className="tile"
        sx={{
          display: 'flex',
          backgroundColor: '#121213',
          borderWidth: '2px',
          borderStyle: 'solid',
          borderColor: letter !== '' ? '#565758' : '#3a3a3c',
          boxSizing: 'border-box',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: 32,
        }}
      >
        {letter}
      </Box>
    ),
    [letter]
  );

  return (
    <ReactCardFlip isFlipped={isFlipped} flipDirection="vertical">
      {unlockedSide}
      {lockedSide}
    </ReactCardFlip>
  );
}

export default GameTile;
