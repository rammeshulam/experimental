/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom/client';

const PRIZES = {
  '📱': 'אייפון',
  '✈️': 'חופשה',
  '🧤': 'כפפות אפייה',
  '🧥': 'חלוק רחצה',
  '🍫': 'שוקולד'
};
const PRIZE_EMOJIS = Object.keys(PRIZES);
const LOSING_EMOJIS = ['😭', '💔', '👎', '🍋', '🍒', '💣'];
const LOSING_MESSAGES = [
  'אוי, כל כך קרוב! נסה שוב!',
  'נראה שזה לא היום שלך...',
  'המזל בדרך, רק לא הפעם.',
  'כמעט שם!',
  'לא נורא, העיקר הכוונה!',
  'המזל שמור לרונית היום!'
];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const HANDLE_PULL_THRESHOLD = 80; // pixels to pull to activate spin
const HANDLE_MAX_PULL = 100;

function App() {
  const [playerName, setPlayerName] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [reels, setReels] = useState(['🎂', '🎉', '🎈']);
  const [message, setMessage] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelsSpinning, setReelsSpinning] = useState([false, false, false]);
  const [prizesWon, setPrizesWon] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [isWinning, setIsWinning] = useState(false);

  // Handle state
  const [isDragging, setIsDragging] = useState(false);
  const [handleTop, setHandleTop] = useState(0);
  const startY = useRef(0);

  const isRonit = playerName.trim().toLowerCase() === 'רונית';

  const handleStartGame = () => {
    if (inputValue.trim()) {
      setPlayerName(inputValue);
      setGameStarted(true);
      setMessage(`בהצלחה, ${inputValue}!`);
    }
  };

  const handleSpin = () => {
    if (attemptsLeft <= 0 || isSpinning) return;

    // 1. Setup
    setIsSpinning(true);
    setReelsSpinning([true, true, true]); // For CSS animation class
    setAttemptsLeft(prev => prev - 1);
    setMessage('');

    // 2. Determine final result ahead of time
    let finalReels;
    let isWin = false;
    let wonPrizeName = null;
    
    if (isRonit) {
      const prizeIndex = prizesWon.length % PRIZE_EMOJIS.length;
      const wonPrizeEmoji = PRIZE_EMOJIS[prizeIndex];
      wonPrizeName = PRIZES[wonPrizeEmoji];
      finalReels = [wonPrizeEmoji, wonPrizeEmoji, wonPrizeEmoji];
      isWin = true;
    } else {
        do {
            finalReels = [
                getRandomElement(LOSING_EMOJIS),
                getRandomElement(LOSING_EMOJIS),
                getRandomElement(LOSING_EMOJIS)
            ];
        } while (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]);
    }

    // 3. Visual spinning animation
    const currentlySpinning = [true, true, true];
    const spinInterval = setInterval(() => {
      setReels(prevReels => 
        prevReels.map((_, i) => 
          currentlySpinning[i] ? getRandomElement(LOSING_EMOJIS) : prevReels[i]
        )
      );
    }, 100);

    // 4. Staggered stop logic
    const baseStopTime = 1000;
    const stopInterval = 500;

    const stopReel = (reelIndex) => {
      currentlySpinning[reelIndex] = false;
      
      setReels(prevReels => {
        const newReels = [...prevReels];
        newReels[reelIndex] = finalReels[reelIndex];
        return newReels;
      });
      
      setReelsSpinning(prevSpinning => {
          const newSpinning = [...prevSpinning];
          newSpinning[reelIndex] = false;
          return newSpinning;
      });
    };

    // Stop reels sequentially (left-to-right in RTL: 2 -> 1 -> 0)
    setTimeout(() => stopReel(2), baseStopTime);
    setTimeout(() => stopReel(1), baseStopTime + stopInterval);
    setTimeout(() => {
      stopReel(0);
      clearInterval(spinInterval);

      if (isWin) {
        setMessage(`יש!!! זכית ב${wonPrizeName}, רונית!`);
        const prizeEmoji = finalReels[0];
        if (!prizesWon.some(p => p.emoji === prizeEmoji)) {
            setPrizesWon(prev => [...prev, { emoji: prizeEmoji, name: PRIZES[prizeEmoji] }]);
        }
        setIsWinning(true);
        setTimeout(() => setIsWinning(false), 800);
      } else {
        setMessage(getRandomElement(LOSING_MESSAGES));
      }

      setIsSpinning(false);
    }, baseStopTime + (stopInterval * 2));
  };
  
  const canSpin = !isSpinning && attemptsLeft > 0 && !gameOver;

  const handleDragStart = (e) => {
    if (!canSpin) return;
    setIsDragging(true);
    startY.current = e.clientY || e.touches[0].clientY;
  };

  const handleDragMove = (e) => {
    if (!isDragging || !canSpin) return;
    const currentY = e.clientY || e.touches[0].clientY;
    const deltaY = currentY - startY.current;
    const newTop = Math.max(0, Math.min(HANDLE_MAX_PULL, deltaY));
    setHandleTop(newTop);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (handleTop >= HANDLE_PULL_THRESHOLD) {
      handleSpin();
    }
    setHandleTop(0);
  };
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    }
  }, [isDragging, handleDragMove, handleDragEnd]);
  
  useEffect(() => {
    if (gameStarted && attemptsLeft === 0 && !isSpinning) {
      setTimeout(() => {
        setGameOver(true);
        if (isRonit) {
          setMessage('מזל טוב רונית! זכית בכל הפרסים! 🥳');
        } else {
          setMessage('מצטערים, נראה שזה יום המזל של רונית! יום הולדת שמח!');
        }
      }, 1600);
    }
  }, [attemptsLeft, gameStarted, isRonit, isSpinning]);

  const resetGame = () => {
    setPlayerName('');
    setInputValue('');
    setGameStarted(false);
    setAttemptsLeft(5);
    setReels(['🎂', '🎉', '🎈']);
    setMessage('');
    setIsSpinning(false);
    setReelsSpinning([false, false, false]);
    setPrizesWon([]);
    setGameOver(false);
  }

  if (!gameStarted) {
    return (
      <div className="app-container">
        <h1>יום הולדת שמח רונית!</h1>
        <p>בואו לבדוק את מזלכם במכונת המזל!</p>
        <input
          type="text"
          className="input-field"
          placeholder="הכניסו את שמכם"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
          aria-label="הזנת שם"
        />
        <button className="action-button" onClick={handleStartGame} disabled={!inputValue.trim()}>
          שחקו!
        </button>
      </div>
    );
  }

  return (
    <div className="game-wrapper">
       <div className="handle-container">
            <div 
              className={`handle ${isDragging ? 'dragging' : ''} ${!canSpin ? 'disabled' : ''}`}
              style={{ top: `${handleTop}px` }}
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
            </div>
        </div>
      <div className={`app-container ${isWinning ? 'winning-animation' : ''}`}>
        <h1>מכונת המזל של רונית</h1>
        <div className="reels-container">
          <div className="reels">
            {reels.map((symbol, index) => (
              <div key={index} className={`reel ${reelsSpinning[index] ? 'spinning' : ''}`} aria-live="polite">
                {symbol}
              </div>
            ))}
          </div>
        </div>
        <p className="message">{message}</p>
        
        {gameOver ? (
          <button className="action-button" onClick={resetGame}>שחקו שוב</button>
        ) : (
          <p className="attempts">נשארו לך {attemptsLeft} ניסיונות</p>
        )}

        {isRonit && prizesWon.length > 0 && (
          <div className="prizes-won">
            <strong>פרסים שזכית:</strong>
            <ul>
              {prizesWon.map(prize => (
                <li key={prize.name}>
                  <span className="prize-emoji">{prize.emoji}</span>
                  <span className="prize-name">{prize.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);