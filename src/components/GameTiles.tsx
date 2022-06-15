/* eslint-disable react/no-array-index-key */
import { Box } from '@mui/material';
import './GameTiles.css';
import GameTile from './GameTile';

interface GameTilesProps {
  target: string;
  word: string;
  wordLength: number;
  locked?: boolean;
  shake?: boolean;
  onLastTileFlip?: () => void;
}

function GameTiles({ target, word, wordLength, locked = false, shake = false, onLastTileFlip }: GameTilesProps) {
  return (
    <Box
      className={shake ? 'shake' : undefined}
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(${wordLength}, 1fr)`,
        gridGap: '5px'
      }}
    >
      {[...Array(wordLength)].map((_, index) => {
        let char = '';
        if (index < word.length) {
          char = word.charAt(index);
        }

        return (
          <GameTile
            key={`letter-${index}`}
            letter={char}
            target={target}
            index={index}
            locked={locked}
            onFlipEnd={index + 1 === wordLength ? onLastTileFlip : undefined}
          />
        );
      })}
    </Box>
  );
}

export default GameTiles;
