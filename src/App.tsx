/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/no-array-index-key */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import useResizeObserver from '@react-hook/resize-observer';
import {
  Alert,
  Box,
  Button,
  createTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grow,
  GrowProps,
  IconButton,
  Popover,
  Snackbar,
  ThemeProvider,
  Typography,
  useMediaQuery
} from '@mui/material';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useWindowEvent } from './utility/window.util';
import { useCheckForUpdates } from './utility/pwa.util';
import PWAUpdateConfirmEvent from './utility/events/pawUpdateConfirmEvent';
import GameTiles from './components/GameTiles';
import Keyboard from './components/Keyboard';
import allWords from './words.json';
import dictionary from './dictionary.json';
import Confetti from './components/Confetti';
import './App.css';

const TOTAL_GUESSES = 6;
const DEFAULT_WIDTH_MULTIPLIER = 66;
const MARGIN = 30;

const useSize = (target: React.RefObject<HTMLDivElement>) => {
  const [size, setSize] = React.useState<DOMRectReadOnly>();

  React.useLayoutEffect(() => {
    if (!target.current) {
      return;
    }
    setSize(target.current.getBoundingClientRect());
  }, [target]);

  // Where the magic happens
  useResizeObserver(target, (entry) => setSize(entry.contentRect));
  return size;
};

