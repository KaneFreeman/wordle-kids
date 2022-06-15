import React from 'react';
import { Box } from '@mui/material';
import ConfettiExplosion from './confetti-explosion';

interface GameTileProps {
  enabled: boolean;
  width: number | undefined;
  height: number | undefined;
}

const Confetti = React.memo(({ enabled, width, height }: GameTileProps) => {
  return enabled ? (
    <Box
      sx={{
        position: 'absolute',
        left: 0,
        top: '51px',
        overflow: 'hidden',
        width: '100%',
        height: 'calc(100% - 51px)'
      }}
    >
      <Box
        sx={{
          position: 'relative',
          left: '50%',
          top: '20%'
        }}
      >
        <ConfettiExplosion key="confetti" floorHeight={height} floorWidth={width} />
      </Box>
    </Box>
  ) : null;
});

export default Confetti;