function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState<{
    width: number | undefined;
    height: number | undefined;
  }>({
    width: undefined,
    height: undefined
  });
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    // Add event listener
    window.addEventListener('resize', handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

function loadState(): AppState {
  const rawData = window.localStorage.getItem('data');
  const defaultState: AppState = {
    wordLength: 3,
    guesses: [],
    guess: '',
    guessLocked: false,
    target: '',
    keyboardStyle: 'abc',
    showTarget: false,
    lastFiveWords: []
  };

  if (!rawData) {
    return defaultState;
  }

  return { ...defaultState, ...(JSON.parse(rawData) as Partial<AppState>) };
}

function saveState(state: AppState) {
  window.localStorage.setItem('data', JSON.stringify(state));
}

function GrowTransition(props: GrowProps) {
  return <Grow {...props} />;
}

interface AppState {
  wordLength: number;
  guesses: string[];
  guess: string;
  guessLocked: boolean;
  target: string;
  keyboardStyle: 'qwerty' | 'abc';
  showTarget: boolean;
  lastFiveWords: string[];
}

interface BadWordState {
  shake: boolean;
  showNotInWordList: boolean;
}

function App() {
  const size = useWindowSize();

  const headerRef = React.useRef<HTMLDivElement>(null);
  const headerSize = useSize(headerRef);

  const keyboardRef = React.useRef<HTMLDivElement>(null);
  const keyboardSize = useSize(keyboardRef);

  const onBigScreen = useMediaQuery('(min-height:700px)');

  const [state, setState] = useState<AppState>(loadState());

  saveState(state);

  const [badWordState, setBadWordState] = useState<BadWordState>({
    shake: false,
    showNotInWordList: false
  });

  const [isExploding, setIsExploding] = useState(false);

  const { wordLength, guesses, guess, guessLocked, target, keyboardStyle, showTarget, lastFiveWords } = state;

  const { shake, showNotInWordList } = badWordState;

  const [anchorElement, setAnchorElement] = useState<HTMLButtonElement | null>(null);
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElement(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorElement(null);
  }, []);

  const popoverOpen = useMemo(() => Boolean(anchorElement), [anchorElement]);

  const guessesLeft = TOTAL_GUESSES - guesses.length;

  const lastGuess = useMemo(() => {
    if (guesses.length > 0) {
      return guesses[guesses.length - 1];
    }

    return '';
  }, [guesses]);

  const onLetterEntered = useCallback(
    (letter: string) => {
      if (lastGuess !== target && guess.length < wordLength) {
        setState({
          ...state,
          guess: `${guess}${letter}`
        });
      }
    },
    [guess, lastGuess, state, target, wordLength]
  );

  const onGuess = useCallback(() => {
    if (lastGuess !== target && guess.length === wordLength && guessesLeft > 0 && !shake) {
      if (!dictionary.includes(guess.toLowerCase())) {
        setBadWordState({
          shake: true,
          showNotInWordList: true
        });
        setTimeout(() => {
          setBadWordState({
            shake: false,
            showNotInWordList: true
          });
        }, 300);
        setTimeout(() => {
          setBadWordState({
            shake: false,
            showNotInWordList: false
          });
        }, 2000);
        return;
      }

      setState({
        ...state,
        guessLocked: true
      });
    }
  }, [guess, guessesLeft, lastGuess, shake, state, target, wordLength]);

  const onGuessFinish = useCallback(() => {
    if (
      lastGuess !== target &&
      guess.length === wordLength &&
      guessesLeft > 0 &&
      dictionary.includes(guess.toLowerCase())
    ) {
      setState({
        ...state,
        guesses: [...guesses, guess],
        guess: '',
        guessLocked: false,
        showTarget: guesses.length + 1 === TOTAL_GUESSES && guess !== target
      });
    }
  }, [guess, guesses, guessesLeft, lastGuess, state, target, wordLength]);

  useEffect(() => {
    if (lastGuess === target) {
      if (lastGuess === target) {
        setIsExploding(true);

        setTimeout(() => {
          setIsExploding(false);
        }, 4000);
      }
    }
  }, [lastGuess, target]);

  const onLetterDeleted = useCallback(() => {
    if (lastGuess !== target && guess.length > 0) {
      setState({
        ...state,
        guess: guess.slice(0, -1)
      });
    }
  }, [guess, lastGuess, state, target]);

  const onWordLengthHandler = useCallback(
    (length: number) => {
      const words = (allWords as Record<string, string[]>)[`${length}`];

      let newWord: string;
      do {
        newWord = words[Math.floor(Math.random() * words.length)].toUpperCase();
      } while (lastFiveWords.includes(newWord));

      const newLastFiveWords = [...lastFiveWords];
      if (newLastFiveWords.length >= 5) {
        newLastFiveWords.shift();
      }
      newLastFiveWords.push(newWord);

      setAnchorElement(null);
      setIsExploding(false);
      setState({
        ...state,
        wordLength: length,
        guesses: [],
        guess: '',
        target: newWord,
        lastFiveWords: newLastFiveWords,
        showTarget: false
      });
    },
    [lastFiveWords, state]
  );

  useEffect(() => {
    if (target === '') {
      onWordLengthHandler(wordLength);
    }
  }, [lastFiveWords, onWordLengthHandler, state, target, wordLength]);

  const [newGameWordLength, setNewGameWordLength] = useState<number | undefined>(undefined);

  const handleNewGameConfirmClose = useCallback(
    (newGame: boolean) => {
      if (!newGame || newGameWordLength === undefined) {
        setNewGameWordLength(undefined);
        return;
      }

      onWordLengthHandler(newGameWordLength);
      setNewGameWordLength(undefined);
    },
    [newGameWordLength, onWordLengthHandler]
  );

  const tryStartNewGame = useCallback(
    (length: number) => {
      if (guessesLeft > 0 && ((guesses.length > 0 && guesses[guesses.length - 1] !== target) || guess !== '')) {
        setAnchorElement(null);
        setNewGameWordLength(length);
        return;
      }

      onWordLengthHandler(length);
    },
    [guess, guesses, guessesLeft, onWordLengthHandler, target]
  );

  const onChangeKeyboardStyle = useCallback(
    (newKeyboardStyle: 'qwerty' | 'abc') => {
      setAnchorElement(null);
      setState({
        ...state,
        keyboardStyle: newKeyboardStyle
      });
    },
    [state]
  );

  const toggleKeyboardStyle = useCallback(
    () => onChangeKeyboardStyle(keyboardStyle === 'abc' ? 'qwerty' : 'abc'),
    [keyboardStyle, onChangeKeyboardStyle]
  );

  const widthMultiplier = useMemo(() => {
    if (onBigScreen || !size?.height || !headerSize?.height || !keyboardSize?.height) {
      return DEFAULT_WIDTH_MULTIPLIER;
    }

    const playareaHeight = size.height - headerSize.height - keyboardSize.height - MARGIN;

    return (playareaHeight - (TOTAL_GUESSES - 1) * 5) / TOTAL_GUESSES;
  }, [headerSize?.height, keyboardSize?.height, onBigScreen, size.height]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.shiftKey) {
        switch (event.key.toLowerCase()) {
          case 'n':
            event.preventDefault();
            tryStartNewGame(wordLength);
            return;
          case 'q':
            event.preventDefault();
            onChangeKeyboardStyle('qwerty');
            return;
          case 'a':
            event.preventDefault();
            onChangeKeyboardStyle('abc');
            return;
          default:
            return;
        }
      }

      switch (event.key.toLowerCase()) {
        case '3':
        case '4':
        case '5':
          event.preventDefault();
          tryStartNewGame(+event.key);
          break;
        case 'a':
        case 'b':
        case 'c':
        case 'd':
        case 'e':
        case 'f':
        case 'g':
        case 'h':
        case 'i':
        case 'j':
        case 'k':
        case 'l':
        case 'm':
        case 'n':
        case 'o':
        case 'p':
        case 'q':
        case 'r':
        case 's':
        case 't':
        case 'u':
        case 'v':
        case 'w':
        case 'x':
        case 'y':
        case 'z':
          event.preventDefault();
          onLetterEntered(event.key.toUpperCase());
          break;
        case 'enter':
          event.preventDefault();
          onGuess();
          break;
        case 'backspace':
          event.preventDefault();
          onLetterDeleted();
          break;
        default:
          break;
      }
    },
    [onChangeKeyboardStyle, onGuess, onLetterDeleted, onLetterEntered, tryStartNewGame, wordLength]
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'dark'
        }
      }),
    []
  );

  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [updating, setUpdating] = useState(false);

  const onUpdate = useCallback(() => {
    setHasNewVersion(true);
  }, []);

  const onUpdateMessageAccept = useCallback(() => {
    setUpdating(true);
    window.dispatchEvent(new PWAUpdateConfirmEvent());
  }, []);

  useWindowEvent('pwaupdateavailable', onUpdate);
  useCheckForUpdates();

  const updateAlert = useMemo(
    () => (
      <Alert severity="info" classes={{ root: 'update-alert-root', message: 'update-alert-message' }}>
        <Box>{updating ? 'Updating...' : 'A new version is available'}</Box>
        {!updating ? (
          <Button color="secondary" size="small" onClick={onUpdateMessageAccept}>
            Update
          </Button>
        ) : null}
      </Alert>
    ),
    [onUpdateMessageAccept, updating]
  );

  return (
    <ThemeProvider theme={theme}>
      <Box className="App">
        <header className={`App-header${onBigScreen ? '' : ' App-header-mobile'}`}>
          <Typography
            ref={headerRef}
            variant={onBigScreen ? 'h4' : 'h5'}
            component="div"
            sx={{
              display: 'flex',
              borderBottom: '1px solid #3a3a3c',
              height: '51px',
              lineHeight: '51px',
              mb: '10px',
              fontWeight: 600,
              width: '100%',
              boxSizing: 'border-box',
              alignItems: 'center'
            }}
          >
            <Box sx={{ flexGrow: 1 }} />
            Wordle for Kids
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end' }}>
              <IconButton
                onClick={handleClick}
                sx={
                  onBigScreen
                    ? undefined
                    : {
                        position: 'absolute',
                        top: '4px',
                        right: '4px'
                      }
                }
                aria-label="settings"
              >
                <SettingsOutlinedIcon sx={{ color: 'white' }} />
              </IconButton>
              <Popover
                open={popoverOpen}
                anchorEl={anchorElement}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
              >
                <Typography component="div" sx={{ p: 1 }}>
                  <Box sx={{ p: 1, cursor: 'pointer' }} onClick={() => tryStartNewGame(3)}>
                    3 Letter Words
                  </Box>
                  <Box sx={{ p: 1, cursor: 'pointer' }} onClick={() => tryStartNewGame(4)}>
                    4 Letter Words
                  </Box>
                  <Box sx={{ p: 1, cursor: 'pointer' }} onClick={() => tryStartNewGame(5)}>
                    5 Letter Words
                  </Box>
                  <Box sx={{ p: 1, cursor: 'pointer' }} onClick={toggleKeyboardStyle}>
                    Change to {keyboardStyle === 'abc' ? 'QWERTY' : 'ABC'} keyboard
                  </Box>
                </Typography>
              </Popover>
            </Box>
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateRows: 'repeat(6, 1fr)',
              gridGap: '6px',
              width: `${wordLength * widthMultiplier + (wordLength - 1) * 5}px`
            }}
          >
            {guesses.map((pastGuess, index) => (
              <GameTiles
                target={target}
                key={`previous-guess-${index}`}
                word={pastGuess}
                wordLength={wordLength}
                locked
              />
            ))}
            {guessesLeft > 0 ? (
              <GameTiles
                key={`current-guess-${guesses.length}`}
                target={target}
                word={guess}
                wordLength={wordLength}
                shake={shake}
                locked={guessLocked}
                onLastTileFlip={onGuessFinish}
              />
            ) : null}
            {guessesLeft > 1
              ? [...Array(guessesLeft - 1)].map((_, index) => (
                  <GameTiles target={target} key={`next-guess-${index}`} word="" wordLength={wordLength} />
                ))
              : null}
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Keyboard
            keyboardRef={keyboardRef}
            guesses={guesses}
            target={target}
            keyboardStyle={keyboardStyle}
            onGuess={onGuess}
            onLetterEntered={onLetterEntered}
            onLetterDeleted={onLetterDeleted}
          />
        </header>
        <Snackbar
          classes={{
            root: 'snackbarRoot'
          }}
          open={showTarget}
          TransitionComponent={GrowTransition}
        >
          <Alert
            classes={{
              message: 'alertMessage'
            }}
            sx={{
              position: 'fixed',
              width: '80%',
              maxWidth: '484px',
              height: '48px',
              top: 'calc(50% - 48px)',
              left: (size?.width ?? 0) < 484 ? '10%' : 'calc(50% - 242px)',
              boxSizing: 'border-box',
              fontSize: 16,
              fontWeight: 'bold'
            }}
            severity="error"
          >
            {showTarget ? target : ''}
          </Alert>
        </Snackbar>
        <Snackbar
          classes={{
            root: 'snackbarRoot'
          }}
          open={showNotInWordList}
          TransitionComponent={GrowTransition}
        >
          <Alert
            classes={{
              message: 'alertMessage'
            }}
            sx={{
              position: 'fixed',
              width: '80%',
              maxWidth: '484px',
              height: '48px',
              top: 'calc(50% - 48px)',
              left: (size?.width ?? 0) < 484 ? '10%' : 'calc(50% - 242px)',
              boxSizing: 'border-box',
              fontSize: 16,
              fontWeight: 'bold'
            }}
            severity="warning"
          >
            Not in word list
          </Alert>
        </Snackbar>
        <Dialog
          open={newGameWordLength !== undefined}
          onClose={() => handleNewGameConfirmClose(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">Quit Game</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Do you want to quit your game in progress?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => handleNewGameConfirmClose(false)}>No</Button>
            <Button onClick={() => handleNewGameConfirmClose(true)}>Yes</Button>
          </DialogActions>
        </Dialog>
        <Confetti enabled={isExploding} width={size.width} height={size.height} />
        <Snackbar open={hasNewVersion}>{updateAlert}</Snackbar>
      </Box>
    </ThemeProvider>
  );
}

export default App;
